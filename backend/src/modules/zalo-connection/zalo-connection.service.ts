import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Zalo } from 'zca-js';
import type { API, Credentials, FindUserResponse } from 'zca-js';
import nodefetch from 'node-fetch';
import { imageSize } from 'image-size';
import { readFile, stat } from 'fs/promises';
import { ZaloConnectionRegistry } from './zalo-connection-registry';
import { ZaloAccountsService } from '../zalo-accounts/zalo-accounts.service';
import {
  ZaloCookieEncryptionService,
  ZaloCookieData,
} from './zalo-cookie-encryption.service';
import { ZaloProxyService } from './zalo-proxy.service';
import { ZaloConnectionInfo } from './zalo-connection-info.interface';
import { CustomerAccount } from '../customers/customer-account.entity';

const RECONNECT_COOLDOWN_MS = 5 * 60 * 1000;

@Injectable()
export class ZaloConnectionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ZaloConnectionService.name);
  private readonly reconnectCooldowns = new Map<string, number>();
  private readonly loginInProgress = new Set<string>();
  private isShuttingDown = false;

  constructor(
    private readonly registry: ZaloConnectionRegistry,
    private readonly accountsService: ZaloAccountsService,
    private readonly encryptionService: ZaloCookieEncryptionService,
    private readonly proxyService: ZaloProxyService,
  ) {}

  async onModuleInit(): Promise<void> {
    const accounts = await this.accountsService.findActiveAccountsWithCookies();
    this.logger.log(
      `Found ${accounts.length} active accounts to reconnect on startup`,
    );

    const results = await Promise.allSettled(
      accounts.map((account) =>
        this.loginWithCookieInternal(account.id, true).then(() => {
          this.logger.log(`Reconnected account ${account.id} on startup`);
        }),
      ),
    );

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(
        `${failed.length}/${accounts.length} accounts failed to reconnect`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    this.logger.log('Shutting down — stopping all Zalo listeners');
    for (const [accountId, conn] of this.registry.entries()) {
      try {
        conn.api.listener.stop();
      } catch {
        this.logger.warn(`Error stopping listener for ${accountId}`);
      }
    }
    this.registry.clear();
  }

  async loginWithCookieForCustomer(
    customerId: string,
    displayName: string,
    input: { imei: string; userAgent: string; cookie: object[] },
    proxyUrl?: string,
  ): Promise<{ accountId: string }> {
    if (proxyUrl && !this.proxyService.canUseProxy(proxyUrl)) {
      throw new BadRequestException('Proxy has reached maximum account limit');
    }

    const account = await this.accountsService.createAccount(
      { id: customerId } as CustomerAccount,
      displayName,
    );
    const accountId = account.id;
    this.acquireLoginLock(accountId);

    try {
      const zalo = this.createZaloInstance(proxyUrl);
      const credentials: Credentials = {
        imei: input.imei,
        cookie: input.cookie,
        userAgent: input.userAgent,
      };

      const api = await zalo.login(credentials);
      await this.handleLoginSuccess(accountId, api, proxyUrl, false);
    } catch (error) {
      this.loginInProgress.delete(accountId);
      await this.accountsService.updateStatus(accountId, 'login_failed');
      throw error;
    }

    this.loginInProgress.delete(accountId);
    return { accountId };
  }

  async assertOwnership(accountId: string, customerId: string): Promise<void> {
    const account = await this.accountsService.findById(accountId);
    if (!account) throw new NotFoundException('Zalo account not found');
    if (account.customer.id !== customerId) {
      throw new ForbiddenException('You do not own this Zalo account');
    }
  }

  async disconnectAccount(accountId: string): Promise<void> {
    const conn = this.registry.get(accountId);
    if (!conn) throw new NotFoundException('Account is not connected');

    try {
      conn.api.listener.stop();
    } catch {
      this.logger.warn(`Error stopping listener for ${accountId}`);
    }

    if (conn.proxyUrl) {
      this.proxyService.releaseSlot(conn.proxyUrl);
    }

    this.registry.delete(accountId);
    await this.accountsService.updateStatus(accountId, 'disconnected');
  }

  async reconnectAccount(accountId: string): Promise<void> {
    if (this.registry.has(accountId)) {
      await this.disconnectAccount(accountId);
    }

    await this.loginWithCookieInternal(accountId, false);
  }

  async updateCredentialsAndReconnect(
    accountId: string,
    input: { imei: string; userAgent: string; cookie: object[] },
  ): Promise<void> {
    if (this.registry.has(accountId)) {
      try {
        await this.disconnectAccount(accountId);
      } catch {
        // Account might not be connected, ignore
      }
    }

    this.acquireLoginLock(accountId);
    try {
      const zalo = this.createZaloInstance();
      const credentials: Credentials = {
        imei: input.imei,
        cookie: input.cookie,
        userAgent: input.userAgent,
      };

      const api = await zalo.login(credentials);
      await this.handleLoginSuccess(accountId, api, undefined, false);
    } catch (error) {
      await this.accountsService.updateStatus(accountId, 'login_failed');
      throw error;
    } finally {
      this.loginInProgress.delete(accountId);
    }
  }

  async listConnectedByCustomer(
    customerId: string,
  ): Promise<ZaloConnectionInfo[]> {
    const accounts = await this.accountsService.findByCustomerId(customerId);
    const accountIds = new Set(accounts.map((a) => a.id));
    return this.registry.listAll().filter((c) => accountIds.has(c.accountId));
  }

  async findUsersByPhoneNumbers(
    customerId: string,
    phoneNumbers: string[],
  ): Promise<{
    results: {
      phoneNumber: string;
      avatar: string;
      uid: string;
      zalo_name: string;
      display_name: string;
      gender?: number;
    }[];
    failedCount: number;
  }> {
    const connection = await this.getConnectedApiForCustomer(customerId);
    const results: {
      phoneNumber: string;
      avatar: string;
      uid: string;
      zalo_name: string;
      display_name: string;
      gender?: number;
    }[] = [];
    let failedCount = 0;

    for (const phoneNumber of phoneNumbers) {
      try {
        const response = await connection.api.findUser(phoneNumber);
        if (!this.isFindUserResponse(response)) {
          failedCount += 1;
          continue;
        }

        results.push({
          phoneNumber,
          avatar: response.avatar,
          uid: response.uid,
          zalo_name: response.zalo_name,
          display_name: response.display_name,
          gender: typeof response.gender === 'number' ? response.gender : undefined,
        });
      } catch {
        failedCount += 1;
      }
    }

    return { results, failedCount };
  }

  getConnectionDetail(accountId: string): ZaloConnectionInfo | null {
    const conn = this.registry.get(accountId);
    if (!conn) return null;
    return {
      accountId,
      providerOwnId: conn.providerOwnId,
      phoneNumber: conn.phoneNumber,
      proxyUrl: conn.proxyUrl,
      isConnected: true,
    };
  }

  private async loginWithCookieInternal(
    accountId: string,
    isStartupReconnect: boolean,
  ): Promise<void> {
    const account = await this.accountsService.findById(accountId);
    if (!account) throw new NotFoundException('Zalo account not found');

    if (!isStartupReconnect) {
      this.acquireLoginLock(accountId);
    }

    try {
      if (!account.encryptedCookieData) {
        throw new BadRequestException('No saved cookie data for this account');
      }

      const cookieData = this.encryptionService.decrypt(
        account.encryptedCookieData,
      );
      const proxyUrl = account.proxyUrl || undefined;

      if (proxyUrl && !this.proxyService.canUseProxy(proxyUrl)) {
        throw new BadRequestException(
          'Proxy has reached maximum account limit',
        );
      }

      const zalo = this.createZaloInstance(proxyUrl);
      const credentials: Credentials = {
        imei: cookieData.imei,
        cookie: cookieData.cookie as Credentials['cookie'],
        userAgent: cookieData.userAgent,
      };

      const api = await zalo.login(credentials);
      await this.handleLoginSuccess(
        accountId,
        api,
        proxyUrl,
        isStartupReconnect,
      );
    } finally {
      this.loginInProgress.delete(accountId);
    }
  }

  private acquireLoginLock(accountId: string): void {
    if (this.loginInProgress.has(accountId)) {
      throw new ConflictException('Login already in progress for this account');
    }
    if (this.registry.has(accountId)) {
      throw new ConflictException('Account is already connected');
    }
    this.loginInProgress.add(accountId);
  }

  private createZaloInstance(proxyUrl?: string): InstanceType<typeof Zalo> {
    const zaloOptions: Record<string, unknown> = {
      imageMetadataGetter: this.imageMetadataGetter,
    };
    if (proxyUrl) {
      const agent = this.proxyService.createAgent(proxyUrl);
      zaloOptions.agent = agent;
      zaloOptions.polyfill = nodefetch;
    }
    return new Zalo(zaloOptions);
  }

  private imageMetadataGetter = async (filePath: string) => {
    try {
      const [buffer, fileStat] = await Promise.all([
        readFile(filePath),
        stat(filePath),
      ]);
      const dimensions = imageSize(buffer);
      if (!dimensions.width || !dimensions.height) return null;
      return {
        width: dimensions.width,
        height: dimensions.height,
        size: fileStat.size,
      };
    } catch {
      return null;
    }
  };

  private async handleLoginSuccess(
    accountId: string,
    api: API,
    proxyUrl?: string,
    isStartupReconnect = false,
  ): Promise<void> {
    const accountInfo = await api.fetchAccountInfo();
    const profile = accountInfo.profile;
    const ownId = api.getOwnId();
    const phoneNumber = profile.phoneNumber || '';
    const displayName = profile.displayName || '';
    const avatarUrl = profile.avatar || '';

    this.logger.log(
      `Login success: ${displayName} (${ownId}), phone=${phoneNumber}, avatar=${avatarUrl}`,
    );

    const ctx = api.getContext();
    const cookieData: ZaloCookieData = {
      imei: ctx.imei,
      cookie: ctx.cookie.toJSON().cookies,
      userAgent: ctx.userAgent,
    };
    const encrypted = this.encryptionService.encrypt(cookieData);

    // Single DB call: save cookie + update connection info together
    await this.accountsService.saveConnectionData(accountId, {
      displayName,
      encryptedCookieData: encrypted,
      providerAccountId: ownId,
      phoneNumber,
      proxyUrl,
      avatarUrl: avatarUrl || undefined,
      status: 'active',
      lastConnectedAt: new Date(),
    });

    // Skip proxy reserve on startup — already counted in ZaloProxyService.onModuleInit
    if (!isStartupReconnect && proxyUrl) {
      this.proxyService.reserveSlot(proxyUrl);
    }

    this.registry.set(accountId, {
      api,
      providerOwnId: ownId,
      phoneNumber,
      proxyUrl,
    });

    this.setupListeners(accountId, api);
    api.listener.start();
  }

  private setupListeners(accountId: string, api: API): void {
    api.listener.on('connected', () => {
      this.logger.log(`Account ${accountId} listener connected`);
    });

    api.listener.on('closed', () => {
      this.logger.warn(`Account ${accountId} listener closed`);
      const conn = this.registry.get(accountId);
      if (conn?.proxyUrl) {
        this.proxyService.releaseSlot(conn.proxyUrl);
      }
      this.registry.delete(accountId);
      this.accountsService
        .updateStatus(accountId, 'disconnected')
        .catch(() => {});

      // Don't auto-reconnect during shutdown
      if (!this.isShuttingDown && this.canReconnect(accountId)) {
        this.reconnectCooldowns.set(accountId, Date.now());
        this.loginWithCookieInternal(accountId, false).catch((err) =>
          this.logger.error(
            `Auto-reconnect failed for ${accountId}`,
            err instanceof Error ? err.message : err,
          ),
        );
      }
    });

    api.listener.on('error', (error) => {
      this.logger.error(
        `Account ${accountId} listener error`,
        error instanceof Error ? error.message : error,
      );
    });
  }

  private canReconnect(accountId: string): boolean {
    const last = this.reconnectCooldowns.get(accountId);
    if (!last) return true;
    return Date.now() - last >= RECONNECT_COOLDOWN_MS;
  }

  private async getConnectedApiForCustomer(customerId: string): Promise<{
    accountId: string;
    api: API;
  }> {
    const connections = await this.listConnectedByCustomer(customerId);
    const primary = connections[0];
    if (!primary) {
      throw new NotFoundException('No connected Zalo account available');
    }

    const api = this.registry.getApi(primary.accountId);
    if (!api) {
      throw new NotFoundException('No connected Zalo account available');
    }

    return { accountId: primary.accountId, api };
  }

  private isFindUserResponse(value: unknown): value is FindUserResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as Record<string, unknown>).avatar === 'string' &&
      typeof (value as Record<string, unknown>).display_name === 'string' &&
      typeof (value as Record<string, unknown>).zalo_name === 'string' &&
      typeof (value as Record<string, unknown>).uid === 'string'
    );
  }
}

import {
  Injectable,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { LoginQRCallbackEventType } from 'zca-js';
import type { LoginQRCallbackEvent } from 'zca-js';
import { ZaloConnectionService } from './zalo-connection.service';
import { ZaloAccountsService } from '../zalo-accounts/zalo-accounts.service';
import { ZaloQrGateway } from './zalo-qr.gateway';
import { ZaloProxyService } from './zalo-proxy.service';
import { CustomerAccount } from '../customers/customer-account.entity';

const QR_SESSION_TIMEOUT_MS = 3 * 60 * 1000;

interface QrSession {
  accountId: string;
  abortFn: (() => unknown) | null;
  timeout: ReturnType<typeof setTimeout>;
  loginSucceeded: boolean;
}

@Injectable()
export class ZaloQrLoginService {
  private readonly logger = new Logger(ZaloQrLoginService.name);
  private readonly activeSessions = new Map<string, QrSession>();

  constructor(
    private readonly connectionService: ZaloConnectionService,
    private readonly accountsService: ZaloAccountsService,
    private readonly qrGateway: ZaloQrGateway,
    private readonly proxyService: ZaloProxyService,
  ) {}

  async startQrLogin(
    customerId: string,
    displayName: string,
    proxyUrl?: string,
  ): Promise<{ accountId: string }> {
    if (this.activeSessions.has(customerId)) {
      this.cleanupSession(customerId, 'replaced');
    }

    if (proxyUrl && !this.proxyService.canUseProxy(proxyUrl)) {
      throw new BadRequestException('Proxy has reached maximum account limit');
    }

    const account = await this.accountsService.createAccount(
      { id: customerId } as CustomerAccount,
      displayName,
    );
    const accountId = account.id;

    try {
      this.connectionService.acquireLoginLock(accountId);
    } catch (err) {
      await this.accountsService.updateStatus(accountId, 'login_failed');
      throw err;
    }

    this.qrGateway.authorizeAccount(accountId, customerId);

    const timeout = setTimeout(() => {
      this.cleanupSession(customerId, 'timeout');
    }, QR_SESSION_TIMEOUT_MS);

    this.activeSessions.set(customerId, {
      accountId,
      abortFn: null,
      timeout,
      loginSucceeded: false,
    });

    this.runQrLogin(customerId, accountId, proxyUrl).catch((err) => {
      this.logger.error(
        `QR login failed for customer=${customerId}`,
        err instanceof Error ? err.message : err,
      );
      this.qrGateway.emitLoginResult(
        accountId,
        false,
        err instanceof Error ? err.message : 'QR login failed',
      );
      this.cleanupSession(customerId, 'error');
    });

    return { accountId };
  }

  cancelQrLogin(customerId: string): void {
    this.cleanupSession(customerId, 'cancelled');
  }

  private async runQrLogin(
    customerId: string,
    accountId: string,
    proxyUrl?: string,
  ): Promise<void> {
    const zalo = this.connectionService.createZaloInstance(proxyUrl);

    const callback = (event: LoginQRCallbackEvent) => {
      if (!this.activeSessions.has(customerId)) return;

      switch (event.type) {
        case LoginQRCallbackEventType.QRCodeGenerated: {
          const session = this.activeSessions.get(customerId);
          if (session) session.abortFn = event.actions.abort;
          this.qrGateway.emitQrCode(accountId, event.data.image);
          break;
        }

        case LoginQRCallbackEventType.QRCodeScanned:
          this.qrGateway.emitQrScanned(accountId, {
            avatar: event.data.avatar,
            displayName: event.data.display_name,
          });
          break;

        case LoginQRCallbackEventType.QRCodeExpired:
          if (!this.activeSessions.has(customerId)) return;
          this.qrGateway.emitQrExpired(accountId);
          event.actions.retry();
          break;

        case LoginQRCallbackEventType.QRCodeDeclined:
          this.qrGateway.emitQrDeclined(accountId);
          this.cleanupSession(customerId, 'declined');
          break;
      }
    };

    const api = await zalo.loginQR(undefined, callback);

    const session = this.activeSessions.get(customerId);
    if (!session) return;

    await this.connectionService.handleLoginSuccess(
      accountId,
      api,
      proxyUrl,
      false,
    );

    session.loginSucceeded = true;
    this.qrGateway.emitLoginResult(accountId, true);
    this.logger.log(`QR login success for customer=${customerId}`);

    clearTimeout(session.timeout);
    this.activeSessions.delete(customerId);
    this.connectionService.releaseLoginLock(accountId);
  }

  private cleanupSession(
    customerId: string,
    reason: string,
  ): void {
    const session = this.activeSessions.get(customerId);
    if (!session) return;

    this.logger.log(
      `Cleaning up QR session for customer=${customerId}, reason=${reason}`,
    );

    clearTimeout(session.timeout);

    if (session.abortFn) {
      try {
        session.abortFn();
      } catch {
        // ignore abort errors
      }
    }

    this.activeSessions.delete(customerId);
    this.connectionService.releaseLoginLock(session.accountId);
    this.qrGateway.revokeAccount(session.accountId);

    if (!session.loginSucceeded && reason !== 'cancelled') {
      this.accountsService
        .updateStatus(session.accountId, 'login_failed')
        .catch(() => {});
    }
  }
}

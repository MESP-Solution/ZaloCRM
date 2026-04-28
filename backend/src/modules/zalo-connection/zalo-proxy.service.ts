import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { AppConfigService } from '../../config/app-config.service';
import { ZaloAccountsService } from '../zalo-accounts/zalo-accounts.service';

@Injectable()
export class ZaloProxyService implements OnModuleInit {
  private readonly logger = new Logger(ZaloProxyService.name);
  private readonly proxyUsage = new Map<string, number>();
  private readonly maxPerProxy: number;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly accountsService: ZaloAccountsService,
  ) {
    this.maxPerProxy = appConfig.zaloMaxAccountsPerProxy;
  }

  async onModuleInit(): Promise<void> {
    const activeAccounts =
      await this.accountsService.findActiveAccountsWithCookies();
    for (const account of activeAccounts) {
      if (account.proxyUrl) {
        const current = this.proxyUsage.get(account.proxyUrl) || 0;
        this.proxyUsage.set(account.proxyUrl, current + 1);
      }
    }
    this.logger.log(
      `Initialized proxy usage: ${this.proxyUsage.size} proxies tracked`,
    );
  }

  canUseProxy(proxyUrl: string): boolean {
    const current = this.proxyUsage.get(proxyUrl) || 0;
    return current < this.maxPerProxy;
  }

  reserveSlot(proxyUrl: string): void {
    const current = this.proxyUsage.get(proxyUrl) || 0;
    this.proxyUsage.set(proxyUrl, current + 1);
  }

  releaseSlot(proxyUrl: string): void {
    const current = this.proxyUsage.get(proxyUrl) || 0;
    if (current > 0) {
      this.proxyUsage.set(proxyUrl, current - 1);
    }
  }

  createAgent(proxyUrl?: string): HttpsProxyAgent<string> | null {
    if (!proxyUrl) return null;
    return new HttpsProxyAgent(proxyUrl);
  }

  getProxyStats(): Array<{
    url: string;
    usedCount: number;
    maxCount: number;
  }> {
    return Array.from(this.proxyUsage.entries()).map(([url, usedCount]) => ({
      url,
      usedCount,
      maxCount: this.maxPerProxy,
    }));
  }
}

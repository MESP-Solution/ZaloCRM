import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { DailyAccountUsage } from '../entities/daily-account-usage.entity';
import { ZaloAccount } from '../../zalo-accounts/zalo-account.entity';
import { AppConfigService } from '../../../config/app-config.service';

@Injectable()
export class QuotaService {
  constructor(
    private readonly em: EntityManager,
    private readonly appConfig: AppConfigService,
    @InjectRepository(DailyAccountUsage)
    private readonly usageRepo: EntityRepository<DailyAccountUsage>,
  ) {}

  async canSend(zaloAccountId: string, em?: EntityManager): Promise<boolean> {
    const usage = await this.getOrCreateTodayUsage(zaloAccountId, em);
    if (usage.autoSentCount >= usage.dailyLimit) return false;

    const hourlyLimit = this.appConfig.zaloHourlySendLimit;
    if (hourlyLimit > 0) {
      this.resetHourlyIfNeeded(usage);
      if (usage.hourlySentCount >= hourlyLimit) return false;
    }

    return true;
  }

  async incrementDailySent(zaloAccountId: string, em?: EntityManager): Promise<void> {
    const effectiveEm = em ?? this.em;
    const usage = await this.getOrCreateTodayUsage(zaloAccountId, em);
    usage.autoSentCount += 1;

    const hourlyLimit = this.appConfig.zaloHourlySendLimit;
    if (hourlyLimit > 0) {
      this.resetHourlyIfNeeded(usage);
      usage.hourlySentCount += 1;
    }

    await effectiveEm.flush();
  }

  private resetHourlyIfNeeded(usage: DailyAccountUsage): void {
    const currentHour = new Date().getUTCHours();
    if (usage.lastHourlyReset !== currentHour) {
      usage.hourlySentCount = 0;
      usage.lastHourlyReset = currentHour;
    }
  }

  async getRemainingQuota(zaloAccountId: string, em?: EntityManager): Promise<number> {
    const usage = await this.getOrCreateTodayUsage(zaloAccountId, em);
    return Math.max(0, usage.dailyLimit - usage.autoSentCount);
  }

  async getLeastUsedAccountId(accountIds: string[], em?: EntityManager): Promise<string | null> {
    if (accountIds.length === 0) return null;
    if (accountIds.length === 1) return accountIds[0];

    const effectiveEm = em ?? this.em;
    const today = new Date().toISOString().slice(0, 10);
    const usages = await effectiveEm.find(DailyAccountUsage, {
      zaloAccount: { id: { $in: accountIds } },
      date: today,
    });

    const usageMap = new Map(
      usages.map((u) => [u.zaloAccount.id, u.autoSentCount]),
    );

    let leastId = accountIds[0];
    let leastCount = usageMap.get(leastId) ?? 0;

    for (let i = 1; i < accountIds.length; i++) {
      const count = usageMap.get(accountIds[i]) ?? 0;
      if (count < leastCount) {
        leastCount = count;
        leastId = accountIds[i];
      }
    }

    return leastId;
  }

  private async getOrCreateTodayUsage(
    zaloAccountId: string,
    em?: EntityManager,
  ): Promise<DailyAccountUsage> {
    const effectiveEm = em ?? this.em;
    const today = new Date().toISOString().slice(0, 10);
    let usage = await effectiveEm.findOne(DailyAccountUsage, {
      zaloAccount: { id: zaloAccountId },
      date: today,
    });

    if (!usage) {
      const zaloAccount = await effectiveEm.findOneOrFail(ZaloAccount, {
        id: zaloAccountId,
      });
      usage = new DailyAccountUsage(
        zaloAccount,
        today,
        this.appConfig.zaloDailySendLimit,
      );
      effectiveEm.persist(usage);
      await effectiveEm.flush();
    }

    return usage;
  }
}

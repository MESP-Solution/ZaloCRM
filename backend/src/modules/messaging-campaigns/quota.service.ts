import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { DailyAccountUsage } from './daily-account-usage.entity';
import { ZaloAccount } from '../zalo-accounts/zalo-account.entity';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class QuotaService {
  constructor(
    private readonly em: EntityManager,
    private readonly appConfig: AppConfigService,
    @InjectRepository(DailyAccountUsage)
    private readonly usageRepo: EntityRepository<DailyAccountUsage>,
  ) {}

  async canSend(zaloAccountId: string): Promise<boolean> {
    const usage = await this.getOrCreateTodayUsage(zaloAccountId);
    return usage.autoSentCount < usage.dailyLimit;
  }

  async incrementDailySent(zaloAccountId: string): Promise<void> {
    const usage = await this.getOrCreateTodayUsage(zaloAccountId);
    usage.autoSentCount += 1;
    await this.em.flush();
  }

  async getRemainingQuota(zaloAccountId: string): Promise<number> {
    const usage = await this.getOrCreateTodayUsage(zaloAccountId);
    return Math.max(0, usage.dailyLimit - usage.autoSentCount);
  }

  private async getOrCreateTodayUsage(
    zaloAccountId: string,
  ): Promise<DailyAccountUsage> {
    const today = new Date().toISOString().slice(0, 10);
    let usage = await this.usageRepo.findOne({
      zaloAccount: { id: zaloAccountId },
      date: today,
    });

    if (!usage) {
      const zaloAccount = await this.em.findOneOrFail(ZaloAccount, {
        id: zaloAccountId,
      });
      usage = new DailyAccountUsage(
        zaloAccount,
        today,
        this.appConfig.zaloDailySendLimit,
      );
      this.em.persist(usage);
      await this.em.flush();
    }

    return usage;
  }
}

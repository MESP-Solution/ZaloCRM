import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { MessagingCampaign } from './messaging-campaign.entity';
import { CampaignRecipient } from './campaign-recipient.entity';
import { CampaignZaloAccount } from './campaign-zalo-account.entity';
import { DeliveryAttempt } from './delivery-attempt.entity';
import { QuotaService } from './quota.service';

interface AccountBreakdown {
  accountId: string;
  displayName: string;
  status: string;
  sentCount: number;
  failedAttempts: number;
  remainingQuota: number;
}

export interface CampaignStatsResponse {
  totalRecipients: number;
  sent: number;
  failed: number;
  queued: number;
  skipped: number;
  sending: number;
  accounts: AccountBreakdown[];
}

@Injectable()
export class CampaignStatsService {
  constructor(
    private readonly em: EntityManager,
    private readonly quotaService: QuotaService,
  ) {}

  async getCampaignStats(campaignId: string): Promise<CampaignStatsResponse> {
    const campaign = await this.em.findOne(MessagingCampaign, {
      id: campaignId,
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const recipients = await this.em.find(CampaignRecipient, {
      campaign: { id: campaignId },
    });

    const statusCounts = {
      queued: 0,
      sending: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };
    for (const r of recipients) {
      if (r.status in statusCounts) {
        statusCounts[r.status] += 1;
      }
    }

    const campaignAccounts = await this.em.find(
      CampaignZaloAccount,
      { campaign: { id: campaignId } },
      { populate: ['zaloAccount'] },
    );

    const accounts: AccountBreakdown[] = [];
    for (const ca of campaignAccounts) {
      const sentCount = recipients.filter(
        (r) =>
          r.status === 'sent' && r.sentByZaloAccount?.id === ca.zaloAccount.id,
      ).length;

      const failedAttempts = await this.em.count(DeliveryAttempt, {
        campaignRecipient: { campaign: { id: campaignId } },
        zaloAccount: { id: ca.zaloAccount.id },
        status: 'failed',
      });

      const remainingQuota = await this.quotaService.getRemainingQuota(
        ca.zaloAccount.id,
      );

      accounts.push({
        accountId: ca.zaloAccount.id,
        displayName: ca.zaloAccount.displayName,
        status: ca.status,
        sentCount,
        failedAttempts,
        remainingQuota,
      });
    }

    return {
      totalRecipients: recipients.length,
      ...statusCounts,
      accounts,
    };
  }
}

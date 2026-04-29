import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { MessagingCampaign } from './messaging-campaign.entity';
import { CampaignZaloAccount } from './campaign-zalo-account.entity';
import { CampaignRecipient } from './campaign-recipient.entity';
import { DeliveryAttempt } from './delivery-attempt.entity';
import { QuotaService } from './quota.service';
import { ZALO_PROVIDER } from '../zalo-provider/zalo-provider.port';
import type { ZaloProviderPort } from '../zalo-provider/zalo-provider.port';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class CampaignDispatchService {
  private readonly logger = new Logger(CampaignDispatchService.name);
  private readonly activeDispatches = new Set<string>();

  constructor(
    private readonly em: EntityManager,
    private readonly quotaService: QuotaService,
    @Inject(ZALO_PROVIDER)
    private readonly zaloProvider: ZaloProviderPort,
    private readonly appConfig: AppConfigService,
  ) {}

  async startDispatch(campaignId: string): Promise<{ message: string }> {
    if (this.activeDispatches.has(campaignId)) {
      throw new BadRequestException('Campaign is already being dispatched');
    }

    const campaign = await this.em.findOneOrFail(MessagingCampaign, {
      id: campaignId,
    });

    const validStatuses = [
      'draft',
      'queued',
      'paused_quota_exhausted',
      'paused_no_available_account',
    ];
    if (!validStatuses.includes(campaign.status)) {
      throw new BadRequestException(
        `Campaign cannot be dispatched from status: ${campaign.status}`,
      );
    }

    campaign.status = 'sending';
    campaign.updatedAt = new Date();
    await this.em.flush();

    this.activeDispatches.add(campaignId);

    this.dispatchLoop(campaignId)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        this.logger.error(
          `Fatal error in dispatch loop for campaign ${campaignId}: ${message}`,
          stack,
        );
      })
      .finally(() => {
        this.activeDispatches.delete(campaignId);
      });

    return { message: 'Dispatch started' };
  }

  private async dispatchLoop(campaignId: string): Promise<void> {
    const em = this.em.fork();
    const delayMs = this.appConfig.campaignSendDelayMs;

    while (true) {
      em.clear();
      const campaign = await em.findOneOrFail(MessagingCampaign, {
        id: campaignId,
      });

      if (campaign.status === 'cancelled') {
        this.logger.log(`Campaign ${campaignId} cancelled, stopping dispatch`);
        return;
      }

      if (campaign.status !== 'sending') {
        this.logger.log(
          `Campaign ${campaignId} status changed to ${campaign.status}, stopping`,
        );
        return;
      }

      const recipient = await em.findOne(
        CampaignRecipient,
        { campaign: { id: campaignId }, status: 'queued' },
        { orderBy: { createdAt: 'ASC' } },
      );

      if (!recipient) {
        campaign.status = 'completed';
        campaign.updatedAt = new Date();
        await em.flush();
        this.logger.log(`Campaign ${campaignId} completed`);
        return;
      }

      const accounts = await em.find(
        CampaignZaloAccount,
        { campaign: { id: campaignId } },
        { populate: ['zaloAccount'] },
      );

      const result = await this.sendToRecipient(
        em,
        campaign,
        recipient,
        accounts,
      );

      if (result === 'paused_quota_exhausted') {
        campaign.status = 'paused_quota_exhausted';
        campaign.updatedAt = new Date();
        await em.flush();
        this.logger.warn(
          `Campaign ${campaignId} paused: all accounts quota exhausted`,
        );
        return;
      }

      if (result === 'paused_no_available_account') {
        campaign.status = 'paused_no_available_account';
        campaign.updatedAt = new Date();
        await em.flush();
        this.logger.warn(
          `Campaign ${campaignId} paused: no available accounts`,
        );
        return;
      }

      await em.flush();
      await this.sleep(delayMs);
    }
  }

  private async sendToRecipient(
    em: EntityManager,
    campaign: MessagingCampaign,
    recipient: CampaignRecipient,
    accounts: CampaignZaloAccount[],
  ): Promise<
    | 'sent'
    | 'failed'
    | 'skipped'
    | 'paused_quota_exhausted'
    | 'paused_no_available_account'
  > {
    if (!recipient.recipientZaloId) {
      recipient.status = 'skipped';
      recipient.errorMessage = 'No Zalo ID resolved for this phone number';
      recipient.updatedAt = new Date();
      return 'skipped';
    }

    recipient.status = 'sending';
    recipient.updatedAt = new Date();
    await em.flush();

    const activeAccounts = accounts.filter((a) => a.status === 'active');

    if (activeAccounts.length === 0) {
      const allQuotaExhausted = accounts.every(
        (a) => a.status === 'quota_exhausted',
      );
      recipient.status = 'queued';
      recipient.updatedAt = new Date();
      return allQuotaExhausted
        ? 'paused_quota_exhausted'
        : 'paused_no_available_account';
    }

    let attemptNumber = recipient.attemptCount;

    for (const campaignAccount of activeAccounts) {
      const canSend = await this.quotaService.canSend(
        campaignAccount.zaloAccount.id,
      );

      if (!canSend) {
        campaignAccount.status = 'quota_exhausted';
        campaignAccount.updatedAt = new Date();
        continue;
      }

      attemptNumber += 1;
      const attempt = await this.attemptSend(
        em,
        campaign,
        recipient,
        campaignAccount,
        attemptNumber,
      );

      recipient.attemptCount = attemptNumber;

      if (attempt.status === 'sent') {
        recipient.status = 'sent';
        recipient.sentByZaloAccount = campaignAccount.zaloAccount;
        recipient.providerMessageId = attempt.providerMessageId;
        recipient.updatedAt = new Date();
        campaign.sentCount += 1;
        await this.quotaService.incrementDailySent(
          campaignAccount.zaloAccount.id,
        );
        return 'sent';
      }
    }

    const stillActive = accounts.filter((a) => a.status === 'active');
    if (stillActive.length === 0) {
      recipient.status = 'queued';
      recipient.updatedAt = new Date();
      const allQuota = accounts.every((a) => a.status === 'quota_exhausted');
      return allQuota
        ? 'paused_quota_exhausted'
        : 'paused_no_available_account';
    }

    recipient.status = 'failed';
    recipient.updatedAt = new Date();
    campaign.failedCount += 1;
    return 'failed';
  }

  private async attemptSend(
    em: EntityManager,
    campaign: MessagingCampaign,
    recipient: CampaignRecipient,
    campaignAccount: CampaignZaloAccount,
    attemptNumber: number,
  ): Promise<DeliveryAttempt> {
    const attempt = new DeliveryAttempt(
      recipient,
      campaignAccount.zaloAccount,
      attemptNumber,
    );

    try {
      const result = await this.zaloProvider.sendMessage({
        zaloAccountId: campaignAccount.zaloAccount.id,
        recipientId: recipient.recipientZaloId!,
        text: campaign.messageText,
        campaignId: campaign.id,
      });
      attempt.status = 'sent';
      attempt.providerMessageId = result.providerMessageId;
    } catch (error: unknown) {
      attempt.status = 'failed';
      attempt.errorMessage =
        error instanceof Error ? error.message : String(error);

      if (error instanceof Error && error.message.includes('not connected')) {
        campaignAccount.status = 'disconnected';
        campaignAccount.updatedAt = new Date();
      }
    }

    attempt.finishedAt = new Date();
    em.persist(attempt);
    await em.flush();
    return attempt;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

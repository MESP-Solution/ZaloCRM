import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
  OnModuleInit,
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
import { resolveMessagePlaceholders } from './resolve-message-placeholders';

@Injectable()
export class CampaignDispatchService implements OnModuleInit {
  private readonly logger = new Logger(CampaignDispatchService.name);
  private readonly activeDispatches = new Set<string>();
  private readonly accountBackoff = new Map<string, number>();

  constructor(
    private readonly em: EntityManager,
    private readonly quotaService: QuotaService,
    @Inject(ZALO_PROVIDER)
    private readonly zaloProvider: ZaloProviderPort,
    private readonly appConfig: AppConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const em = this.em.fork();
    const stuckCampaigns = await em.find(MessagingCampaign, {
      status: 'sending',
    });

    if (stuckCampaigns.length === 0) return;

    this.logger.log(
      `Recovering ${stuckCampaigns.length} stuck campaign(s) from previous run`,
    );

    for (const campaign of stuckCampaigns) {
      try {
        campaign.status = 'queued';
        campaign.updatedAt = new Date();
        await em.flush();
        await this.startDispatch(campaign.id);
        this.logger.log(`Resumed dispatch for campaign ${campaign.id}`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Failed to resume campaign ${campaign.id}: ${message}`,
        );
      }
    }
  }

  async startDispatch(campaignId: string): Promise<{ message: string }> {
    if (this.activeDispatches.has(campaignId)) {
      throw new BadRequestException('Campaign is already being dispatched');
    }

    const em = this.em.fork();
    const campaign = await em.findOneOrFail(MessagingCampaign, {
      id: campaignId,
    });

    const validStatuses = [
      'draft',
      'queued',
      'paused_manual',
      'paused_quota_exhausted',
      'paused_no_available_account',
    ];
    if (!validStatuses.includes(campaign.status)) {
      throw new BadRequestException(
        `Campaign cannot be dispatched from status: ${campaign.status}`,
      );
    }

    this.activeDispatches.add(campaignId);

    campaign.status = 'sending';
    campaign.updatedAt = new Date();
    try {
      await em.flush();
    } catch (error) {
      this.activeDispatches.delete(campaignId);
      throw error;
    }

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
    if (!recipient.recipientZaloId && recipient.recipientPhone) {
      const activeAccountIds = accounts
        .filter((a) => a.status === 'active')
        .map((a) => a.zaloAccount.id);
      const lookupAccountId =
        await this.quotaService.getLeastUsedAccountId(activeAccountIds, em);
      if (lookupAccountId) {
        const resolvedUid = await this.zaloProvider.findUser(
          lookupAccountId,
          recipient.recipientPhone,
        );
        if (resolvedUid) {
          recipient.recipientZaloId = resolvedUid;
          await em.flush();
        }
      }
    }

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
    const leastUsedId = await this.quotaService.getLeastUsedAccountId(
      activeAccounts.map((a) => a.zaloAccount.id),
      em,
    );
    if (leastUsedId) {
      activeAccounts.sort((a, b) =>
        a.zaloAccount.id === leastUsedId ? -1 : b.zaloAccount.id === leastUsedId ? 1 : 0,
      );
    }

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
        em,
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
          em,
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

    const accountId = campaignAccount.zaloAccount.id;
    const backoffMs = this.accountBackoff.get(accountId) ?? 0;
    if (backoffMs > 0) {
      await this.sleep(backoffMs);
    }

    try {
      const resolvedText = resolveMessagePlaceholders(campaign.messageText, recipient);
      const result = await this.zaloProvider.sendMessage({
        zaloAccountId: accountId,
        recipientId: recipient.recipientZaloId!,
        text: resolvedText,
        campaignId: campaign.id,
        imageFilePath: campaign.imageFilePath,
      });
      attempt.status = 'sent';
      attempt.providerMessageId = result.providerMessageId;
      this.accountBackoff.delete(accountId);
    } catch (error: unknown) {
      attempt.status = 'failed';
      const errorMsg =
        error instanceof Error ? error.message : String(error);
      attempt.errorMessage = errorMsg;

      const lowerMsg = errorMsg.toLowerCase();

      if (lowerMsg.includes('not connected')) {
        campaignAccount.status = 'disconnected';
        campaignAccount.updatedAt = new Date();
      } else if (
        lowerMsg.includes('restricted') ||
        lowerMsg.includes('banned') ||
        lowerMsg.includes('blocked')
      ) {
        campaignAccount.status = 'restricted';
        campaignAccount.updatedAt = new Date();
      }

      if (
        lowerMsg.includes('rate') ||
        lowerMsg.includes('limit') ||
        lowerMsg.includes('spam') ||
        lowerMsg.includes('too many')
      ) {
        const currentBackoff = this.accountBackoff.get(accountId) || Math.max(this.appConfig.campaignSendDelayMs, 1000);
        const nextBackoff = Math.min(
          currentBackoff * 2,
          this.appConfig.campaignMaxBackoffMs,
        );
        this.accountBackoff.set(accountId, nextBackoff);
        this.logger.warn(
          `Rate-limit detected for account ${accountId}, backoff=${nextBackoff}ms`,
        );
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

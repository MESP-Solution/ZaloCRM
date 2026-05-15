import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { MessagingCampaign } from '../entities/messaging-campaign.entity';
import { CampaignZaloAccount } from '../entities/campaign-zalo-account.entity';
import { CampaignRecipient } from '../entities/campaign-recipient.entity';
import { DeliveryAttempt } from '../entities/delivery-attempt.entity';
import { QuotaService } from './quota.service';
import { ZALO_PROVIDER } from '../../zalo-provider/zalo-provider.port';
import type { ZaloProviderPort } from '../../zalo-provider/zalo-provider.port';
import { AppConfigService } from '../../../config/app-config.service';
import { ZaloConnectionService } from '../../zalo-connection/zalo-connection.service';
import { resolveMessagePlaceholders } from '../utils/resolve-message-placeholders';

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
    private readonly zaloConnectionService: ZaloConnectionService,
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

    const initialCampaign = await em.findOne(
      MessagingCampaign,
      { id: campaignId },
      { populate: ['customer'] },
    );
    if (!initialCampaign) return;

    const accounts = await em.find(
      CampaignZaloAccount,
      { campaign: { id: campaignId } },
      { populate: ['zaloAccount'] },
    );

    const friendSets = await this.loadFriendSets(
      initialCampaign.customer.id,
      accounts,
    );

    while (true) {
      em.clear();
      const campaign = await em.findOne(MessagingCampaign, {
        id: campaignId,
      });

      if (!campaign) {
        this.logger.log(`Campaign ${campaignId} deleted, stopping dispatch`);
        return;
      }

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

        await em.flush();
        this.logger.log(`Campaign ${campaignId} completed`);
        return;
      }

      const currentAccounts = await em.find(
        CampaignZaloAccount,
        { campaign: { id: campaignId } },
        { populate: ['zaloAccount'] },
      );

      const result = await this.sendToRecipient(
        em,
        campaign,
        recipient,
        currentAccounts,
        friendSets,
      );

      if (result === 'paused_quota_exhausted') {
        campaign.status = 'paused_quota_exhausted';

        await em.flush();
        this.logger.warn(
          `Campaign ${campaignId} paused: all accounts quota exhausted`,
        );
        return;
      }

      if (result === 'paused_no_available_account') {
        campaign.status = 'paused_no_available_account';

        await em.flush();
        this.logger.warn(
          `Campaign ${campaignId} paused: no available accounts`,
        );
        return;
      }

      await em.flush();
      await this.sleep(this.jitteredDelay(delayMs));
    }
  }

  private async loadFriendSets(
    customerId: string,
    accounts: CampaignZaloAccount[],
  ): Promise<Map<string, Set<string>>> {
    const friendSets = new Map<string, Set<string>>();
    for (const ca of accounts) {
      try {
        const friends = await this.zaloConnectionService.getAllFriends(
          customerId,
          ca.zaloAccount.id,
        );
        const uidSet = new Set(
          (friends as Array<{ userId: string }>).map((f) => f.userId),
        );
        friendSets.set(ca.zaloAccount.id, uidSet);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to load friend list for account=${ca.zaloAccount.id}: ${msg} — treating all recipients as strangers`,
        );
        friendSets.set(ca.zaloAccount.id, new Set());
      }
    }
    return friendSets;
  }

  private jitteredDelay(baseMs: number): number {
    const jitter = Math.floor(Math.random() * 10000) - 5000;
    return Math.max(5000, baseMs + jitter);
  }

  private async sendToRecipient(
    em: EntityManager,
    campaign: MessagingCampaign,
    recipient: CampaignRecipient,
    accounts: CampaignZaloAccount[],
    friendSets: Map<string, Set<string>>,
  ): Promise<
    | 'sent'
    | 'failed'
    | 'skipped'
    | 'paused_quota_exhausted'
    | 'paused_no_available_account'
  > {
    const isFriendCampaign = campaign.campaignType === 'friend';

    if (!isFriendCampaign && !recipient.recipientZaloId && recipient.recipientPhone) {
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
          await this.sleep(3000);
        }
      }
    }

    if (!recipient.recipientZaloId) {
      recipient.status = 'skipped';
      recipient.errorMessage = recipient.recipientPhone
        ? 'No Zalo ID resolved for this phone number'
        : 'No Zalo ID and no phone number provided';

      return 'skipped';
    }

    recipient.status = 'sending';
    await em.flush();

    const activeAccounts = accounts.filter((a) => a.status === 'active');
    if (!isFriendCampaign) {
      const leastUsedId = await this.quotaService.getLeastUsedAccountId(
        activeAccounts.map((a) => a.zaloAccount.id),
        em,
      );
      if (leastUsedId) {
        activeAccounts.sort((a, b) =>
          a.zaloAccount.id === leastUsedId ? -1 : b.zaloAccount.id === leastUsedId ? 1 : 0,
        );
      }
    }

    if (activeAccounts.length === 0) {
      const allQuotaExhausted = accounts.every(
        (a) => a.status === 'quota_exhausted',
      );
      recipient.status = 'queued';

      return allQuotaExhausted
        ? 'paused_quota_exhausted'
        : 'paused_no_available_account';
    }

    let attemptNumber = recipient.attemptCount;
    let lastErrorMessage: string | undefined;

    for (let i = 0; i < activeAccounts.length; i++) {
      const campaignAccount = activeAccounts[i];
      if (i > 0) {
        await this.sleep(5000);
      }

      const isFriendOfAccount = friendSets
        .get(campaignAccount.zaloAccount.id)
        ?.has(recipient.recipientZaloId!) ?? false;
      recipient.isFriend = isFriendOfAccount;

      if (!isFriendOfAccount) {
        const canSend = await this.quotaService.canSend(
          campaignAccount.zaloAccount.id,
          em,
        );

        if (!canSend) {
          campaignAccount.status = 'quota_exhausted';

          continue;
        }
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

        campaign.sentCount += 1;
        if (!isFriendOfAccount) {
          await this.quotaService.incrementDailySent(
            campaignAccount.zaloAccount.id,
            em,
          );
        }
        return 'sent';
      }

      lastErrorMessage = attempt.errorMessage;
    }

    const stillActive = accounts.filter((a) => a.status === 'active');
    if (stillActive.length === 0) {
      recipient.status = 'queued';

      const allQuota = accounts.every((a) => a.status === 'quota_exhausted');
      return allQuota
        ? 'paused_quota_exhausted'
        : 'paused_no_available_account';
    }

    const isRateLimitError = lastErrorMessage &&
      lastErrorMessage.toLowerCase().includes('không hợp lệ');
    if (isRateLimitError && recipient.attemptCount < 6) {
      recipient.status = 'queued';
      this.logger.warn(
        `Recipient ${recipient.recipientZaloId} requeued (attempt ${recipient.attemptCount}/6) due to suspected rate limit`,
      );
      return 'sent';
    }

    recipient.status = 'failed';
    recipient.errorMessage = lastErrorMessage;
    campaign.failedCount += 1;
    return 'failed';
  }

  private isRetryableError(errorMsg: string): boolean {
    const lower = errorMsg.toLowerCase();
    if (lower.includes('cannot send message to self')) return false;
    return (
      lower.includes('không hợp lệ') ||
      lower.includes('invalid') ||
      lower.includes('timeout') ||
      lower.includes('econnreset') ||
      lower.includes('econnrefused')
    );
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

    const maxRetries = 2;
    const resolvedText = resolveMessagePlaceholders(campaign.messageText, recipient);
    let lastError: string | undefined;

    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        if (retry > 0) {
          const retryDelay = this.jitteredDelay(retry * 10000);
          this.logger.log(
            `Retry ${retry}/${maxRetries} for recipient=${recipient.recipientZaloId} after ${retryDelay}ms`,
          );
          await this.sleep(retryDelay);
        }

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
        lastError = undefined;
        break;
      } catch (error: unknown) {
        const errorMsg =
          error instanceof Error ? error.message : String(error);
        lastError = errorMsg;

        if (retry < maxRetries && this.isRetryableError(errorMsg)) {
          continue;
        }
        break;
      }
    }

    if (lastError) {
      attempt.status = 'failed';
      attempt.errorMessage = lastError;
      this.logger.error(
        `Send failed [campaign=${campaign.id}] [account=${accountId}] [recipient=${recipient.recipientZaloId}]: ${lastError}`,
      );

      const lowerMsg = lastError.toLowerCase();

      if (lowerMsg.includes('not connected')) {
        campaignAccount.status = 'disconnected';
        campaignAccount.zaloAccount.status = 'disconnected';
      } else if (
        lowerMsg.includes('restricted') ||
        lowerMsg.includes('banned') ||
        lowerMsg.includes('blocked')
      ) {
        campaignAccount.status = 'restricted';
        campaignAccount.zaloAccount.status = 'restricted';
      }

      if (
        lowerMsg.includes('rate') ||
        lowerMsg.includes('limit') ||
        lowerMsg.includes('spam') ||
        lowerMsg.includes('too many') ||
        lowerMsg.includes('không hợp lệ')
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
    try {
      em.persist(attempt);
      await em.flush();
    } catch (flushErr) {
      this.logger.warn(
        `Failed to persist delivery attempt for recipient=${recipient.recipientZaloId}: ${flushErr instanceof Error ? flushErr.message : flushErr}`,
      );
      em.clear();
    }
    return attempt;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

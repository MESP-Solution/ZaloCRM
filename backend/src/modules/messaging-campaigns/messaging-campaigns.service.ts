import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  requireText,
  requireTextList,
} from '../../common/validation/request-validation';
import { CustomersService } from '../customers/customers.service';
import { ZaloAccountsService } from '../zalo-accounts/zalo-accounts.service';
import { ZALO_PROVIDER } from '../zalo-provider/zalo-provider.port';
import type { ZaloProviderPort } from '../zalo-provider/zalo-provider.port';
import { CreateMessagingCampaignDto } from './dto/create-messaging-campaign.dto';
import { MessagingCampaign } from './messaging-campaign.entity';

@Injectable()
export class MessagingCampaignsService {
  private readonly campaigns = new Map<string, MessagingCampaign>();

  constructor(
    private readonly customersService: CustomersService,
    private readonly zaloAccountsService: ZaloAccountsService,
    @Inject(ZALO_PROVIDER) private readonly zaloProvider: ZaloProviderPort,
  ) {}

  createCampaign(dto: CreateMessagingCampaignDto): MessagingCampaign {
    const customerId = requireText(dto.customerId, 'customerId');
    const zaloAccountId = requireText(dto.zaloAccountId, 'zaloAccountId');
    const recipientIds = requireTextList(dto.recipientIds, 'recipientIds');
    this.customersService.getCustomer(customerId);
    this.zaloAccountsService.getAccount(zaloAccountId);

    const now = new Date();
    const campaign: MessagingCampaign = {
      id: randomUUID(),
      customerId,
      zaloAccountId,
      name: requireText(dto.name, 'name'),
      messageText: requireText(dto.messageText, 'messageText'),
      status: 'draft',
      jobs: recipientIds.map((recipientId) => ({
        id: randomUUID(),
        recipientId,
        status: 'queued',
      })),
      createdAt: now,
      updatedAt: now,
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  listCampaigns(customerId?: string): MessagingCampaign[] {
    const campaigns = [...this.campaigns.values()];

    if (!customerId) {
      return campaigns;
    }

    return campaigns.filter((campaign) => campaign.customerId === customerId);
  }

  getCampaign(campaignId: string): MessagingCampaign {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      throw new NotFoundException('Messaging campaign not found');
    }

    return campaign;
  }

  async dispatchCampaign(campaignId: string): Promise<MessagingCampaign> {
    const campaign = this.getCampaign(campaignId);
    campaign.status = 'sending';
    campaign.updatedAt = new Date();

    try {
      for (const job of campaign.jobs) {
        const result = await this.zaloProvider.sendMessage({
          zaloAccountId: campaign.zaloAccountId,
          recipientId: job.recipientId,
          text: campaign.messageText,
          campaignId: campaign.id,
        });

        job.status = 'sent';
        job.providerMessageId = result.providerMessageId;
      }
    } catch (error) {
      campaign.status = 'failed';
      campaign.updatedAt = new Date();
      this.markQueuedJobsFailed(campaign, error);
      throw error;
    }

    campaign.status = 'completed';
    campaign.updatedAt = new Date();
    return campaign;
  }

  private markQueuedJobsFailed(campaign: MessagingCampaign, error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown dispatch error';

    for (const job of campaign.jobs) {
      if (job.status === 'queued') {
        job.status = 'failed';
        job.errorMessage = errorMessage;
      }
    }
  }
}

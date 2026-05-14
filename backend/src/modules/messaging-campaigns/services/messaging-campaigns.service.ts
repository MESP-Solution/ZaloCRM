import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import {
  MessagingCampaign,
  MessagingCampaignStatus,
  MessagingCampaignType,
} from '../entities/messaging-campaign.entity';
import { CampaignZaloAccount } from '../entities/campaign-zalo-account.entity';
import { CampaignRecipient } from '../entities/campaign-recipient.entity';
import { DeliveryAttempt } from '../entities/delivery-attempt.entity';
import { CustomersService } from '../../customers/customers.service';
import { ZaloAccountsService } from '../../zalo-accounts/zalo-accounts.service';

interface RecipientInput {
  phone?: string;
  zaloId?: string;
  name?: string;
  gender?: number;
}

@Injectable()
export class MessagingCampaignsService {
  constructor(
    private readonly em: EntityManager,
    private readonly customersService: CustomersService,
    private readonly zaloAccountsService: ZaloAccountsService,
    @InjectRepository(MessagingCampaign)
    private readonly campaignRepo: EntityRepository<MessagingCampaign>,
    @InjectRepository(CampaignRecipient)
    private readonly recipientRepo: EntityRepository<CampaignRecipient>,
    @InjectRepository(CampaignZaloAccount)
    private readonly campaignAccountRepo: EntityRepository<CampaignZaloAccount>,
  ) {}

  async createCampaign(
    customerId: string,
    name: string,
    messageText: string,
    zaloAccountIds: string[],
    recipients: RecipientInput[],
    scheduleAt?: Date,
    imageFilePath?: string,
    campaignType?: MessagingCampaignType,
  ): Promise<MessagingCampaign> {
    const customer = await this.customersService.findById(customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!zaloAccountIds.length) {
      throw new BadRequestException('At least one Zalo account is required');
    }

    if (!recipients.length) {
      throw new BadRequestException('At least one recipient is required');
    }

    const zaloAccounts = await Promise.all(
      zaloAccountIds.map(async (id) => {
        const account = await this.zaloAccountsService.findById(id);
        if (!account) {
          throw new NotFoundException(`Zalo account ${id} not found`);
        }
        if (account.customer.id !== customer.id) {
          throw new BadRequestException(
            `Zalo account ${id} does not belong to customer`,
          );
        }
        return account;
      }),
    );

    const campaign = new MessagingCampaign(customer, name, messageText);
    if (campaignType) {
      campaign.campaignType = campaignType;
    }
    if (imageFilePath) {
      campaign.imageFilePath = imageFilePath;
    }
    if (scheduleAt) {
      campaign.scheduleAt = scheduleAt;
      campaign.status = 'queued';
    }
    campaign.queuedCount = recipients.length;
    this.em.persist(campaign);

    for (const account of zaloAccounts) {
      const campaignAccount = new CampaignZaloAccount(campaign, account);
      this.em.persist(campaignAccount);
    }

    for (const r of recipients) {
      const recipient = new CampaignRecipient(
        campaign,
        r.phone,
        r.zaloId,
        r.name,
        r.gender,
      );
      this.em.persist(recipient);
    }

    await this.em.flush();
    return campaign;
  }

  async findById(campaignId: string): Promise<MessagingCampaign | null> {
    return this.campaignRepo.findOne({ id: campaignId });
  }

  async listCampaigns(customerId: string): Promise<MessagingCampaign[]> {
    return this.campaignRepo.find({ customer: { id: customerId } });
  }

  async assertOwnership(
    campaignId: string,
    customerId: string,
  ): Promise<MessagingCampaign> {
    const campaign = await this.campaignRepo.findOne(
      { id: campaignId },
      { populate: ['customer'] },
    );
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.customer.id !== customerId) {
      throw new ForbiddenException('You do not own this campaign');
    }
    return campaign;
  }

  async updateStatus(
    campaignId: string,
    status: MessagingCampaignStatus,
  ): Promise<MessagingCampaign | null> {
    const campaign = await this.campaignRepo.findOne({ id: campaignId });
    if (!campaign) {
      return null;
    }
    campaign.status = status;
    await this.em.flush();
    return campaign;
  }

  async pauseCampaign(campaignId: string): Promise<MessagingCampaign | null> {
    const campaign = await this.campaignRepo.findOne({ id: campaignId });
    if (!campaign) {
      return null;
    }
    if (campaign.status !== 'sending') {
      throw new BadRequestException('Can only pause a sending campaign');
    }
    campaign.status = 'paused_manual';
    await this.em.flush();
    return campaign;
  }

  async resumeCampaign(campaignId: string): Promise<MessagingCampaign | null> {
    const campaign = await this.campaignRepo.findOne({ id: campaignId });
    if (!campaign) {
      return null;
    }
    const pausedStatuses: MessagingCampaignStatus[] = [
      'paused_manual',
      'paused_quota_exhausted',
      'paused_no_available_account',
    ];
    if (!pausedStatuses.includes(campaign.status)) {
      throw new BadRequestException('Can only resume a paused campaign');
    }

    campaign.status = 'queued';

    const campaignAccounts = await this.campaignAccountRepo.find({
      campaign: { id: campaignId },
      status: 'quota_exhausted',
    });
    for (const ca of campaignAccounts) {
      ca.status = 'active';
    }

    await this.em.flush();
    return campaign;
  }

  async cancelCampaign(campaignId: string): Promise<MessagingCampaign | null> {
    const campaign = await this.campaignRepo.findOne({ id: campaignId });
    if (!campaign) {
      return null;
    }
    if (campaign.status === 'completed' || campaign.status === 'cancelled') {
      throw new BadRequestException(
        'Cannot cancel a completed or already cancelled campaign',
      );
    }
    campaign.status = 'cancelled';
    await this.em.flush();
    return campaign;
  }

  async getCampaignAccounts(
    campaignId: string,
  ): Promise<CampaignZaloAccount[]> {
    return this.campaignAccountRepo.find(
      { campaign: { id: campaignId } },
      { populate: ['zaloAccount'] },
    );
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    const campaign = await this.campaignRepo.findOne({ id: campaignId });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const deletableStatuses: MessagingCampaignStatus[] = [
      'draft',
      'completed',
      'cancelled',
      'failed',
    ];
    if (!deletableStatuses.includes(campaign.status)) {
      throw new BadRequestException(
        'Only draft, completed, cancelled, or failed campaigns can be deleted',
      );
    }

    const recipientIds = (
      await this.recipientRepo.find(
        { campaign: { id: campaignId } },
        { fields: ['id'] },
      )
    ).map((r) => r.id);

    if (recipientIds.length > 0) {
      await this.em.nativeDelete(DeliveryAttempt, {
        campaignRecipient: { $in: recipientIds },
      });
    }
    await this.em.nativeDelete(CampaignRecipient, {
      campaign: { id: campaignId },
    });
    await this.em.nativeDelete(CampaignZaloAccount, {
      campaign: { id: campaignId },
    });
    await this.em.nativeDelete(MessagingCampaign, { id: campaignId });
  }

  async getRecipients(
    campaignId: string,
    options?: { status?: string; page?: number; limit?: number },
  ): Promise<{ data: CampaignRecipient[]; total: number }> {
    const where: Record<string, unknown> = { campaign: { id: campaignId } };
    if (options?.status) {
      where.status = options.status;
    }
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 50, 200);
    const [data, total] = await this.recipientRepo.findAndCount(where, {
      limit,
      offset: (page - 1) * limit,
      orderBy: { createdAt: 'ASC' },
    });
    return { data, total };
  }
}

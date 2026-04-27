import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { MessagingCampaign } from './messaging-campaign.entity';
import { MessagingCampaignStatus } from './messaging-campaign.entity';
import { CustomersService } from '../customers/customers.service';
import { ZaloAccountsService } from '../zalo-accounts/zalo-accounts.service';

@Injectable()
export class MessagingCampaignsService {
  constructor(
    private readonly em: EntityManager,
    private readonly customersService: CustomersService,
    private readonly zaloAccountsService: ZaloAccountsService,
    @InjectRepository(MessagingCampaign)
    private readonly campaignRepo: EntityRepository<MessagingCampaign>,
  ) {}

  async createCampaign(
    customerId: string,
    name: string,
    messageText: string,
    zaloAccountId: string,
    scheduleAt?: Date,
  ): Promise<MessagingCampaign> {
    const customer = await this.customersService.findById(customerId);
    const zaloAccount = await this.zaloAccountsService.findById(zaloAccountId);

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!zaloAccount) {
      throw new NotFoundException('Zalo account not found');
    }

    if (zaloAccount.customer.id !== customer.id) {
      throw new BadRequestException('Zalo account does not belong to customer');
    }

    const campaign = new MessagingCampaign(
      customer,
      name,
      messageText,
      zaloAccount,
    );
    if (scheduleAt) {
      campaign.scheduleAt = scheduleAt;
    }
    this.em.persist(campaign);
    await this.em.flush();
    return campaign;
  }

  async findById(campaignId: string): Promise<MessagingCampaign | null> {
    return this.campaignRepo.findOne({ id: campaignId });
  }

  async findByCustomerId(customerId: string): Promise<MessagingCampaign[]> {
    return this.campaignRepo.find({ customer: { id: customerId } });
  }

  async listCampaigns(customerId?: string): Promise<MessagingCampaign[]> {
    if (customerId) {
      return this.campaignRepo.find({ customer: { id: customerId } });
    }
    return this.campaignRepo.findAll();
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

  async updateResults(
    campaignId: string,
    results: {
      sent?: number;
      delivered?: number;
      failed?: number;
    },
  ): Promise<MessagingCampaign | null> {
    const campaign = await this.campaignRepo.findOne({ id: campaignId });
    if (!campaign) {
      return null;
    }
    if (results.sent !== undefined) {
      campaign.sentCount = results.sent;
    }
    if (results.delivered !== undefined) {
      campaign.deliveredCount = results.delivered;
    }
    if (results.failed !== undefined) {
      campaign.failedCount = results.failed;
    }
    await this.em.flush();
    return campaign;
  }
}

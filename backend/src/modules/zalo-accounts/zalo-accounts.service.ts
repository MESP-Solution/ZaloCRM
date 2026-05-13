import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { ZaloAccount, ZaloAccountStatus } from './zalo-account.entity';
import { CustomerAccount } from '../customers/customer-account.entity';
import { DailyAccountUsage } from '../messaging-campaigns/entities/daily-account-usage.entity';
import { DeliveryAttempt } from '../messaging-campaigns/entities/delivery-attempt.entity';
import { CampaignZaloAccount } from '../messaging-campaigns/entities/campaign-zalo-account.entity';
import { CampaignRecipient } from '../messaging-campaigns/entities/campaign-recipient.entity';

@Injectable()
export class ZaloAccountsService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(ZaloAccount)
    private readonly accountRepo: EntityRepository<ZaloAccount>,
  ) {}

  async createAccount(
    customer: CustomerAccount,
    displayName: string,
    providerAccountId?: string,
  ): Promise<ZaloAccount> {
    const account = new ZaloAccount(customer, displayName);
    if (providerAccountId) {
      account.providerAccountId = providerAccountId;
      account.status = 'active';
    }
    this.em.persist(account);
    await this.em.flush();
    return account;
  }

  async findById(accountId: string): Promise<ZaloAccount | null> {
    const fork = this.em.fork();
    return fork.findOne(
      ZaloAccount,
      { id: accountId },
      { populate: ['customer'] },
    );
  }

  async findByCustomerId(customerId: string): Promise<ZaloAccount[]> {
    return this.accountRepo.find({ customer: { id: customerId } });
  }

  async listAccounts(customerId?: string): Promise<ZaloAccount[]> {
    if (customerId) {
      return this.accountRepo.find({ customer: { id: customerId } });
    }
    return this.accountRepo.findAll();
  }

  async updateStatus(
    accountId: string,
    status: ZaloAccountStatus,
  ): Promise<void> {
    const fork = this.em.fork();
    const account = await fork.findOneOrFail(ZaloAccount, { id: accountId });
    account.status = status;
    await fork.flush();
  }

  async saveConnectionData(
    accountId: string,
    data: {
      displayName: string;
      encryptedCookieData: string;
      providerAccountId: string;
      phoneNumber: string;
      proxyUrl?: string;
      avatarUrl?: string;
      status: ZaloAccountStatus;
      lastConnectedAt: Date;
    },
  ): Promise<void> {
    const fork = this.em.fork();
    const account = await fork.findOneOrFail(ZaloAccount, { id: accountId });
    account.displayName = data.displayName;
    account.encryptedCookieData = data.encryptedCookieData;
    account.providerAccountId = data.providerAccountId;
    account.phoneNumber = data.phoneNumber;
    account.proxyUrl = data.proxyUrl;
    account.avatarUrl = data.avatarUrl;
    account.status = data.status;
    account.lastConnectedAt = data.lastConnectedAt;
    await fork.flush();
  }

  async updateDisplayName(
    accountId: string,
    displayName: string,
  ): Promise<void> {
    const fork = this.em.fork();
    const account = await fork.findOneOrFail(ZaloAccount, { id: accountId });
    account.displayName = displayName;
    await fork.flush();
  }

  async deleteAccount(accountId: string): Promise<void> {
    const fork = this.em.fork();
    const account = await fork.findOneOrFail(ZaloAccount, { id: accountId });

    const dailyUsages = await fork.find(DailyAccountUsage, { zaloAccount: account });
    for (const u of dailyUsages) fork.remove(u);

    const deliveryAttempts = await fork.find(DeliveryAttempt, { zaloAccount: account });
    for (const a of deliveryAttempts) fork.remove(a);

    const campaignAccounts = await fork.find(CampaignZaloAccount, { zaloAccount: account });
    for (const ca of campaignAccounts) fork.remove(ca);

    const sentRecipients = await fork.find(CampaignRecipient, { sentByZaloAccount: account });
    for (const r of sentRecipients) {
      r.sentByZaloAccount = undefined;
    }

    fork.remove(account);
    await fork.flush();
  }

  async findActiveAccountsWithCookies(): Promise<ZaloAccount[]> {
    const fork = this.em.fork();
    return fork.find(ZaloAccount, {
      status: 'active',
      encryptedCookieData: { $ne: null },
    });
  }
}

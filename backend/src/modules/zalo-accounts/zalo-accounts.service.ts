import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { ZaloAccount } from './zalo-account.entity';
import { CustomerAccount } from '../customers/customer-account.entity';

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
    return this.accountRepo.findOne({ id: accountId });
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
}

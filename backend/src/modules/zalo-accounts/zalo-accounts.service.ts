import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { requireText } from '../../common/validation/request-validation';
import { CustomersService } from '../customers/customers.service';
import { CreateZaloAccountDto } from './dto/create-zalo-account.dto';
import { ZaloAccount } from './zalo-account.entity';

@Injectable()
export class ZaloAccountsService {
  private readonly accounts = new Map<string, ZaloAccount>();

  constructor(private readonly customersService: CustomersService) {}

  createAccount(dto: CreateZaloAccountDto): ZaloAccount {
    const customerId = requireText(dto.customerId, 'customerId');
    const displayName = requireText(dto.displayName, 'displayName');
    const providerAccountId = dto.providerAccountId?.trim();
    this.customersService.getCustomer(customerId);

    const now = new Date();
    const account: ZaloAccount = {
      id: randomUUID(),
      customerId,
      displayName,
      providerAccountId,
      status: providerAccountId ? 'active' : 'pending_login',
      createdAt: now,
      updatedAt: now,
    };

    this.accounts.set(account.id, account);
    return account;
  }

  listAccounts(customerId?: string): ZaloAccount[] {
    const accounts = [...this.accounts.values()];

    if (!customerId) {
      return accounts;
    }

    return accounts.filter((account) => account.customerId === customerId);
  }

  getAccount(accountId: string): ZaloAccount {
    const account = this.accounts.get(accountId);

    if (!account) {
      throw new NotFoundException('Zalo account not found');
    }

    return account;
  }
}

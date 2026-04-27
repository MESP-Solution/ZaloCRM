import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { requireText } from '../../common/validation/request-validation';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerAccount } from './customer-account.entity';

@Injectable()
export class CustomersService {
  private readonly customers = new Map<string, CustomerAccount>();

  createCustomer(dto: CreateCustomerDto): CustomerAccount {
    const email = this.normalizeEmail(dto.email);
    const name = requireText(dto.name, 'name');

    if (this.findByEmail(email)) {
      throw new ConflictException('Customer email already exists');
    }

    const now = new Date();
    const customer: CustomerAccount = {
      id: randomUUID(),
      email,
      name,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    this.customers.set(customer.id, customer);
    return customer;
  }

  listCustomers(): CustomerAccount[] {
    return [...this.customers.values()];
  }

  getCustomer(customerId: string): CustomerAccount {
    const customer = this.customers.get(customerId);

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  findByEmail(email: string): CustomerAccount | undefined {
    return [...this.customers.values()].find(
      (customer) => customer.email === this.normalizeEmail(email),
    );
  }

  private normalizeEmail(email: string): string {
    return requireText(email, 'email').toLowerCase();
  }
}

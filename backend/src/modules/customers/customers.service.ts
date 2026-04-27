import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { CustomerAccount } from './customer-account.entity';
import { PasswordService } from '../../common/auth/password.service';

@Injectable()
export class CustomersService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(CustomerAccount)
    private readonly customerRepo: EntityRepository<CustomerAccount>,
    private readonly passwordService: PasswordService,
  ) {}

  async createCustomer(
    email: string,
    name: string,
    password: string,
  ): Promise<CustomerAccount> {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwordService.hash(password);
    const customer = new CustomerAccount(email, name, passwordHash);
    this.em.persist(customer);
    await this.em.flush();
    return customer;
  }

  async createCustomerWithPasswordHash(
    email: string,
    name: string,
    passwordHash: string,
  ): Promise<CustomerAccount> {
    const customer = new CustomerAccount(email, name, passwordHash);
    this.em.persist(customer);
    await this.em.flush();
    return customer;
  }

  async findByEmail(email: string): Promise<CustomerAccount | null> {
    return this.customerRepo.findOne({ email: email.toLowerCase().trim() });
  }

  async findById(customerId: string): Promise<CustomerAccount | null> {
    return this.customerRepo.findOne({ id: customerId });
  }

  async findByIdPublic(customerId: string) {
    const customer = await this.customerRepo.findOne({ id: customerId });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      status: customer.status,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  async listCustomers(): Promise<CustomerAccount[]> {
    return this.customerRepo.findAll();
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { CustomerContact } from './customer-contact.entity';
import { CustomersService } from '../customers/customers.service';
import { ZaloConnectionService } from '../zalo-connection/zalo-connection.service';

@Injectable()
export class CustomerContactsService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(CustomerContact)
    private readonly contactRepo: EntityRepository<CustomerContact>,
    private readonly customersService: CustomersService,
    private readonly zaloConnectionService: ZaloConnectionService,
  ) {}

  async listByCustomer(
    customerId: string,
    options?: { search?: string; page?: number; limit?: number },
  ): Promise<{ data: CustomerContact[]; total: number }> {
    const where: Record<string, unknown> = { customer: { id: customerId } };

    if (options?.search) {
      where.$or = [
        { phone: { $like: `%${options.search}%` } },
        { zaloName: { $like: `%${options.search}%` } },
      ];
    }

    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 50, 200);

    const [data, total] = await this.contactRepo.findAndCount(where, {
      orderBy: { createdAt: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });

    return { data, total };
  }

  async lookupAndSave(
    customerId: string,
    phoneNumbers: string[],
  ): Promise<{ saved: CustomerContact[]; failedCount: number }> {
    const customer = await this.customersService.findById(customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const lookupResult = await this.zaloConnectionService.findUsersByPhoneNumbers(
      customerId,
      phoneNumbers,
    );

    const saved: CustomerContact[] = [];

    for (const result of lookupResult.results) {
      let contact = await this.contactRepo.findOne({
        customer: { id: customerId },
        phone: result.phoneNumber,
      });

      if (contact) {
        contact.zaloUid = result.uid;
        contact.zaloName = result.zalo_name || result.display_name;
        contact.avatarUrl = result.avatar;
        contact.gender = result.gender;
        contact.updatedAt = new Date();
      } else {
        contact = new CustomerContact(customer, result.phoneNumber);
        contact.zaloUid = result.uid;
        contact.zaloName = result.zalo_name || result.display_name;
        contact.avatarUrl = result.avatar;
        contact.gender = result.gender;
        this.em.persist(contact);
      }

      saved.push(contact);
    }

    await this.em.flush();

    return { saved, failedCount: lookupResult.failedCount };
  }

  async deleteContact(customerId: string, contactId: string): Promise<void> {
    const contact = await this.contactRepo.findOne({
      id: contactId,
      customer: { id: customerId },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    this.em.remove(contact);
    await this.em.flush();
  }

  async bulkDelete(customerId: string, contactIds: string[]): Promise<number> {
    const contacts = await this.contactRepo.find({
      id: { $in: contactIds },
      customer: { id: customerId },
    });
    for (const contact of contacts) {
      this.em.remove(contact);
    }
    await this.em.flush();
    return contacts.length;
  }

  async clearAll(customerId: string): Promise<number> {
    const contacts = await this.contactRepo.find({ customer: { id: customerId } });
    const count = contacts.length;
    for (const contact of contacts) {
      this.em.remove(contact);
    }
    await this.em.flush();
    return count;
  }
}

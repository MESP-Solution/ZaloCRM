import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Role } from './role.entity';
import { CustomerAccount } from '../customers/customer-account.entity';

const DEFAULT_ROLES = [
  { name: 'customer', description: 'Default customer role' },
];

@Injectable()
export class RolesSeederService implements OnModuleInit {
  private readonly logger = new Logger(RolesSeederService.name);

  constructor(private readonly em: EntityManager) {}

  async onModuleInit(): Promise<void> {
    const fork = this.em.fork();

    for (const def of DEFAULT_ROLES) {
      let role = await fork.findOne(Role, { name: def.name });
      if (!role) {
        role = new Role(def.name, def.description);
        fork.persist(role);
        this.logger.log(`Seeded role: ${def.name}`);
      }
    }
    await fork.flush();

    const customerRole = await fork.findOne(Role, { name: 'customer' });
    if (customerRole) {
      const customersWithoutRole = await fork.find(CustomerAccount, {
        roles: { $none: { name: 'customer' } },
      }, { populate: ['roles'] });

      for (const customer of customersWithoutRole) {
        customer.roles.add(customerRole);
        this.logger.log(`Assigned customer role to: ${customer.email}`);
      }
      await fork.flush();
    }
  }
}

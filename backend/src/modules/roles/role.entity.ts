import { Entity, PrimaryKey, Property, ManyToMany } from '@mikro-orm/decorators/legacy';
import { Collection } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { CustomerAccount } from '../customers/customer-account.entity';

@Entity()
export class Role {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string', unique: true })
  name!: string;

  @Property({ type: 'string' })
  description!: string;

  @ManyToMany({ entity: () => CustomerAccount, mappedBy: 'roles' })
  customers = new Collection<CustomerAccount>(this);

  constructor(name: string, description: string) {
    this.id = uuidv4();
    this.name = name;
    this.description = description;
  }
}

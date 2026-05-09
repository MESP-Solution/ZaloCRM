import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  ManyToMany,
} from '@mikro-orm/decorators/legacy';
import { Collection } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '../roles/role.entity';

export type CustomerStatus = 'active' | 'disabled';

@Entity()
export class CustomerAccount {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string', unique: true })
  email!: string;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string' })
  passwordHash!: string;

  @Enum({ items: () => ['active', 'disabled'] })
  status!: CustomerStatus;

  @ManyToMany({ entity: () => Role, inversedBy: 'customers' })
  roles = new Collection<Role>(this);

  @Property({ type: 'Date', onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ type: 'Date', onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  constructor(email: string, name: string, passwordHash: string) {
    this.id = uuidv4();
    this.email = email.toLowerCase().trim();
    this.name = name.trim();
    this.passwordHash = passwordHash;
    this.status = 'active';
  }
}

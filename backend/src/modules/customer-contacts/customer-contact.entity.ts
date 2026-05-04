import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';
import { CustomerAccount } from '../customers/customer-account.entity';

@Entity()
@Unique({ properties: ['customer', 'phone'] })
export class CustomerContact {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @ManyToOne(() => CustomerAccount)
  customer!: CustomerAccount;

  @Property({ type: 'string' })
  phone!: string;

  @Property({ type: 'string', nullable: true })
  zaloUid?: string;

  @Property({ type: 'string', nullable: true })
  zaloName?: string;

  @Property({ type: 'string', nullable: true })
  avatarUrl?: string;

  @Property({ type: 'smallint', nullable: true })
  gender?: number;

  @Property({ type: 'Date' })
  createdAt!: Date;

  @Property({ type: 'Date' })
  updatedAt!: Date;

  constructor(customer: CustomerAccount, phone: string) {
    this.id = uuidv4();
    this.customer = customer;
    this.phone = phone;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

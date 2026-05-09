import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  Index,
  ManyToOne,
} from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';
import { CustomerAccount } from '../customers/customer-account.entity';

export type ZaloAccountStatus =
  | 'pending_login'
  | 'active'
  | 'disconnected'
  | 'restricted'
  | 'login_failed';

@Entity()
export class ZaloAccount {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @ManyToOne(() => CustomerAccount)
  customer!: CustomerAccount;

  @Property({ type: 'string' })
  displayName!: string;

  @Index()
  @Property({ type: 'string', nullable: true })
  providerAccountId?: string;

  @Enum({
    items: () => [
      'pending_login',
      'active',
      'disconnected',
      'restricted',
      'login_failed',
    ],
  })
  status!: ZaloAccountStatus;

  @Property({ type: 'Date', onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ type: 'string', nullable: true })
  phoneNumber?: string;

  @Property({ type: 'string', nullable: true, length: 2048 })
  avatarUrl?: string;

  @Property({ type: 'string', nullable: true })
  proxyUrl?: string;

  @Property({ type: 'text', nullable: true })
  encryptedCookieData?: string;

  @Property({ type: 'Date', nullable: true })
  lastConnectedAt?: Date;

  @Property({
    type: 'Date',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt!: Date;

  constructor(customer: CustomerAccount, displayName: string) {
    this.id = uuidv4();
    this.customer = customer;
    this.displayName = displayName;
    this.status = 'pending_login';
  }
}

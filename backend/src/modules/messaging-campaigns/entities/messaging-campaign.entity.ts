import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  ManyToOne,
} from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';
import { CustomerAccount } from '../../customers/customer-account.entity';

export type MessagingCampaignStatus =
  | 'draft'
  | 'queued'
  | 'sending'
  | 'paused_manual'
  | 'paused_quota_exhausted'
  | 'paused_no_available_account'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type MessagingCampaignType = 'stranger' | 'friend';

@Entity()
export class MessagingCampaign {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @ManyToOne(() => CustomerAccount)
  customer!: CustomerAccount;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string', length: 4096 })
  messageText!: string;

  @Enum({
    items: () => [
      'draft',
      'queued',
      'sending',
      'paused_manual',
      'paused_quota_exhausted',
      'paused_no_available_account',
      'completed',
      'failed',
      'cancelled',
    ],
  })
  status!: MessagingCampaignStatus;

  @Enum({ items: () => ['stranger', 'friend'], default: 'stranger' })
  campaignType!: MessagingCampaignType;

  @Property({ type: 'json', default: '[]' })
  imageFilePaths: string[] = [];

  @Property({ type: 'Date', nullable: true })
  scheduleAt?: Date;

  @Property({ type: 'int' })
  queuedCount: number = 0;

  @Property({ type: 'int' })
  sentCount: number = 0;

  @Property({ type: 'int' })
  failedCount: number = 0;

  @Property({ type: 'Date', onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ type: 'Date', onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  constructor(customer: CustomerAccount, name: string, messageText: string) {
    this.id = uuidv4();
    this.customer = customer;
    this.name = name;
    this.messageText = messageText;
    this.status = 'draft';
    this.campaignType = 'stranger';
  }
}

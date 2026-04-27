import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  ManyToOne,
} from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';
import { CustomerAccount } from '../customers/customer-account.entity';
import { ZaloAccount } from '../zalo-accounts/zalo-account.entity';

export type MessagingCampaignStatus =
  | 'draft'
  | 'queued'
  | 'sending'
  | 'completed'
  | 'failed';

export type MessagingJobStatus = 'queued' | 'sent' | 'failed';

export interface MessagingJob {
  id: string;
  recipientId: string;
  status: MessagingJobStatus;
  providerMessageId?: string;
  errorMessage?: string;
}

@Entity()
export class MessagingCampaign {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @ManyToOne(() => CustomerAccount)
  customer!: CustomerAccount;

  @ManyToOne(() => ZaloAccount)
  zaloAccount!: ZaloAccount;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string' })
  messageText!: string;

  @Enum({ items: () => ['draft', 'queued', 'sending', 'completed', 'failed'] })
  status!: MessagingCampaignStatus;

  @Property({ type: 'json' })
  jobs: MessagingJob[] = [];

  @Property({ type: 'Date', nullable: true })
  scheduleAt?: Date;

  @Property({ type: 'int' })
  sentCount: number = 0;

  @Property({ type: 'int' })
  deliveredCount: number = 0;

  @Property({ type: 'int' })
  failedCount: number = 0;

  @Property({ type: 'Date' })
  createdAt!: Date;

  @Property({ type: 'Date' })
  updatedAt!: Date;

  constructor(
    customer: CustomerAccount,
    name: string,
    messageText: string,
    zaloAccount: ZaloAccount,
  ) {
    this.id = uuidv4();
    this.customer = customer;
    this.name = name;
    this.messageText = messageText;
    this.zaloAccount = zaloAccount;
    this.status = 'draft';
    this.jobs = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  ManyToOne,
} from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';
import { CampaignRecipient } from './campaign-recipient.entity';
import { ZaloAccount } from '../zalo-accounts/zalo-account.entity';

export type AttemptStatus = 'sent' | 'failed';

@Entity()
export class DeliveryAttempt {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @ManyToOne(() => CampaignRecipient)
  campaignRecipient!: CampaignRecipient;

  @ManyToOne(() => ZaloAccount)
  zaloAccount!: ZaloAccount;

  @Property({ type: 'int' })
  attemptNumber!: number;

  @Enum({ items: () => ['sent', 'failed'] })
  status!: AttemptStatus;

  @Property({ type: 'string', nullable: true })
  providerMessageId?: string;

  @Property({ type: 'string', nullable: true, length: 2048 })
  errorMessage?: string;

  @Property({ type: 'Date' })
  startedAt!: Date;

  @Property({ type: 'Date', nullable: true })
  finishedAt?: Date;

  constructor(
    campaignRecipient: CampaignRecipient,
    zaloAccount: ZaloAccount,
    attemptNumber: number,
  ) {
    this.id = uuidv4();
    this.campaignRecipient = campaignRecipient;
    this.zaloAccount = zaloAccount;
    this.attemptNumber = attemptNumber;
    this.status = 'failed';
    this.startedAt = new Date();
  }
}
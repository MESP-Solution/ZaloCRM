import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  ManyToOne,
} from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';
import { MessagingCampaign } from './messaging-campaign.entity';
import { ZaloAccount } from '../zalo-accounts/zalo-account.entity';

export type RecipientStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'skipped';

@Entity()
export class CampaignRecipient {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @ManyToOne(() => MessagingCampaign)
  campaign!: MessagingCampaign;

  @Property({ type: 'string', nullable: true })
  recipientPhone?: string;

  @Property({ type: 'string', nullable: true })
  recipientZaloId?: string;

  @Property({ type: 'string', nullable: true })
  recipientName?: string;

  @Property({ type: 'smallint', nullable: true })
  recipientGender?: number;

  @Enum({ items: () => ['queued', 'sending', 'sent', 'failed', 'skipped'] })
  status!: RecipientStatus;

  @ManyToOne(() => ZaloAccount, { nullable: true })
  sentByZaloAccount?: ZaloAccount;

  @Property({ type: 'string', nullable: true })
  providerMessageId?: string;

  @Property({ type: 'string', nullable: true, length: 2048 })
  errorMessage?: string;

  @Property({ type: 'int' })
  attemptCount: number = 0;

  @Property({ type: 'Date', onCreate: () => new Date() })
  createdAt!: Date;

  @Property({
    type: 'Date',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt!: Date;

  constructor(
    campaign: MessagingCampaign,
    recipientPhone?: string,
    recipientZaloId?: string,
    recipientName?: string,
    recipientGender?: number,
  ) {
    this.id = uuidv4();
    this.campaign = campaign;
    this.recipientPhone = recipientPhone;
    this.recipientZaloId = recipientZaloId;
    this.recipientName = recipientName;
    this.recipientGender = recipientGender;
    this.status = 'queued';
  }
}
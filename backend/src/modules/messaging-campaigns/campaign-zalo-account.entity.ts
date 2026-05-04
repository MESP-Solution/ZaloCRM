import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  ManyToOne,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';
import { MessagingCampaign } from './messaging-campaign.entity';
import { ZaloAccount } from '../zalo-accounts/zalo-account.entity';

export type CampaignAccountStatus =
  | 'active'
  | 'quota_exhausted'
  | 'disconnected'
  | 'restricted'
  | 'failed';

@Entity()
@Unique({ properties: ['campaign', 'zaloAccount'] })
export class CampaignZaloAccount {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @ManyToOne(() => MessagingCampaign)
  campaign!: MessagingCampaign;

  @ManyToOne(() => ZaloAccount)
  zaloAccount!: ZaloAccount;

  @Enum({
    items: () => [
      'active',
      'quota_exhausted',
      'disconnected',
      'restricted',
      'failed',
    ],
  })
  status!: CampaignAccountStatus;

  @Property({ type: 'Date', onCreate: () => new Date() })
  createdAt!: Date;

  @Property({
    type: 'Date',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt!: Date;

  constructor(campaign: MessagingCampaign, zaloAccount: ZaloAccount) {
    this.id = uuidv4();
    this.campaign = campaign;
    this.zaloAccount = zaloAccount;
    this.status = 'active';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
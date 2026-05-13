import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';
import { ZaloAccount } from '../../zalo-accounts/zalo-account.entity';

@Entity()
@Unique({ properties: ['zaloAccount', 'date'] })
export class DailyAccountUsage {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @ManyToOne(() => ZaloAccount)
  zaloAccount!: ZaloAccount;

  @Property({ type: 'string' })
  date!: string;

  @Property({ type: 'int' })
  autoSentCount: number = 0;

  @Property({ type: 'int' })
  dailyLimit: number = 50;

  @Property({ type: 'int' })
  hourlySentCount: number = 0;

  @Property({ type: 'int' })
  lastHourlyReset: number = -1;

  @Property({ type: 'Date', onCreate: () => new Date() })
  createdAt!: Date;

  @Property({
    type: 'Date',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt!: Date;

  constructor(zaloAccount: ZaloAccount, date: string, dailyLimit: number = 50) {
    this.id = uuidv4();
    this.zaloAccount = zaloAccount;
    this.date = date;
    this.dailyLimit = dailyLimit;
  }
}

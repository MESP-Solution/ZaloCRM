import { AppConfigService } from './src/config/app-config.service';
import { Role } from './src/modules/roles/role.entity';
import { CustomerAccount } from './src/modules/customers/customer-account.entity';
import { ZaloAccount } from './src/modules/zalo-accounts/zalo-account.entity';
import { MessagingCampaign } from './src/modules/messaging-campaigns/messaging-campaign.entity';
import { CampaignZaloAccount } from './src/modules/messaging-campaigns/campaign-zalo-account.entity';
import { CampaignRecipient } from './src/modules/messaging-campaigns/campaign-recipient.entity';
import { DeliveryAttempt } from './src/modules/messaging-campaigns/delivery-attempt.entity';
import { DailyAccountUsage } from './src/modules/messaging-campaigns/daily-account-usage.entity';
import { CustomerContact } from './src/modules/customer-contacts/customer-contact.entity';
import { Migrator } from '@mikro-orm/migrations';
import { MySqlDriver } from '@mikro-orm/mysql';

const appConfig = new AppConfigService();

export default {
  driver: MySqlDriver,
  host: appConfig.dbHost,
  port: appConfig.dbPort,
  user: appConfig.dbUser,
  password: appConfig.dbPassword,
  dbName: appConfig.dbName,
  entities: [
    CustomerAccount,
    ZaloAccount,
    MessagingCampaign,
    CampaignZaloAccount,
    CampaignRecipient,
    DeliveryAttempt,
    DailyAccountUsage,
    Role,
    CustomerContact,
  ],
  extensions: [Migrator],
  migrations: {
    path: './dist/migrations',
    pathTs: './migrations',
    glob: '!(*.d).ts',
    emit: 'ts',
  },
};
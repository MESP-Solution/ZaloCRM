import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, MySqlDriver } from '@mikro-orm/mysql';
import { AppConfigService } from './app-config.service';
import { CustomerAccount } from '../modules/customers/customer-account.entity';
import { ZaloAccount } from '../modules/zalo-accounts/zalo-account.entity';
import { MessagingCampaign } from '../modules/messaging-campaigns/messaging-campaign.entity';
import { CampaignZaloAccount } from '../modules/messaging-campaigns/campaign-zalo-account.entity';
import { CampaignRecipient } from '../modules/messaging-campaigns/campaign-recipient.entity';
import { DeliveryAttempt } from '../modules/messaging-campaigns/delivery-attempt.entity';
import { DailyAccountUsage } from '../modules/messaging-campaigns/daily-account-usage.entity';
import { Role } from '../modules/roles/role.entity';

export function createMikroOrmConfig(appConfig: AppConfigService) {
  return defineConfig({
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
    ],
    extensions: [Migrator],
    migrations: {
      path: './dist/migrations',
      pathTs: './migrations',
      emit: 'ts' as const,
    },
  });
}

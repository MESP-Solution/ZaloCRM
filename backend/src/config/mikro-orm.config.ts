import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfigService } from './app-config.service';
import { CustomerAccount } from '../modules/customers/customer-account.entity';
import { ZaloAccount } from '../modules/zalo-accounts/zalo-account.entity';
import { MessagingCampaign } from '../modules/messaging-campaigns/messaging-campaign.entity';
import { Role } from '../modules/roles/role.entity';

export function createMikroOrmConfig(appConfig: AppConfigService) {
  return defineConfig({
    driver: PostgreSqlDriver,
    clientUrl: appConfig.databaseUrl,
    driverOptions: {
      connection: {
        ssl: appConfig.databaseSsl ? { rejectUnauthorized: false } : false,
      },
    },
    entities: [CustomerAccount, ZaloAccount, MessagingCampaign, Role],
    extensions: [Migrator],
    migrations: {
      path: './dist/migrations',
      pathTs: './migrations',
      emit: 'ts' as const,
    },
  });
}

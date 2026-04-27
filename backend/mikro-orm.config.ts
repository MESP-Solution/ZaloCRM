import { AppConfigService } from './src/config/app-config.service';
import { createMikroOrmConfig } from './src/config/mikro-orm.config';
import { Role } from './src/modules/roles/role.entity';
import { CustomerAccount } from './src/modules/customers/customer-account.entity';
import { ZaloAccount } from './src/modules/zalo-accounts/zalo-account.entity';
import { MessagingCampaign } from './src/modules/messaging-campaigns/messaging-campaign.entity';
import { Migrator } from '@mikro-orm/migrations';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

const appConfig = new AppConfigService();

export default {
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
    emit: 'ts',
  },
};

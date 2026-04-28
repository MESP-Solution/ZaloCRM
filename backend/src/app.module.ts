import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './config/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { MessagingCampaignsModule } from './modules/messaging-campaigns/messaging-campaigns.module';
import { RolesModule } from './modules/roles/roles.module';
import { ZaloAccountsModule } from './modules/zalo-accounts/zalo-accounts.module';
import { ZaloConnectionModule } from './modules/zalo-connection/zalo-connection.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    CustomersModule,
    RolesModule,
    ZaloAccountsModule,
    ZaloConnectionModule,
    MessagingCampaignsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

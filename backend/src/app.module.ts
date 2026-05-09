import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './config/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CustomerContactsModule } from './modules/customer-contacts/customer-contacts.module';
import { MessagingCampaignsModule } from './modules/messaging-campaigns/messaging-campaigns.module';
import { RolesModule } from './modules/roles/roles.module';
import { ZaloAccountsModule } from './modules/zalo-accounts/zalo-accounts.module';
import { ZaloConnectionModule } from './modules/zalo-connection/zalo-connection.module';
import { ZaloGroupsModule } from './modules/zalo-groups/zalo-groups.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    CustomersModule,
    RolesModule,
    ZaloAccountsModule,
    ZaloConnectionModule,
    CustomerContactsModule,
    MessagingCampaignsModule,
    ZaloGroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

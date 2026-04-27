import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app-config.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { MessagingCampaignsModule } from './modules/messaging-campaigns/messaging-campaigns.module';
import { ZaloAccountsModule } from './modules/zalo-accounts/zalo-accounts.module';

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    CustomersModule,
    ZaloAccountsModule,
    MessagingCampaignsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

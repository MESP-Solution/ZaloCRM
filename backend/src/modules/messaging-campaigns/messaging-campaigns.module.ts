import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { ZaloAccountsModule } from '../zalo-accounts/zalo-accounts.module';
import { ZaloProviderModule } from '../zalo-provider/zalo-provider.module';
import { MessagingCampaignsController } from './messaging-campaigns.controller';
import { MessagingCampaignsService } from './messaging-campaigns.service';

@Module({
  imports: [CustomersModule, ZaloAccountsModule, ZaloProviderModule],
  controllers: [MessagingCampaignsController],
  providers: [MessagingCampaignsService],
})
export class MessagingCampaignsModule {}

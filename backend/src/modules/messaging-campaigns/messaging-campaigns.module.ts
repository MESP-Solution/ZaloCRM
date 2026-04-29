import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { ZaloAccountsModule } from '../zalo-accounts/zalo-accounts.module';
import { ZaloProviderModule } from '../zalo-provider/zalo-provider.module';
import { JwtAuthModule } from '../../common/jwt/jwt-auth.module';
import { AppConfigModule } from '../../config/app-config.module';
import { MessagingCampaignsController } from './messaging-campaigns.controller';
import { MessagingCampaignsService } from './messaging-campaigns.service';
import { QuotaService } from './quota.service';
import { CampaignDispatchService } from './campaign-dispatch.service';
import { CampaignStatsService } from './campaign-stats.service';
import { MessagingCampaign } from './messaging-campaign.entity';
import { CampaignZaloAccount } from './campaign-zalo-account.entity';
import { CampaignRecipient } from './campaign-recipient.entity';
import { DeliveryAttempt } from './delivery-attempt.entity';
import { DailyAccountUsage } from './daily-account-usage.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      MessagingCampaign,
      CampaignZaloAccount,
      CampaignRecipient,
      DeliveryAttempt,
      DailyAccountUsage,
    ]),
    CustomersModule,
    ZaloAccountsModule,
    ZaloProviderModule,
    JwtAuthModule,
    AppConfigModule,
  ],
  controllers: [MessagingCampaignsController],
  providers: [
    MessagingCampaignsService,
    QuotaService,
    CampaignDispatchService,
    CampaignStatsService,
  ],
})
export class MessagingCampaignsModule {}

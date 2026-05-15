import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { ZaloAccountsModule } from '../zalo-accounts/zalo-accounts.module';
import { ZaloProviderModule } from '../zalo-provider/zalo-provider.module';
import { JwtAuthModule } from '../../common/jwt/jwt-auth.module';
import { AppConfigModule } from '../../config/app-config.module';
import { ZaloConnectionModule } from '../zalo-connection/zalo-connection.module';
import { MessagingCampaignsController } from './messaging-campaigns.controller';
import { MessagingCampaignsService } from './services/messaging-campaigns.service';
import { QuotaService } from './services/quota.service';
import { CampaignDispatchService } from './services/campaign-dispatch.service';
import { CampaignStatsService } from './services/campaign-stats.service';
import { CampaignSchedulerService } from './services/campaign-scheduler.service';
import { MessagingCampaign } from './entities/messaging-campaign.entity';
import { CampaignZaloAccount } from './entities/campaign-zalo-account.entity';
import { CampaignRecipient } from './entities/campaign-recipient.entity';
import { DeliveryAttempt } from './entities/delivery-attempt.entity';
import { DailyAccountUsage } from './entities/daily-account-usage.entity';

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
    ZaloConnectionModule,
  ],
  controllers: [MessagingCampaignsController],
  providers: [
    MessagingCampaignsService,
    QuotaService,
    CampaignDispatchService,
    CampaignStatsService,
    CampaignSchedulerService,
  ],
})
export class MessagingCampaignsModule {}

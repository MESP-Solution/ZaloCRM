import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { ZaloAccountsModule } from '../zalo-accounts/zalo-accounts.module';
import { ZaloProviderModule } from '../zalo-provider/zalo-provider.module';
import { JwtAuthModule } from '../../common/jwt/jwt-auth.module';
import { MessagingCampaignsController } from './messaging-campaigns.controller';
import { MessagingCampaignsService } from './messaging-campaigns.service';
import { MessagingCampaign } from './messaging-campaign.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([MessagingCampaign]),
    CustomersModule,
    ZaloAccountsModule,
    ZaloProviderModule,
    JwtAuthModule,
  ],
  controllers: [MessagingCampaignsController],
  providers: [MessagingCampaignsService],
})
export class MessagingCampaignsModule {}

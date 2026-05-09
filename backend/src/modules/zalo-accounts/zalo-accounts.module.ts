import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module, forwardRef } from '@nestjs/common';
import { JwtAuthModule } from '../../common/jwt/jwt-auth.module';
import { AppConfigModule } from '../../config/app-config.module';
import { ZaloConnectionModule } from '../zalo-connection/zalo-connection.module';
import { QuotaService } from '../messaging-campaigns/quota.service';
import { DailyAccountUsage } from '../messaging-campaigns/daily-account-usage.entity';
import { ZaloAccountsController } from './zalo-accounts.controller';
import { ZaloAccountsService } from './zalo-accounts.service';
import { ZaloAccount } from './zalo-account.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([ZaloAccount, DailyAccountUsage]),
    JwtAuthModule,
    AppConfigModule,
    forwardRef(() => ZaloConnectionModule),
  ],
  controllers: [ZaloAccountsController],
  providers: [ZaloAccountsService, QuotaService],
  exports: [ZaloAccountsService],
})
export class ZaloAccountsModule {}

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module, forwardRef } from '@nestjs/common';
import { JwtAuthModule } from '../../common/jwt/jwt-auth.module';
import { ZaloConnectionModule } from '../zalo-connection/zalo-connection.module';
import { ZaloAccountsController } from './zalo-accounts.controller';
import { ZaloAccountsService } from './zalo-accounts.service';
import { ZaloAccount } from './zalo-account.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([ZaloAccount]),
    JwtAuthModule,
    forwardRef(() => ZaloConnectionModule),
  ],
  controllers: [ZaloAccountsController],
  providers: [ZaloAccountsService],
  exports: [ZaloAccountsService],
})
export class ZaloAccountsModule {}

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { JwtAuthModule } from '../../common/jwt/jwt-auth.module';
import { ZaloAccountsController } from './zalo-accounts.controller';
import { ZaloAccountsService } from './zalo-accounts.service';
import { ZaloAccount } from './zalo-account.entity';

@Module({
  imports: [MikroOrmModule.forFeature([ZaloAccount]), CustomersModule, JwtAuthModule],
  controllers: [ZaloAccountsController],
  providers: [ZaloAccountsService],
  exports: [ZaloAccountsService],
})
export class ZaloAccountsModule {}

import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { ZaloAccountsController } from './zalo-accounts.controller';
import { ZaloAccountsService } from './zalo-accounts.service';

@Module({
  imports: [CustomersModule],
  controllers: [ZaloAccountsController],
  providers: [ZaloAccountsService],
  exports: [ZaloAccountsService],
})
export class ZaloAccountsModule {}

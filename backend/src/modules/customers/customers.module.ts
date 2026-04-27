import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomerAccount } from './customer-account.entity';
import { JwtAuthModule } from '../../common/jwt/jwt-auth.module';

@Module({
  imports: [MikroOrmModule.forFeature([CustomerAccount]), JwtAuthModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}

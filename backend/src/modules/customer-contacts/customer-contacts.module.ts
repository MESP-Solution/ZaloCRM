import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JwtAuthModule } from '../../common/jwt/jwt-auth.module';
import { CustomersModule } from '../customers/customers.module';
import { ZaloConnectionModule } from '../zalo-connection/zalo-connection.module';
import { CustomerContact } from './customer-contact.entity';
import { CustomerContactsController } from './customer-contacts.controller';
import { CustomerContactsService } from './customer-contacts.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([CustomerContact]),
    JwtAuthModule,
    CustomersModule,
    forwardRef(() => ZaloConnectionModule),
  ],
  controllers: [CustomerContactsController],
  providers: [CustomerContactsService],
  exports: [CustomerContactsService],
})
export class CustomerContactsModule {}

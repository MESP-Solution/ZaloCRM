import { Module } from '@nestjs/common';
import { ZaloGroupsController } from './zalo-groups.controller';
import { ZaloGroupsService } from './zalo-groups.service';
import { ZaloConnectionModule } from '../zalo-connection/zalo-connection.module';
import { ZaloAccountsModule } from '../zalo-accounts/zalo-accounts.module';
import { JwtAuthModule } from '../../common/jwt/jwt-auth.module';

@Module({
  imports: [ZaloConnectionModule, ZaloAccountsModule, JwtAuthModule],
  controllers: [ZaloGroupsController],
  providers: [ZaloGroupsService],
})
export class ZaloGroupsModule {}

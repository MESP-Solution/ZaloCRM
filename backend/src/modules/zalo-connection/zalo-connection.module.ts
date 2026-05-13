import { Module, forwardRef } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { JwtAuthModule } from '../../common/jwt/jwt-auth.module';
import { ZaloAccountsModule } from '../zalo-accounts/zalo-accounts.module';
import { ZaloConnectionRegistry } from './zalo-connection-registry';
import { ZaloConnectionService } from './zalo-connection.service';
import { ZaloConnectionController } from './zalo-connection.controller';
import { ZaloCookieEncryptionService } from './zalo-cookie-encryption.service';
import { ZaloProxyService } from './zalo-proxy.service';
import { ZaloQrGateway } from './zalo-qr.gateway';
import { ZaloQrLoginService } from './zalo-qr-login.service';

@Module({
  imports: [
    forwardRef(() => ZaloAccountsModule),
    AppConfigModule,
    JwtAuthModule,
  ],
  controllers: [ZaloConnectionController],
  providers: [
    ZaloConnectionRegistry,
    ZaloConnectionService,
    ZaloCookieEncryptionService,
    ZaloProxyService,
    ZaloQrGateway,
    ZaloQrLoginService,
  ],
  exports: [ZaloConnectionService, ZaloConnectionRegistry],
})
export class ZaloConnectionModule {}

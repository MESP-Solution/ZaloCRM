import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthService } from './jwt-auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthCookieService } from '../../modules/auth/auth-cookie.service';
import { BootstrapAdminService } from '../../modules/auth/bootstrap-admin.service';
import { PasswordService } from '../auth/password.service';
import { loadEnvFile } from '../../config/load-env-file';
import { requireEnv } from '../../config/required-env';

loadEnvFile();

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: requireEnv('JWT_SECRET'),
      }),
    }),
  ],
  providers: [
    JwtAuthService,
    JwtAuthGuard,
    AuthCookieService,
    BootstrapAdminService,
    PasswordService,
  ],
  exports: [JwtAuthService, JwtAuthGuard, AuthCookieService, BootstrapAdminService, PasswordService],
})
export class JwtAuthModule {}

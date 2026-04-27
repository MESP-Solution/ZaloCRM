import { Injectable } from '@nestjs/common';
import { requireEnv } from '../../config/required-env';
import { PasswordService } from '../../common/auth/password.service';
import { AuthenticatedPrincipal } from './auth-session.entity';

@Injectable()
export class BootstrapAdminService {
  constructor(private readonly passwordService: PasswordService) {}

  getAdmin(): AuthenticatedPrincipal {
    return {
      id: requireEnv('ADMIN_ID'),
      email: this.normalizeEmail(requireEnv('ADMIN_EMAIL')),
      name: requireEnv('ADMIN_NAME'),
      role: 'admin',
      status: 'active',
    };
  }

  matchesEmail(email: string): boolean {
    return this.normalizeEmail(email) === this.getAdmin().email;
  }

  async verifyPassword(password: string): Promise<boolean> {
    return this.passwordService.verify(
      password,
      requireEnv('ADMIN_PASSWORD_HASH'),
    );
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}

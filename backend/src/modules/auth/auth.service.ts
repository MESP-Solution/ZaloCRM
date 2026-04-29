import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { PasswordService } from '../../common/auth/password.service';
import { JwtAuthService } from '../../common/jwt/jwt-auth.service';
import { CustomersService } from '../customers/customers.service';
import { AuthSession, AuthenticatedPrincipal } from './auth-session.entity';
import { BootstrapAdminService } from './bootstrap-admin.service';

const DUMMY_PASSWORD_HASH =
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7yUIT5ZYXi';

@Injectable()
export class AuthService {
  constructor(
    private readonly customersService: CustomersService,
    private readonly passwordService: PasswordService,
    private readonly jwtAuthService: JwtAuthService,
    private readonly bootstrapAdminService: BootstrapAdminService,
  ) {}

  async login(dto: LoginRequestDto): Promise<AuthSession> {
    const email = dto.email.trim().toLowerCase();
    const adminEmail = this.bootstrapAdminService.getAdmin().email;
    const isAdminEmail = email === adminEmail;

    let user: AuthenticatedPrincipal | null = null;

    if (isAdminEmail) {
      const valid = await this.bootstrapAdminService.verifyPassword(
        dto.password,
      );
      if (valid) {
        user = this.bootstrapAdminService.getAdmin();
      }
    } else {
      const customer = await this.customersService.findByEmail(email);
      if (customer) {
        const valid = await this.passwordService.verify(
          dto.password,
          customer.passwordHash,
        );
        if (valid) {
          if (customer.status === 'disabled') {
            throw new UnauthorizedException('Account is disabled');
          }
          user = {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            roles: customer.roles.getItems().map((r) => r.name),
            status: customer.status,
          };
        }
      }
    }

    await this.passwordService.verify(dto.password, DUMMY_PASSWORD_HASH);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.jwtAuthService.signSession(user);
  }

  async register(
    dto: RegisterRequestDto,
  ): Promise<{ user: AuthenticatedPrincipal }> {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    if (this.bootstrapAdminService.matchesEmail(email)) {
      throw new ConflictException('Email already registered');
    }

    const existing = await this.customersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    this.validatePasswordStrength(dto.password);

    const passwordHash = await this.passwordService.hash(dto.password);
    const customer = await this.customersService.createCustomerWithPasswordHash(
      email,
      name,
      passwordHash,
    );

    return {
      user: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        roles: customer.roles.getItems().map((r) => r.name),
        status: customer.status,
      },
    };
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least 1 uppercase letter',
      );
    }
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least 1 lowercase letter',
      );
    }
    if (!/\d/.test(password)) {
      throw new BadRequestException('Password must contain at least 1 number');
    }
  }
}

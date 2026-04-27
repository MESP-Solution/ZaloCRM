import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthService } from './jwt-auth.service';
import { AuthCookieService } from '../../modules/auth/auth-cookie.service';
import { BootstrapAdminService } from '../../modules/auth/bootstrap-admin.service';
import { AuthenticatedPrincipal } from '../../modules/auth/auth-session.entity';

declare module 'express' {
  interface Request {
    user?: AuthenticatedPrincipal;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtAuthService: JwtAuthService,
    private readonly authCookieService: AuthCookieService,
    private readonly bootstrapAdminService: BootstrapAdminService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    let token: string | undefined;

    if (
      request.cookies &&
      this.authCookieService.cookieName in request.cookies
    ) {
      token = request.cookies[this.authCookieService.cookieName];
    }

    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const payload = this.jwtAuthService.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.role === 'admin') {
      const admin = this.bootstrapAdminService.getAdmin();

      if (payload.sub !== admin.id) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      request.user = admin;
      return true;
    }

    // Trust status from JWT payload - no DB hit needed
    if (payload.status === 'disabled') {
      throw new UnauthorizedException('Account is disabled');
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      status: payload.status,
    };
    return true;
  }
}

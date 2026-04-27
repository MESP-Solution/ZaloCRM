import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { requireNumberEnv } from '../../config/required-env';
import {
  AuthenticatedPrincipal,
  AuthRole,
} from '../../modules/auth/auth-session.entity';

export interface JwtPayload {
  sub: string;
  jti: string;
  role: AuthRole;
  email: string;
  name: string;
  status: 'active' | 'disabled';
}

@Injectable()
export class JwtAuthService {
  constructor(private readonly jwtService: JwtService) {}

  signSession(user: AuthenticatedPrincipal) {
    const expiresInSeconds = requireNumberEnv('JWT_EXPIRES_IN_SECONDS');
    const payload: JwtPayload = {
      sub: user.id,
      jti: randomUUID(),
      role: user.role,
      email: user.email,
      name: user.name,
      status: user.status,
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: expiresInSeconds,
    });
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    return { accessToken, expiresAt, user };
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }
}

import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import {
  requireBooleanEnv,
  requireEnv,
  requireNumberEnv,
} from '../../config/required-env';

type SameSiteCookieOption = 'lax' | 'strict' | 'none';

@Injectable()
export class AuthCookieService {
  readonly cookieName: string;
  private readonly secure: boolean;
  private readonly maxAgeMs: number;
  private readonly sameSiteValue: SameSiteCookieOption;

  constructor() {
    this.cookieName = requireEnv('AUTH_COOKIE_NAME');
    this.secure = requireBooleanEnv('AUTH_COOKIE_SECURE');
    this.maxAgeMs = requireNumberEnv('JWT_EXPIRES_IN_SECONDS') * 1000;
    this.sameSiteValue = this.parseSameSite(
      requireEnv('AUTH_COOKIE_SAME_SITE'),
    );
  }

  setSessionCookie(response: Response, accessToken: string): void {
    response.cookie(this.cookieName, accessToken, {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSiteValue,
      maxAge: this.maxAgeMs,
      path: '/',
    });
  }

  clearSessionCookie(response: Response): void {
    response.clearCookie(this.cookieName, {
      secure: this.secure,
      sameSite: this.sameSiteValue,
      path: '/',
    });
  }

  private parseSameSite(value: string): SameSiteCookieOption {
    const sameSite = value.toLowerCase();
    if (sameSite === 'lax' || sameSite === 'strict' || sameSite === 'none') {
      return sameSite;
    }
    throw new Error('AUTH_COOKIE_SAME_SITE must be lax, strict, or none');
  }
}

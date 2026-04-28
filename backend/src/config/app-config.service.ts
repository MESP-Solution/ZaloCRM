import { Injectable } from '@nestjs/common';
import { loadEnvFile } from './load-env-file';
import { requireEnv, requireNumberEnv } from './required-env';

@Injectable()
export class AppConfigService {
  constructor() {
    loadEnvFile();
  }

  get port(): number {
    return requireNumberEnv('PORT');
  }

  get apiPrefix(): string {
    return requireEnv('API_PREFIX');
  }

  get corsOrigins(): string[] {
    return requireEnv('CORS_ORIGINS')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  get dbHost(): string {
    return requireEnv('DB_HOST');
  }

  get dbPort(): number {
    return requireNumberEnv('DB_PORT');
  }

  get dbUser(): string {
    return requireEnv('DB_USER');
  }

  get dbPassword(): string {
    return requireEnv('DB_PASSWORD');
  }

  get dbName(): string {
    return requireEnv('DB_NAME');
  }

  get zaloCookieEncryptionKey(): string {
    return requireEnv('ZALO_COOKIE_ENCRYPTION_KEY');
  }

  get zaloMaxAccountsPerProxy(): number {
    return requireNumberEnv('ZALO_MAX_ACCOUNTS_PER_PROXY');
  }
}

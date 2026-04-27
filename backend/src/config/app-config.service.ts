import { Injectable } from '@nestjs/common';
import { loadEnvFile } from './load-env-file';
import { requireEnv, requireNumberEnv } from './required-env';

export interface DatabaseConfig {
  url: string;
  ssl: boolean;
}

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

  get database(): DatabaseConfig {
    return {
      url: this.databaseUrl,
      ssl: requireEnv('DATABASE_SSL').toLowerCase() === 'true',
    };
  }

  get databaseUrl(): string {
    return requireEnv('DATABASE_URL');
  }

  get databaseSsl(): boolean {
    return this.database.ssl;
  }
}

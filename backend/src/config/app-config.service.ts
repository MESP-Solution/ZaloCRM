import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  get port(): number {
    return Number(process.env.PORT ?? 3000);
  }

  get apiPrefix(): string {
    return process.env.API_PREFIX ?? 'api';
  }

  get corsOrigins(): string[] {
    const rawOrigins = process.env.CORS_ORIGINS;

    if (!rawOrigins) {
      return ['http://localhost:3000', 'http://localhost:5173'];
    }

    return rawOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
}

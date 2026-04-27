import { Injectable } from '@nestjs/common';
import { AppConfigService } from './app-config.service';

@Injectable()
export class DatabaseConfigService {
  constructor(private readonly appConfig: AppConfigService) {}

  get config() {
    const db = this.appConfig.database;
    return {
      clientUrl: db.url,
      ssl: db.ssl,
    };
  }
}

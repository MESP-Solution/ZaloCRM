import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      name: 'ZaloMKT Backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

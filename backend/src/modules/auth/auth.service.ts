import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { LoginRequestDto } from './dto/login-request.dto';
import { AuthSession } from './auth-session.entity';

@Injectable()
export class AuthService {
  login(dto: LoginRequestDto): AuthSession {
    void dto;

    throw new ServiceUnavailableException(
      'Authentication store is not configured yet',
    );
  }
}

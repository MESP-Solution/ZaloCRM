import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LoginWithQrDto {
  @ApiPropertyOptional({
    description: 'Display name for the Zalo account',
    example: 'My Zalo Account',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Proxy URL (http/https only)',
    example: 'http://user:pass@proxy.example.com:8080',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  proxyUrl?: string;
}

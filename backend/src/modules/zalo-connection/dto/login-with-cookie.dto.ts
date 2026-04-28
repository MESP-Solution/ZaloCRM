import { IsArray, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginWithCookieDto {
  @ApiPropertyOptional({
    description: 'Display name for the Zalo account (auto-fetched from Zalo profile if omitted)',
    example: 'My Zalo Account',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @ApiProperty({
    description: 'Device IMEI from Zalo client',
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  })
  @IsString()
  @IsNotEmpty()
  imei!: string;

  @ApiProperty({
    description: 'User agent string from Zalo client',
  })
  @IsString()
  @IsNotEmpty()
  userAgent!: string;

  @ApiProperty({
    description: 'Cookie data from Zalo client (array of cookie objects)',
    example: [{ domain: '.zalo.me', name: '__zi', value: '...', path: '/' }],
  })
  @IsArray()
  @IsNotEmpty()
  cookie!: object[];

  @ApiPropertyOptional({
    description: 'Proxy URL (http/https only)',
    example: 'http://user:pass@proxy.example.com:8080',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  proxyUrl?: string;
}

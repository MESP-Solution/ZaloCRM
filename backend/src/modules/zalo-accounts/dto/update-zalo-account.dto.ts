import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateZaloAccountDto {
  @ApiPropertyOptional({ description: 'New display name', example: 'My Zalo Account' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Device IMEI (provide all 3 credential fields to reconnect)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  imei?: string;

  @ApiPropertyOptional({ description: 'User agent string' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Cookie data array from Zalo client' })
  @IsOptional()
  @IsArray()
  @IsNotEmpty()
  cookie?: object[];
}

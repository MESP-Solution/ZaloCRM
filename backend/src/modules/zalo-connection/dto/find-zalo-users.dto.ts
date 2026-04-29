import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
  MaxLength,
} from 'class-validator';

export class FindZaloUsersDto {
  @ApiProperty({
    description:
      'Phone numbers to resolve with zca-js api.findUser(phoneNumber)',
    example: ['0909090909', '84901234567'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  @MaxLength(32, { each: true })
  phoneNumbers!: string[];
}

import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
  MaxLength,
} from 'class-validator';

export class LookupContactsDto {
  @ApiProperty({
    description: 'Phone numbers to look up and save as contacts',
    example: ['0909090909', '84901234567'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  @MaxLength(32, { each: true })
  phoneNumbers!: string[];
}

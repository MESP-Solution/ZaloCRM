import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
} from 'class-validator';

export class BulkDeleteContactsDto {
  @ApiProperty({
    description: 'Array of contact IDs to delete',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  contactIds!: string[];
}

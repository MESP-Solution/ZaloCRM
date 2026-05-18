import { IsArray, IsIn, IsOptional, IsString, ArrayNotEmpty, ArrayMaxSize } from 'class-validator';

export class CreateMessagingCampaignDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  zaloAccountIds!: string[];

  @IsString()
  name!: string;

  @IsString()
  messageText!: string;

  @IsArray()
  @ArrayNotEmpty()
  recipients!: { phone?: string; zaloId?: string; name?: string; gender?: number }[];

  @IsOptional()
  @IsString()
  scheduleAt?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  imageFilePaths?: string[];

  @IsOptional()
  @IsIn(['stranger', 'friend'])
  campaignType?: 'stranger' | 'friend';
}

import { IsArray, IsIn, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

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
  @IsString()
  imageFilePath?: string;

  @IsOptional()
  @IsIn(['stranger', 'friend'])
  campaignType?: 'stranger' | 'friend';
}

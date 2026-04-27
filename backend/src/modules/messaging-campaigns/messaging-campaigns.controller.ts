import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateMessagingCampaignDto } from './dto/create-messaging-campaign.dto';
import { MessagingCampaignsService } from './messaging-campaigns.service';

@Controller('messaging-campaigns')
export class MessagingCampaignsController {
  constructor(
    private readonly messagingCampaignsService: MessagingCampaignsService,
  ) {}

  @Post()
  createCampaign(@Body() dto: CreateMessagingCampaignDto) {
    return this.messagingCampaignsService.createCampaign(dto);
  }

  @Get()
  listCampaigns(@Query('customerId') customerId?: string) {
    return this.messagingCampaignsService.listCampaigns(customerId);
  }

  @Get(':campaignId')
  getCampaign(@Param('campaignId') campaignId: string) {
    return this.messagingCampaignsService.getCampaign(campaignId);
  }

  @Post(':campaignId/dispatch')
  dispatchCampaign(@Param('campaignId') campaignId: string) {
    return this.messagingCampaignsService.dispatchCampaign(campaignId);
  }
}

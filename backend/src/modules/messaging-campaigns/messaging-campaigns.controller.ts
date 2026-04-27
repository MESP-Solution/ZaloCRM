import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/auth/roles.guard';
import { CreateMessagingCampaignDto } from './dto/create-messaging-campaign.dto';
import { MessagingCampaignsService } from './messaging-campaigns.service';

@ApiTags('Messaging Campaigns')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('messaging-campaigns')
export class MessagingCampaignsController {
  constructor(
    private readonly messagingCampaignsService: MessagingCampaignsService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a messaging campaign (admin only)' })
  createCampaign(@Body() dto: CreateMessagingCampaignDto) {
    return this.messagingCampaignsService.createCampaign(
      dto.customerId,
      dto.name,
      dto.messageText,
      dto.zaloAccountId,
    );
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List messaging campaigns (admin only)' })
  listCampaigns(@Query('customerId') customerId?: string) {
    return this.messagingCampaignsService.listCampaigns(customerId);
  }

  @Get(':campaignId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get a campaign by ID (admin only)' })
  getCampaign(@Param('campaignId') campaignId: string) {
    return this.messagingCampaignsService.findById(campaignId);
  }

  @Post(':campaignId/dispatch')
  @Roles('admin')
  @ApiOperation({ summary: 'Dispatch a campaign (admin only)' })
  dispatchCampaign(@Param('campaignId') campaignId: string) {
    return this.messagingCampaignsService.updateStatus(campaignId, 'sending');
  }
}

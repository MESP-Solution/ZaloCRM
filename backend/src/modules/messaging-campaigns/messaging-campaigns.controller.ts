import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/auth/roles.guard';
import { CreateMessagingCampaignDto } from './dto/create-messaging-campaign.dto';
import { MessagingCampaignsService } from './messaging-campaigns.service';
import { CampaignDispatchService } from './campaign-dispatch.service';
import { CampaignStatsService } from './campaign-stats.service';

@ApiTags('Messaging Campaigns')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('messaging-campaigns')
export class MessagingCampaignsController {
  constructor(
    private readonly messagingCampaignsService: MessagingCampaignsService,
    private readonly campaignDispatchService: CampaignDispatchService,
    private readonly campaignStatsService: CampaignStatsService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a messaging campaign' })
  createCampaign(@Body() dto: CreateMessagingCampaignDto) {
    return this.messagingCampaignsService.createCampaign(
      dto.customerId,
      dto.name,
      dto.messageText,
      dto.zaloAccountIds,
      dto.recipients,
      dto.scheduleAt ? new Date(dto.scheduleAt) : undefined,
    );
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List messaging campaigns' })
  listCampaigns(@Query('customerId') customerId?: string) {
    return this.messagingCampaignsService.listCampaigns(customerId);
  }

  @Get(':campaignId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get a campaign by ID' })
  getCampaign(@Param('campaignId') campaignId: string) {
    return this.messagingCampaignsService.findById(campaignId);
  }

  @Get(':campaignId/stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Get campaign stats' })
  getCampaignStats(@Param('campaignId') campaignId: string) {
    return this.campaignStatsService.getCampaignStats(campaignId);
  }

  @Get(':campaignId/recipients')
  @Roles('admin')
  @ApiOperation({ summary: 'List campaign recipients' })
  getRecipients(
    @Param('campaignId') campaignId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagingCampaignsService.getRecipients(campaignId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post(':campaignId/dispatch')
  @Roles('admin')
  @ApiOperation({ summary: 'Dispatch a campaign' })
  dispatchCampaign(@Param('campaignId') campaignId: string) {
    return this.campaignDispatchService.startDispatch(campaignId);
  }

  @Post(':campaignId/pause')
  @Roles('admin')
  @ApiOperation({ summary: 'Pause a sending campaign' })
  pauseCampaign(@Param('campaignId') campaignId: string) {
    return this.messagingCampaignsService.pauseCampaign(campaignId);
  }

  @Post(':campaignId/resume')
  @Roles('admin')
  @ApiOperation({ summary: 'Resume a paused campaign and restart dispatch' })
  async resumeCampaign(@Param('campaignId') campaignId: string) {
    await this.messagingCampaignsService.resumeCampaign(campaignId);
    return this.campaignDispatchService.startDispatch(campaignId);
  }

  @Post(':campaignId/cancel')
  @Roles('admin')
  @ApiOperation({ summary: 'Cancel a campaign' })
  cancelCampaign(@Param('campaignId') campaignId: string) {
    return this.messagingCampaignsService.cancelCampaign(campaignId);
  }
}

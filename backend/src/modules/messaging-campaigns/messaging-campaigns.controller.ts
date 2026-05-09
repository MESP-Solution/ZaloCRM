import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiCookieAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
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

  @Post('upload-image')
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'Upload a campaign image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'campaign-images'),
        filename: (_req, file, cb) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { filePath: file.path };
  }

  @Post()
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'Create a messaging campaign' })
  createCampaign(@Body() dto: CreateMessagingCampaignDto) {
    return this.messagingCampaignsService.createCampaign(
      dto.customerId,
      dto.name,
      dto.messageText,
      dto.zaloAccountIds,
      dto.recipients,
      dto.scheduleAt ? new Date(dto.scheduleAt) : undefined,
      dto.imageFilePath,
    );
  }

  @Get()
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'List messaging campaigns' })
  listCampaigns(@Query('customerId') customerId?: string) {
    return this.messagingCampaignsService.listCampaigns(customerId);
  }

  @Get(':campaignId')
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'Get a campaign by ID' })
  getCampaign(@Param('campaignId') campaignId: string) {
    return this.messagingCampaignsService.findById(campaignId);
  }

  @Get(':campaignId/stats')
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'Get campaign stats' })
  getCampaignStats(@Param('campaignId') campaignId: string) {
    return this.campaignStatsService.getCampaignStats(campaignId);
  }

  @Get(':campaignId/recipients')
  @Roles('admin', 'customer')
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

  @Delete(':campaignId')
  @Roles('admin', 'customer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a campaign' })
  async deleteCampaign(@Param('campaignId') campaignId: string) {
    await this.messagingCampaignsService.deleteCampaign(campaignId);
  }

  @Post(':campaignId/dispatch')
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'Dispatch a campaign' })
  dispatchCampaign(@Param('campaignId') campaignId: string) {
    return this.campaignDispatchService.startDispatch(campaignId);
  }

  @Post(':campaignId/pause')
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'Pause a sending campaign' })
  pauseCampaign(@Param('campaignId') campaignId: string) {
    return this.messagingCampaignsService.pauseCampaign(campaignId);
  }

  @Post(':campaignId/resume')
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'Resume a paused campaign and restart dispatch' })
  async resumeCampaign(@Param('campaignId') campaignId: string) {
    await this.messagingCampaignsService.resumeCampaign(campaignId);
    return this.campaignDispatchService.startDispatch(campaignId);
  }

  @Post(':campaignId/cancel')
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'Cancel a campaign' })
  cancelCampaign(@Param('campaignId') campaignId: string) {
    return this.messagingCampaignsService.cancelCampaign(campaignId);
  }
}

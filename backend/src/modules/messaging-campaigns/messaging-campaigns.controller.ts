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
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiCookieAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
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
  @Roles('customer')
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
  @Roles('customer')
  @ApiOperation({ summary: 'Create a messaging campaign' })
  createCampaign(@Req() req: Request, @Body() dto: CreateMessagingCampaignDto) {
    return this.messagingCampaignsService.createCampaign(
      req.user!.id,
      dto.name,
      dto.messageText,
      dto.zaloAccountIds,
      dto.recipients,
      dto.scheduleAt ? new Date(dto.scheduleAt) : undefined,
      dto.imageFilePath,
    );
  }

  @Get()
  @Roles('customer')
  @ApiOperation({ summary: 'List messaging campaigns' })
  listCampaigns(@Req() req: Request) {
    return this.messagingCampaignsService.listCampaigns(req.user!.id);
  }

  @Get(':campaignId')
  @Roles('customer')
  @ApiOperation({ summary: 'Get a campaign by ID' })
  async getCampaign(
    @Req() req: Request,
    @Param('campaignId') campaignId: string,
  ) {
    return this.messagingCampaignsService.assertOwnership(campaignId, req.user!.id);
  }

  @Get(':campaignId/stats')
  @Roles('customer')
  @ApiOperation({ summary: 'Get campaign stats' })
  async getCampaignStats(
    @Req() req: Request,
    @Param('campaignId') campaignId: string,
  ) {
    await this.messagingCampaignsService.assertOwnership(campaignId, req.user!.id);
    return this.campaignStatsService.getCampaignStats(campaignId);
  }

  @Get(':campaignId/recipients')
  @Roles('customer')
  @ApiOperation({ summary: 'List campaign recipients' })
  async getRecipients(
    @Req() req: Request,
    @Param('campaignId') campaignId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    await this.messagingCampaignsService.assertOwnership(campaignId, req.user!.id);
    return this.messagingCampaignsService.getRecipients(campaignId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Delete(':campaignId')
  @Roles('customer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a campaign' })
  async deleteCampaign(
    @Req() req: Request,
    @Param('campaignId') campaignId: string,
  ) {
    await this.messagingCampaignsService.assertOwnership(campaignId, req.user!.id);
    await this.messagingCampaignsService.deleteCampaign(campaignId);
  }

  @Post(':campaignId/dispatch')
  @Roles('customer')
  @ApiOperation({ summary: 'Dispatch a campaign' })
  async dispatchCampaign(
    @Req() req: Request,
    @Param('campaignId') campaignId: string,
  ) {
    await this.messagingCampaignsService.assertOwnership(campaignId, req.user!.id);
    return this.campaignDispatchService.startDispatch(campaignId);
  }

  @Post(':campaignId/pause')
  @Roles('customer')
  @ApiOperation({ summary: 'Pause a sending campaign' })
  async pauseCampaign(
    @Req() req: Request,
    @Param('campaignId') campaignId: string,
  ) {
    await this.messagingCampaignsService.assertOwnership(campaignId, req.user!.id);
    return this.messagingCampaignsService.pauseCampaign(campaignId);
  }

  @Post(':campaignId/resume')
  @Roles('customer')
  @ApiOperation({ summary: 'Resume a paused campaign and restart dispatch' })
  async resumeCampaign(
    @Req() req: Request,
    @Param('campaignId') campaignId: string,
  ) {
    await this.messagingCampaignsService.assertOwnership(campaignId, req.user!.id);
    await this.messagingCampaignsService.resumeCampaign(campaignId);
    return this.campaignDispatchService.startDispatch(campaignId);
  }

  @Post(':campaignId/cancel')
  @Roles('customer')
  @ApiOperation({ summary: 'Cancel a campaign' })
  async cancelCampaign(
    @Req() req: Request,
    @Param('campaignId') campaignId: string,
  ) {
    await this.messagingCampaignsService.assertOwnership(campaignId, req.user!.id);
    return this.messagingCampaignsService.cancelCampaign(campaignId);
  }
}

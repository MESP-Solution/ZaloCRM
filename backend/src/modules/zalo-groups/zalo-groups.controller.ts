import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { ZaloGroupsService } from './zalo-groups.service';
import { ZaloAccountsService } from '../zalo-accounts/zalo-accounts.service';

@ApiTags('Zalo Groups')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class ZaloGroupsController {
  constructor(
    private readonly groupsService: ZaloGroupsService,
    private readonly zaloAccountsService: ZaloAccountsService,
  ) {}

  @Get('my-groups')
  @ApiOperation({ summary: 'Get all groups the Zalo account has joined' })
  async getMyGroups(
    @Req() req: Request,
    @Query('accountId') accountId: string,
  ) {
    if (!accountId) {
      throw new BadRequestException('accountId is required');
    }

    const account = await this.zaloAccountsService.findById(accountId);
    if (!account || account.customer.id !== req.user!.id) {
      throw new BadRequestException(
        'Zalo account not found or does not belong to you',
      );
    }

    return this.groupsService.getMyGroups(accountId);
  }

  @Post('group-members')
  @ApiOperation({ summary: 'Get members of a specific group by groupId' })
  async getGroupMembers(
    @Req() req: Request,
    @Body() body: { zaloAccountId: string; groupId: string },
  ) {
    const { zaloAccountId, groupId } = body;

    if (!zaloAccountId || !groupId) {
      throw new BadRequestException(
        'zaloAccountId and groupId are required',
      );
    }

    const account = await this.zaloAccountsService.findById(zaloAccountId);
    if (!account || account.customer.id !== req.user!.id) {
      throw new BadRequestException(
        'Zalo account not found or does not belong to you',
      );
    }

    return this.groupsService.getGroupMembersByGroupId(zaloAccountId, groupId);
  }

  @Post('fetch-link-info')
  @ApiOperation({ summary: 'Fetch group info from a Zalo group link' })
  async fetchLinkInfo(
    @Req() req: Request,
    @Body() body: { link: string; zaloAccountId: string; memberPage?: number },
  ) {
    const { link, zaloAccountId, memberPage } = body;

    if (!link || !zaloAccountId) {
      throw new BadRequestException('link and zaloAccountId are required');
    }

    const account = await this.zaloAccountsService.findById(zaloAccountId);
    if (!account || account.customer.id !== req.user!.id) {
      throw new BadRequestException(
        'Zalo account not found or does not belong to you',
      );
    }

    return this.groupsService.getGroupLinkInfo(zaloAccountId, link, memberPage);
  }

  @Post('fetch-all-members')
  @ApiOperation({ summary: 'Fetch all members from a group link (paginated internally)' })
  async fetchAllMembers(
    @Req() req: Request,
    @Body() body: { link: string; zaloAccountId: string },
  ) {
    const { link, zaloAccountId } = body;

    if (!link || !zaloAccountId) {
      throw new BadRequestException('link and zaloAccountId are required');
    }

    const account = await this.zaloAccountsService.findById(zaloAccountId);
    if (!account || account.customer.id !== req.user!.id) {
      throw new BadRequestException(
        'Zalo account not found or does not belong to you',
      );
    }

    return this.groupsService.fetchAllMembers(zaloAccountId, link);
  }
}

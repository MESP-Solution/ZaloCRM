import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  Inject,
  forwardRef,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { ZaloAccountsService } from './zalo-accounts.service';
import { ZaloConnectionService } from '../zalo-connection/zalo-connection.service';
import { QuotaService } from '../messaging-campaigns/quota.service';
import { UpdateZaloAccountDto } from './dto/update-zalo-account.dto';
import { ZaloConnectionRegistry } from '../zalo-connection/zalo-connection-registry';
import { ThreadType } from 'zca-js';

@ApiTags('Zalo Accounts')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
@Controller('zalo-accounts')
export class ZaloAccountsController {
  constructor(
    private readonly zaloAccountsService: ZaloAccountsService,
    @Inject(forwardRef(() => ZaloConnectionService))
    private readonly connectionService: ZaloConnectionService,
    private readonly quotaService: QuotaService,
    private readonly registry: ZaloConnectionRegistry,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List own Zalo accounts' })
  async listAccounts(@Req() req: Request) {
    return this.zaloAccountsService.findByCustomerId(req.user!.id);
  }

  @Get('quota')
  @ApiOperation({ summary: 'Get daily quota for all own Zalo accounts' })
  async getQuotaSummary(@Req() req: Request) {
    const accounts = await this.zaloAccountsService.findByCustomerId(
      req.user!.id,
    );
    const quotas = await Promise.all(
      accounts.map(async (account) => {
        const remaining = await this.quotaService.getRemainingQuota(account.id);
        const dailyLimit = 50;
        return {
          accountId: account.id,
          used: dailyLimit - remaining,
          dailyLimit,
        };
      }),
    );
    return quotas;
  }

  @Get(':accountId')
  @ApiOperation({ summary: 'Get own Zalo account by ID' })
  async getAccount(@Req() req: Request, @Param('accountId') accountId: string) {
    const account = await this.assertOwnership(accountId, req.user!.id);
    return account;
  }

  @Patch(':accountId')
  @ApiOperation({
    summary: 'Update own Zalo account (provide credentials to reconnect)',
  })
  async updateAccount(
    @Req() req: Request,
    @Param('accountId') accountId: string,
    @Body() dto: UpdateZaloAccountDto,
  ) {
    await this.assertOwnership(accountId, req.user!.id);

    const hasCredentials = dto.imei || dto.userAgent || dto.cookie;
    if (hasCredentials) {
      if (!dto.imei || !dto.userAgent || !dto.cookie) {
        throw new BadRequestException(
          'Must provide all 3 fields: imei, userAgent, cookie',
        );
      }
      await this.connectionService.updateCredentialsAndReconnect(accountId, {
        imei: dto.imei,
        userAgent: dto.userAgent,
        cookie: dto.cookie,
      });
    }

    if (dto.displayName) {
      await this.zaloAccountsService.updateDisplayName(
        accountId,
        dto.displayName,
      );
    }

    return {
      success: true,
      message: hasCredentials
        ? 'Credentials updated and reconnected'
        : 'Account updated',
    };
  }

  @Delete(':accountId')
  @ApiOperation({ summary: 'Delete own Zalo account' })
  async deleteAccount(
    @Req() req: Request,
    @Param('accountId') accountId: string,
  ) {
    await this.assertOwnership(accountId, req.user!.id);
    await this.zaloAccountsService.deleteAccount(accountId);
    return { success: true, message: 'Account deleted' };
  }

  @Post(':accountId/test-send')
  @ApiOperation({ summary: 'Test send a message from this account' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['recipientId'],
      properties: {
        recipientId: { type: 'string', example: '4575641363482065221' },
        text: { type: 'string', example: 'Test message', default: 'Test message' },
      },
    },
  })
  async testSend(
    @Req() req: Request,
    @Param('accountId') accountId: string,
    @Body() body: { recipientId?: string; text?: string },
  ) {
    await this.assertOwnership(accountId, req.user!.id);

    if (!body?.recipientId) {
      throw new BadRequestException('recipientId is required');
    }

    const conn = this.registry.get(accountId);
    if (!conn) {
      throw new BadRequestException('Account is not connected');
    }

    try {
      const response = await conn.api.sendMessage(
        body.text || 'Test message',
        body.recipientId,
        ThreadType.User,
      );
      return { success: true, response };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        accountId,
        recipientId: body.recipientId,
      };
    }
  }

  private async assertOwnership(accountId: string, customerId: string) {
    const account = await this.zaloAccountsService.findById(accountId);
    if (!account || account.customer.id !== customerId) {
      throw new NotFoundException('Zalo account not found');
    }
    return account;
  }
}

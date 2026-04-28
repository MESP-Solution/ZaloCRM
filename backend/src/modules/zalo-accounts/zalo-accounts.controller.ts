import {
  Controller,
  Get,
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
import { ApiTags, ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { ZaloAccountsService } from './zalo-accounts.service';
import { ZaloConnectionService } from '../zalo-connection/zalo-connection.service';
import { UpdateZaloAccountDto } from './dto/update-zalo-account.dto';

@ApiTags('Zalo Accounts')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
@Controller('zalo-accounts')
export class ZaloAccountsController {
  constructor(
    private readonly zaloAccountsService: ZaloAccountsService,
    @Inject(forwardRef(() => ZaloConnectionService))
    private readonly connectionService: ZaloConnectionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List own Zalo accounts' })
  async listAccounts(@Req() req: Request) {
    return this.zaloAccountsService.findByCustomerId(req.user!.id);
  }

  @Get(':accountId')
  @ApiOperation({ summary: 'Get own Zalo account by ID' })
  async getAccount(@Req() req: Request, @Param('accountId') accountId: string) {
    const account = await this.assertOwnership(accountId, req.user!.id);
    return account;
  }

  @Patch(':accountId')
  @ApiOperation({ summary: 'Update own Zalo account (provide credentials to reconnect)' })
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
      await this.zaloAccountsService.updateDisplayName(accountId, dto.displayName);
    }

    return { success: true, message: hasCredentials ? 'Credentials updated and reconnected' : 'Account updated' };
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

  private async assertOwnership(accountId: string, customerId: string) {
    const account = await this.zaloAccountsService.findById(accountId);
    if (!account || account.customer.id !== customerId) {
      throw new NotFoundException('Zalo account not found');
    }
    return account;
  }
}

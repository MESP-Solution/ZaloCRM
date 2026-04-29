import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { ZaloConnectionService } from './zalo-connection.service';
import { LoginWithCookieDto } from './dto/login-with-cookie.dto';
import { FindZaloUsersDto } from './dto/find-zalo-users.dto';

@ApiTags('Zalo Connections')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
@Controller('zalo-connections')
export class ZaloConnectionController {
  constructor(
    private readonly connectionService: ZaloConnectionService,
  ) {}

  @Post('login-cookie')
  @ApiOperation({ summary: 'Login with cookie — auto-creates Zalo account for current customer' })
  async loginWithCookie(@Req() req: Request, @Body() dto: LoginWithCookieDto) {
    const customerId = req.user!.id;
    const result = await this.connectionService.loginWithCookieForCustomer(
      customerId,
      dto.displayName ?? 'Zalo Account',
      { imei: dto.imei, userAgent: dto.userAgent, cookie: dto.cookie },
      dto.proxyUrl,
    );
    return {
      success: true,
      accountId: result.accountId,
      message: 'Zalo account created and connected',
    };
  }

  @Post('find-users')
  @ApiOperation({ summary: 'Resolve phone numbers with zca-js api.findUser' })
  async findUsers(@Req() req: Request, @Body() dto: FindZaloUsersDto) {
    return this.connectionService.findUsersByPhoneNumbers(
      req.user!.id,
      dto.phoneNumbers,
    );
  }

  @Post(':accountId/reconnect')
  @ApiOperation({ summary: 'Reconnect from saved cookie (with cooldown)' })
  async reconnect(
    @Req() req: Request,
    @Param('accountId') accountId: string,
  ) {
    await this.connectionService.assertOwnership(accountId, req.user!.id);
    await this.connectionService.reconnectAccount(accountId);
    return { success: true, message: 'Account reconnected' };
  }

  @Post(':accountId/disconnect')
  @ApiOperation({ summary: 'Disconnect a Zalo account' })
  async disconnect(
    @Req() req: Request,
    @Param('accountId') accountId: string,
  ) {
    await this.connectionService.assertOwnership(accountId, req.user!.id);
    await this.connectionService.disconnectAccount(accountId);
    return { success: true, message: 'Account disconnected' };
  }

  @Get()
  @ApiOperation({ summary: 'List own connected Zalo accounts' })
  async listConnected(@Req() req: Request) {
    return this.connectionService.listConnectedByCustomer(req.user!.id);
  }

  @Get(':accountId')
  @ApiOperation({ summary: 'Get connection detail for own Zalo account' })
  async getDetail(
    @Req() req: Request,
    @Param('accountId') accountId: string,
  ) {
    await this.connectionService.assertOwnership(accountId, req.user!.id);
    const detail = this.connectionService.getConnectionDetail(accountId);
    if (!detail) throw new NotFoundException('Account is not connected');
    return detail;
  }
}

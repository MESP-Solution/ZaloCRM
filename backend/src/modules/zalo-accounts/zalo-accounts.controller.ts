import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/auth/roles.guard';
import { ZaloAccountsService } from './zalo-accounts.service';
import { CustomersService } from '../customers/customers.service';

@ApiTags('Zalo Accounts')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('zalo-accounts')
export class ZaloAccountsController {
  constructor(
    private readonly zaloAccountsService: ZaloAccountsService,
    private readonly customersService: CustomersService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a Zalo account (admin only)' })
  async createAccount(
    @Body()
    dto: {
      customerId: string;
      displayName: string;
      providerAccountId?: string;
    },
  ) {
    const customer = await this.customersService.findById(dto.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return this.zaloAccountsService.createAccount(
      customer,
      dto.displayName,
      dto.providerAccountId,
    );
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List Zalo accounts (admin only)' })
  listAccounts(@Query('customerId') customerId?: string) {
    return this.zaloAccountsService.listAccounts(customerId);
  }

  @Get(':accountId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get a Zalo account by ID (admin only)' })
  getAccount(@Param('accountId') accountId: string) {
    return this.zaloAccountsService.findById(accountId);
  }
}

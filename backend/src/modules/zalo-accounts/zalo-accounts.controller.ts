import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateZaloAccountDto } from './dto/create-zalo-account.dto';
import { ZaloAccountsService } from './zalo-accounts.service';

@Controller('zalo-accounts')
export class ZaloAccountsController {
  constructor(private readonly zaloAccountsService: ZaloAccountsService) {}

  @Post()
  createAccount(@Body() dto: CreateZaloAccountDto) {
    return this.zaloAccountsService.createAccount(dto);
  }

  @Get()
  listAccounts(@Query('customerId') customerId?: string) {
    return this.zaloAccountsService.listAccounts(customerId);
  }

  @Get(':accountId')
  getAccount(@Param('accountId') accountId: string) {
    return this.zaloAccountsService.getAccount(accountId);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/auth/roles.guard';
import { CustomerContactsService } from './customer-contacts.service';
import { LookupContactsDto } from './dto/lookup-contacts.dto';
import { BulkDeleteContactsDto } from './dto/bulk-delete-contacts.dto';

@ApiTags('Customer Contacts')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customer-contacts')
export class CustomerContactsController {
  constructor(
    private readonly contactsService: CustomerContactsService,
  ) {}

  @Get()
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'List contacts with pagination and search' })
  list(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contactsService.listByCustomer(req.user!.id, {
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('lookup')
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'Lookup phone numbers via Zalo and save as contacts' })
  async lookup(@Req() req: Request, @Body() dto: LookupContactsDto) {
    const result = await this.contactsService.lookupAndSave(
      req.user!.id,
      dto.phoneNumbers,
    );
    return {
      results: result.saved.map((c) => ({
        id: c.id,
        phone: c.phone,
        zaloUid: c.zaloUid,
        zaloName: c.zaloName,
        avatarUrl: c.avatarUrl,
        gender: c.gender,
      })),
      failedCount: result.failedCount,
    };
  }

  @Post('bulk-delete')
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'Bulk delete contacts by IDs' })
  async bulkDelete(@Req() req: Request, @Body() dto: BulkDeleteContactsDto) {
    const count = await this.contactsService.bulkDelete(req.user!.id, dto.contactIds);
    return { deleted: count };
  }

  @Delete(':contactId')
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'Delete a contact' })
  async remove(@Req() req: Request, @Param('contactId') contactId: string) {
    await this.contactsService.deleteContact(req.user!.id, contactId);
    return { success: true };
  }

  @Delete()
  @Roles('admin', 'customer')
  @ApiOperation({ summary: 'Clear all contacts for the current customer' })
  async clearAll(@Req() req: Request) {
    const count = await this.contactsService.clearAll(req.user!.id);
    return { deleted: count };
  }
}

import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/auth/roles.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@ApiTags('Customers')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a customer (admin only)' })
  @ApiResponse({ status: 201, description: 'Customer created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createCustomer(@Body() dto: CreateCustomerDto) {
    const customer = await this.customersService.createCustomer(
      dto.email,
      dto.name,
      dto.password,
    );
    return this.toPublicCustomer(customer);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all customers (admin only)' })
  async listCustomers() {
    const customers = await this.customersService.listCustomers();
    return customers.map((c) => this.toPublicCustomer(c));
  }

  @Get(':customerId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get a customer by ID (admin only)' })
  getCustomer(@Param('customerId') customerId: string) {
    return this.customersService.findByIdPublic(customerId);
  }

  private toPublicCustomer(
    customer: import('./customer-account.entity').CustomerAccount,
  ) {
    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      status: customer.status,
      roles: customer.roles.getItems().map((r) => r.name),
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}

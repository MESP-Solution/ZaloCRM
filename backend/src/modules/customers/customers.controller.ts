import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.customersService.createCustomer(dto);
  }

  @Get()
  listCustomers() {
    return this.customersService.listCustomers();
  }

  @Get(':customerId')
  getCustomer(@Param('customerId') customerId: string) {
    return this.customersService.getCustomer(customerId);
  }
}

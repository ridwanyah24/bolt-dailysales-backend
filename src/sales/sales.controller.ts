import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto';
import { CurrentBusiness, CurrentUser } from '../common/current-user.decorator';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Record a sale (transactional: decrements stock atomically)' })
  async createSale(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateSaleDto,
  ) {
    return this.salesService.createSale(
      businessId,
      user.userId,
      dto.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List sales (scoped, salespeople see only their own)' })
  @ApiQuery({ name: 'salespersonId', required: false })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  async getSales(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: any,
    @Query('salespersonId') salespersonId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.salesService.getSales(businessId, user, { salespersonId, start, end });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single sale' })
  async getSale(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.salesService.getSale(businessId, user, id);
  }
}

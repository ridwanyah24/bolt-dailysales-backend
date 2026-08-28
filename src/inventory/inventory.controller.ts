import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto';
import { CurrentBusiness } from '../common/current-user.decorator';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('alerts')
  @ApiOperation({ summary: 'Get low-stock and out-of-stock alerts' })
  async getAlerts(@CurrentBusiness() businessId: string) {
    return this.inventoryService.getAlerts(businessId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get inventory summary counts' })
  async getSummary(@CurrentBusiness() businessId: string) {
    return this.inventoryService.getSummary(businessId);
  }

  @Post('adjust/:productId')
  @ApiOperation({ summary: 'Adjust stock for a product' })
  async adjustStock(
    @CurrentBusiness() businessId: string,
    @Param('productId') productId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(businessId, productId, dto.delta);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentBusiness } from '../common/current-user.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s KPIs' })
  async getTodayKpis(@CurrentBusiness() businessId: string) {
    return this.dashboardService.getTodayKpis(businessId);
  }

  @Get('trend')
  @ApiOperation({ summary: 'Get revenue trend over N days' })
  @ApiQuery({ name: 'days', required: false })
  async getSalesTrend(@CurrentBusiness() businessId: string, @Query('days') days?: string) {
    return this.dashboardService.getSalesTrend(businessId, days ? parseInt(days) : 7);
  }
}

import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentBusiness } from '../common/current-user.decorator';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Get daily report for a specific date' })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD (defaults to today)' })
  async getDailyReport(@CurrentBusiness() businessId: string, @Query('date') date?: string) {
    return this.reportsService.getDailyReport(businessId, date);
  }

  @Get('range')
  @ApiOperation({ summary: 'Get reports for a date range' })
  @ApiQuery({ name: 'start', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'end', required: true, description: 'YYYY-MM-DD' })
  async getReportRange(
    @CurrentBusiness() businessId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    if (!start || !end) throw new BadRequestException('start and end dates are required');
    return this.reportsService.getReportRange(businessId, start, end);
  }
}

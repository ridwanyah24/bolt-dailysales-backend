import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiInsightsService } from './ai-insights.service';
import { Roles } from '../common/roles.decorator';
import { CurrentBusiness } from '../common/current-user.decorator';

@ApiTags('ai-insights')
@Controller('ai-insights')
export class AiInsightsController {
  constructor(private aiInsightsService: AiInsightsService) {}

  @Get()
  @Roles('owner')
  @ApiOperation({ summary: 'Get AI-generated insights (owner only)' })
  async getInsights(@CurrentBusiness() businessId: string) {
    return this.aiInsightsService.getInsights(businessId);
  }
}

import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { UpdateBusinessDto } from './dto';
import { Roles } from '../common/roles.decorator';
import { CurrentBusiness } from '../common/current-user.decorator';

@ApiTags('business')
@Controller('business')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Get()
  @ApiOperation({ summary: 'Get the caller\'s business' })
  async getBusiness(@CurrentBusiness() businessId: string) {
    return this.businessService.getBusiness(businessId);
  }

  @Patch()
  @Roles('owner')
  @ApiOperation({ summary: 'Update business profile (owner only)' })
  async updateBusiness(@CurrentBusiness() businessId: string, @Body() dto: UpdateBusinessDto) {
    return this.businessService.updateBusiness(businessId, dto);
  }

  @Post('complete-setup')
  @Roles('owner')
  @ApiOperation({ summary: 'Mark setup as complete (owner only)' })
  async completeSetup(@CurrentBusiness() businessId: string) {
    return this.businessService.completeSetup(businessId);
  }
}

import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentBusiness } from '../common/current-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get derived notifications' })
  async getNotifications(@CurrentBusiness() businessId: string) {
    return this.notificationsService.getNotifications(businessId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@CurrentBusiness() businessId: string, @Param('id') id: string) {
    await this.notificationsService.markAsRead(businessId, id);
  }
}

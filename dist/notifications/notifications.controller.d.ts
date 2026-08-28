import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(businessId: string): Promise<import("../common/domain.types").Notification[]>;
    markAsRead(businessId: string, id: string): Promise<void>;
}

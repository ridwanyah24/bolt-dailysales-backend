import { PrismaService } from '../common/prisma.service';
import type { Notification } from '../common/domain.types';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getNotifications(businessId: string): Promise<Notification[]>;
    markAsRead(businessId: string, notificationId: string): Promise<void>;
}

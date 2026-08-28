import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import type { Notification, NotificationType } from '../common/domain.types';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(businessId: string): Promise<Notification[]> {
    const [lowStockProducts, recentSales, invitedUsers, readRows] = await Promise.all([
      this.prisma.product.findMany({
        where: { businessId, isActive: true },
      }),
      this.prisma.sale.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { salesperson: true },
      }),
      this.prisma.user.findMany({
        where: { businessId, status: 'INVITED', role: 'SALESPERSON' },
      }),
      this.prisma.notificationRead.findMany({ where: { businessId } }),
    ]);

    const readSet = new Set(readRows.map((r) => r.notificationId));

    const notifications: Notification[] = [];

    // Low stock notifications
    for (const p of lowStockProducts) {
      if (p.stockQty <= p.lowStockThreshold) {
        const id = `notif_low_${p.id}`;
        const severity = p.stockQty === 0 ? 'out of stock' : 'low stock';
        notifications.push({
          id,
          type: 'low-stock' as NotificationType,
          title: `${p.name} is ${severity}`,
          body: `Current stock: ${p.stockQty} (threshold: ${p.lowStockThreshold})`,
          read: readSet.has(id),
          createdAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : new Date().toISOString(),
        });
      }
    }

    // Recent sale notifications
    for (const s of recentSales) {
      const id = `notif_sale_${s.id}`;
      const spName = s.salesperson?.name || 'Unknown';
      notifications.push({
        id,
        type: 'new-sale' as NotificationType,
        title: 'New sale recorded',
        body: `${spName} recorded a sale`,
        read: readSet.has(id),
        createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : new Date().toISOString(),
      });
    }

    // Pending invite notifications
    for (const u of invitedUsers) {
      const id = `notif_invite_${u.id}`;
      notifications.push({
        id,
        type: 'salesperson' as NotificationType,
        title: 'Pending invite',
        body: `${u.name} (${u.email}) hasn't accepted their invite yet`,
        read: readSet.has(id),
        createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : new Date().toISOString(),
      });
    }

    // Sort newest first
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return notifications;
  }

  async markAsRead(businessId: string, notificationId: string): Promise<void> {
    await this.prisma.notificationRead.upsert({
      where: { businessId_notificationId: { businessId, notificationId } },
      create: { businessId, notificationId },
      update: { readAt: new Date() },
    });
  }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
let NotificationsService = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getNotifications(businessId) {
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
        const notifications = [];
        for (const p of lowStockProducts) {
            if (p.stockQty <= p.lowStockThreshold) {
                const id = `notif_low_${p.id}`;
                const severity = p.stockQty === 0 ? 'out of stock' : 'low stock';
                notifications.push({
                    id,
                    type: 'low-stock',
                    title: `${p.name} is ${severity}`,
                    body: `Current stock: ${p.stockQty} (threshold: ${p.lowStockThreshold})`,
                    read: readSet.has(id),
                    createdAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : new Date().toISOString(),
                });
            }
        }
        for (const s of recentSales) {
            const id = `notif_sale_${s.id}`;
            const spName = s.salesperson?.name || 'Unknown';
            notifications.push({
                id,
                type: 'new-sale',
                title: 'New sale recorded',
                body: `${spName} recorded a sale`,
                read: readSet.has(id),
                createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : new Date().toISOString(),
            });
        }
        for (const u of invitedUsers) {
            const id = `notif_invite_${u.id}`;
            notifications.push({
                id,
                type: 'salesperson',
                title: 'Pending invite',
                body: `${u.name} (${u.email}) hasn't accepted their invite yet`,
                read: readSet.has(id),
                createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : new Date().toISOString(),
            });
        }
        notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return notifications;
    }
    async markAsRead(businessId, notificationId) {
        await this.prisma.notificationRead.upsert({
            where: { businessId_notificationId: { businessId, notificationId } },
            create: { businessId, notificationId },
            update: { readAt: new Date() },
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map
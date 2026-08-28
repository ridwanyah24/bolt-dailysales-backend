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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const utils_1 = require("../common/utils");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTodayKpis(businessId) {
        const todayStart = (0, utils_1.startOfDay)(new Date());
        const todayEnd = (0, utils_1.endOfDay)(new Date());
        const sales = await this.prisma.sale.findMany({
            where: { businessId, createdAt: { gte: todayStart, lte: todayEnd } },
            include: { items: true, salesperson: true },
        });
        const revenue = sales.reduce((sum, s) => sum + (0, utils_1.decimalToNumber)(s.total), 0);
        const productsSoldCount = sales.reduce((sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0);
        const transactionCount = sales.length;
        const productMap = new Map();
        for (const sale of sales) {
            for (const item of sale.items) {
                const existing = productMap.get(item.productId) || {
                    productId: item.productId,
                    productName: item.productName,
                    quantitySold: 0,
                    revenue: 0,
                };
                existing.quantitySold += item.quantity;
                existing.revenue += (0, utils_1.decimalToNumber)(item.lineTotal);
                productMap.set(item.productId, existing);
            }
        }
        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
        const salespersonMap = new Map();
        for (const sale of sales) {
            const spId = sale.salespersonId;
            const spName = sale.salesperson?.name || '';
            const existing = salespersonMap.get(spId) || {
                salespersonId: spId,
                salespersonName: spName,
                revenue: 0,
                transactionCount: 0,
                quantitySold: 0,
            };
            existing.revenue += (0, utils_1.decimalToNumber)(sale.total);
            existing.transactionCount += 1;
            existing.quantitySold += sale.items.reduce((sum, i) => sum + i.quantity, 0);
            salespersonMap.set(spId, existing);
        }
        const salesBySalesperson = Array.from(salespersonMap.values());
        return { revenue, productsSoldCount, transactionCount, topProducts, salesBySalesperson };
    }
    async getSalesTrend(businessId, days = 7) {
        const trend = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayStart = (0, utils_1.startOfDay)(date);
            const dayEnd = (0, utils_1.endOfDay)(date);
            const sales = await this.prisma.sale.findMany({
                where: { businessId, createdAt: { gte: dayStart, lte: dayEnd } },
            });
            const revenue = sales.reduce((sum, s) => sum + (0, utils_1.decimalToNumber)(s.total), 0);
            trend.push({ date: (0, utils_1.toISODate)(date), revenue });
        }
        return trend;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map
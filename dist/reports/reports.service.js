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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const utils_1 = require("../common/utils");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDailyReport(businessId, dateStr) {
        const date = dateStr ? new Date(dateStr) : new Date();
        const dayStart = (0, utils_1.startOfDay)(date);
        const dayEnd = (0, utils_1.endOfDay)(date);
        const [sales, activeProducts, salespeople] = await Promise.all([
            this.prisma.sale.findMany({
                where: { businessId, createdAt: { gte: dayStart, lte: dayEnd } },
                include: { items: true, salesperson: true },
            }),
            this.prisma.product.findMany({ where: { businessId, isActive: true } }),
            this.prisma.user.findMany({ where: { businessId, role: 'SALESPERSON' } }),
        ]);
        const revenue = sales.reduce((sum, s) => sum + (0, utils_1.decimalToNumber)(s.total), 0);
        const quantitySold = sales.reduce((sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0);
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
        const soldProducts = Array.from(productMap.values());
        const bestSellers = [...soldProducts].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5);
        const soldProductIds = new Set(soldProducts.map((p) => p.productId));
        const unsoldProducts = activeProducts
            .filter((p) => !soldProductIds.has(p.id))
            .map((p) => ({ productId: p.id, productName: p.name, quantitySold: 0, revenue: 0 }));
        const slowSellers = [...soldProducts]
            .sort((a, b) => a.quantitySold - b.quantitySold)
            .concat(unsoldProducts)
            .slice(0, 5);
        const remainingInventoryUnits = activeProducts.reduce((sum, p) => sum + p.stockQty, 0);
        const spMap = new Map();
        for (const sp of salespeople) {
            spMap.set(sp.id, {
                salespersonId: sp.id,
                salespersonName: sp.name,
                revenue: 0,
                transactionCount: 0,
                quantitySold: 0,
            });
        }
        for (const sale of sales) {
            const sp = spMap.get(sale.salespersonId);
            if (sp) {
                sp.revenue += (0, utils_1.decimalToNumber)(sale.total);
                sp.transactionCount += 1;
                sp.quantitySold += sale.items.reduce((sum, i) => sum + i.quantity, 0);
            }
        }
        const salespersonPerformance = Array.from(spMap.values());
        return {
            date: (0, utils_1.toISODate)(date),
            revenue,
            quantitySold,
            transactionCount,
            bestSellers,
            slowSellers,
            remainingInventoryUnits,
            salespersonPerformance,
        };
    }
    async getReportRange(businessId, start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const reports = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            const report = await this.getDailyReport(businessId, (0, utils_1.toISODate)(current));
            reports.push(report);
            current.setDate(current.getDate() + 1);
        }
        return reports;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map
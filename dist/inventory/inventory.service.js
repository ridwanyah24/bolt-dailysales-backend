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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const errors_1 = require("../common/errors");
const utils_1 = require("../common/utils");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapProduct(p) {
        return {
            id: p.id,
            businessId: p.businessId,
            categoryId: p.categoryId,
            name: p.name,
            sku: p.sku || undefined,
            barcode: p.barcode || undefined,
            sellingPrice: (0, utils_1.decimalToNumber)(p.sellingPrice),
            costPrice: p.costPrice ? (0, utils_1.decimalToNumber)(p.costPrice) : undefined,
            stockQty: p.stockQty,
            lowStockThreshold: p.lowStockThreshold,
            imageUrl: p.imageUrl || undefined,
            isActive: p.isActive,
            createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
            updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
        };
    }
    async getAlerts(businessId) {
        const products = await this.prisma.product.findMany({
            where: {
                businessId,
                isActive: true,
                stockQty: { lte: this.prisma.product.fields.lowStockThreshold },
            },
            orderBy: { stockQty: 'asc' },
        });
        const alertProducts = products.filter((p) => p.stockQty <= p.lowStockThreshold);
        return alertProducts.map((p) => {
            const severity = p.stockQty === 0 ? 'out' : 'low';
            return {
                id: `inv_${p.id}`,
                productId: p.id,
                productName: p.name,
                currentStock: p.stockQty,
                threshold: p.lowStockThreshold,
                severity,
            };
        });
    }
    async getSummary(businessId) {
        const products = await this.prisma.product.findMany({
            where: { businessId, isActive: true },
        });
        const totalSkus = products.length;
        const totalUnits = products.reduce((sum, p) => sum + p.stockQty, 0);
        const lowStockCount = products.filter((p) => p.stockQty > 0 && p.stockQty <= p.lowStockThreshold).length;
        const outOfStockCount = products.filter((p) => p.stockQty === 0).length;
        return { totalSkus, totalUnits, lowStockCount, outOfStockCount };
    }
    async adjustStock(businessId, productId, delta) {
        const product = await this.prisma.product.findFirst({
            where: { id: productId, businessId },
        });
        if (!product)
            throw errors_1.Errors.PRODUCT_NOT_FOUND();
        const newQty = Math.max(0, product.stockQty + delta);
        const updated = await this.prisma.product.update({
            where: { id: productId },
            data: { stockQty: newQty },
        });
        return this.mapProduct(updated);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map
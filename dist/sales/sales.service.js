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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/prisma.service");
const errors_1 = require("../common/errors");
const utils_1 = require("../common/utils");
let SalesService = class SalesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapSale(s) {
        return {
            id: s.id,
            businessId: s.businessId,
            salespersonId: s.salespersonId,
            salespersonName: s.salesperson?.name || '',
            items: (s.items || []).map((i) => ({
                productId: i.productId,
                productName: i.productName,
                quantity: i.quantity,
                unitPrice: (0, utils_1.decimalToNumber)(i.unitPrice),
                lineTotal: (0, utils_1.decimalToNumber)(i.lineTotal),
            })),
            subtotal: (0, utils_1.decimalToNumber)(s.subtotal),
            total: (0, utils_1.decimalToNumber)(s.total),
            createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
        };
    }
    async createSale(businessId, salespersonId, items) {
        if (!items || items.length === 0)
            throw errors_1.Errors.EMPTY_CART();
        for (const item of items) {
            if (item.quantity <= 0)
                throw errors_1.Errors.BAD_REQUEST('Quantity must be positive');
        }
        return await this.prisma.$transaction(async (tx) => {
            const salesperson = await tx.user.findUnique({ where: { id: salespersonId } });
            if (!salesperson)
                throw errors_1.Errors.USER_NOT_FOUND();
            const saleItems = [];
            let subtotal = new client_1.Prisma.Decimal(0);
            for (const item of items) {
                const product = await tx.product.findFirst({
                    where: { id: item.productId, businessId },
                });
                if (!product || !product.isActive) {
                    throw errors_1.Errors.PRODUCT_NOT_FOUND(`Product ${item.productId} not found or inactive`);
                }
                if (product.stockQty < item.quantity) {
                    throw errors_1.Errors.INSUFFICIENT_STOCK(product.name, product.id, item.quantity, product.stockQty);
                }
                const unitPrice = product.sellingPrice;
                const lineTotal = unitPrice.mul(item.quantity);
                subtotal = subtotal.add(lineTotal);
                await tx.product.update({
                    where: { id: product.id },
                    data: { stockQty: product.stockQty - item.quantity },
                });
                saleItems.push({
                    productId: product.id,
                    productName: product.name,
                    quantity: item.quantity,
                    unitPrice,
                    lineTotal,
                });
            }
            const sale = await tx.sale.create({
                data: {
                    businessId,
                    salespersonId,
                    subtotal,
                    total: subtotal,
                    items: { create: saleItems },
                },
                include: { items: true, salesperson: true },
            });
            return this.mapSale(sale);
        });
    }
    async getSales(businessId, authUser, opts) {
        const where = { businessId };
        if (authUser.role === 'salesperson') {
            where.salespersonId = authUser.userId;
        }
        else if (opts.salespersonId) {
            where.salespersonId = opts.salespersonId;
        }
        if (opts.start || opts.end) {
            where.createdAt = {};
            if (opts.start)
                where.createdAt.gte = new Date(opts.start);
            if (opts.end)
                where.createdAt.lte = (0, utils_1.endOfDay)(new Date(opts.end));
        }
        const sales = await this.prisma.sale.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { items: true, salesperson: true },
        });
        return sales.map(this.mapSale);
    }
    async getSale(businessId, authUser, id) {
        const sale = await this.prisma.sale.findFirst({
            where: { id, businessId },
            include: { items: true, salesperson: true },
        });
        if (!sale)
            throw errors_1.Errors.SALE_NOT_FOUND();
        if (authUser.role === 'salesperson' && sale.salespersonId !== authUser.userId) {
            throw errors_1.Errors.FORBIDDEN();
        }
        return this.mapSale(sale);
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalesService);
//# sourceMappingURL=sales.service.js.map
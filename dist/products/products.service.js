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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const errors_1 = require("../common/errors");
const utils_1 = require("../common/utils");
let ProductsService = class ProductsService {
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
    mapCategory(c) {
        return { id: c.id, businessId: c.businessId, name: c.name };
    }
    async getProducts(businessId, opts) {
        const page = Math.max(1, opts.page || 1);
        const pageSize = Math.min(100, Math.max(1, opts.pageSize || 20));
        const skip = (page - 1) * pageSize;
        const where = { businessId };
        if (opts.categoryId)
            where.categoryId = opts.categoryId;
        if (opts.query)
            where.name = { contains: opts.query, mode: 'insensitive' };
        if (!opts.includeInactive || opts.role !== 'owner') {
            where.isActive = true;
        }
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({ where, orderBy: { name: 'asc' }, skip, take: pageSize }),
            this.prisma.product.count({ where }),
        ]);
        return { items: products.map(this.mapProduct), total };
    }
    async searchProducts(businessId, q) {
        const where = {
            businessId,
            isActive: true,
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } },
                { barcode: { contains: q, mode: 'insensitive' } },
            ],
        };
        const products = await this.prisma.product.findMany({ where, orderBy: { name: 'asc' }, take: 50 });
        return products.map(this.mapProduct);
    }
    async getProduct(businessId, id) {
        const product = await this.prisma.product.findFirst({ where: { id, businessId } });
        if (!product)
            throw errors_1.Errors.PRODUCT_NOT_FOUND();
        return this.mapProduct(product);
    }
    async createProduct(businessId, dto) {
        const category = await this.prisma.category.findFirst({
            where: { id: dto.categoryId, businessId },
        });
        if (!category)
            throw errors_1.Errors.CATEGORY_NOT_FOUND();
        if (dto.sku) {
            const existing = await this.prisma.product.findFirst({
                where: { businessId, sku: dto.sku },
            });
            if (existing)
                throw errors_1.Errors.SKU_EXISTS();
        }
        const product = await this.prisma.product.create({
            data: {
                businessId,
                categoryId: dto.categoryId,
                name: dto.name,
                sku: dto.sku || null,
                barcode: dto.barcode || null,
                sellingPrice: dto.sellingPrice,
                costPrice: dto.costPrice ?? null,
                stockQty: dto.stockQty,
                lowStockThreshold: dto.lowStockThreshold,
                imageUrl: dto.imageUrl || null,
                isActive: true,
            },
        });
        return this.mapProduct(product);
    }
    async updateProduct(businessId, id, dto) {
        const product = await this.prisma.product.findFirst({ where: { id, businessId } });
        if (!product)
            throw errors_1.Errors.PRODUCT_NOT_FOUND();
        if (dto.categoryId) {
            const category = await this.prisma.category.findFirst({
                where: { id: dto.categoryId, businessId },
            });
            if (!category)
                throw errors_1.Errors.CATEGORY_NOT_FOUND();
        }
        if (dto.sku) {
            const existing = await this.prisma.product.findFirst({
                where: { businessId, sku: dto.sku, NOT: { id } },
            });
            if (existing)
                throw errors_1.Errors.SKU_EXISTS();
        }
        const data = {};
        for (const key of ['categoryId', 'name', 'sku', 'barcode', 'sellingPrice', 'costPrice', 'stockQty', 'lowStockThreshold', 'imageUrl', 'isActive']) {
            if (dto[key] !== undefined)
                data[key] = dto[key];
        }
        if (data.sku === undefined)
            delete data.sku;
        if (data.barcode !== undefined && data.barcode === null)
            data.barcode = null;
        const updated = await this.prisma.product.update({ where: { id }, data });
        return this.mapProduct(updated);
    }
    async deleteProduct(businessId, id) {
        const product = await this.prisma.product.findFirst({ where: { id, businessId } });
        if (!product)
            throw errors_1.Errors.PRODUCT_NOT_FOUND();
        await this.prisma.product.update({ where: { id }, data: { isActive: false } });
    }
    async getCategories(businessId) {
        const categories = await this.prisma.category.findMany({
            where: { businessId },
            orderBy: { name: 'asc' },
        });
        return categories.map(this.mapCategory);
    }
    async createCategory(businessId, name) {
        const existing = await this.prisma.category.findFirst({
            where: { businessId, name: { equals: name, mode: 'insensitive' } },
        });
        if (existing)
            throw errors_1.Errors.BAD_REQUEST('A category with this name already exists');
        const category = await this.prisma.category.create({ data: { businessId, name } });
        return this.mapCategory(category);
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map
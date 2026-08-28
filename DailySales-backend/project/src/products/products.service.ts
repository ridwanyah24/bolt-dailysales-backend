import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Errors } from '../common/errors';
import { decimalToNumber } from '../common/utils';
import type { Product, Category, Paginated, Role } from '../common/domain.types';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private mapProduct(p: any): Product {
    return {
      id: p.id,
      businessId: p.businessId,
      categoryId: p.categoryId,
      name: p.name,
      sku: p.sku || undefined,
      barcode: p.barcode || undefined,
      sellingPrice: decimalToNumber(p.sellingPrice),
      costPrice: p.costPrice ? decimalToNumber(p.costPrice) : undefined,
      stockQty: p.stockQty,
      lowStockThreshold: p.lowStockThreshold,
      imageUrl: p.imageUrl || undefined,
      isActive: p.isActive,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
    };
  }

  private mapCategory(c: any): Category {
    return { id: c.id, businessId: c.businessId, name: c.name };
  }

  async getProducts(
    businessId: string,
    opts: { categoryId?: string; query?: string; page?: number; pageSize?: number; includeInactive?: boolean; role?: Role },
  ): Promise<Paginated<Product>> {
    const page = Math.max(1, opts.page || 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = { businessId };
    if (opts.categoryId) where.categoryId = opts.categoryId;
    if (opts.query) where.name = { contains: opts.query, mode: 'insensitive' };

    if (!opts.includeInactive || opts.role !== 'owner') {
      where.isActive = true;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({ where, orderBy: { name: 'asc' }, skip, take: pageSize }),
      this.prisma.product.count({ where }),
    ]);

    return { items: products.map(this.mapProduct), total };
  }

  async searchProducts(businessId: string, q: string): Promise<Product[]> {
    const where = {
      businessId,
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { sku: { contains: q, mode: 'insensitive' as const } },
        { barcode: { contains: q, mode: 'insensitive' as const } },
      ],
    };
    const products = await this.prisma.product.findMany({ where, orderBy: { name: 'asc' }, take: 50 });
    return products.map(this.mapProduct);
  }

  async getProduct(businessId: string, id: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({ where: { id, businessId } });
    if (!product) throw Errors.PRODUCT_NOT_FOUND();
    return this.mapProduct(product);
  }

  async createProduct(businessId: string, dto: any): Promise<Product> {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, businessId },
    });
    if (!category) throw Errors.CATEGORY_NOT_FOUND();

    if (dto.sku) {
      const existing = await this.prisma.product.findFirst({
        where: { businessId, sku: dto.sku },
      });
      if (existing) throw Errors.SKU_EXISTS();
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

  async updateProduct(businessId: string, id: string, dto: any): Promise<Product> {
    const product = await this.prisma.product.findFirst({ where: { id, businessId } });
    if (!product) throw Errors.PRODUCT_NOT_FOUND();

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, businessId },
      });
      if (!category) throw Errors.CATEGORY_NOT_FOUND();
    }

    if (dto.sku) {
      const existing = await this.prisma.product.findFirst({
        where: { businessId, sku: dto.sku, NOT: { id } },
      });
      if (existing) throw Errors.SKU_EXISTS();
    }

    const data: any = {};
    for (const key of ['categoryId', 'name', 'sku', 'barcode', 'sellingPrice', 'costPrice', 'stockQty', 'lowStockThreshold', 'imageUrl', 'isActive']) {
      if (dto[key] !== undefined) data[key] = dto[key];
    }
    if (data.sku === undefined) delete data.sku;
    if (data.barcode !== undefined && data.barcode === null) data.barcode = null;

    const updated = await this.prisma.product.update({ where: { id }, data });
    return this.mapProduct(updated);
  }

  async deleteProduct(businessId: string, id: string): Promise<void> {
    const product = await this.prisma.product.findFirst({ where: { id, businessId } });
    if (!product) throw Errors.PRODUCT_NOT_FOUND();
    await this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  async getCategories(businessId: string): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });
    return categories.map(this.mapCategory);
  }

  async createCategory(businessId: string, name: string): Promise<Category> {
    const existing = await this.prisma.category.findFirst({
      where: { businessId, name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) throw Errors.BAD_REQUEST('A category with this name already exists');

    const category = await this.prisma.category.create({ data: { businessId, name } });
    return this.mapCategory(category);
  }
}

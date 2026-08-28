import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Errors } from '../common/errors';
import { decimalToNumber } from '../common/utils';
import type { InventoryAlert, InventorySummary, Product, InventorySeverity } from '../common/domain.types';

@Injectable()
export class InventoryService {
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

  async getAlerts(businessId: string): Promise<InventoryAlert[]> {
    const products = await this.prisma.product.findMany({
      where: {
        businessId,
        isActive: true,
        stockQty: { lte: this.prisma.product.fields.lowStockThreshold },
      },
      orderBy: { stockQty: 'asc' },
    });

    // Prisma doesn't support comparing two columns directly in where, so filter in-app
    const alertProducts = products.filter((p) => p.stockQty <= p.lowStockThreshold);

    return alertProducts.map((p) => {
      const severity: InventorySeverity = p.stockQty === 0 ? 'out' : 'low';
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

  async getSummary(businessId: string): Promise<InventorySummary> {
    const products = await this.prisma.product.findMany({
      where: { businessId, isActive: true },
    });

    const totalSkus = products.length;
    const totalUnits = products.reduce((sum, p) => sum + p.stockQty, 0);
    const lowStockCount = products.filter((p) => p.stockQty > 0 && p.stockQty <= p.lowStockThreshold).length;
    const outOfStockCount = products.filter((p) => p.stockQty === 0).length;

    return { totalSkus, totalUnits, lowStockCount, outOfStockCount };
  }

  async adjustStock(businessId: string, productId: string, delta: number): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, businessId },
    });
    if (!product) throw Errors.PRODUCT_NOT_FOUND();

    const newQty = Math.max(0, product.stockQty + delta);

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { stockQty: newQty },
    });
    return this.mapProduct(updated);
  }
}

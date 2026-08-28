import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { decimalToNumber, startOfDay, endOfDay, toISODate } from '../common/utils';
import type {
  DailyReport, ProductPerformance, SalespersonPerformance,
} from '../common/domain.types';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDailyReport(businessId: string, dateStr?: string): Promise<DailyReport> {
    const date = dateStr ? new Date(dateStr) : new Date();
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const [sales, activeProducts, salespeople] = await Promise.all([
      this.prisma.sale.findMany({
        where: { businessId, createdAt: { gte: dayStart, lte: dayEnd } },
        include: { items: true, salesperson: true },
      }),
      this.prisma.product.findMany({ where: { businessId, isActive: true } }),
      this.prisma.user.findMany({ where: { businessId, role: 'SALESPERSON' } }),
    ]);

    const revenue = sales.reduce((sum, s) => sum + decimalToNumber(s.total), 0);
    const quantitySold = sales.reduce(
      (sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
      0,
    );
    const transactionCount = sales.length;

    // Product performance
    const productMap = new Map<string, { productId: string; productName: string; quantitySold: number; revenue: number }>();
    for (const sale of sales) {
      for (const item of sale.items) {
        const existing = productMap.get(item.productId) || {
          productId: item.productId,
          productName: item.productName,
          quantitySold: 0,
          revenue: 0,
        };
        existing.quantitySold += item.quantity;
        existing.revenue += decimalToNumber(item.lineTotal);
        productMap.set(item.productId, existing);
      }
    }

    const soldProducts = Array.from(productMap.values());
    const bestSellers = [...soldProducts].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5);

    // Slow sellers: active products not sold, padded into the list
    const soldProductIds = new Set(soldProducts.map((p) => p.productId));
    const unsoldProducts: ProductPerformance[] = activeProducts
      .filter((p) => !soldProductIds.has(p.id))
      .map((p) => ({ productId: p.id, productName: p.name, quantitySold: 0, revenue: 0 }));
    const slowSellers = [...soldProducts]
      .sort((a, b) => a.quantitySold - b.quantitySold)
      .concat(unsoldProducts)
      .slice(0, 5);

    const remainingInventoryUnits = activeProducts.reduce((sum, p) => sum + p.stockQty, 0);

    // Salesperson performance
    const spMap = new Map<string, SalespersonPerformance>();
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
        sp.revenue += decimalToNumber(sale.total);
        sp.transactionCount += 1;
        sp.quantitySold += sale.items.reduce((sum, i) => sum + i.quantity, 0);
      }
    }
    const salespersonPerformance = Array.from(spMap.values());

    return {
      date: toISODate(date),
      revenue,
      quantitySold,
      transactionCount,
      bestSellers,
      slowSellers,
      remainingInventoryUnits,
      salespersonPerformance,
    };
  }

  async getReportRange(businessId: string, start: string, end: string): Promise<DailyReport[]> {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const reports: DailyReport[] = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      const report = await this.getDailyReport(businessId, toISODate(current));
      reports.push(report);
      current.setDate(current.getDate() + 1);
    }

    return reports;
  }
}

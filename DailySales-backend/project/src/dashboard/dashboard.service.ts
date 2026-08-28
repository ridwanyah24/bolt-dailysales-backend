import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { decimalToNumber, startOfDay, endOfDay, toISODate } from '../common/utils';
import type { ProductPerformance, SalespersonPerformance } from '../common/domain.types';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getTodayKpis(businessId: string) {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const sales = await this.prisma.sale.findMany({
      where: { businessId, createdAt: { gte: todayStart, lte: todayEnd } },
      include: { items: true, salesperson: true },
    });

    const revenue = sales.reduce((sum, s) => sum + decimalToNumber(s.total), 0);
    const productsSoldCount = sales.reduce(
      (sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
      0,
    );
    const transactionCount = sales.length;

    // Top products by revenue
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
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Sales by salesperson
    const salespersonMap = new Map<string, { salespersonId: string; salespersonName: string; revenue: number; transactionCount: number; quantitySold: number }>();
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
      existing.revenue += decimalToNumber(sale.total);
      existing.transactionCount += 1;
      existing.quantitySold += sale.items.reduce((sum, i) => sum + i.quantity, 0);
      salespersonMap.set(spId, existing);
    }
    const salesBySalesperson = Array.from(salespersonMap.values());

    return { revenue, productsSoldCount, transactionCount, topProducts, salesBySalesperson };
  }

  async getSalesTrend(businessId: string, days: number = 7) {
    const trend: { date: string; revenue: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const sales = await this.prisma.sale.findMany({
        where: { businessId, createdAt: { gte: dayStart, lte: dayEnd } },
      });

      const revenue = sales.reduce((sum, s) => sum + decimalToNumber(s.total), 0);
      trend.push({ date: toISODate(date), revenue });
    }

    return trend;
  }
}

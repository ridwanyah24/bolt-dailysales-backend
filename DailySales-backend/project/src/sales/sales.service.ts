import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { Errors } from '../common/errors';
import { decimalToNumber, startOfDay, endOfDay } from '../common/utils';
import type { Sale, SaleItem, Role } from '../common/domain.types';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  private mapSale(s: any): Sale {
    return {
      id: s.id,
      businessId: s.businessId,
      salespersonId: s.salespersonId,
      salespersonName: s.salesperson?.name || '',
      items: (s.items || []).map((i: any) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: decimalToNumber(i.unitPrice),
        lineTotal: decimalToNumber(i.lineTotal),
      })),
      subtotal: decimalToNumber(s.subtotal),
      total: decimalToNumber(s.total),
      createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    };
  }

  async createSale(
    businessId: string,
    salespersonId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<Sale> {
    if (!items || items.length === 0) throw Errors.EMPTY_CART();
    for (const item of items) {
      if (item.quantity <= 0) throw Errors.BAD_REQUEST('Quantity must be positive');
    }

    return await this.prisma.$transaction(async (tx) => {
      const salesperson = await tx.user.findUnique({ where: { id: salespersonId } });
      if (!salesperson) throw Errors.USER_NOT_FOUND();

      const saleItems: any[] = [];
      let subtotal = new Prisma.Decimal(0);

      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, businessId },
        });

        if (!product || !product.isActive) {
          throw Errors.PRODUCT_NOT_FOUND(`Product ${item.productId} not found or inactive`);
        }

        if (product.stockQty < item.quantity) {
          throw Errors.INSUFFICIENT_STOCK(product.name, product.id, item.quantity, product.stockQty);
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

  async getSales(
    businessId: string,
    authUser: any,
    opts: { salespersonId?: string; start?: string; end?: string },
  ): Promise<Sale[]> {
    const where: any = { businessId };

    // Salesperson role can only see their own sales
    if (authUser.role === 'salesperson') {
      where.salespersonId = authUser.userId;
    } else if (opts.salespersonId) {
      where.salespersonId = opts.salespersonId;
    }

    if (opts.start || opts.end) {
      where.createdAt = {};
      if (opts.start) where.createdAt.gte = new Date(opts.start);
      if (opts.end) where.createdAt.lte = endOfDay(new Date(opts.end));
    }

    const sales = await this.prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true, salesperson: true },
    });

    return sales.map(this.mapSale);
  }

  async getSale(businessId: string, authUser: any, id: string): Promise<Sale> {
    const sale = await this.prisma.sale.findFirst({
      where: { id, businessId },
      include: { items: true, salesperson: true },
    });

    if (!sale) throw Errors.SALE_NOT_FOUND();

    // Salesperson can only see their own sale
    if (authUser.role === 'salesperson' && sale.salespersonId !== authUser.userId) {
      throw Errors.FORBIDDEN();
    }

    return this.mapSale(sale);
  }
}

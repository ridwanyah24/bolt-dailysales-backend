import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Errors } from '../common/errors';
import type { Business } from '../common/domain.types';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  private mapBusiness(b: any): Business {
    return {
      id: b.id,
      name: b.name,
      storeName: b.storeName || undefined,
      address: b.address || undefined,
      currency: b.currency,
      createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
    };
  }

  async getBusiness(businessId: string): Promise<Business> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw Errors.BUSINESS_NOT_FOUND();
    return this.mapBusiness(business);
  }

  async updateBusiness(businessId: string, dto: Partial<{ name: string; storeName: string; address: string; currency: string }>): Promise<Business> {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.storeName !== undefined) data.storeName = dto.storeName;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.currency !== undefined) data.currency = dto.currency;

    const business = await this.prisma.business.update({ where: { id: businessId }, data });
    return this.mapBusiness(business);
  }

  async completeSetup(businessId: string): Promise<Business> {
    const business = await this.prisma.business.update({
      where: { id: businessId },
      data: { setupCompletedAt: new Date() },
    });
    return this.mapBusiness(business);
  }
}

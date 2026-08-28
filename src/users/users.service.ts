import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Errors } from '../common/errors';
import { hashToken, generateToken, decimalToNumber, startOfDay, endOfDay } from '../common/utils';
import * as bcrypt from 'bcryptjs';
import type { Salesperson, SalespersonStatus, SalespersonPerformance, Role } from '../common/domain.types';

const BCRYPT_COST = 12;
const INVITE_EXPIRY_DAYS = 7;

const statusMap: Record<string, SalespersonStatus> = {
  ACTIVE: 'active',
  INVITED: 'invited',
  DISABLED: 'disabled',
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private mapSalesperson(u: any): Salesperson {
    return {
      id: u.id,
      businessId: u.businessId,
      name: u.name,
      email: u.email,
      role: u.role.toLowerCase() as Role,
      avatarUrl: u.avatarUrl || undefined,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
      status: statusMap[u.status] || 'active',
    };
  }

  async getSalespeople(businessId: string): Promise<Salesperson[]> {
    const users = await this.prisma.user.findMany({
      where: { businessId, role: 'SALESPERSON' },
      orderBy: { name: 'asc' },
    });
    return users.map(this.mapSalesperson);
  }

  async inviteSalesperson(businessId: string, dto: { name: string; email: string }): Promise<Salesperson> {
    const existing = await this.prisma.user.findFirst({
      where: { businessId, email: dto.email },
    });
    if (existing) throw Errors.EMAIL_EXISTS('A user with this email already exists in this business');

    const inviteToken = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const user = await this.prisma.user.create({
      data: {
        businessId,
        name: dto.name,
        email: dto.email,
        role: 'SALESPERSON',
        status: 'INVITED',
        passwordHash: null,
        inviteTokenHash: hashToken(inviteToken),
        inviteExpiresAt: expiresAt,
      },
    });

    // In production, send invite email. In dev, log.
    console.log(`[DEV] Invite token for ${dto.email}: ${inviteToken}`);

    return this.mapSalesperson(user);
  }

  async acceptInvite(dto: { token: string; password: string }): Promise<{ user: any; accessToken: string }> {
    const tokenHash = hashToken(dto.token);
    const user = await this.prisma.user.findFirst({
      where: { inviteTokenHash: tokenHash, status: 'INVITED' },
    });

    if (!user || !user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
      throw Errors.INVALID_INVITE();
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        inviteTokenHash: null,
        inviteExpiresAt: null,
      },
    });

    // Issue access token — the controller will handle refresh cookie
    return { user: updated, accessToken: '' };
  }

  async updateSalespersonStatus(
    businessId: string,
    id: string,
    status: SalespersonStatus,
  ): Promise<Salesperson> {
    const user = await this.prisma.user.findFirst({
      where: { id, businessId, role: 'SALESPERSON' },
    });
    if (!user) throw Errors.USER_NOT_FOUND('Salesperson not found');

    const dbStatus = status.toUpperCase() as any;
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dbStatus },
    });

    if (status === 'disabled') {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return this.mapSalesperson(updated);
  }

  async getSalespersonPerformance(
    businessId: string,
    salespersonId: string,
    dateRange?: { start?: string; end?: string },
  ): Promise<SalespersonPerformance> {
    const user = await this.prisma.user.findFirst({
      where: { id: salespersonId, businessId, role: 'SALESPERSON' },
    });
    if (!user) throw Errors.USER_NOT_FOUND('Salesperson not found');

    const where: any = { businessId, salespersonId };
    if (dateRange?.start || dateRange?.end) {
      where.createdAt = {};
      if (dateRange.start) where.createdAt.gte = startOfDay(new Date(dateRange.start));
      if (dateRange.end) where.createdAt.lte = endOfDay(new Date(dateRange.end));
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: { items: true },
    });

    const revenue = sales.reduce((sum, s) => sum + decimalToNumber(s.total), 0);
    const transactionCount = sales.length;
    const quantitySold = sales.reduce(
      (sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
      0,
    );

    return {
      salespersonId,
      salespersonName: user.name,
      revenue,
      transactionCount,
      quantitySold,
    };
  }
}

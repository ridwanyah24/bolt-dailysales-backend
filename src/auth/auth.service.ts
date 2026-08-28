import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { Errors } from '../common/errors';
import { hashToken, generateToken, generateCode, decimalToNumber } from '../common/utils';
import * as bcrypt from 'bcryptjs';
import type { User, Business, Role } from '../common/domain.types';

const BCRYPT_COST = 12;
const REFRESH_TOKEN_DAYS = 30;
const VERIFICATION_CODE_EXPIRY_HOURS = 24;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private mapUser(u: any): User {
    return {
      id: u.id,
      businessId: u.businessId,
      name: u.name,
      email: u.email,
      role: u.role.toLowerCase() as Role,
      avatarUrl: u.avatarUrl || undefined,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    };
  }

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

  private signAccessToken(userId: string, businessId: string, role: Role): string {
    return this.jwtService.sign({ sub: userId, businessId, role });
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    });
    return token;
  }

  private setRefreshCookie(res: any, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/v1/auth',
      maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(res: any) {
    res.clearCookie('refreshToken', { path: '/v1/auth' });
  }

  async register(dto: { businessName: string; ownerName: string; email: string; password: string }, res: any) {
    const existing = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (existing) throw Errors.EMAIL_EXISTS();

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    const verificationCode = generateCode(6);
    const codeExpiry = new Date();
    codeExpiry.setHours(codeExpiry.getHours() + VERIFICATION_CODE_EXPIRY_HOURS);

    const result = await this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: { name: dto.businessName },
      });
      const user = await tx.user.create({
        data: {
          businessId: business.id,
          name: dto.ownerName,
          email: dto.email,
          passwordHash,
          role: 'OWNER',
          status: 'ACTIVE',
          inviteTokenHash: hashToken(verificationCode),
          inviteExpiresAt: codeExpiry,
        },
      });
      return { business, user };
    });

    const accessToken = this.signAccessToken(result.user.id, result.business.id, 'owner');
    const refreshToken = await this.issueRefreshToken(result.user.id);
    this.setRefreshCookie(res, refreshToken);

    // In production, send verification email here.
    // In dev, log the code.
    console.log(`[DEV] Email verification code for ${dto.email}: ${verificationCode}`);

    return {
      user: this.mapUser(result.user),
      business: this.mapBusiness(result.business),
      accessToken,
    };
  }

  async login(dto: { email: string; password: string }, res: any) {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw Errors.INVALID_CREDENTIALS();
    if (user.status === 'DISABLED') throw Errors.ACCOUNT_DISABLED();

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw Errors.INVALID_CREDENTIALS();

    const business = await this.prisma.business.findUnique({ where: { id: user.businessId } });
    if (!business) throw Errors.INVALID_CREDENTIALS();

    const accessToken = this.signAccessToken(user.id, business.id, user.role.toLowerCase() as Role);
    const refreshToken = await this.issueRefreshToken(user.id);
    this.setRefreshCookie(res, refreshToken);

    return {
      user: this.mapUser(user),
      accessToken,
    };
  }

  async refresh(req: any, res: any) {
    const token = req.cookies?.refreshToken;
    if (!token) throw Errors.MISSING_TOKEN();

    const tokenHash = hashToken(token);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
    });

    if (!stored || stored.expiresAt < new Date()) throw Errors.INVALID_TOKEN();

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || user.status === 'DISABLED') throw Errors.INVALID_TOKEN();

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = this.signAccessToken(user.id, user.businessId, user.role.toLowerCase() as Role);
    const newRefreshToken = await this.issueRefreshToken(user.id);
    this.setRefreshCookie(res, newRefreshToken);

    return { accessToken };
  }

  async logout(req: any, res: any) {
    const token = req.cookies?.refreshToken;
    if (token) {
      const tokenHash = hashToken(token);
      const stored = await this.prisma.refreshToken.findFirst({ where: { tokenHash } });
      if (stored) {
        await this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revokedAt: new Date() },
        });
      }
    }
    this.clearRefreshCookie(res);
  }

  async me(authUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id: authUser.userId } });
    if (!user) throw Errors.USER_NOT_FOUND();
    const business = await this.prisma.business.findUnique({ where: { id: user.businessId } });
    if (!business) throw Errors.BUSINESS_NOT_FOUND();
    return { user: this.mapUser(user), business: this.mapBusiness(business) };
  }

  async forgotPassword(dto: { email: string }) {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (!user) return {}; // Always succeed — don't leak account existence

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
    });

    // In production, send email. In dev, log.
    console.log(`[DEV] Password reset token for ${dto.email}: ${token}`);

    return {};
  }

  async resetPassword(dto: { token: string; newPassword: string }) {
    if (dto.newPassword.length < 8) throw Errors.WEAK_PASSWORD();

    const tokenHash = hashToken(dto.token);
    const stored = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, consumedAt: null },
    });

    if (!stored || stored.expiresAt < new Date()) throw Errors.INVALID_RESET_TOKEN();

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_COST);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {};
  }

  async verifyEmail(dto: { code: string }, authUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id: authUser.userId } });
    if (!user) throw Errors.USER_NOT_FOUND();
    if (user.emailVerifiedAt) throw Errors.ALREADY_VERIFIED();

    const codeHash = hashToken(dto.code);
    if (!user.inviteTokenHash || user.inviteTokenHash !== codeHash) {
      throw Errors.INVALID_TOKEN('Invalid verification code');
    }
    if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
      throw Errors.INVALID_TOKEN('Verification code expired');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), inviteTokenHash: null, inviteExpiresAt: null },
    });

    return { user: this.mapUser(updated) };
  }
}

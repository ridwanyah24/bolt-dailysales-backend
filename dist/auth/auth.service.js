"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../common/prisma.service");
const errors_1 = require("../common/errors");
const utils_1 = require("../common/utils");
const bcrypt = __importStar(require("bcryptjs"));
const BCRYPT_COST = 12;
const REFRESH_TOKEN_DAYS = 30;
const VERIFICATION_CODE_EXPIRY_HOURS = 24;
let AuthService = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    mapUser(u) {
        return {
            id: u.id,
            businessId: u.businessId,
            name: u.name,
            email: u.email,
            role: u.role.toLowerCase(),
            avatarUrl: u.avatarUrl || undefined,
            createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
        };
    }
    mapBusiness(b) {
        return {
            id: b.id,
            name: b.name,
            storeName: b.storeName || undefined,
            address: b.address || undefined,
            currency: b.currency,
            createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
        };
    }
    signAccessToken(userId, businessId, role) {
        return this.jwtService.sign({ sub: userId, businessId, role });
    }
    async issueRefreshToken(userId) {
        const token = (0, utils_1.generateToken)();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);
        await this.prisma.refreshToken.create({
            data: { userId, tokenHash: (0, utils_1.hashToken)(token), expiresAt },
        });
        return token;
    }
    setRefreshCookie(res, token) {
        res.cookie('refreshToken', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/v1/auth',
            maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
        });
    }
    clearRefreshCookie(res) {
        res.clearCookie('refreshToken', { path: '/v1/auth' });
    }
    async register(dto, res) {
        const existing = await this.prisma.user.findFirst({ where: { email: dto.email } });
        if (existing)
            throw errors_1.Errors.EMAIL_EXISTS();
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
        const verificationCode = (0, utils_1.generateCode)(6);
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
                    inviteTokenHash: (0, utils_1.hashToken)(verificationCode),
                    inviteExpiresAt: codeExpiry,
                },
            });
            return { business, user };
        });
        const accessToken = this.signAccessToken(result.user.id, result.business.id, 'owner');
        const refreshToken = await this.issueRefreshToken(result.user.id);
        this.setRefreshCookie(res, refreshToken);
        console.log(`[DEV] Email verification code for ${dto.email}: ${verificationCode}`);
        return {
            user: this.mapUser(result.user),
            business: this.mapBusiness(result.business),
            accessToken,
        };
    }
    async login(dto, res) {
        const user = await this.prisma.user.findFirst({ where: { email: dto.email } });
        if (!user || !user.passwordHash)
            throw errors_1.Errors.INVALID_CREDENTIALS();
        if (user.status === 'DISABLED')
            throw errors_1.Errors.ACCOUNT_DISABLED();
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid)
            throw errors_1.Errors.INVALID_CREDENTIALS();
        const business = await this.prisma.business.findUnique({ where: { id: user.businessId } });
        if (!business)
            throw errors_1.Errors.INVALID_CREDENTIALS();
        const accessToken = this.signAccessToken(user.id, business.id, user.role.toLowerCase());
        const refreshToken = await this.issueRefreshToken(user.id);
        this.setRefreshCookie(res, refreshToken);
        return {
            user: this.mapUser(user),
            accessToken,
        };
    }
    async refresh(req, res) {
        const token = req.cookies?.refreshToken;
        if (!token)
            throw errors_1.Errors.MISSING_TOKEN();
        const tokenHash = (0, utils_1.hashToken)(token);
        const stored = await this.prisma.refreshToken.findFirst({
            where: { tokenHash, revokedAt: null },
        });
        if (!stored || stored.expiresAt < new Date())
            throw errors_1.Errors.INVALID_TOKEN();
        const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
        if (!user || user.status === 'DISABLED')
            throw errors_1.Errors.INVALID_TOKEN();
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });
        const accessToken = this.signAccessToken(user.id, user.businessId, user.role.toLowerCase());
        const newRefreshToken = await this.issueRefreshToken(user.id);
        this.setRefreshCookie(res, newRefreshToken);
        return { accessToken };
    }
    async logout(req, res) {
        const token = req.cookies?.refreshToken;
        if (token) {
            const tokenHash = (0, utils_1.hashToken)(token);
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
    async me(authUser) {
        const user = await this.prisma.user.findUnique({ where: { id: authUser.userId } });
        if (!user)
            throw errors_1.Errors.USER_NOT_FOUND();
        const business = await this.prisma.business.findUnique({ where: { id: user.businessId } });
        if (!business)
            throw errors_1.Errors.BUSINESS_NOT_FOUND();
        return { user: this.mapUser(user), business: this.mapBusiness(business) };
    }
    async forgotPassword(dto) {
        const user = await this.prisma.user.findFirst({ where: { email: dto.email } });
        if (!user)
            return {};
        const token = (0, utils_1.generateToken)();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        await this.prisma.passwordResetToken.create({
            data: { userId: user.id, tokenHash: (0, utils_1.hashToken)(token), expiresAt },
        });
        console.log(`[DEV] Password reset token for ${dto.email}: ${token}`);
        return {};
    }
    async resetPassword(dto) {
        if (dto.newPassword.length < 8)
            throw errors_1.Errors.WEAK_PASSWORD();
        const tokenHash = (0, utils_1.hashToken)(dto.token);
        const stored = await this.prisma.passwordResetToken.findFirst({
            where: { tokenHash, consumedAt: null },
        });
        if (!stored || stored.expiresAt < new Date())
            throw errors_1.Errors.INVALID_RESET_TOKEN();
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
    async verifyEmail(dto, authUser) {
        const user = await this.prisma.user.findUnique({ where: { id: authUser.userId } });
        if (!user)
            throw errors_1.Errors.USER_NOT_FOUND();
        if (user.emailVerifiedAt)
            throw errors_1.Errors.ALREADY_VERIFIED();
        const codeHash = (0, utils_1.hashToken)(dto.code);
        if (!user.inviteTokenHash || user.inviteTokenHash !== codeHash) {
            throw errors_1.Errors.INVALID_TOKEN('Invalid verification code');
        }
        if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
            throw errors_1.Errors.INVALID_TOKEN('Verification code expired');
        }
        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: { emailVerifiedAt: new Date(), inviteTokenHash: null, inviteExpiresAt: null },
        });
        return { user: this.mapUser(updated) };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
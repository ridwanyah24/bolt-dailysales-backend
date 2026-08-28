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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const errors_1 = require("../common/errors");
const utils_1 = require("../common/utils");
const bcrypt = __importStar(require("bcryptjs"));
const BCRYPT_COST = 12;
const INVITE_EXPIRY_DAYS = 7;
const statusMap = {
    ACTIVE: 'active',
    INVITED: 'invited',
    DISABLED: 'disabled',
};
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapSalesperson(u) {
        return {
            id: u.id,
            businessId: u.businessId,
            name: u.name,
            email: u.email,
            role: u.role.toLowerCase(),
            avatarUrl: u.avatarUrl || undefined,
            createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
            status: statusMap[u.status] || 'active',
        };
    }
    async getSalespeople(businessId) {
        const users = await this.prisma.user.findMany({
            where: { businessId, role: 'SALESPERSON' },
            orderBy: { name: 'asc' },
        });
        return users.map(this.mapSalesperson);
    }
    async inviteSalesperson(businessId, dto) {
        const existing = await this.prisma.user.findFirst({
            where: { businessId, email: dto.email },
        });
        if (existing)
            throw errors_1.Errors.EMAIL_EXISTS('A user with this email already exists in this business');
        const inviteToken = (0, utils_1.generateToken)();
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
                inviteTokenHash: (0, utils_1.hashToken)(inviteToken),
                inviteExpiresAt: expiresAt,
            },
        });
        console.log(`[DEV] Invite token for ${dto.email}: ${inviteToken}`);
        return this.mapSalesperson(user);
    }
    async acceptInvite(dto) {
        const tokenHash = (0, utils_1.hashToken)(dto.token);
        const user = await this.prisma.user.findFirst({
            where: { inviteTokenHash: tokenHash, status: 'INVITED' },
        });
        if (!user || !user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
            throw errors_1.Errors.INVALID_INVITE();
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
        return { user: updated, accessToken: '' };
    }
    async updateSalespersonStatus(businessId, id, status) {
        const user = await this.prisma.user.findFirst({
            where: { id, businessId, role: 'SALESPERSON' },
        });
        if (!user)
            throw errors_1.Errors.USER_NOT_FOUND('Salesperson not found');
        const dbStatus = status.toUpperCase();
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
    async getSalespersonPerformance(businessId, salespersonId, dateRange) {
        const user = await this.prisma.user.findFirst({
            where: { id: salespersonId, businessId, role: 'SALESPERSON' },
        });
        if (!user)
            throw errors_1.Errors.USER_NOT_FOUND('Salesperson not found');
        const where = { businessId, salespersonId };
        if (dateRange?.start || dateRange?.end) {
            where.createdAt = {};
            if (dateRange.start)
                where.createdAt.gte = (0, utils_1.startOfDay)(new Date(dateRange.start));
            if (dateRange.end)
                where.createdAt.lte = (0, utils_1.endOfDay)(new Date(dateRange.end));
        }
        const sales = await this.prisma.sale.findMany({
            where,
            include: { items: true },
        });
        const revenue = sales.reduce((sum, s) => sum + (0, utils_1.decimalToNumber)(s.total), 0);
        const transactionCount = sales.length;
        const quantitySold = sales.reduce((sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0);
        return {
            salespersonId,
            salespersonName: user.name,
            revenue,
            transactionCount,
            quantitySold,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map
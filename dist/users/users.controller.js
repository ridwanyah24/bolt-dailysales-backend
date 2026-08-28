"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("./users.service");
const dto_1 = require("./dto");
const roles_decorator_1 = require("../common/roles.decorator");
const public_decorator_1 = require("../common/public.decorator");
const current_user_decorator_1 = require("../common/current-user.decorator");
const utils_1 = require("../common/utils");
const prisma_service_1 = require("../common/prisma.service");
let UsersController = class UsersController {
    constructor(usersService, jwtService, prisma) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async getSalespeople(businessId) {
        return this.usersService.getSalespeople(businessId);
    }
    async inviteSalesperson(businessId, dto) {
        return this.usersService.inviteSalesperson(businessId, dto);
    }
    async acceptInvite(dto, res) {
        const result = await this.usersService.acceptInvite(dto);
        const user = result.user;
        const accessToken = this.jwtService.sign({
            sub: user.id,
            businessId: user.businessId,
            role: user.role.toLowerCase(),
        });
        const refreshToken = (0, utils_1.generateToken)();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await this.prisma.refreshToken.create({
            data: { userId: user.id, tokenHash: (0, utils_1.hashToken)(refreshToken), expiresAt },
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/v1/auth',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            user: {
                id: user.id,
                businessId: user.businessId,
                name: user.name,
                email: user.email,
                role: user.role.toLowerCase(),
                avatarUrl: user.avatarUrl || undefined,
                createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
            },
            accessToken,
        });
    }
    async updateStatus(businessId, id, dto) {
        return this.usersService.updateSalespersonStatus(businessId, id, dto.status);
    }
    async getPerformance(businessId, id, start, end) {
        return this.usersService.getSalespersonPerformance(businessId, id, { start, end });
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('owner'),
    (0, swagger_1.ApiOperation)({ summary: 'List salespeople (owner only)' }),
    __param(0, (0, current_user_decorator_1.CurrentBusiness)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getSalespeople", null);
__decorate([
    (0, common_1.Post)('invite'),
    (0, roles_decorator_1.Roles)('owner'),
    (0, swagger_1.ApiOperation)({ summary: 'Invite a salesperson (owner only)' }),
    __param(0, (0, current_user_decorator_1.CurrentBusiness)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.InviteSalespersonDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "inviteSalesperson", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('accept-invite'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept an invite and set password' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AcceptInviteDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "acceptInvite", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)('owner'),
    (0, swagger_1.ApiOperation)({ summary: 'Update salesperson status (owner only)' }),
    __param(0, (0, current_user_decorator_1.CurrentBusiness)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateSalespersonStatusDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(':id/performance'),
    (0, roles_decorator_1.Roles)('owner'),
    (0, swagger_1.ApiOperation)({ summary: 'Get salesperson performance (owner only)' }),
    (0, swagger_1.ApiQuery)({ name: 'start', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'end', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentBusiness)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('start')),
    __param(3, (0, common_1.Query)('end')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getPerformance", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('salespeople'),
    (0, common_1.Controller)('salespeople'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService])
], UsersController);
//# sourceMappingURL=users.controller.js.map
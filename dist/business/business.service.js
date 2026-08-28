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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const errors_1 = require("../common/errors");
let BusinessService = class BusinessService {
    constructor(prisma) {
        this.prisma = prisma;
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
    async getBusiness(businessId) {
        const business = await this.prisma.business.findUnique({ where: { id: businessId } });
        if (!business)
            throw errors_1.Errors.BUSINESS_NOT_FOUND();
        return this.mapBusiness(business);
    }
    async updateBusiness(businessId, dto) {
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.storeName !== undefined)
            data.storeName = dto.storeName;
        if (dto.address !== undefined)
            data.address = dto.address;
        if (dto.currency !== undefined)
            data.currency = dto.currency;
        const business = await this.prisma.business.update({ where: { id: businessId }, data });
        return this.mapBusiness(business);
    }
    async completeSetup(businessId) {
        const business = await this.prisma.business.update({
            where: { id: businessId },
            data: { setupCompletedAt: new Date() },
        });
        return this.mapBusiness(business);
    }
};
exports.BusinessService = BusinessService;
exports.BusinessService = BusinessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BusinessService);
//# sourceMappingURL=business.service.js.map
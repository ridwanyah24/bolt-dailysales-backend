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
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const products_service_1 = require("./products.service");
const dto_1 = require("./dto");
const roles_decorator_1 = require("../common/roles.decorator");
const current_user_decorator_1 = require("../common/current-user.decorator");
const errors_1 = require("../common/errors");
let ProductsController = class ProductsController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    async getProducts(businessId, user, categoryId, query, page, pageSize, includeInactive) {
        return this.productsService.getProducts(businessId, {
            categoryId,
            query,
            page: page ? parseInt(page) : undefined,
            pageSize: pageSize ? parseInt(pageSize) : undefined,
            includeInactive: includeInactive === 'true',
            role: user.role,
        });
    }
    async searchProducts(businessId, q) {
        if (!q || q.length < 1)
            throw errors_1.Errors.BAD_REQUEST('Search query is required');
        return this.productsService.searchProducts(businessId, q);
    }
    async getProduct(businessId, id) {
        return this.productsService.getProduct(businessId, id);
    }
    async createProduct(businessId, dto) {
        return this.productsService.createProduct(businessId, dto);
    }
    async updateProduct(businessId, id, dto) {
        return this.productsService.updateProduct(businessId, id, dto);
    }
    async deleteProduct(businessId, id) {
        await this.productsService.deleteProduct(businessId, id);
    }
    async getCategories(businessId) {
        return this.productsService.getCategories(businessId);
    }
    async createCategory(businessId, dto) {
        return this.productsService.createCategory(businessId, dto.name);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Get)('products'),
    (0, swagger_1.ApiOperation)({ summary: 'List products (paginated, scoped)' }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'query', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'includeInactive', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentBusiness)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('categoryId')),
    __param(3, (0, common_1.Query)('query')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('pageSize')),
    __param(6, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Get)('products/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search products for POS' }),
    __param(0, (0, current_user_decorator_1.CurrentBusiness)()),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "searchProducts", null);
__decorate([
    (0, common_1.Get)('products/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single product' }),
    __param(0, (0, current_user_decorator_1.CurrentBusiness)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Post)('products'),
    (0, roles_decorator_1.Roles)('owner'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a product (owner only)' }),
    __param(0, (0, current_user_decorator_1.CurrentBusiness)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateProductDto]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Patch)('products/:id'),
    (0, roles_decorator_1.Roles)('owner'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a product (owner only)' }),
    __param(0, (0, current_user_decorator_1.CurrentBusiness)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateProductDto]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)('products/:id'),
    (0, roles_decorator_1.Roles)('owner'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete a product (owner only)' }),
    __param(0, (0, current_user_decorator_1.CurrentBusiness)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'List categories' }),
    __param(0, (0, current_user_decorator_1.CurrentBusiness)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Post)('categories'),
    (0, roles_decorator_1.Roles)('owner'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a category (owner only)' }),
    __param(0, (0, current_user_decorator_1.CurrentBusiness)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateCategoryDto]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "createCategory", null);
exports.ProductsController = ProductsController = __decorate([
    (0, swagger_1.ApiTags)('products'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map
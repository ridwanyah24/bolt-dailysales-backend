"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./common/prisma.module");
const jwt_auth_guard_1 = require("./common/jwt-auth.guard");
const roles_guard_1 = require("./common/roles.guard");
const auth_module_1 = require("./auth/auth.module");
const business_module_1 = require("./business/business.module");
const products_module_1 = require("./products/products.module");
const inventory_module_1 = require("./inventory/inventory.module");
const sales_module_1 = require("./sales/sales.module");
const users_module_1 = require("./users/users.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const reports_module_1 = require("./reports/reports.module");
const notifications_module_1 = require("./notifications/notifications.module");
const ai_insights_module_1 = require("./ai-insights/ai-insights.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_ACCESS_SECRET', 'fallback-access-secret'),
                    signOptions: { expiresIn: '15m' },
                }),
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            business_module_1.BusinessModule,
            products_module_1.ProductsModule,
            inventory_module_1.InventoryModule,
            sales_module_1.SalesModule,
            users_module_1.UsersModule,
            dashboard_module_1.DashboardModule,
            reports_module_1.ReportsModule,
            notifications_module_1.NotificationsModule,
            ai_insights_module_1.AiInsightsModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
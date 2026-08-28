"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentBusiness = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
exports.CurrentBusiness = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.businessId;
});
//# sourceMappingURL=current-user.decorator.js.map
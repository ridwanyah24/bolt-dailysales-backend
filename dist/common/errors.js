"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = exports.DomainError = void 0;
const common_1 = require("@nestjs/common");
class DomainError extends common_1.HttpException {
    constructor(error, message, status, details) {
        const body = { error, message };
        if (details !== undefined)
            body.details = details;
        super(body, status);
    }
}
exports.DomainError = DomainError;
exports.Errors = {
    INVALID_CREDENTIALS: (msg = 'Invalid email or password') => new DomainError('INVALID_CREDENTIALS', msg, common_1.HttpStatus.UNAUTHORIZED),
    MISSING_TOKEN: (msg = 'Authentication required') => new DomainError('MISSING_TOKEN', msg, common_1.HttpStatus.UNAUTHORIZED),
    INVALID_TOKEN: (msg = 'Invalid or expired token') => new DomainError('INVALID_TOKEN', msg, common_1.HttpStatus.UNAUTHORIZED),
    FORBIDDEN: (msg = 'You do not have permission to perform this action') => new DomainError('FORBIDDEN', msg, common_1.HttpStatus.FORBIDDEN),
    PRODUCT_NOT_FOUND: (msg = 'Product not found') => new DomainError('PRODUCT_NOT_FOUND', msg, common_1.HttpStatus.NOT_FOUND),
    CATEGORY_NOT_FOUND: (msg = 'Category not found') => new DomainError('CATEGORY_NOT_FOUND', msg, common_1.HttpStatus.NOT_FOUND),
    SALE_NOT_FOUND: (msg = 'Sale not found') => new DomainError('SALE_NOT_FOUND', msg, common_1.HttpStatus.NOT_FOUND),
    BUSINESS_NOT_FOUND: (msg = 'Business not found') => new DomainError('BUSINESS_NOT_FOUND', msg, common_1.HttpStatus.NOT_FOUND),
    USER_NOT_FOUND: (msg = 'User not found') => new DomainError('USER_NOT_FOUND', msg, common_1.HttpStatus.NOT_FOUND),
    EMAIL_EXISTS: (msg = 'An account with this email already exists') => new DomainError('EMAIL_EXISTS', msg, common_1.HttpStatus.CONFLICT),
    EMPTY_CART: (msg = 'Cannot record a sale with no items') => new DomainError('EMPTY_CART', msg, common_1.HttpStatus.BAD_REQUEST),
    INSUFFICIENT_STOCK: (productName, productId, requested, available) => new DomainError('INSUFFICIENT_STOCK', `Not enough stock for ${productName}`, common_1.HttpStatus.CONFLICT, { productId, requested, available }),
    SKU_EXISTS: (msg = 'A product with this SKU already exists') => new DomainError('SKU_EXISTS', msg, common_1.HttpStatus.CONFLICT),
    INVALID_INVITE: (msg = 'Invalid or expired invite token') => new DomainError('INVALID_INVITE', msg, common_1.HttpStatus.BAD_REQUEST),
    INVALID_RESET_TOKEN: (msg = 'Invalid or expired reset token') => new DomainError('INVALID_RESET_TOKEN', msg, common_1.HttpStatus.BAD_REQUEST),
    WEAK_PASSWORD: (msg = 'Password must be at least 8 characters') => new DomainError('WEAK_PASSWORD', msg, common_1.HttpStatus.BAD_REQUEST),
    ACCOUNT_DISABLED: (msg = 'This account has been disabled') => new DomainError('ACCOUNT_DISABLED', msg, common_1.HttpStatus.UNAUTHORIZED),
    ALREADY_VERIFIED: (msg = 'Email is already verified') => new DomainError('ALREADY_VERIFIED', msg, common_1.HttpStatus.BAD_REQUEST),
    BAD_REQUEST: (msg) => new DomainError('BAD_REQUEST', msg, common_1.HttpStatus.BAD_REQUEST),
};
//# sourceMappingURL=errors.js.map
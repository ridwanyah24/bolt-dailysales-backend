import { HttpException, HttpStatus } from '@nestjs/common';
export declare class DomainError extends HttpException {
    constructor(error: string, message: string, status: HttpStatus, details?: any);
}
export declare const Errors: {
    INVALID_CREDENTIALS: (msg?: string) => DomainError;
    MISSING_TOKEN: (msg?: string) => DomainError;
    INVALID_TOKEN: (msg?: string) => DomainError;
    FORBIDDEN: (msg?: string) => DomainError;
    PRODUCT_NOT_FOUND: (msg?: string) => DomainError;
    CATEGORY_NOT_FOUND: (msg?: string) => DomainError;
    SALE_NOT_FOUND: (msg?: string) => DomainError;
    BUSINESS_NOT_FOUND: (msg?: string) => DomainError;
    USER_NOT_FOUND: (msg?: string) => DomainError;
    EMAIL_EXISTS: (msg?: string) => DomainError;
    EMPTY_CART: (msg?: string) => DomainError;
    INSUFFICIENT_STOCK: (productName: string, productId: string, requested: number, available: number) => DomainError;
    SKU_EXISTS: (msg?: string) => DomainError;
    INVALID_INVITE: (msg?: string) => DomainError;
    INVALID_RESET_TOKEN: (msg?: string) => DomainError;
    WEAK_PASSWORD: (msg?: string) => DomainError;
    ACCOUNT_DISABLED: (msg?: string) => DomainError;
    ALREADY_VERIFIED: (msg?: string) => DomainError;
    BAD_REQUEST: (msg: string) => DomainError;
};

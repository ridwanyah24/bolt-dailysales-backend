import { HttpException, HttpStatus } from '@nestjs/common';

export class DomainError extends HttpException {
  constructor(error: string, message: string, status: HttpStatus, details?: any) {
    const body: any = { error, message };
    if (details !== undefined) body.details = details;
    super(body, status);
  }
}

export const Errors = {
  INVALID_CREDENTIALS: (msg = 'Invalid email or password') =>
    new DomainError('INVALID_CREDENTIALS', msg, HttpStatus.UNAUTHORIZED),

  MISSING_TOKEN: (msg = 'Authentication required') =>
    new DomainError('MISSING_TOKEN', msg, HttpStatus.UNAUTHORIZED),

  INVALID_TOKEN: (msg = 'Invalid or expired token') =>
    new DomainError('INVALID_TOKEN', msg, HttpStatus.UNAUTHORIZED),

  FORBIDDEN: (msg = 'You do not have permission to perform this action') =>
    new DomainError('FORBIDDEN', msg, HttpStatus.FORBIDDEN),

  PRODUCT_NOT_FOUND: (msg = 'Product not found') =>
    new DomainError('PRODUCT_NOT_FOUND', msg, HttpStatus.NOT_FOUND),

  CATEGORY_NOT_FOUND: (msg = 'Category not found') =>
    new DomainError('CATEGORY_NOT_FOUND', msg, HttpStatus.NOT_FOUND),

  SALE_NOT_FOUND: (msg = 'Sale not found') =>
    new DomainError('SALE_NOT_FOUND', msg, HttpStatus.NOT_FOUND),

  BUSINESS_NOT_FOUND: (msg = 'Business not found') =>
    new DomainError('BUSINESS_NOT_FOUND', msg, HttpStatus.NOT_FOUND),

  USER_NOT_FOUND: (msg = 'User not found') =>
    new DomainError('USER_NOT_FOUND', msg, HttpStatus.NOT_FOUND),

  EMAIL_EXISTS: (msg = 'An account with this email already exists') =>
    new DomainError('EMAIL_EXISTS', msg, HttpStatus.CONFLICT),

  EMPTY_CART: (msg = 'Cannot record a sale with no items') =>
    new DomainError('EMPTY_CART', msg, HttpStatus.BAD_REQUEST),

  INSUFFICIENT_STOCK: (productName: string, productId: string, requested: number, available: number) =>
    new DomainError('INSUFFICIENT_STOCK', `Not enough stock for ${productName}`, HttpStatus.CONFLICT, { productId, requested, available }),

  SKU_EXISTS: (msg = 'A product with this SKU already exists') =>
    new DomainError('SKU_EXISTS', msg, HttpStatus.CONFLICT),

  INVALID_INVITE: (msg = 'Invalid or expired invite token') =>
    new DomainError('INVALID_INVITE', msg, HttpStatus.BAD_REQUEST),

  INVALID_RESET_TOKEN: (msg = 'Invalid or expired reset token') =>
    new DomainError('INVALID_RESET_TOKEN', msg, HttpStatus.BAD_REQUEST),

  WEAK_PASSWORD: (msg = 'Password must be at least 8 characters') =>
    new DomainError('WEAK_PASSWORD', msg, HttpStatus.BAD_REQUEST),

  ACCOUNT_DISABLED: (msg = 'This account has been disabled') =>
    new DomainError('ACCOUNT_DISABLED', msg, HttpStatus.UNAUTHORIZED),

  ALREADY_VERIFIED: (msg = 'Email is already verified') =>
    new DomainError('ALREADY_VERIFIED', msg, HttpStatus.BAD_REQUEST),

  BAD_REQUEST: (msg: string) =>
    new DomainError('BAD_REQUEST', msg, HttpStatus.BAD_REQUEST),
};

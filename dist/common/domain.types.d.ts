export type Role = 'owner' | 'salesperson';
export type SalespersonStatus = 'active' | 'invited' | 'disabled';
export type InventorySeverity = 'low' | 'out';
export type NotificationType = 'low-stock' | 'new-sale' | 'salesperson' | 'system';
export type AIInsightType = 'top-seller' | 'declining' | 'restock' | 'peak-period' | 'recommendation' | 'summary';
export type AIInsightSeverity = 'info' | 'warning' | 'critical';
export interface JwtPayload {
    sub: string;
    businessId: string;
    role: Role;
    iat?: number;
    exp?: number;
}
export interface AuthUser {
    userId: string;
    businessId: string;
    role: Role;
}
export interface User {
    id: string;
    businessId: string;
    name: string;
    email: string;
    role: Role;
    avatarUrl?: string;
    createdAt: string;
}
export interface Business {
    id: string;
    name: string;
    storeName?: string;
    address?: string;
    currency: string;
    createdAt: string;
}
export interface Category {
    id: string;
    businessId: string;
    name: string;
}
export interface Product {
    id: string;
    businessId: string;
    categoryId: string;
    name: string;
    sku?: string;
    barcode?: string;
    sellingPrice: number;
    costPrice?: number;
    stockQty: number;
    lowStockThreshold: number;
    imageUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export type ProductInput = Omit<Product, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>;
export interface InventoryAlert {
    id: string;
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
    severity: InventorySeverity;
}
export interface InventorySummary {
    totalSkus: number;
    totalUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
}
export interface SaleItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}
export interface Sale {
    id: string;
    businessId: string;
    salespersonId: string;
    salespersonName: string;
    items: SaleItem[];
    subtotal: number;
    total: number;
    createdAt: string;
}
export interface Salesperson extends User {
    status: SalespersonStatus;
}
export interface SalespersonPerformance {
    salespersonId: string;
    salespersonName: string;
    revenue: number;
    transactionCount: number;
    quantitySold: number;
}
export interface ProductPerformance {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
}
export interface DailyReport {
    date: string;
    revenue: number;
    quantitySold: number;
    transactionCount: number;
    bestSellers: ProductPerformance[];
    slowSellers: ProductPerformance[];
    remainingInventoryUnits: number;
    salespersonPerformance: SalespersonPerformance[];
}
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
}
export interface AIInsight {
    id: string;
    type: AIInsightType;
    title: string;
    body: string;
    relatedProductIds?: string[];
    severity: AIInsightSeverity;
    generatedAt: string;
}
export interface Paginated<T> {
    items: T[];
    total: number;
}
export interface DateRange {
    start: string;
    end: string;
}

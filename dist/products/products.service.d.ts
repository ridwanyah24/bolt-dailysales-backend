import { PrismaService } from '../common/prisma.service';
import type { Product, Category, Paginated, Role } from '../common/domain.types';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    private mapProduct;
    private mapCategory;
    getProducts(businessId: string, opts: {
        categoryId?: string;
        query?: string;
        page?: number;
        pageSize?: number;
        includeInactive?: boolean;
        role?: Role;
    }): Promise<Paginated<Product>>;
    searchProducts(businessId: string, q: string): Promise<Product[]>;
    getProduct(businessId: string, id: string): Promise<Product>;
    createProduct(businessId: string, dto: any): Promise<Product>;
    updateProduct(businessId: string, id: string, dto: any): Promise<Product>;
    deleteProduct(businessId: string, id: string): Promise<void>;
    getCategories(businessId: string): Promise<Category[]>;
    createCategory(businessId: string, name: string): Promise<Category>;
}

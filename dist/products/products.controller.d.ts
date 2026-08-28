import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, CreateCategoryDto } from './dto';
export declare class ProductsController {
    private productsService;
    constructor(productsService: ProductsService);
    getProducts(businessId: string, user: any, categoryId?: string, query?: string, page?: string, pageSize?: string, includeInactive?: string): Promise<import("../common/domain.types").Paginated<import("../common/domain.types").Product>>;
    searchProducts(businessId: string, q: string): Promise<import("../common/domain.types").Product[]>;
    getProduct(businessId: string, id: string): Promise<import("../common/domain.types").Product>;
    createProduct(businessId: string, dto: CreateProductDto): Promise<import("../common/domain.types").Product>;
    updateProduct(businessId: string, id: string, dto: UpdateProductDto): Promise<import("../common/domain.types").Product>;
    deleteProduct(businessId: string, id: string): Promise<void>;
    getCategories(businessId: string): Promise<import("../common/domain.types").Category[]>;
    createCategory(businessId: string, dto: CreateCategoryDto): Promise<import("../common/domain.types").Category>;
}

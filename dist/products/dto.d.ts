export declare class CreateProductDto {
    categoryId: string;
    name: string;
    sku?: string;
    barcode?: string;
    sellingPrice: number;
    costPrice?: number;
    stockQty: number;
    lowStockThreshold: number;
    imageUrl?: string;
}
export declare class UpdateProductDto {
    categoryId?: string;
    name?: string;
    sku?: string;
    barcode?: string;
    sellingPrice?: number;
    costPrice?: number;
    stockQty?: number;
    lowStockThreshold?: number;
    imageUrl?: string;
    isActive?: boolean;
}
export declare class CreateCategoryDto {
    name: string;
}

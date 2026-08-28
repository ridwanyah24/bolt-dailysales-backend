import { PrismaService } from '../common/prisma.service';
import type { InventoryAlert, InventorySummary, Product } from '../common/domain.types';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    private mapProduct;
    getAlerts(businessId: string): Promise<InventoryAlert[]>;
    getSummary(businessId: string): Promise<InventorySummary>;
    adjustStock(businessId: string, productId: string, delta: number): Promise<Product>;
}

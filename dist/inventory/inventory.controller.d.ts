import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto';
export declare class InventoryController {
    private inventoryService;
    constructor(inventoryService: InventoryService);
    getAlerts(businessId: string): Promise<import("../common/domain.types").InventoryAlert[]>;
    getSummary(businessId: string): Promise<import("../common/domain.types").InventorySummary>;
    adjustStock(businessId: string, productId: string, dto: AdjustStockDto): Promise<import("../common/domain.types").Product>;
}

import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto';
export declare class SalesController {
    private salesService;
    constructor(salesService: SalesService);
    createSale(businessId: string, user: any, dto: CreateSaleDto): Promise<import("../common/domain.types").Sale>;
    getSales(businessId: string, user: any, salespersonId?: string, start?: string, end?: string): Promise<import("../common/domain.types").Sale[]>;
    getSale(businessId: string, user: any, id: string): Promise<import("../common/domain.types").Sale>;
}

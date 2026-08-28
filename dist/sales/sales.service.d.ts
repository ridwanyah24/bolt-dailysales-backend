import { PrismaService } from '../common/prisma.service';
import type { Sale } from '../common/domain.types';
export declare class SalesService {
    private prisma;
    constructor(prisma: PrismaService);
    private mapSale;
    createSale(businessId: string, salespersonId: string, items: {
        productId: string;
        quantity: number;
    }[]): Promise<Sale>;
    getSales(businessId: string, authUser: any, opts: {
        salespersonId?: string;
        start?: string;
        end?: string;
    }): Promise<Sale[]>;
    getSale(businessId: string, authUser: any, id: string): Promise<Sale>;
}

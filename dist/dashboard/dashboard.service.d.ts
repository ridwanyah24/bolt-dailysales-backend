import { PrismaService } from '../common/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getTodayKpis(businessId: string): Promise<{
        revenue: any;
        productsSoldCount: any;
        transactionCount: any;
        topProducts: {
            productId: string;
            productName: string;
            quantitySold: number;
            revenue: number;
        }[];
        salesBySalesperson: {
            salespersonId: string;
            salespersonName: string;
            revenue: number;
            transactionCount: number;
            quantitySold: number;
        }[];
    }>;
    getSalesTrend(businessId: string, days?: number): Promise<{
        date: string;
        revenue: number;
    }[]>;
}

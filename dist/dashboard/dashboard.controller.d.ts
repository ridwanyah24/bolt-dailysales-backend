import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private dashboardService;
    constructor(dashboardService: DashboardService);
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
    getSalesTrend(businessId: string, days?: string): Promise<{
        date: string;
        revenue: number;
    }[]>;
}

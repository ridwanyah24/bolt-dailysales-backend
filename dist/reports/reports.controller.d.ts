import { ReportsService } from './reports.service';
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
    getDailyReport(businessId: string, date?: string): Promise<import("../common/domain.types").DailyReport>;
    getReportRange(businessId: string, start: string, end: string): Promise<import("../common/domain.types").DailyReport[]>;
}

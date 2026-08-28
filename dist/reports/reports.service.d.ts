import { PrismaService } from '../common/prisma.service';
import type { DailyReport } from '../common/domain.types';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDailyReport(businessId: string, dateStr?: string): Promise<DailyReport>;
    getReportRange(businessId: string, start: string, end: string): Promise<DailyReport[]>;
}

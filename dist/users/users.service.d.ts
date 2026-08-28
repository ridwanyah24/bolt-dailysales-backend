import { PrismaService } from '../common/prisma.service';
import type { Salesperson, SalespersonStatus, SalespersonPerformance } from '../common/domain.types';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    private mapSalesperson;
    getSalespeople(businessId: string): Promise<Salesperson[]>;
    inviteSalesperson(businessId: string, dto: {
        name: string;
        email: string;
    }): Promise<Salesperson>;
    acceptInvite(dto: {
        token: string;
        password: string;
    }): Promise<{
        user: any;
        accessToken: string;
    }>;
    updateSalespersonStatus(businessId: string, id: string, status: SalespersonStatus): Promise<Salesperson>;
    getSalespersonPerformance(businessId: string, salespersonId: string, dateRange?: {
        start?: string;
        end?: string;
    }): Promise<SalespersonPerformance>;
}

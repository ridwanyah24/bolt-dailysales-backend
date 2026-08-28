import { PrismaService } from '../common/prisma.service';
import type { Business } from '../common/domain.types';
export declare class BusinessService {
    private prisma;
    constructor(prisma: PrismaService);
    private mapBusiness;
    getBusiness(businessId: string): Promise<Business>;
    updateBusiness(businessId: string, dto: Partial<{
        name: string;
        storeName: string;
        address: string;
        currency: string;
    }>): Promise<Business>;
    completeSetup(businessId: string): Promise<Business>;
}

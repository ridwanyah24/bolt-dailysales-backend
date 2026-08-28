import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import type { AIInsight } from '../common/domain.types';
export declare class AiInsightsService {
    private prisma;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    getInsights(businessId: string): Promise<AIInsight[]>;
    private gatherData;
    private generateWithLLM;
    private generateRulesBased;
}

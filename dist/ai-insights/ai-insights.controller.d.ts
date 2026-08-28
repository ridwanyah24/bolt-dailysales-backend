import { AiInsightsService } from './ai-insights.service';
export declare class AiInsightsController {
    private aiInsightsService;
    constructor(aiInsightsService: AiInsightsService);
    getInsights(businessId: string): Promise<import("../common/domain.types").AIInsight[]>;
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { decimalToNumber, startOfDay, endOfDay, toISODate } from '../common/utils';
import type { AIInsight, AIInsightType, AIInsightSeverity } from '../common/domain.types';

const CACHE_TTL_HOURS = 6;

@Injectable()
export class AiInsightsService {
  private readonly logger = new Logger(AiInsightsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getInsights(businessId: string): Promise<AIInsight[]> {
    // Check cache
    const cached = await this.prisma.aiInsightCache.findUnique({ where: { businessId } });
    if (cached && cached.expiresAt > new Date()) {
      return cached.payload as AIInsight[];
    }

    // Try LLM, fall back to rules-based
    let insights: AIInsight[];
    try {
      insights = await this.generateWithLLM(businessId);
    } catch (err) {
      this.logger.warn(`LLM call failed, using rules-based fallback: ${err instanceof Error ? err.message : err}`);
      // If we have stale cache, serve it rather than failing
      if (cached) {
        return cached.payload as AIInsight[];
      }
      insights = await this.generateRulesBased(businessId);
    }

    // Cache the result
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

    await this.prisma.aiInsightCache.upsert({
      where: { businessId },
      create: { businessId, payload: insights as any, expiresAt },
      update: { payload: insights as any, expiresAt, generatedAt: new Date() },
    });

    return insights;
  }

  private async gatherData(businessId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [sales, products, recentSales] = await Promise.all([
      this.prisma.sale.findMany({
        where: { businessId, createdAt: { gte: thirtyDaysAgo } },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.findMany({ where: { businessId, isActive: true } }),
      this.prisma.sale.findMany({
        where: { businessId, createdAt: { gte: thirtyDaysAgo } },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Product performance
    const productMap = new Map<string, { productId: string; productName: string; quantitySold: number; revenue: number }>();
    for (const sale of sales) {
      for (const item of sale.items) {
        const existing = productMap.get(item.productId) || {
          productId: item.productId, productName: item.productName, quantitySold: 0, revenue: 0,
        };
        existing.quantitySold += item.quantity;
        existing.revenue += decimalToNumber(item.lineTotal);
        productMap.set(item.productId, existing);
      }
    }

    const allProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
    const topSellers = allProducts.slice(0, 5);
    const declining = allProducts.slice(-5).reverse();

    const lowStockItems = products.filter((p) => p.stockQty <= p.lowStockThreshold).map((p) => ({
      name: p.name, stock: p.stockQty, threshold: p.lowStockThreshold,
    }));

    return { topSellers, declining, lowStockItems, totalSales: sales.length, products };
  }

  private async generateWithLLM(businessId: string): Promise<AIInsight[]> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return this.generateRulesBased(businessId);
    }

    const data = await this.gatherData(businessId);
    const now = new Date().toISOString();

    const prompt = `You are a retail business analyst. Based on the following data, generate 3-5 insights.
Return ONLY a JSON array where each item has: type (one of: top-seller, declining, restock, peak-period, recommendation, summary), title, body, relatedProductIds (array of strings, optional), severity (one of: info, warning, critical).

Data:
- Top sellers: ${JSON.stringify(data.topSellers)}
- Declining products: ${JSON.stringify(data.declining)}
- Low stock items: ${JSON.stringify(data.lowStockItems)}
- Total sales in last 30 days: ${data.totalSales}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const result: any = await response.json();
    const text = result.content?.[0]?.text || '[]';

    let parsed: any[];
    try {
      // Extract JSON from the response text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      throw new Error('Failed to parse LLM response');
    }

    return parsed.map((item, index) => ({
      id: `ai_insight_${index}_${Date.now()}`,
      type: item.type as AIInsightType,
      title: item.title,
      body: item.body,
      relatedProductIds: item.relatedProductIds,
      severity: (item.severity || 'info') as AIInsightSeverity,
      generatedAt: now,
    }));
  }

  private async generateRulesBased(businessId: string): Promise<AIInsight[]> {
    const data = await this.gatherData(businessId);
    const now = new Date().toISOString();
    const insights: AIInsight[] = [];

    // Top seller insight
    if (data.topSellers.length > 0) {
      const top = data.topSellers[0];
      insights.push({
        id: `ai_top_${Date.now()}`,
        type: 'top-seller',
        title: `${top.productName} is your best seller`,
        body: `${top.productName} generated ${top.revenue.toFixed(2)} in revenue with ${top.quantitySold} units sold in the last 30 days.`,
        relatedProductIds: [top.productId],
        severity: 'info',
        generatedAt: now,
      });
    }

    // Declining products
    if (data.declining.length > 0 && data.declining[0].quantitySold > 0) {
      const declining = data.declining[0];
      insights.push({
        id: `ai_declining_${Date.now()}`,
        type: 'declining',
        title: `${declining.productName} is underperforming`,
        body: `${declining.productName} only sold ${declining.quantitySold} units in the last 30 days. Consider a promotion or price adjustment.`,
        relatedProductIds: [declining.productId],
        severity: 'warning',
        generatedAt: now,
      });
    }

    // Restock alerts
    if (data.lowStockItems.length > 0) {
      const items = data.lowStockItems.slice(0, 3);
      insights.push({
        id: `ai_restock_${Date.now()}`,
        type: 'restock',
        title: `${data.lowStockItems.length} products need restocking`,
        body: `Products needing attention: ${items.map((i) => `${i.name} (${i.stock} left)`).join(', ')}${data.lowStockItems.length > 3 ? ' and more' : ''}.`,
        severity: data.lowStockItems.some((i) => i.stock === 0) ? 'critical' : 'warning',
        generatedAt: now,
      });
    }

    // Summary insight
    insights.push({
      id: `ai_summary_${Date.now()}`,
      type: 'summary',
      title: '30-day business summary',
      body: `You made ${data.totalSales} sales across ${data.products.length} active products in the last 30 days. ${data.topSellers.length > 0 ? `Top performer: ${data.topSellers[0].productName}.` : ''} ${data.lowStockItems.length} products need restocking.`,
      severity: 'info',
      generatedAt: now,
    });

    return insights;
  }
}

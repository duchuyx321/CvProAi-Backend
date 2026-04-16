import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Ai_results } from '~/models';
import { CreateAiResultsDto } from './dto/create-ai-results.dto';

type LockedMeta = {
    visible_count: number;
    total_count: number;
    hidden_count: number;
    is_premium_locked: boolean;
};

@Injectable()
export class AiResultsService {
    constructor(
        @InjectModel(Ai_results)
        private readonly aiResultsModel: typeof Ai_results,
    ) {}
    getVisibleCount(total: number): number {
        if (total <= 1) return total;
        if (total <= 3) return 1;
        return 2;
    }
    maskList(items: Record<string, any>[]) {
        const list = Array.isArray(items) ? items : [];
        const visibleCount = this.getVisibleCount(list.length);
        const visibleItems = list.slice(0, visibleCount);

        const meta: LockedMeta = {
            visible_count: visibleItems.length,
            total_count: list.length,
            hidden_count: Math.max(list.length - visibleItems.length, 0),
            is_premium_locked: list.length > visibleItems.length,
        };

        return {
            items: visibleItems,
            meta,
        };
    }
    async create(createAiResultsDto: CreateAiResultsDto) {
        return await this.aiResultsModel.create(createAiResultsDto as any);
    }
    async getAiResultByAiRunId(
        ai_run_id: string,
        view_full_ai_analysis: boolean,
        tier: string,
    ) {
        const result = await this.aiResultsModel.findOne({
            where: { ai_run_id },
        });
        if (!result) {
            throw new NotFoundException('Không tìm thấy kết quả AI');
        }
        if (view_full_ai_analysis) return { ...result, tier };

        const weaknesses = this.maskList(result.dataValues.weaknesses ?? []);
        const suggestions = this.maskList(result.dataValues.suggestions ?? []);
        const strengths = this.maskList(result.dataValues.strengths ?? []);
        return {
            id: result.dataValues.id,
            ai_run_id: result.dataValues.ai_run_id,
            overall_score: result.dataValues.overall_score,
            ats_score: result.dataValues.ats_score,
            clarity_score: result.dataValues.clarity_score,
            impact_score: result.dataValues.impact_score,
            tier: 'free',
            upgrade_hint: 'Nâng cấp Premium để xem toàn bộ phân tích chi tiết.',
            weaknesses: weaknesses.items,
            weaknesses_meta: weaknesses.meta,

            suggestions: suggestions.items,
            suggestions_meta: suggestions.meta,

            strengths: strengths.items,
            strengths_meta: strengths.meta,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            created_at: result.dataValues.createdAt,
        };
    }
}

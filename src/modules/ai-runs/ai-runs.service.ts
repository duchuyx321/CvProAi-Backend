import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { col, Op, Transaction } from 'sequelize';
import { Ai_results, Ai_runs } from '~/models';
import { CreateAiRunsDto } from './dto/create-ai-run.dto';
import { UpdateAiRunDto } from './dto/update-ai-run.dto';
import { ai_run_status } from '~/models/ai_runs.model';
import { AiResultsService } from '../ai-results/ai-results.service';
import { Helper } from '~/utils/helpers';

@Injectable()
export class AiRunsService {
    constructor(
        @InjectModel(Ai_runs) private readonly aiRunsModel: typeof Ai_runs,
        private readonly aiResultService: AiResultsService,
    ) {}

    async AdminCountAiRuns(fromDate: Date, toDate: Date) {
        const durationMs = toDate.getTime() - fromDate.getTime();
        const previousFromDate = new Date(fromDate.getTime() - durationMs);
        const previousToExclusive = fromDate;

        const currentDateWhere = {
            [Op.gte]: fromDate,
            [Op.lt]: toDate,
        };

        const previousDateWhere = {
            [Op.gte]: previousFromDate,
            [Op.lt]: previousToExclusive,
        };
        const [current, previous] = await Promise.all([
            this.aiRunsModel.count({
                where: {
                    createdAt: currentDateWhere,
                },
            }),
            this.aiRunsModel.count({
                where: {
                    createdAt: previousDateWhere,
                },
            }),
        ]);
        const growth_percent = Helper.calculateGrowthPercent(current, previous);
        return {
            value: current,
            growth_percent,
        };
    }
    async getAllAiRunByUserID(
        user_id: string,
        limit: number,
        page: number,
        search?: string,
        sort_by: 'createdAt' | 'updatedAt' | 'title' = 'updatedAt',
        sort_order: 'ASC' | 'DESC' = 'DESC',
        fromDate?: Date,
        toDate?: Date,
    ) {
        const offset = (page - 1) * limit;
        const where: Record<string, any> = { user_id };
        if (search?.trim()) {
            where.cv_name = {
                [Op.iLike]: `%${search.trim()}%`,
            };
        }
        if (fromDate && toDate) {
            where.createdAt = {
                [Op.gte]: fromDate,
                [Op.lt]: toDate,
            };
        }
        const { count, rows } = await this.aiRunsModel.findAndCountAll({
            where,
            attributes: ['id', 'cv_name', 'job_title', 'status', 'createdAt'],
            include: [
                {
                    model: Ai_results,
                    as: 'ai_result',
                    attributes: ['overall_score'],
                    required: false,
                },
            ],
            limit,
            offset,
            order: [[sort_by, sort_order]],
        });
        return {
            data: {
                data: rows,
                meta: {
                    page,
                    limit,
                    total_items: count,
                    total_pages: Math.ceil(count / limit),
                },
            },
        };
    }

    async createAiRun(createAiRunDto: CreateAiRunsDto) {
        return await this.aiRunsModel.create(createAiRunDto as any);
    }
    async updateAiRun(id: string, updateAiRunDto: UpdateAiRunDto) {
        const edited = await this.aiRunsModel.update(updateAiRunDto as any, {
            where: { id },
        });
        if (edited[0] === 0) {
            throw new InternalServerErrorException('Cập nhật ai run thất bại');
        }
        return edited;
    }
    async getAiRunById(id: string, user_id: string) {
        const aiRun = await this.aiRunsModel.findOne({
            where: { id, user_id },
        });
        if (!aiRun) {
            throw new NotFoundException('Ai run không tồn tại');
        }
        if (
            aiRun.dataValues.status === ai_run_status.QUEUED ||
            aiRun.dataValues.status === ai_run_status.RUNNING
        ) {
            throw new InternalServerErrorException(
                'Ai run không ở trạng thái chờ hoặc đang chạy',
            );
        }

        return aiRun;
    }
    async getAiRuns(user_id: string, page: number, limit: number) {
        const offset = (page - 1) * limit;
        return await this.aiRunsModel.findAndCountAll({
            where: { user_id },
            attributes: [
                'id',
                'cv_name',
                'job_title',
                'status',
                [col('ai_result.overall_score'), 'total_score'],
            ],
            include: [
                {
                    model: Ai_results,
                    as: 'ai_result',
                    attributes: [],
                    required: false,
                },
            ],
            order: [['created_at', 'DESC']],
            distinct: true,
            offset,
            limit,
        });
    }

    async destroyByCvId(cv_id: string, transaction?: Transaction) {
        const aiRuns = await this.aiRunsModel.findAll({
            where: { cv_id },
            attributes: ['id'],
            transaction,
        });

        const aiRunIds = aiRuns.map((item) => item.id);

        if (aiRunIds.length > 0) {
            await this.aiResultService.destroyByAiRun(aiRunIds, transaction);
            await this.aiRunsModel.destroy({
                where: { cv_id },
                transaction,
            });
        }
        return { message: 'Xóa ai kết quả phân tích ai thành công.' };
    }
}

import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { Usage_quotas } from '~/models';
import { SubscriptionsService } from '~/modules/subscriptions/subscriptions.service';
import { CreateUsageQuotasDto } from './dto/create-usageQuatas.dto';
import { UpdateUsageQuotasDto } from './dto/update-usageQuatas.dto';

@Injectable()
export class UsageQuotasService {
    constructor(
        @InjectModel(Usage_quotas)
        private readonly usageQuotasModel: typeof Usage_quotas,
        private readonly subscriptionsService: SubscriptionsService,
    ) {}

    private getEndOfCurrentMonth(date: Date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    }

    async getUsageQuotaByUserId(user_id: string) {
        const now = new Date();
        const { plan, subscription, is_free_fallback } =
            await this.subscriptionsService.getSubscriptionsByUserID(user_id);

        const ai_runs_limit = Number(
            (plan?.ai_limit || plan?.dataValues.ai_limit) ?? 0,
        );
        const exports_limit = Number(
            plan?.export_limit ?? plan?.dataValues?.export_limit ?? 0,
        );
        const cvs_limit = Number(
            plan?.cv_limit ?? plan?.dataValues?.cv_limit ?? 0,
        );

        const quota_end_at =
            subscription?.dataValues?.current_period_end ??
            subscription?.current_period_end ??
            this.getEndOfCurrentMonth(now);

        const quota = await this.usageQuotasModel.findOne({
            where: {
                user_id,
                quota_end_at: {
                    [Op.gte]: now,
                },
            },
            order: [
                ['quota_end_at', 'ASC'],
                ['created_at', 'DESC'],
            ],
        });

        if (!quota) {
            const newQuota = await this.createUsageQuota({
                quota_end_at,
                ai_runs_used: 0,
                ai_runs_limit,
                exports_used: 0,
                exports_limit,
                cvs_limit,
                cvs_used: 0,
                user_id,
            } as CreateUsageQuotasDto);

            return {
                quota: newQuota,
                plan,
                subscription,
                is_free_fallback,
                was_reset: true,
            };
        }

        const hasQuotaWindowChanged =
            new Date(quota.dataValues.quota_end_at).getTime() !==
            new Date(quota_end_at).getTime();

        if (hasQuotaWindowChanged) {
            const newQuota = await this.createUsageQuota({
                quota_end_at,
                ai_runs_used: 0,
                ai_runs_limit,
                exports_used: 0,
                exports_limit,
                user_id,
            } as CreateUsageQuotasDto);

            return {
                quota: newQuota,
                plan,
                subscription,
                is_free_fallback,
                was_reset: true,
            };
        }

        return {
            quota,
            plan,
            subscription,
            is_free_fallback,
        };
    }

    async createUsageQuota(createUsageQuotaDto: CreateUsageQuotasDto) {
        return this.usageQuotasModel.create(createUsageQuotaDto as any);
    }
    async updateUsageQuota(
        id: string,
        updateUsageQuotaDto: UpdateUsageQuotasDto,
    ) {
        const quota = await this.usageQuotasModel.findByPk(id);
        if (!quota) {
            throw new NotFoundException('Không tìm thấy quota.');
        }
        const updated = await quota.update(updateUsageQuotaDto as any);
        if (updated[0] === 0) {
            throw new BadRequestException('Cập nhật quota thất bại.');
        }
        return { message: 'Cập nhật quota thành công.' };
    }
    async increaseUsage(
        user_id: string,
        usageable_id: string,
        usageable_type: 'ai_runs_used' | 'exports_used' | 'cvs_used',
    ) {
        const now = new Date();
        const quota = await this.usageQuotasModel.findOne({
            where: {
                user_id,
                id: usageable_id,
                quota_end_at: {
                    [Op.gte]: now,
                },
            },
        });
        if (!quota) {
            throw new NotFoundException('Không tìm thấy quota.');
        }
        if (
            usageable_type === 'ai_runs_used' &&
            quota.dataValues.ai_runs_used >= quota.dataValues.ai_runs_limit
        ) {
            throw new BadRequestException('Đã hết lượt sử dụng AI.');
        }

        if (
            usageable_type === 'exports_used' &&
            quota.dataValues.exports_used >= quota.dataValues.exports_limit
        ) {
            throw new BadRequestException('Đã hết lượt export.');
        }

        if (
            usageable_type === 'cvs_used' &&
            quota.dataValues.exports_used >= quota.dataValues.exports_limit
        ) {
            throw new BadRequestException('Đã hết lượt tạo Cv ');
        }
        await quota.increment(usageable_type, { by: 1 });
        await quota.reload();
        return { message: 'Tăng usage thành công.' };
    }
}

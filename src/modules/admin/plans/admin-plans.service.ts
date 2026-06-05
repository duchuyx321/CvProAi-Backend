import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentsService } from '~/modules/payments/payments.service';
import { CreatePlansDto, UpdatePlansDto } from '~/modules/plans/dto';
import { PlansService } from '~/modules/plans/plans.service';
import { SubscriptionsService } from '~/modules/subscriptions/subscriptions.service';
import { QueryPlanDto } from './dto/query-plan.dto';
import { DateRangeUtil } from '~/utils/date-range.util';
import { QueryRange } from '~/common/dto/queryTime.dto';

@Injectable()
export class AdminPlansService {
    constructor(
        private readonly plansService: PlansService,
        private readonly subscriptionsService: SubscriptionsService,
        private readonly paymentsService: PaymentsService,
    ) {}
    async getPlans(queryPlanDto: QueryPlanDto) {
        const { limit, page, search, sort_by, sort_order, from, range, to } =
            queryPlanDto;
        const { fromDate, toExclusive } = DateRangeUtil.getDateRange(
            from,
            to,
            range as QueryRange,
            {
                requireDateRange: false,
            },
        );
        return await this.plansService.findAll(
            limit,
            page,
            search,
            sort_by,
            sort_order,
            fromDate,
            toExclusive,
        );
    }
    async getPlansBySlug(slug: string) {
        return await this.plansService.findBySlug(slug);
    }
    async cretaePlans(createPlansDto: CreatePlansDto) {
        return await this.plansService.create(createPlansDto);
    }

    async updatePlans(plan_id: string, updatePlansDto: UpdatePlansDto) {
        return await this.plansService.update(updatePlansDto, plan_id);
    }

    async disablePlans(plan_id: string) {
        return await this.plansService.disable(plan_id);
    }

    async restorePlans(plan_id: string) {
        return await this.plansService.restore(plan_id);
    }

    async destroyPlans(plan_id: string) {
        const alreadyExists = await this.plansService.findOneById(
            plan_id,
            false,
        );
        const plainPlan = alreadyExists.data.get({ plain: true });
        const subscriptionCount =
            await this.subscriptionsService.countSubscriptions(plan_id);
        const orderCount = await this.paymentsService.countOrders(plan_id);
        if (subscriptionCount > 0 || orderCount > 0) {
            throw new BadRequestException(
                'Gói mua thêm AI đã phát sinh đơn hàng, không thể xóa.',
            );
        }
        return await this.plansService.destroy(plainPlan.id);
    }
}

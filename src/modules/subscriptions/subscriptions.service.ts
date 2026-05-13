import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { Plans, Subscriptions } from '~/models';
import { subscription_status } from '~/models/subscriptions.model';
import { PlansService } from '../plans/plans.service';
import { CreateSubscriptionsDto } from './dto/create-subscriptions.dto';
import { PlanInterval } from '../plans/dto';

@Injectable()
export class SubscriptionsService {
    constructor(
        @InjectModel(Subscriptions)
        private readonly subscriptionsModel: typeof Subscriptions,
        private readonly plansService: PlansService,
    ) {}

    async getSubscriptionsByUserID(user_id: string) {
        const now = new Date();
        const whereCondition = {
            user_id,
            status: subscription_status.ACTIVE,
            [Op.or]: [
                { current_period_end: { [Op.is]: null } },
                { current_period_end: { [Op.gte]: now } },
            ],
        };

        const subscription = await this.subscriptionsModel.findOne({
            where: whereCondition,
            include: [Plans],
            order: [
                ['current_period_end', 'DESC'],
                ['createdAt', 'DESC'],
            ],
        });

        if (subscription) {
            return {
                subscription,
                plan: subscription.plan,
                is_free_fallback: false,
            };
        }

        const freePlan = await this.plansService.findOneBySlug('free');

        return {
            subscription: null,
            plan: freePlan,
            is_free_fallback: true,
        };
    }

    async create(createSubscriptionsDto: CreateSubscriptionsDto) {
        const { order_id, plan_id, user_id } = createSubscriptionsDto;
        const current_period_start = new Date();
        const plan = await this.plansService.findOneById(plan_id);
        const plainPlan = plan.data.get({ plain: true });
        const current_period_end = new Date(current_period_start);
        const billingCycle = plainPlan.billing_cycle as PlanInterval;
        switch (billingCycle) {
            case PlanInterval.MONTH:
                current_period_end.setDate(current_period_end.getDate() + 30);
                break;

            case PlanInterval.YEAR:
                current_period_end.setDate(current_period_end.getDate() + 365);
                break;

            default:
                throw new BadRequestException('Chu kỳ gói không hợp lệ');
        }
        const existingSubscription = await this.subscriptionsModel.findOne({
            where: { user_id },
        });

        const payload = {
            order_id,
            plan_id,
            user_id,
            status: subscription_status.ACTIVE,
            current_period_start,
            current_period_end,
            cancel_at_period_end: false,
            canceled_at: null,
        };

        if (existingSubscription) {
            return await existingSubscription.update(payload as any);
        }

        return await this.subscriptionsModel.create(payload as any);
    }

    async countSubscriptions(plan_id: string) {
        return await this.subscriptionsModel.count({
            where: {
                plan_id,
            },
        });
    }
}

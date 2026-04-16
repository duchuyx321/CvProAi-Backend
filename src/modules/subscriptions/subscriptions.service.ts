import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { Plans, Subscriptions } from '~/models';
import { subscription_status } from '~/models/subscriptions.model';
import { PlansService } from '../plans/plans.service';

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
}

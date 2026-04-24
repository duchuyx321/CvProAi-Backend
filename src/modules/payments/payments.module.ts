import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { AiAddonPackages, Orders, Plans } from '~/models';
import { AuthModule } from '~/modules/auth/auth.module';
import { PlansModule } from '~/modules/plans/plans.module';
import { SubscriptionsModule } from '~/modules/subscriptions/subscriptions.module';
import { AiAddonPackagesModule } from '~/modules/ai_addon_packages/ai_addon_packages.module';
import { UsageQuotasModule } from '../usage-quotas/usage-quotas.module';

@Module({
    imports: [
        SequelizeModule.forFeature([Orders, Plans, AiAddonPackages]),
        AuthModule,
        PlansModule,
        SubscriptionsModule,
        AiAddonPackagesModule,
        UsageQuotasModule,
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService],
})
export class PaymentsModule {}

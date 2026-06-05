import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { AiAddonPackages, Orders, Plans, User_profile, Users } from '~/models';
import { AuthModule } from '~/modules/auth/auth.module';
import { PlansModule } from '~/modules/plans/plans.module';
import { SubscriptionsModule } from '~/modules/subscriptions/subscriptions.module';
import { AiAddonPackagesModule } from '~/modules/ai_addon_packages/ai_addon_packages.module';
import { UsageQuotasModule } from '~/modules/usage-quotas/usage-quotas.module';
import { UsersModule } from '~/modules/users/users.module';

@Module({
    imports: [
        SequelizeModule.forFeature([
            Orders,
            Plans,
            AiAddonPackages,
            Users,
            User_profile,
        ]),
        AuthModule,
        PlansModule,
        SubscriptionsModule,
        AiAddonPackagesModule,
        UsageQuotasModule,
        UsersModule,
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule {}

import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Subscriptions } from '~/models';
import { PlansModule } from '~/modules/plans/plans.module';

@Module({
    imports: [
        SequelizeModule.forFeature([Subscriptions]),
        forwardRef(() => PlansModule),
    ],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

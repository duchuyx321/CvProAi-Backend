import { Module } from '@nestjs/common';
import { UsageQuotasService } from './usage-quotas.service';
import { UsageQuotasController } from './usage-quotas.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Usage_quotas } from '~/models';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
    imports: [SequelizeModule.forFeature([Usage_quotas]), SubscriptionsModule],
    controllers: [UsageQuotasController],
    providers: [UsageQuotasService],
    exports: [UsageQuotasService],
})
export class UsageQuotasModule {}

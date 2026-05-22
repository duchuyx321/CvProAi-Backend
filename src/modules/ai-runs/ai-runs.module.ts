import { Module } from '@nestjs/common';
import { AiRunsService } from './ai-runs.service';
import { AiRunsController } from './ai-runs.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Ai_runs } from '~/models';
import { AiResultsModule } from '../ai-results/ai-results.module';
import { UsageQuotasModule } from '../usage-quotas/usage-quotas.module';

@Module({
    imports: [
        SequelizeModule.forFeature([Ai_runs]),
        AiResultsModule,
        UsageQuotasModule,
    ],
    controllers: [AiRunsController],
    providers: [AiRunsService],
    exports: [AiRunsService],
})
export class AiRunsModule {}

import { Module } from '@nestjs/common';
import { AiRunsService } from './ai-runs.service';
import { AiRunsController } from './ai-runs.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Ai_runs } from '~/models';
import { AiResultsModule } from '../ai-results/ai-results.module';

@Module({
    imports: [SequelizeModule.forFeature([Ai_runs]), AiResultsModule],
    controllers: [AiRunsController],
    providers: [AiRunsService],
    exports: [AiRunsService],
})
export class AiRunsModule {}

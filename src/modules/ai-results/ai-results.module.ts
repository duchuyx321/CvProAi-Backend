import { Module } from '@nestjs/common';
import { AiResultsService } from './ai-results.service';
import { AiResultsController } from './ai-results.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Ai_results } from '~/models';

@Module({
    imports: [SequelizeModule.forFeature([Ai_results])],
    controllers: [AiResultsController],
    providers: [AiResultsService],
    exports: [AiResultsService],
})
export class AiResultsModule {}

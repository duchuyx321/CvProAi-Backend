import { Module } from '@nestjs/common';
import { AiAnalysisService } from './ai-analysis.service';
import { AiAnalysisController } from './ai-analysis.controller';
import { AuthModule } from '~/modules/auth/auth.module';
import { CloudinaryModule } from '~/modules/cloudinary/cloudinary.module';
import { CvsModule } from '~/modules/cvs/cvs.module';
import { UsageQuotasModule } from '~/modules/usage-quotas/usage-quotas.module';
import { AiResultsModule } from '~/modules/ai-results/ai-results.module';
import { AiRunsModule } from '~/modules/ai-runs/ai-runs.module';

@Module({
    imports: [
        AuthModule,
        CvsModule,
        UsageQuotasModule,
        CloudinaryModule,
        AiRunsModule,
        AiResultsModule,
    ],
    controllers: [AiAnalysisController],
    providers: [AiAnalysisService],
    exports: [AiAnalysisService],
})
export class AiAnalysisModule {}

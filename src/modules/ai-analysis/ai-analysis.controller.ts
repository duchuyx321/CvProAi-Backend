import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

import { AiAnalysisService } from './ai-analysis.service';
import { documentUploadConfig } from '~/config/file-upload.config';
import { JwtAuthGuard } from '~/modules/auth/guards';
import { AnalyzeDto } from './dto/analyze.dto';

@ApiTags('AI Analysis')
@UseGuards(JwtAuthGuard)
@Controller('ai-analysis')
export class AiAnalysisController {
    constructor(private readonly aiAnalysisService: AiAnalysisService) {}

    private validateAnalyzeInput(
        analyzeDto: AnalyzeDto,
        files: {
            cv_file?: Express.Multer.File[];
            jd_file?: Express.Multer.File[];
        },
    ) {
        const cv_id = analyzeDto.cv_id?.trim();
        const jd_text = analyzeDto.jd_text?.trim();
        const cv_file = files?.cv_file?.[0];
        const jd_file = files?.jd_file?.[0];

        const hasCvId = Boolean(cv_id);
        const hasCvFile = Boolean(cv_file);
        const hasJdText = Boolean(jd_text);
        const hasJdFile = Boolean(jd_file);

        if (!hasCvId && !hasCvFile) {
            throw new BadRequestException('Vui lòng gửi cv_id hoặc cv_file.');
        }

        if (hasCvId && hasCvFile) {
            throw new BadRequestException(
                'Chỉ được gửi một trong hai: cv_id hoặc cv_file.',
            );
        }

        if (!hasJdText && !hasJdFile) {
            throw new BadRequestException('Vui lòng gửi jd_text hoặc jd_file.');
        }

        if (hasJdText && hasJdFile) {
            throw new BadRequestException(
                'Chỉ được gửi một trong hai: jd_text hoặc jd_file.',
            );
        }

        return {
            cv_id,
            jd_text,
            cv_file,
            jd_file,
        };
    }

    @Post('analyze')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                {
                    name: 'cv_file',
                    maxCount: 1,
                },
                {
                    name: 'jd_file',
                    maxCount: 1,
                },
            ],
            documentUploadConfig,
        ),
    )
    async analyze(
        @Req() req: Request,
        @UploadedFiles()
        files: {
            cv_file?: Express.Multer.File[];
            jd_file?: Express.Multer.File[];
        },
        @Body() analyzeDto: AnalyzeDto,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        const validatedInput = this.validateAnalyzeInput(analyzeDto, files);

        return this.aiAnalysisService.AnalyzeResults(user_id, validatedInput);
    }
    @Get('result/:ai_run_id')
    async getAnalysisResult(
        @Req() req: Request,
        @Param('ai_run_id') ai_run_id: string,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return this.aiAnalysisService.getAnalysisResult(user_id, ai_run_id);
    }
    @Get()
    async getAnalysisResults(
        @Req() req: Request,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return this.aiAnalysisService.getAnalysisResults(user_id, limit, page);
    }
}

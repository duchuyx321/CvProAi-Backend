import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

import { AiAnalysisService } from './ai-analysis.service';
import { documentUploadConfig } from '~/config/file-upload.config';
import { JwtAuthGuard } from '~/modules/auth/guards';
import { AnalyzeDto } from './dto/analyze.dto';
import { QueryAnalyzeDto } from './dto/query-anlalyze.dto';
import {
    ApplyAiRewriteProposalsDto,
    RejectAiRewriteProposalsDto,
} from '../ai-results/dto/create-ai-results.dto';

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
    @ApiOperation({ summary: 'lấy dữ liệu kết quả phân tích ai' })
    @Get('result/:ai_run_id')
    async getAnalysisResult(
        @Req() req: Request,
        @Param('ai_run_id') ai_run_id: string,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return this.aiAnalysisService.getAnalysisResult(user_id, ai_run_id);
    }
    @ApiOperation({ summary: 'lấy dữ liệu danh sách phân tích ai' })
    @Get('results')
    async getAnalysisResults(
        @Req() req: Request,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return this.aiAnalysisService.getAnalysisResults(user_id, limit, page);
    }

    @ApiOperation({ summary: 'lấy dữ liệu danh sách phân tích ai cá nhân' })
    @Get()
    async getAllAnalysisByUserID(
        @Req() req: Request,
        @Query() queryAnalyzeDto: QueryAnalyzeDto,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;

        return await this.aiAnalysisService.getAllAnalysisByUserId(
            user_id,
            queryAnalyzeDto,
        );
    }
    @ApiOperation({ summary: 'Phân tích ai' })
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
    @ApiOperation({ summary: 'Nhận gợi ý Cv' })
    @Post('rewrite-proposals/:aiRun_id')
    async rewriteProposals(
        @Req() req: Request,
        @Param('aiRun_id') aiRun_id: string,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return this.aiAnalysisService.generateRewriteSuggestions(
            user_id,
            aiRun_id,
        );
    }

    @ApiOperation({ summary: 'Áp dụng các gợi ý CV vào CV' })
    @Patch('rewrite-proposals/apply/:aiRun_id')
    async applyRewriteProposals(
        @Req() req: Request,
        @Param('aiRun_id') aiRun_id: string,
        @Body() applyAiRewriteProposalsDto: ApplyAiRewriteProposalsDto,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return await this.aiAnalysisService.applyRewriteProposals(
            user_id,
            aiRun_id,
            applyAiRewriteProposalsDto,
        );
    }
    @ApiOperation({ summary: 'Bỏ qua các gợi ý CV vào CV' })
    @Patch('rewrite-proposals/rejected/:aiRun_id')
    async rejectedRewriteProposals(
        @Req() req: Request,
        @Param('aiRun_id') aiRun_id: string,
        @Body() rejectedAiRewriteProposalsDto: RejectAiRewriteProposalsDto,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;
        return await this.aiAnalysisService.rejectedRewriteProposals(
            user_id,
            aiRun_id,
            rejectedAiRewriteProposalsDto,
        );
    }
}

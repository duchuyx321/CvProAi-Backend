/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { GoogleGenAI } from '@google/genai';
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import {
    buildCvJdAnalysisUserPrompt,
    CV_JD_ANALYSIS_JSON_SCHEMA,
    CV_JD_ANALYSIS_SYSTEM_PROMPT,
} from '~/config/promptAnalyze.config';

import { CvsService } from '~/modules/cvs/cvs.service';
import { UsageQuotasService } from '~/modules/usage-quotas/usage-quotas.service';
import { AiRunsService } from '~/modules/ai-runs/ai-runs.service';
import { ai_run_status } from '~/models/ai_runs.model';
import { AiResultsService } from '~/modules/ai-results/ai-results.service';
import { QueryAnalyzeDto } from './dto/query-anlalyze.dto';
import { DateRangeUtil } from '~/utils/date-range.util';
import { QueryRange } from '~/common/dto/queryTime.dto';

type AnalysisSourceType = 'cv' | 'jd';

type ParsedAnalysisDocument = {
    sourceType: AnalysisSourceType;
    fileName?: string;
    mimeType?: string;
    contentMarkdown: string;
    contentText: string;
};

@Injectable()
export class AiAnalysisService {
    constructor(
        private readonly cvsService: CvsService,
        private readonly usageQuotasService: UsageQuotasService,
        private readonly configService: ConfigService,
        private readonly aiRunsService: AiRunsService,
        private readonly aiResultsService: AiResultsService,
    ) {}

    private normalizeText(value?: string | null): string {
        return String(value ?? '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
    private cleanExtractedPdfText(value: string): string {
        return this.normalizeText(value)
            .replace(/[]/g, '')
            .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
            .replace(/©\s*topcv\.vn/gi, '')
            .replace(/Powered by TCPDF\s*\(www\.tcpdf\.org\)/gi, '')
            .replace(/^\s*•\s*$/gm, '')
            .replace(/[ \t]{2,}/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
    private markdownToPlainText(markdown: string): string {
        return markdown
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/^\s*[-*+]\s+/gm, '')
            .replace(/^\s*\d+\.\s+/gm, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    private normalizeAiRunLabel(value?: string | null): string | undefined {
        const normalized = this.normalizeText(value);

        if (!normalized) {
            return undefined;
        }

        return normalized.slice(0, 255).trim();
    }

    private getBaseFileName(fileName?: string | null): string | undefined {
        const normalized = this.normalizeAiRunLabel(fileName);

        if (!normalized) {
            return undefined;
        }

        return this.normalizeAiRunLabel(normalized.replace(/\.[^/.]+$/, ''));
    }

    private extractJobTitleFromJdText(
        jdText?: string | null,
    ): string | undefined {
        const normalized = this.normalizeText(jdText);

        if (!normalized) {
            return undefined;
        }

        const firstMeaningfulLine = normalized
            .split('\n')
            .map((line) => line.trim())
            .find(Boolean);

        return this.normalizeAiRunLabel(firstMeaningfulLine);
    }

    private buildDocument(
        sourceType: AnalysisSourceType,
        contentMarkdown: string,
        meta?: Partial<ParsedAnalysisDocument>,
    ): ParsedAnalysisDocument {
        const normalizedMarkdown = this.normalizeText(contentMarkdown);

        return {
            sourceType,
            fileName: meta?.fileName,
            mimeType: meta?.mimeType,
            contentMarkdown: normalizedMarkdown,
            contentText: this.markdownToPlainText(normalizedMarkdown),
        };
    }

    private async buildInternalCvAnalysisDocument(
        user_id: string,
        cv_id: string,
    ): Promise<ParsedAnalysisDocument> {
        const cv = await this.cvsService.getCvMeByID(user_id, cv_id);
        const content = cv?.data?.dataValues?.content ?? {};
        const lines: string[] = [];

        if (content?.profile_header) {
            lines.push('# Candidate Profile');
            lines.push(
                `- Full name: ${content.profile_header.full_name ?? ''}`,
            );
            lines.push(`- Headline: ${content.profile_header.headline ?? ''}`);
            lines.push('');
        }

        if (content?.CONTACT) {
            lines.push('# Contact');
            lines.push(`- Email: ${content.CONTACT.email ?? ''}`);
            lines.push(`- Phone: ${content.CONTACT.phone ?? ''}`);
            lines.push(`- Address: ${content.CONTACT.address ?? ''}`);
            lines.push('');
        }

        if (content?.SUMMARY) {
            lines.push('# Summary');
            lines.push(String(content.SUMMARY));
            lines.push('');
        }

        if (
            Array.isArray(content?.EXPERIENCE) &&
            content.EXPERIENCE.length > 0
        ) {
            lines.push('# Experience');

            for (const item of content.EXPERIENCE) {
                lines.push(
                    `## ${item.role ?? 'Role'} - ${item.company ?? 'Company'}`,
                );
                lines.push(`- Start date: ${item.start_date ?? ''}`);
                lines.push(
                    `- End date: ${item.end_date ?? (item.is_current ? 'Present' : '')}`,
                );

                if (item.description) {
                    lines.push(`- Description: ${String(item.description)}`);
                }

                lines.push('');
            }
        }

        if (Array.isArray(content?.SKILLS) && content.SKILLS.length > 0) {
            lines.push('# Skills');

            for (const item of content.SKILLS) {
                lines.push(
                    `- ${item.name ?? ''}${item.level ? ` (${item.level})` : ''}`,
                );
            }

            lines.push('');
        }

        if (Array.isArray(content?.EDUCATION) && content.EDUCATION.length > 0) {
            lines.push('# Education');

            for (const item of content.EDUCATION) {
                lines.push(`- ${item.degree ?? ''} - ${item.school ?? ''}`);
            }

            lines.push('');
        }

        return this.buildDocument('cv', lines.join('\n'), {
            fileName: cv?.data?.dataValues?.title,
        });
    }

    private buildRawTextDocument(
        sourceType: AnalysisSourceType,
        rawText: string,
    ): ParsedAnalysisDocument {
        return this.buildDocument(sourceType, rawText);
    }

    private async extractTextFromPdf(buffer: Buffer): Promise<string> {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        await parser.destroy();

        return this.cleanExtractedPdfText(result.text || '');
    }

    private async extractTextFromDocx(buffer: Buffer): Promise<string> {
        const result = await mammoth.extractRawText({ buffer });
        return this.normalizeText(result.value || '');
    }

    private async parseUploadedDocument(
        file: Express.Multer.File,
        sourceType: AnalysisSourceType,
    ): Promise<ParsedAnalysisDocument> {
        const mimeType = file.mimetype;
        const fileName = file.originalname;

        let extractedText = '';

        if (mimeType === 'text/plain') {
            extractedText = this.normalizeText(file.buffer.toString('utf-8'));
        } else if (mimeType === 'application/pdf') {
            extractedText = await this.extractTextFromPdf(file.buffer);
        } else if (
            mimeType ===
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimeType === 'application/msword'
        ) {
            extractedText = await this.extractTextFromDocx(file.buffer);
        } else {
            throw new BadRequestException(
                `Định dạng file không hỗ trợ: ${mimeType}`,
            );
        }

        if (!extractedText) {
            throw new BadRequestException(
                `${sourceType.toUpperCase()} upload không trích xuất được nội dung.`,
            );
        }

        return this.buildDocument(sourceType, extractedText, {
            fileName,
            mimeType,
        });
    }

    private async resolveCvDocument(
        user_id: string,
        payload: { cv_id?: string; cv_file?: Express.Multer.File },
    ): Promise<ParsedAnalysisDocument> {
        if (payload.cv_id) {
            return this.buildInternalCvAnalysisDocument(user_id, payload.cv_id);
        }

        if (payload.cv_file) {
            return this.parseUploadedDocument(payload.cv_file, 'cv');
        }

        throw new BadRequestException(
            'Không tìm thấy dữ liệu CV để phân tích.',
        );
    }

    private async resolveJdDocument(payload: {
        jd_text?: string;
        jd_file?: Express.Multer.File;
    }): Promise<ParsedAnalysisDocument> {
        if (payload.jd_text?.trim()) {
            return this.buildRawTextDocument('jd', payload.jd_text);
        }

        if (payload.jd_file) {
            return this.parseUploadedDocument(payload.jd_file, 'jd');
        }

        throw new BadRequestException(
            'Không tìm thấy dữ liệu JD để phân tích.',
        );
    }
    async callAIApiResult(
        aiRunId: string,
        cvDocument: ParsedAnalysisDocument,
        jdDocument: ParsedAnalysisDocument,
    ) {
        const apiKey = this.configService.get<string>(
            'GEMINI_API_KEY',
        ) as string;
        const model = this.configService.get<string>('AI_MODEL') as string;
        const provider = this.configService.get<string>(
            'AI_PROVIDER',
        ) as string;
        if (provider !== 'gemini') {
            throw new InternalServerErrorException(
                `AI_PROVIDER không hỗ trợ: ${provider}`,
            );
        }
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = CV_JD_ANALYSIS_SYSTEM_PROMPT;
        const userPrompt = buildCvJdAnalysisUserPrompt({
            cvMarkdown: cvDocument.contentMarkdown,
            jdMarkdown: jdDocument.contentMarkdown,
        });
        const responseSchema = CV_JD_ANALYSIS_JSON_SCHEMA;
        try {
            const response = await ai.models.generateContent({
                model,
                contents: userPrompt,
                config: {
                    systemInstruction: systemPrompt,
                    responseMimeType: 'application/json',
                    responseJsonSchema: responseSchema,
                },
            });

            const text = response.text;

            if (!text) {
                await this.aiRunsService.updateAiRun(aiRunId, {
                    status: ai_run_status.FAILED,
                    error_message: 'Gemini không trả về nội dung phân tích.',
                });
                throw new InternalServerErrorException(
                    'Gemini không trả về nội dung phân tích.',
                );
            }

            const parsed = JSON.parse(text) as Record<string, any>;

            return {
                model,
                rawText: text,
                parsed,
                usageMetadata: response.usageMetadata ?? null,
            };
        } catch (error) {
            console.error('callAIApiResult error:', error);
            await this.aiRunsService.updateAiRun(aiRunId, {
                status: ai_run_status.FAILED,
                error_message: 'Không thể gọi Gemini để phân tích CV và JD.',
            });
            throw new InternalServerErrorException(
                'Không thể gọi Gemini để phân tích CV và JD.',
            );
        }
    }
    async AnalyzeResults(
        user_id: string,
        {
            cv_id,
            jd_text,
            cv_file,
            jd_file,
        }: {
            cv_id?: string;
            jd_text?: string;
            cv_file?: Express.Multer.File;
            jd_file?: Express.Multer.File;
        },
    ) {
        const quotaLimit =
            await this.usageQuotasService.getUsageQuotaByUserId(user_id);

        if (
            quotaLimit &&
            quotaLimit.quota.dataValues.ai_runs_used >=
                quotaLimit.quota.dataValues.ai_runs_limit
        ) {
            throw new BadRequestException(
                'Bạn đã đạt đến giới hạn phân tích AI của mình. Vui lòng nâng cấp gói của bạn để tiếp tục sử dụng dịch vụ.',
            );
        }

        const [cvDocument, jdDocument] = await Promise.all([
            this.resolveCvDocument(user_id, { cv_id, cv_file }),
            this.resolveJdDocument({ jd_text, jd_file }),
        ]);
        const cvName =
            this.getBaseFileName(cvDocument.fileName) ??
            this.normalizeAiRunLabel(cvDocument.fileName);
        const jobTitle =
            this.extractJobTitleFromJdText(jd_text) ??
            this.getBaseFileName(jdDocument.fileName) ??
            this.normalizeAiRunLabel(jdDocument.fileName);
        // cập nhật trạng thái đang chờ sử lý ai
        const aiRun = await this.aiRunsService.createAiRun({
            user_id,
            status: ai_run_status.RUNNING,
            cv_id: cv_id as string,
            cv_name: cvName,
            job_title: jobTitle,
        });
        const result = await this.callAIApiResult(
            aiRun.dataValues.id,
            cvDocument,
            jdDocument,
        );
        // cập nhật trạng thái sau khi xử lý ai
        const payload = {
            model:
                result.model ??
                this.configService.get<string>('AI_MODEL') ??
                null,
            completion_tokens:
                result.usageMetadata?.candidatesTokenCount ?? undefined,
            prompt_tokens: result.usageMetadata?.promptTokenCount ?? undefined,
            status: ai_run_status.SUCCESS,
            finished_at: new Date(),
        };
        if (cvName) {
            payload['cv_name'] = cvName;
        }
        if (jobTitle) {
            payload['job_title'] = jobTitle;
        }
        if (cv_id && cv_id !== '' && cv_id !== null && cv_id !== undefined) {
            payload['cv_id'] = cv_id;
        }
        await this.aiRunsService.updateAiRun(aiRun.dataValues.id, payload);
        await this.aiResultsService.create({
            ai_run_id: aiRun.dataValues.id,
            ...result.parsed,
        });
        await this.usageQuotasService.increaseUsage(
            user_id,
            quotaLimit.quota.dataValues.id,
            'ai_runs_used',
        );
        return {
            data: {
                detailAnalyze: aiRun.dataValues.id,
            },
        };
    }

    async getAnalysisResult(user_id: string, ai_run_id: string) {
        // kiểm tra người dùng là free hay premium
        const quotaLimit =
            await this.usageQuotasService.getUsageQuotaByUserId(user_id);

        const aiRun = await this.aiRunsService.getAiRunById(ai_run_id, user_id);
        const result = await this.aiResultsService.getAiResultByAiRunId(
            aiRun.dataValues.id,
            quotaLimit?.plan?.dataValues.view_full_ai_analysis ?? false,
            quotaLimit?.plan?.dataValues.name ?? 'free',
        );
        return {
            data: result,
        };
    }
    async getAnalysisResults(user_id: string, limit: number, page: number) {
        return this.aiRunsService.getAiRuns(user_id, page, limit);
    }
    async getAllAnalysisByUserId(
        user_id: string,
        queryAnalyzeDto: QueryAnalyzeDto,
    ) {
        const { range, limit, page, search, sort_by, sort_order, from, to } =
            queryAnalyzeDto;
        const { fromDate, toExclusive } = DateRangeUtil.getDateRange(
            from,
            to,
            range as QueryRange,
        );
        return this.aiRunsService.getAllAiRunByUserID(
            user_id,
            limit,
            page,
            search,
            sort_by,
            sort_order,
            fromDate,
            toExclusive,
        );
    }
}

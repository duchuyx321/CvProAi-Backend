/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Cvs } from '~/models';
import { CreateCVSDto, CVContent } from './dto/create-cvs.dto';
import { Helper } from '~/utils/helpers';
import { CloudinaryService } from '~/modules/cloudinary/cloudinary.service';
import { UpdateCVSDto } from './dto/update-cvs.dto';
import { CvTemplatesService } from '~/modules/cv_templates/cv_templates.service';
import { merge } from 'lodash';
import { ExportCvsDto } from './dto/export-cvs.dto';
import puppeteer from 'puppeteer';
import { UsageQuotasService } from '~/modules/usage-quotas/usage-quotas.service';
import { CvVersionService } from '../cv-version/cv-version.service';
import { CvExportService } from '../cv-export/cv-export.service';
import { CreateVersionDto } from '../cv-version/dto/create-version.dto';
import { CreateExportDto } from '../cv-export/dto/create-export.dto';
import { export_format } from '~/models/cv_exports.model';
import { Op, Transaction } from 'sequelize';
import { cv_status } from '~/models/cvs.model';
import { AiRunsService } from '../ai-runs/ai-runs.service';

@Injectable()
export class CvsService {
    private readonly footerWatermarkRegex =
        /<div\b[^>]*data-cvproai-watermark=(['"])footer\1[^>]*>[\s\S]*?<\/div>/gi;

    constructor(
        @InjectModel(Cvs) private readonly CvsModule: typeof Cvs,
        private readonly cloudinaryService: CloudinaryService,
        private readonly cvTemplatesService: CvTemplatesService,
        private readonly usageQuotasService: UsageQuotasService,
        private readonly cvVersionsService: CvVersionService,
        private readonly cvExportService: CvExportService,
        private readonly aiRunsService: AiRunsService,
        private readonly sequelize: Sequelize,
    ) {}

    private buildFooterWatermark(isVisible: boolean) {
        return `<div data-cvproai-watermark="footer" data-visible="${isVisible ? 'true' : 'false'}">© CvProAI.vn</div>`;
    }

    private syncFooterWatermark(htmlText: string, isVisible: boolean) {
        const watermark = this.buildFooterWatermark(isVisible);
        const normalizedHtml = htmlText
            .replace(this.footerWatermarkRegex, '')
            .trim();

        return `${normalizedHtml}${watermark}`;
    }

    async getAllCVMe(
        user_id: string,
        limit: number,
        page: number,
        search?: string,
        sort_by: 'created_at' | 'updated_at' | 'title' = 'updated_at',
        sort_order: 'ASC' | 'DESC' = 'DESC',
        is_trash: boolean = false,
    ) {
        const offset = (page - 1) * limit;
        const where: any = { user_id };
        if (search?.trim()) {
            where.title = { [Op.iLike]: `%${search.trim()}%` };
        }
        if (is_trash) {
            where.status = cv_status.DELETED;
        } else {
            where.status = {
                [Op.ne]: cv_status.DELETED,
            };
        }
        const { rows, count } = await this.CvsModule.findAndCountAll({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            where,
            attributes: {
                exclude: ['content', 'custom_config'],
            },
            order: [[sort_by, sort_order]],
            limit,
            offset,
        });
        return {
            message: 'Lấy danh sách CV thành công',
            data: rows,
            meta: {
                page,
                limit,
                total_items: count,
                total_pages: Math.ceil(count / limit),
            },
        };
    }
    async getCvMeByID(
        user_id: string,
        cv_id: string,
        is_trash: boolean = false,
    ) {
        const where: any = { user_id, id: cv_id };
        if (is_trash) {
            where.status = cv_status.DELETED;
        } else {
            where.status = {
                [Op.ne]: cv_status.DELETED,
            };
        }
        const alreadyExist = await this.CvsModule.findOne({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            where,
        });
        if (!alreadyExist) {
            throw new NotFoundException('Không tìm thấy cv này.');
        }
        return {
            message: 'Lấy dữ liệu CV thành công.',
            data: alreadyExist,
        };
    }
    async getCvMeSlug(
        user_id: string,
        slug: string,
        isAlreadyExist: boolean = false,
    ) {
        const alreadyExist = await this.CvsModule.findOne({
            where: { user_id, slug },
        });
        if (!alreadyExist && !isAlreadyExist) {
            throw new NotFoundException('Không tìm thấy cv này.');
        }

        // 1. Lấy Template gốc
        const cvData = alreadyExist?.get({ plain: true });

        const cvTemplate = await this.cvTemplatesService.getTemplateByID(
            cvData?.template_id as string,
        );

        const baseConfig =
            cvTemplate?.data?.dataValues?.config ??
            cvTemplate?.data?.config ??
            {};
        const customConfig = cvData?.custom_config ?? {};
        const finalConfig = merge({}, baseConfig, customConfig);

        // 4. Xóa custom_config gốc đi vì nó đã được "hòa tan" vào finalConfig
        delete cvData?.custom_config;

        return {
            message: 'Lấy dữ liệu CV thành công.',
            data: {
                ...cvData,
                config: finalConfig, // Trả về config hoàn chỉnh cho Frontend
            },
        };
    }
    async findOneBySlug(user_id: string, slug: string) {
        return await this.CvsModule.findOne({
            where: { slug, user_id },
        });
    }
    async getCountCvs(template_id: string) {
        return await this.CvsModule.count({
            where: { template_id },
        });
    }
    async AdminCountCvs(fromDate: Date, toDate: Date) {
        const durationMs = toDate.getTime() - fromDate.getTime();
        const previousFromDate = new Date(fromDate.getTime() - durationMs);
        const previousToExclusive = fromDate;

        const currentDateWhere = {
            [Op.gte]: fromDate,
            [Op.lt]: toDate,
        };

        const previousDateWhere = {
            [Op.gte]: previousFromDate,
            [Op.lt]: previousToExclusive,
        };
        const [currentCvs, previousCvs] = await Promise.all([
            this.CvsModule.count({
                where: {
                    createdAt: currentDateWhere,
                },
            }),
            this.CvsModule.count({
                where: {
                    createdAt: previousDateWhere,
                },
            }),
        ]);
        const growth_percent = Helper.calculateGrowthPercent(
            currentCvs,
            previousCvs,
        );
        return {
            value: currentCvs,
            growth_percent,
        };
    }
    getFilesToDelete = (cv: CreateCVSDto | UpdateCVSDto): string[] => {
        const files: string[] = [];
        const avatarUrl = cv?.content?.profile_header?.avatar_url;
        const previewUrl = cv?.preview_url;

        if (avatarUrl) files.push(avatarUrl);
        if (previewUrl) files.push(previewUrl);

        return files;
    };
    async addCv(user_id: string, createCVSDto: CreateCVSDto) {
        try {
            const quotaLimit =
                await this.usageQuotasService.getUsageQuotaByUserId(user_id);
            if (
                quotaLimit.quota.dataValues.exports_used >=
                quotaLimit.quota.dataValues.exports_limit
            ) {
                throw new BadRequestException('Bạn đã hết tạo CV.');
            }
            const slug = Helper.makeSlugFromString(createCVSDto.title);
            const alreadyExists = await this.findOneBySlug(user_id, slug);
            if (alreadyExists) {
                const files = this.getFilesToDelete(createCVSDto);
                if (files.length > 0) {
                    await this.cloudinaryService.deleteMultiple(files);
                }
                throw new BadRequestException('tiêu đề này đã tồn tại.');
            }
            // tăng increase usage quota
            await this.usageQuotasService.increaseUsage(
                user_id,
                quotaLimit.quota.dataValues.id,
                'cvs_used',
            );
            await this.CvsModule.create({ user_id, ...createCVSDto } as any);
            return {
                message: 'Lưu cv thành công',
                data: { slug },
            };
        } catch (error) {
            console.log(error);
            const files = this.getFilesToDelete(createCVSDto);
            if (files.length > 0) {
                await this.cloudinaryService.deleteMultiple(files);
            }
            throw new BadRequestException('Lưu Cv thất bại');
        }
    }
    async editCv(user_id: string, cv_id: string, updateCVSDto: UpdateCVSDto) {
        try {
            const cv = await this.getCvMeByID(user_id, cv_id);
            if (updateCVSDto?.title) {
                const slug = Helper.makeSlugFromString(updateCVSDto?.title);
                const alreadyExists = await this.getCvMeSlug(
                    user_id,
                    slug,
                    true,
                );
                if (alreadyExists?.data) {
                    const files = this.getFilesToDelete(updateCVSDto);
                    if (files.length > 0) {
                        await this.cloudinaryService.deleteMultiple(files);
                    }
                    throw new BadRequestException('tiêu đề này đã tồn tại.');
                }
            }
            const plainCv = cv.data.get({ plain: true });
            const oldCustomConfig = plainCv.custom_config ?? {};
            const hasNewCustomConfig =
                updateCVSDto.custom_config &&
                Object.keys(updateCVSDto.custom_config).length > 0;
            const nextCustomConfig = hasNewCustomConfig
                ? merge({}, oldCustomConfig, updateCVSDto.custom_config)
                : oldCustomConfig;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { custom_config, ...rest } = updateCVSDto;
            const payload: any = { ...rest };
            if (hasNewCustomConfig) {
                payload['custom_config'] = nextCustomConfig;
            }
            const updated = await this.CvsModule.update(payload, {
                where: {
                    user_id,
                    id: cv_id,
                },
            });
            if (updated[0] === 0) {
                const files = this.getFilesToDelete(updateCVSDto);
                if (files.length > 0) {
                    await this.cloudinaryService.deleteMultiple(files);
                }
                throw new BadRequestException('Chỉnh sửa cv không thành công.');
            }
            return {
                message: 'Lưu cv thành công',
            };
        } catch (error) {
            console.log(error);
            const files = this.getFilesToDelete(updateCVSDto);
            if (files.length > 0) {
                await this.cloudinaryService.deleteMultiple(files);
            }
            throw new BadRequestException('Lưu Cv thất bại');
        }
    }

    async exportCv(cvID: string, user_id: string, exportCvsDto: ExportCvsDto) {
        const cv = await this.getCvMeByID(user_id, cvID);
        // check asage-quota người dùng còn đủ không
        const quotaLimit =
            await this.usageQuotasService.getUsageQuotaByUserId(user_id);
        if (
            quotaLimit.quota.dataValues.exports_used >=
            quotaLimit.quota.dataValues.exports_limit
        ) {
            throw new BadRequestException('Bạn đã hết lượt xuất file.');
        }
        const canRemoveWatermark = Boolean(quotaLimit.plan?.remove_watermark);
        const htmlWithWatermark = this.syncFooterWatermark(
            exportCvsDto.htmlText,
            !canRemoveWatermark,
        );
        const resultText = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>CvProAI</title><style>${exportCvsDto.cssText}</style></head><body>${htmlWithWatermark}</body></html>`;
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        try {
            const page = await browser.newPage();

            await page.setContent(resultText, {
                waitUntil: 'networkidle0',
            });

            await page.emulateMediaType('screen');

            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0',
                    right: '0',
                    bottom: '0',
                    left: '0',
                },
            });
            // gửi lên cloudinary
            const uploadCloudinary: any =
                await this.cloudinaryService.uploadFile({
                    buffer: Buffer.from(pdf),
                    originalname: `${cv.data.dataValues.slug || 'cv'}.pdf`,
                } as Express.Multer.File);
            // lưu vào version
            await this.cvVersionsService.createVersion({
                cv_id: cvID,
                created_by: user_id,
                content: cv.data.dataValues.content as CVContent,
                custom_config: cv.data.dataValues.custom_config ?? {},
            } as CreateVersionDto);
            // lưu vòa export history
            await this.cvExportService.addExport({
                created_by: user_id,
                cv_id: cvID,
                format: export_format.PDF,
                file_url: uploadCloudinary['url'] as string,
                html_content: exportCvsDto.htmlText,
                css_content: exportCvsDto.cssText,
            } as CreateExportDto);
            // tăng increase usage quota
            await this.usageQuotasService.increaseUsage(
                user_id,
                quotaLimit.quota.dataValues.id,
                'exports_used',
            );
            return {
                buffer: Buffer.from(pdf),
                fileName: `${cv.data.dataValues.slug || 'cv'}.pdf`,
            };
        } finally {
            await browser.close();
        }
    }
    async restoreCvMe(user_id: string, cv_id: string) {
        const cv = await this.getCvMeByID(user_id, cv_id, true);

        await cv.data.update({
            status: cv_status.DRAFT,
        });

        return {
            message: 'Đã khôi phục cv thành công.',
        };
    }
    async deleteCvMe(user_id: string, cv_id: string) {
        const cv = await this.getCvMeByID(user_id, cv_id);

        await cv.data.update({
            status: cv_status.DELETED,
        });

        return {
            message: 'Đã chuyển CV vào thùng rác',
        };
    }
    async destroyCvMe(user_id: string, cv_id: string) {
        const cv = await this.getCvMeByID(user_id, cv_id, true);

        return this.sequelize.transaction(
            async (transaction: Transaction): Promise<{ message: string }> => {
                await this.aiRunsService.destroyByCvId(cv_id, transaction);
                await this.cvExportService.destroyByCvId(cv_id, transaction);
                await this.cvVersionsService.destroyByCvId(cv_id, transaction);

                await cv.data.destroy({ transaction });

                return {
                    message: 'Đã xóa vĩnh viễn CV',
                };
            },
        );
    }
}

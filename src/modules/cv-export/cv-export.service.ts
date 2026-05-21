/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cv_exports, Cv_versions, Cvs } from '~/models';
import { CreateExportDto } from './dto/create-export.dto';
import { Op, Transaction } from 'sequelize';
import { Helper } from '~/utils/helpers';
import puppeteer from 'puppeteer';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class CvExportService {
    constructor(
        @InjectModel(Cv_exports) private cvExportModel: typeof Cv_exports,
        private readonly cloudinaryService: CloudinaryService,
    ) {}
    async addExport(createExportDto: CreateExportDto) {
        return await this.cvExportModel.create(createExportDto as any);
    }
    async countCvExportUserID(user_id: string) {
        return this.cvExportModel.count({ where: { created_by: user_id } });
    }
    async getExportByUserID(
        user_id: string,
        limit: number,
        page: number,
        search?: string,
        sort_by: 'createdAt' | 'updatedAt' | 'title' = 'updatedAt',
        sort_order: 'ASC' | 'DESC' = 'DESC',
        fromDate?: Date,
        toDate?: Date,
    ) {
        const offset = (page - 1) * limit;
        const where: any = { created_by: user_id };
        if (search?.trim()) {
            where[Op.or] = [
                {
                    cv_name: {
                        [Op.iLike]: `%${search.trim()}%`,
                    },
                },
                {
                    '$cv.title$': {
                        [Op.iLike]: `%${search.trim()}%`,
                    },
                },
                {
                    '$cv.slug$': {
                        [Op.iLike]: `%${search.trim()}%`,
                    },
                },
            ];
        }
        if (fromDate && toDate) {
            where.createdAt = {
                [Op.gte]: fromDate,
                [Op.lt]: toDate,
            };
        }
        const { count, rows } = await this.cvExportModel.findAndCountAll({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            where,
            include: [
                {
                    model: Cvs,
                    as: 'cv',
                    attributes: ['id', 'title', 'slug'],
                    required: !!search,
                },
                {
                    model: Cv_versions,
                    as: 'cv_version',
                    attributes: ['id', 'version_no'],
                    required: false,
                },
            ],
            attributes: ['id', 'cv_id', 'version_id', 'createdAt', 'updatedAt'],
            limit,
            offset,
            distinct: true,
            subQuery: false,
            order: [[sort_by, sort_order]],
        });
        return {
            data: {
                data: rows,
                meta: {
                    page,
                    limit,
                    total_items: count,
                    total_pages: Math.ceil(count / limit),
                },
            },
        };
    }
    async destroyByCvId(cv_id: string, transaction?: Transaction) {
        await this.cvExportModel.destroy({
            where: { cv_id },
            transaction,
        });
    }

    async AdminCountExport(fromDate: Date, toDate: Date) {
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
        const [currentCvExport, previousCvExport] = await Promise.all([
            this.cvExportModel.count({
                where: {
                    createdAt: currentDateWhere,
                },
            }),
            this.cvExportModel.count({
                where: {
                    createdAt: previousDateWhere,
                },
            }),
        ]);
        const growth_percent = Helper.calculateGrowthPercent(
            currentCvExport,
            previousCvExport,
        );
        return {
            value: currentCvExport,
            growth_percent,
        };
    }
    async download(user_id: string, id: string) {
        const cvExport = await this.cvExportModel.findOne({
            where: {
                created_by: user_id,
                id,
            },
        });
        if (!cvExport) {
            throw new NotFoundException('Không tìm thấy phiên bản export');
        }

        const plain = cvExport.get({ plain: true }) as {
            id: string;
            file_url: string;
            html_content?: string;
            css_content?: string;
        };

        // 1. Nếu có file_url, kiểm tra Cloudinary còn file không
        let finalUrl: string | null = null;
        if (plain.file_url) {
            const exists = await this.cloudinaryService.checkFileExists(
                plain.file_url,
            );
            if (exists) {
                finalUrl = plain.file_url;
            }
        }

        // 2. Nếu không có URL hợp lệ, thử regenerate từ HTML/CSS
        if (!finalUrl) {
            if (!plain.html_content || !plain.css_content) {
                throw new NotFoundException(
                    'File không còn tồn tại và không thể khôi phục. Vui lòng xuất lại CV.',
                );
            }

            const resultText = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>CvProAI</title><style>${plain.css_content}</style></head><body>${plain.html_content}</body></html>`;
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
                    margin: { top: '0', right: '0', bottom: '0', left: '0' },
                });

                // Upload lại lên Cloudinary
                const uploadResult: any =
                    await this.cloudinaryService.uploadFile({
                        buffer: Buffer.from(pdf),
                        originalname: 'cv.pdf',
                    } as Express.Multer.File);

                finalUrl = uploadResult['url'] as string;

                // Cập nhật file_url mới vào DB
                await this.cvExportModel.update(
                    { file_url: finalUrl },
                    { where: { id: plain.id } },
                );
            } finally {
                await browser.close();
            }
        }

        // 3. Trả về URL để controller xử lý
        return { url: finalUrl };
    }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cv_exports, Cv_versions, Cvs } from '~/models';
import { CreateExportDto } from './dto/create-export.dto';
import { Op, Transaction } from 'sequelize';
import { Helper } from '~/utils/helpers';

@Injectable()
export class CvExportService {
    constructor(
        @InjectModel(Cv_exports) private cvExportModel: typeof Cv_exports,
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
        const where: Record<string, any> = { created_by: user_id };
        if (search?.trim()) {
            where.cv_name = {
                [Op.iLike]: `%${search.trim()}%`,
            };
        }
        if (fromDate && toDate) {
            where.createdAt = {
                [Op.gte]: fromDate,
                [Op.lt]: toDate,
            };
        }
        const { count, rows } = await this.cvExportModel.findAndCountAll({
            where,
            include: [
                {
                    model: Cvs,
                    as: 'cv',
                    attributes: ['id', 'title', 'slug'],
                    required: !!search,
                    where: search
                        ? {
                              [Op.or]: [
                                  {
                                      title: {
                                          [Op.iLike]: `%${search}%`,
                                      },
                                  },
                                  {
                                      slug: {
                                          [Op.iLike]: `%${search}%`,
                                      },
                                  },
                              ],
                          }
                        : undefined,
                },
                {
                    model: Cv_versions,
                    as: 'version',
                    attributes: ['id', 'version_no'],
                    required: false,
                },
            ],
            attributes: ['id', 'cv_id', 'version_id', 'createdAt', 'updatedAt'],
            limit,
            offset,
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
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cv_exports } from '~/models';
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

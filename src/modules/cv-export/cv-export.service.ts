import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cv_exports } from '~/models';
import { CreateExportDto } from './dto/create-export.dto';
import { Transaction } from 'sequelize';

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
}

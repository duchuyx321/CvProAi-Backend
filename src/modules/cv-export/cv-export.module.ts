import { Module } from '@nestjs/common';
import { CvExportService } from './cv-export.service';
import { CvExportController } from './cv-export.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Cv_exports } from '~/models';

@Module({
    imports: [SequelizeModule.forFeature([Cv_exports])],
    controllers: [CvExportController],
    providers: [CvExportService],
    exports: [CvExportService],
})
export class CvExportModule {}

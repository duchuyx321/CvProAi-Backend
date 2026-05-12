import { Module } from '@nestjs/common';
import { CvExportService } from './cv-export.service';
import { CvExportController } from './cv-export.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Cv_exports, Cv_versions, Cvs } from '~/models';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
    imports: [
        SequelizeModule.forFeature([Cv_exports, Cvs, Cv_versions]),
        CloudinaryModule,
    ],
    controllers: [CvExportController],
    providers: [CvExportService],
    exports: [CvExportService],
})
export class CvExportModule {}

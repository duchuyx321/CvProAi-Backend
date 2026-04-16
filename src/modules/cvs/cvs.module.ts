import { Module } from '@nestjs/common';
import { CvsService } from './cvs.service';
import { CvsController } from './cvs.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Cvs, Cv_versions } from '~/models';
import { AuthModule } from '~/modules/auth/auth.module';
import { CloudinaryModule } from '~/modules/cloudinary/cloudinary.module';
import { CvTemplatesModule } from '~/modules/cv_templates/cv_templates.module';
import { UsageQuotasModule } from '~/modules/usage-quotas/usage-quotas.module';
import { CvVersionModule } from '../cv-version/cv-version.module';
import { CvExportModule } from '../cv-export/cv-export.module';

@Module({
    imports: [
        SequelizeModule.forFeature([Cvs, Cv_versions]),
        AuthModule,
        CvTemplatesModule,
        CloudinaryModule,
        UsageQuotasModule,
        CvVersionModule,
        CvExportModule,
    ],
    controllers: [CvsController],
    providers: [CvsService],
    exports: [CvsService],
})
export class CvsModule {}

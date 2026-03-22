import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Cv_templates } from '~/models';
import { CvTemplatesService } from './cv_templates.service';
import { CvTemplatesController } from './cv_templates.controller';

@Module({
    imports: [SequelizeModule.forFeature([Cv_templates])],
    controllers: [CvTemplatesController],
    providers: [CvTemplatesService],
})
export class CvTemplatesModule {}

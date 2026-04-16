import { Module } from '@nestjs/common';
import { CvVersionService } from './cv-version.service';
import { CvVersionController } from './cv-version.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Cv_versions } from '~/models';

@Module({
    imports: [SequelizeModule.forFeature([Cv_versions])],
    controllers: [CvVersionController],
    providers: [CvVersionService],
    exports: [CvVersionService],
})
export class CvVersionModule {}

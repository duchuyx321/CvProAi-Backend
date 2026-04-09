import { Module } from '@nestjs/common';
import { CvsService } from './cvs.service';
import { CvsController } from './cvs.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Cvs } from '~/models';
import { AuthModule } from '~/modules/auth/auth.module';
import { CloudinaryModule } from '~/modules/cloudinary/cloudinary.module';
import { CvTemplatesModule } from '~/modules/cv_templates/cv_templates.module';

@Module({
    imports: [
        SequelizeModule.forFeature([Cvs]),
        AuthModule,
        CvTemplatesModule,
        CloudinaryModule,
    ],
    controllers: [CvsController],
    providers: [CvsService],
})
export class CvsModule {}

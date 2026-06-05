import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Cv_templates } from '~/models';
import { CvTemplatesService } from './cv_templates.service';
import { CvTemplatesController } from './cv_templates.controller';
import { AuthModule } from '~/modules/auth/auth.module';
import { CloudinaryModule } from '~/modules/cloudinary/cloudinary.module';

@Module({
    imports: [
        SequelizeModule.forFeature([Cv_templates]),
        forwardRef(() => AuthModule),
        CloudinaryModule,
    ],
    controllers: [CvTemplatesController],
    providers: [CvTemplatesService],
    exports: [CvTemplatesService],
})
export class CvTemplatesModule {}

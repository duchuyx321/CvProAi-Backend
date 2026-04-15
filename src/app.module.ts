import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule, SequelizeModuleOptions } from '@nestjs/sequelize';
import { sequelizeConfig } from '~/config/sequelize.config';
import { PlansModule } from '~/modules/plans/plans.module';
import { UsersModule } from '~/modules/users/users.module';
import { AuthModule } from '~/modules/auth/auth.module';
import { CvTemplatesModule } from '~/modules/cv_templates/cv_templates.module';

import { AuthTokenModule } from '~/modules/auth-token/auth-token.module';
import { CloudinaryModule } from '~/modules/cloudinary/cloudinary.module';
import { CvsModule } from '~/modules/cvs/cvs.module';
// import { UserProfileModule } from '~/modules/user_profile/user_profile.module';
import { UsageQuotasModule } from './modules/usage-quotas/usage-quotas.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { CvExportModule } from './modules/cv-export/cv-export.module';
import { CvVersionModule } from './modules/cv-version/cv-version.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.development.local',
        }),
        SequelizeModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (
                configService: ConfigService,
            ): SequelizeModuleOptions => sequelizeConfig(configService),
        }),
        PlansModule,
        UsersModule,
        AuthModule,
        CvTemplatesModule,
        AuthTokenModule,
        CloudinaryModule,
        CvsModule,
        UsageQuotasModule,
        SubscriptionsModule,
        CvExportModule,
        CvVersionModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}

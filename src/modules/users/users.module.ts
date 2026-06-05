import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import {
    Plans,
    Subscriptions,
    Usage_quotas,
    User_profile,
    Users,
} from '~/models';
import { AuthModule } from '../auth/auth.module';
import { UsageQuotasModule } from '../usage-quotas/usage-quotas.module';
import { CvExportModule } from '../cv-export/cv-export.module';
import { CvsModule } from '../cvs/cvs.module';

@Module({
    imports: [
        SequelizeModule.forFeature([
            Users,
            User_profile,
            Usage_quotas,
            Plans,
            Subscriptions,
        ]),
        forwardRef(() => AuthModule),
        UsageQuotasModule,
        CvExportModule,
        CvsModule,
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule {}

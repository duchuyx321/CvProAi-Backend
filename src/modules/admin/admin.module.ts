import { Module } from '@nestjs/common';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';
import { AdminCvTemplatesController } from './cv-templates/admin-cv-templates.controller';
import { AdminCvTemplatesService } from './cv-templates/admin-cv-templates.service';
import { AdminPlansController } from './plans/admin-plans.controller';
import { AdminPlansService } from './plans/admin-plans.service';
import { PlansModule } from '~/modules/plans/plans.module';
import { SubscriptionsModule } from '~/modules/subscriptions/subscriptions.module';
import { PaymentsModule } from '~/modules/payments/payments.module';
import { UsersModule } from '~/modules/users/users.module';
import { CloudinaryModule } from '~/modules/cloudinary/cloudinary.module';
import { CvsModule } from '~/modules/cvs/cvs.module';
import { CvTemplatesModule } from '~/modules/cv_templates/cv_templates.module';
import { UserProfileModule } from '~/modules/user_profile/user_profile.module';

@Module({
    imports: [
        PlansModule,
        SubscriptionsModule,
        PaymentsModule,
        UsersModule,
        UserProfileModule,
        CloudinaryModule,
        CvTemplatesModule,
        CvsModule,
    ],
    controllers: [
        AdminUsersController,
        AdminCvTemplatesController,
        AdminPlansController,
    ],
    providers: [AdminUsersService, AdminCvTemplatesService, AdminPlansService],
})
export class AdminModule {}

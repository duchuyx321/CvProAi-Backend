import { Module } from '@nestjs/common';
import { UserProfileService } from './user_profile.service';
import { UserProfileController } from './user_profile.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User_profile } from '~/models';
import { AuthModule } from '~/modules/auth/auth.module';
import { UsersModule } from '~/modules/users/users.module';
import { CloudinaryModule } from '~/modules/cloudinary/cloudinary.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
    imports: [
        AuthModule,
        UsersModule,
        CloudinaryModule,
        SequelizeModule.forFeature([User_profile]),
        SubscriptionsModule,
    ],
    controllers: [UserProfileController],
    providers: [UserProfileService],
    exports: [UserProfileService],
})
export class UserProfileModule {}

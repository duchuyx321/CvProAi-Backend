import { Module } from '@nestjs/common';
import { UserProfileService } from './user_profile.service';
import { UserProfileController } from './user_profile.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User_profile } from '~/models';
import { AuthModule } from '~/modules/auth/auth.module';
import { UsersModule } from '~/modules/users/users.module';

@Module({
    imports: [
        AuthModule,
        UsersModule,
        SequelizeModule.forFeature([User_profile]),
    ],
    controllers: [UserProfileController],
    providers: [UserProfileService],
})
export class UserProfileModule {}

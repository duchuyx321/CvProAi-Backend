import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { User_profile } from '~/models/user_profile.model';
import { UsersService } from '~/modules/users/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePassDto } from './dto/change-pass.dto';
import { Helper } from '~/utils/helpers';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class UserProfileService {
    constructor(
        @InjectModel(User_profile)
        private readonly userProfileModel: typeof User_profile,
        private readonly userService: UsersService,
        private readonly subscriptionsService: SubscriptionsService,
    ) {}

    async getMyProfile({ user_id, role }) {
        const alreadyExist = await this.userService.findById(user_id, role);
        const planUser = alreadyExist.getUserWithoutPassword();
        // lấy profile
        const profile = await this.userProfileModel.findOne({
            where: { user_id: user_id as string },
            attributes: {
                exclude: ['user_id', 'createdAt', 'updatedAt'],
            },
        });
        const sub = await this.subscriptionsService.getSubscriptionsByUserID(
            planUser.id,
        );
        return {
            message: 'Lấy profile thành công.',
            data: {
                email: planUser.email,
                full_name: planUser.full_name,
                role: planUser.role,
                profile,
                planCurrent: sub.plan,
                last_login_at: planUser.last_login_at,
                createdAt: planUser.createdAt as Date,
                updatedAt: planUser.updatedAt as Date,
            },
        };
    }
    async updateProfile({ user_id }, updateProfileDto: UpdateProfileDto) {
        const { full_name, ...rest } = updateProfileDto;
        const isOneField = Object.values(rest).some((value) => {
            if (value === undefined || value === null) return false;
            if (typeof value === 'string') return value.trim() !== '';
            return true;
        });
        const hasFullName =
            typeof full_name === 'string' && full_name.trim() !== '';
        if (!isOneField && !hasFullName)
            throw new BadRequestException('Không có dữ liệu để cập nhật');

        const alreadyExist = await this.userProfileModel.findOne({
            where: {
                user_id: user_id as string,
            },
        });

        if (!alreadyExist && isOneField) {
            await this.userProfileModel.create({
                user_id: user_id as string,
                ...rest,
            } as any);
        } else if (hasFullName) {
            await this.userService.updateFullName(user_id, full_name);
        } else {
            const updated = await this.userProfileModel.update(rest as any, {
                where: { user_id: user_id as string },
            });
            if (updated[0] === 0) {
                throw new NotFoundException(
                    'Cập nhật tên người dùng thất bại.',
                );
            }
        }
        return {
            message: 'Cập nhật thông tin cá nhân thành công.',
        };
    }
    async changePassword({ user_id, role }, changePasswordDto: ChangePassDto) {
        if (changePasswordDto.password === changePasswordDto.newPass)
            throw new BadRequestException(
                'Mật khẩu mới không được trùng với mật khẩu cũ',
            );
        const alreadyExist = await this.userService.findById(user_id, role);
        const isMatchingOldPass = alreadyExist.comparePassword(
            changePasswordDto.password,
        );
        if (!isMatchingOldPass)
            throw new BadRequestException('Mật khẩu không chính xác.');

        if (changePasswordDto.newPass !== changePasswordDto.repeatPass)
            throw new BadRequestException(
                'Xác thực mật khẩu không thành công.',
            );

        const pass_hash = Helper.hashValue(changePasswordDto.newPass);
        await this.userService.updatePassword(user_id, pass_hash);
        return { message: 'Thay đổi mật khẩu thành công.' };
    }
}

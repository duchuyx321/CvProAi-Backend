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

@Injectable()
export class UserProfileService {
    constructor(
        @InjectModel(User_profile)
        private readonly userProfileModel: typeof User_profile,
        private readonly userService: UsersService,
    ) {}

    async getMyProfile({ uid, role }) {
        const alreadyExist = await this.userService.findById(uid, role);
        const planUser = alreadyExist.getUserWithoutPassword();
        // lấy profile
        const profile = await this.userProfileModel.findOne({
            where: { user_id: uid as string },
            attributes: ['user_id', 'createdAt', 'updatedAt'],
        });
        return {
            message: 'Lấy profile thành công.',
            data: {
                email: planUser.email,
                full_name: planUser.full_name,
                profile,
                last_login_at: planUser.last_login_at,
                createdAt: planUser.createdAt as Date,
                updatedAt: planUser.updatedAt as Date,
            },
        };
    }
    async updateProfile({ uid }, updateProfileDto: UpdateProfileDto) {
        const { fullName, ...rest } = updateProfileDto;
        const isOneField = Object.values(rest).some((value) => {
            if (value === undefined || value === null) return false;
            if (typeof value === 'string') return value.trim() !== '';
            return true;
        });
        const hasFullName =
            typeof fullName === 'string' && fullName.trim() !== '';
        if (!isOneField && !hasFullName)
            throw new BadRequestException('Không có dữ liệu để cập nhật');

        const alreadyExist = await this.userProfileModel.findOne({
            where: {
                user_id: uid as string,
            },
        });

        if (!alreadyExist && isOneField) {
            await this.userProfileModel.create({
                user_id: uid as string,
                ...rest,
            } as any);
        } else if (hasFullName) {
            await this.userService.updateFullName(uid, fullName);
        } else {
            const updated = await this.userProfileModel.update(rest as any, {
                where: { user_id: uid as string },
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
    async changePassword({ uid, role }, changePasswordDto: ChangePassDto) {
        if (changePasswordDto.password === changePasswordDto.newPass)
            throw new BadRequestException(
                'Mật khẩu mới không được trùng với mật khẩu cũ',
            );
        const alreadyExist = await this.userService.findById(uid, role);
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
        await this.userService.updatePassword(uid, pass_hash);
        return { message: 'Thay đổi mật khẩu thành công.' };
    }
}

import {
    BadRequestException,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import { Users } from '~/models';
import { CreateUserDto } from '~/modules/users/dto/create-user.dto';
import { Helper } from '~/utils/helpers';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(Users) private readonly UsersModel: typeof Users,
    ) {}

    async findByEmail(email: string) {
        return await this.UsersModel.findOne({
            where: { email },
        });
    }
    async validateUser(email: string, password: string) {
        const alreadyExists = await this.findByEmail(email);
        if (!alreadyExists)
            throw new BadRequestException(
                'Email hoặc mật khẩu không chính xác!',
            );

        // kiểm tra pass
        const isCorrectPassword = alreadyExists.comparePassword(password);
        if (!isCorrectPassword)
            throw new BadRequestException(
                'Email hoặc mật khẩu không chính xác!',
            );

        if (!alreadyExists.email_verified)
            throw new ForbiddenException('Tài khoản chưa được xác thực email!');

        const plainUser = alreadyExists.getUserWithoutPassword();

        return {
            id: plainUser.id,
            role: plainUser.role,
        };
    }
    async create(createUserDto: CreateUserDto) {
        const alreadyExists = await this.findByEmail(createUserDto.email);
        if (alreadyExists) throw new BadRequestException('Email đã tồn tại!');

        const password_hash = Helper.hashValue(createUserDto.password);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...rest } = createUserDto;
        const payload = {
            ...rest,
            password_hash,
        };
        const newUser = await this.UsersModel.create(payload as any);

        return {
            message: 'Tạo tài khoản thành công!',
            data: newUser.getUserWithoutPassword(),
        };
    }
    // hệ thống sữ dụng
    async markEmailVerified(user_id: string) {
        const updated = await this.UsersModel.update(
            { email_verified: true },
            { where: { id: user_id } },
        );
        if (updated[0] === 0)
            throw new BadRequestException('Xác thực email không thành công.');

        return { message: 'Xác thực email thành công.' };
    }
    async updatePassword(user_id: string, password_hash: string) {
        const updated = await this.UsersModel.update(
            { password_hash },
            { where: { id: user_id } },
        );
        if (updated[0] === 0)
            throw new BadRequestException('Reset password không thành công.');

        return { message: 'Reset password  thành công.' };
    }
}

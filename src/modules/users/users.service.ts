import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import { user_status, Users } from '~/models';
import { user_provider, user_role } from '~/models/users.model';
import { CreateUserDto } from '~/modules/users/dto/create-user.dto';
import { Helper } from '~/utils/helpers';
import { UsageQuotasService } from '../usage-quotas/usage-quotas.service';
import { CvExportService } from '../cv-export/cv-export.service';
import { CvsService } from '../cvs/cvs.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(Users) private readonly UsersModel: typeof Users,
        private readonly quotaService: UsageQuotasService,
        private readonly cvExportService: CvExportService,
        private readonly cvsService: CvsService,
    ) {}
    async findById(user_id: string, role: string = user_role.USER) {
        const user = await this.UsersModel.findOne({
            where: {
                id: user_id,
                role,
                email_verified: true,
                status: user_status.ACTIVE,
            },
        });

        if (!user) throw new NotFoundException('Không tìm thầy người dùng.');

        return user;
    }
    async findByEmail(
        email: string,
        provider: user_provider = user_provider.LOCAL,
    ) {
        console.log('find', { email, provider });
        return await this.UsersModel.findOne({
            where: { email, provider },
        });
    }
    async validateUser(
        email: string,
        password: string,
        provider: user_provider,
    ) {
        const alreadyExists = await this.findByEmail(email, provider);
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

        if (!alreadyExists.dataValues.email_verified)
            throw new ForbiddenException('Tài khoản chưa được xác thực email!');

        const plainUser = alreadyExists.getUserWithoutPassword();

        return {
            uid: plainUser.id,
            role: plainUser.role,
        };
    }
    async create(createUserDto: CreateUserDto) {
        console.log('create', createUserDto);
        const alreadyExists = await this.findByEmail(
            createUserDto.email,
            createUserDto.provider,
        );
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
    async updateLastLoginAt(user_id: string, last_login_at?: Date) {
        const updated = await this.UsersModel.update(
            {
                last_login_at: last_login_at
                    ? last_login_at
                    : new Date(Date.now()),
            },
            {
                where: { id: user_id },
            },
        );
        if (updated[0] === 0)
            throw new BadRequestException(
                'Cập nhật thời gian login không thành công.',
            );

        return { message: 'ập nhật thời gian login thành công.' };
    }
    async updateFullName(user_id: string, full_name: string) {
        const updated = await this.UsersModel.update(
            { full_name },
            { where: { id: user_id } },
        );

        if (updated[0] === 0) {
            throw new NotFoundException('Cập nhật tên người dùng thất bại.');
        }
        return { message: 'Cập nhật tên người dùng thành công' };
    }
    async validateAccountProvide(
        email: string,
        full_name: string,
        provider: user_provider,
    ) {
        const alreadyExist = await this.findByEmail(email, provider);
        if (!alreadyExist) {
            const pass = Helper.generateResetPass();
            const newUser = await this.create({
                email,
                full_name,
                password: pass,
                provider,
                email_verified: true,
            });
            return { uid: newUser.data.id, role: newUser.data.role };
        }
        return {
            uid: alreadyExist.dataValues.id,
            role: alreadyExist.dataValues.role,
        };
    }

    async dashboar(user_id) {
        const cv = await this.cvsService.getAllCVMe(
            user_id,
            3,
            1,
            '',
            'created_at',
            'DESC',
        );
        const quota = await this.quotaService.getUsageQuotaByUserId(user_id);
        const totalExport =
            await this.cvExportService.countCvExportUserID(user_id);
        return {
            data: {
                totalCvs: cv.meta.total_items,
                cvs: cv.data,
                ai_limit: quota.quota.dataValues.ai_runs_limit,
                ai_use: quota.quota.dataValues.ai_runs_used,
                namePlan: quota.plan?.dataValues.name,
                totalExport,
            },
        };
    }
}

import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import {
    Plans,
    Subscriptions,
    Usage_quotas,
    User_profile,
    user_status,
    Users,
} from '~/models';
import { user_provider, user_role } from '~/models/users.model';
import { CreateUserDto } from '~/modules/users/dto/create-user.dto';
import { Helper } from '~/utils/helpers';
import { UsageQuotasService } from '../usage-quotas/usage-quotas.service';
import { CvExportService } from '../cv-export/cv-export.service';
import { CvsService } from '../cvs/cvs.service';
import { Op } from 'sequelize';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(Users) private readonly UsersModel: typeof Users,
        private readonly quotaService: UsageQuotasService,
        private readonly cvExportService: CvExportService,
        private readonly cvsService: CvsService,
    ) {}
    async findAllUser(
        limit: number,
        page: number,
        search?: string,
        sort_by: 'createdAt' | 'updatedAt' = 'updatedAt',
        sort_order: 'ASC' | 'DESC' = 'DESC',
        fromDate?: Date,
        toDate?: Date,
        user_status?: user_status,
    ) {
        const offset = (page - 1) * limit;
        const where: any = {};
        if (search?.trim()) {
            const keyword = `%${search.trim()}%`;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            where[Op.or] = [
                { full_name: { [Op.like]: keyword } },
                { email: { [Op.like]: keyword } },
            ];
        }
        if (fromDate && toDate) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            where.createdAt = {
                [Op.gte]: fromDate,
                [Op.lt]: toDate,
            };
        }
        if (user_status?.trim()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            where.status = user_status;
        }
        const { rows, count } = await this.UsersModel.findAndCountAll({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            where,
            include: [
                {
                    model: User_profile,
                    as: 'user_profile',
                },
                {
                    model: Usage_quotas,
                    as: 'usage_quotas',
                    attributes: {
                        exclude: ['createdAt', 'updatedAt'],
                    },
                    required: false,
                    separate: true,
                    limit: 1,
                    order: [['quota_end_at', 'DESC']],
                },
                {
                    model: Subscriptions,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt'],
                    },
                    include: [
                        {
                            model: Plans,
                            as: 'plan',
                            attributes: {
                                exclude: ['createdAt', 'updatedAt'],
                            },
                        },
                    ],
                },
            ],
            attributes: {
                exclude: ['password_hash'],
            },
            distinct: true,
            col: 'id',
            limit,
            offset,
            order: [[sort_by, sort_order]],
        });
        return {
            message: 'Lấy danh sách người dùng',
            data: {
                data: rows ?? [],
                meta: {
                    meta: {
                        page,
                        limit,
                        total_items: count,
                        total_pages: Math.ceil(count / limit),
                    },
                },
            },
        };
    }
    async AdminFindById(user_id: string) {
        const user = await this.UsersModel.findOne({
            where: {
                id: user_id,
            },
            include: [
                {
                    model: User_profile,
                },
            ],
            attributes: {
                exclude: ['password_hash'],
            },
        });
        if (!user) {
            throw new NotFoundException('Không tìm thầy người dùng.');
        }
        const quota = await this.quotaService.getUsageQuotaByUserId(user_id);
        return {
            message: 'Lấy thông tin người dùng thành công',
            data: { ...user.dataValues, ...quota.quota.dataValues },
        };
    }
    async findById(user_id: string, role: string = user_role.USER) {
        const user = await this.UsersModel.findOne({
            where: {
                id: user_id,
                role,
                email_verified: true,
            },
        });
        if (!user) throw new NotFoundException('Không tìm thầy người dùng.');
        if (
            user.dataValues.status === user_status.DELETED ||
            user.dataValues.status === user_status.BANNED
        ) {
            throw new ForbiddenException('Tài khoản đã bị khóa hoặc đã bị xóa');
        }
        return user;
    }
    async findByEmail(
        email: string,
        provider: user_provider = user_provider.LOCAL,
    ) {
        const user = await this.UsersModel.findOne({
            where: { email, provider },
        });
        return user;
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
        if (
            alreadyExists.dataValues.status === user_status.BANNED ||
            alreadyExists.dataValues.status === user_status.DELETED
        ) {
            throw new ForbiddenException({
                code: 'ACCOUNT_BLOCKED',
                message: 'Tài khoản đã bị khóa hoặc đã bị xóa',
            });
        }
        // kiểm tra pass
        const isCorrectPassword = alreadyExists.comparePassword(password);
        if (!isCorrectPassword)
            throw new BadRequestException(
                'Email hoặc mật khẩu không chính xác!',
            );

        if (!alreadyExists.dataValues.email_verified)
            throw new ForbiddenException({
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Tài khoản chưa được xác thực email!',
            });
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
        if (!alreadyExist) {
            throw new NotFoundException('Người dùng không tồn tại.');
        }
        if (
            alreadyExist.dataValues.status === user_status.BANNED ||
            alreadyExist.dataValues.status === user_status.DELETED
        ) {
            throw new ForbiddenException('Tài khoản đã bị khóa hoặc đã bị xóa');
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
            undefined,
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
                export_limit: quota.quota.dataValues.exports_limit,
                ai_use: quota.quota.dataValues.ai_runs_used,
                export_use: quota.quota.dataValues.exports_used,
                namePlan: quota.plan?.dataValues.name,
                totalExport,
            },
        };
    }

    async AdminCountUser(fromDate: Date, toDate: Date) {
        const durationMs = toDate.getTime() - fromDate.getTime();
        const previousFromDate = new Date(fromDate.getTime() - durationMs);
        const previousToExclusive = fromDate;

        const currentDateWhere = {
            [Op.gte]: fromDate,
            [Op.lt]: toDate,
        };

        const previousDateWhere = {
            [Op.gte]: previousFromDate,
            [Op.lt]: previousToExclusive,
        };
        const [currentUsers, previousUsers] = await Promise.all([
            this.UsersModel.count({
                where: {
                    createdAt: currentDateWhere,
                },
            }),
            this.UsersModel.count({
                where: {
                    createdAt: previousDateWhere,
                },
            }),
        ]);
        const growth_percent = Helper.calculateGrowthPercent(
            currentUsers,
            previousUsers,
        );
        return {
            value: currentUsers,
            growth_percent,
        };
    }
    async AdminCountAll() {
        const total = await this.UsersModel.count();

        return total ?? 0;
    }
    async bannedUser(user_id: string) {
        const user = await this.UsersModel.findOne({
            where: { id: user_id, status: user_status.ACTIVE },
        });
        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng.');
        }
        const updated = await user.update(
            { status: user_status.BANNED },
            { where: { id: user_id } },
        );
        if (updated[0] === 0)
            throw new BadRequestException('Banned user không thành công.');

        return { message: 'Banned user thành công.' };
    }
    async disBannedUser(user_id: string) {
        const user = await this.UsersModel.findOne({
            where: { id: user_id, status: user_status.BANNED },
        });
        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng.');
        }
        const updated = await user.update(
            { status: user_status.ACTIVE },
            { where: { id: user_id } },
        );
        if (updated[0] === 0)
            throw new BadRequestException('Mở banned user không thành công.');

        return { message: 'Mở banned user thành công.' };
    }
    async deleteUser(user_id: string) {
        const user = await this.UsersModel.findOne({
            where: { id: user_id },
        });
        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng.');
        }
        const updated = await user.update(
            { status: user_status.DELETED },
            { where: { id: user_id } },
        );
        if (updated[0] === 0)
            throw new BadRequestException('Xóa người dùng không thành công.');

        return { message: 'Xóa người dùng thành công.' };
    }
}

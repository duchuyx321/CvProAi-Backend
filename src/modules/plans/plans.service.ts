import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Plans } from '~/models';
import { CreatePlansDto, UpdatePlansDto } from '~/modules/plans/dto';
import { Helper } from '~/utils/helpers';
import { AiAddonPackagesService } from '../ai_addon_packages/ai_addon_packages.service';
import { Op } from 'sequelize';

@Injectable()
export class PlansService {
    constructor(
        @InjectModel(Plans) private readonly plansModel: typeof Plans,
        private readonly addonSerice: AiAddonPackagesService,
    ) {}
    async findAll(
        limit: number,
        page: number,
        search?: string,
        sort_by: 'createdAt' | 'updatedAt' | 'name' = 'updatedAt',
        sort_order: 'ASC' | 'DESC' = 'DESC',
        is_active?: boolean,
    ) {
        const offset = (page - 1) * limit;
        const where: any = {};

        if (search?.trim()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            where.name = {
                [Op.iLike]: `%${search.trim()}%`,
            };
        }
        if (typeof is_active === 'boolean') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            where.is_active = is_active;
        }
        const { rows, count } = await this.plansModel.findAndCountAll({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            where,
            order: [[sort_by, sort_order]],
            limit,
            offset,
            attributes: {
                exclude: ['created_at', 'updated_at'],
            },
        });
        return {
            message: 'Lấy danh sách gói dịch vụ thành công',
            data: {
                data: rows,
                meta: {
                    page,
                    limit,
                    total_items: count,
                    total_pages: Math.ceil(count / limit),
                },
            },
        };
    }
    async findOneBySlug(slug: string) {
        return await this.plansModel.findOne({
            where: { slug },
        });
    }
    async findBySlug(slug: string) {
        const plan = await this.plansModel.findOne({
            where: { slug },
        });
        if (!plan) {
            throw new NotFoundException('Gói không tồn tại.');
        }
        const plainPlan = plan?.get({ plain: true });
        let addon: any = {};
        if (plainPlan.can_purchase_ai_addon) {
            addon = (await this.addonSerice.getAll(10, 1)).data;
        }
        return {
            message: 'lấy dữ liệu thành công.',
            data: {
                plan: plainPlan,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                addon,
            },
        };
    }
    async findOneById(id: string, is_active: boolean = true) {
        const alreadyExists = await this.plansModel.findOne({
            where: { id, is_active },
        });
        if (!alreadyExists)
            throw new NotFoundException('Không tìm thấy gói dịch vụ.');
        return { message: 'lấy gói thành công', data: alreadyExists };
    }
    async create(createPlans: CreatePlansDto) {
        const alreadyExists = await this.plansModel.findOne({
            where: {
                slug: Helper.makeSlugFromString(createPlans.name),
            },
        });
        if (alreadyExists)
            throw new ConflictException('Gói dịch vụ đã tồn tại.');

        await this.plansModel.create(createPlans as any);
        return { message: 'Tạo gói dịch vụ thành công.' };
    }
    async update(updatePlans: UpdatePlansDto, id: string) {
        const alreadyExists = await this.plansModel.findByPk(id);
        if (!alreadyExists)
            throw new NotFoundException('Không tìm thấy gói dịch vụ.');

        const updated = await alreadyExists.update(updatePlans);
        if (updated[0] === 0)
            throw new BadRequestException(
                'Cập nhật gói dịch vụ không thành công.',
            );
        return { message: 'Cập nhật gói dịch vụ thành công.' };
    }
    async disable(id: string) {
        const alreadyExists = await this.findOneById(id);
        await alreadyExists.data.dataValues.update({ is_active: false });
        return { message: 'Tắt gói dịch vụ thành công.' };
    }
    async restore(id: string) {
        const alreadyExists = await this.findOneById(id, false);
        await alreadyExists.data.dataValues.update({ is_active: true });
        return { message: 'Tắt gói dịch vụ thành công.' };
    }
    async destroy(id: string) {
        const alreadyExists = await this.findOneById(id);
        await alreadyExists.data.dataValues.destroy();
        return { message: 'Xóa gói dịch vụ thành công.' };
    }
}

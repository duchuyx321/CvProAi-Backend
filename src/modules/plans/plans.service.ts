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

@Injectable()
export class PlansService {
    constructor(
        @InjectModel(Plans) private readonly plansModel: typeof Plans,
    ) {}
    async findAll(
        limit: number,
        page: number,
        search?: string,
        sort_by: 'created_at' | 'updated_at' | 'title' = 'updated_at',
        sort_order: 'ASC' | 'DESC' = 'DESC',
        is_trash: boolean = false,
    ) {
        return this.plansModel.findAll({
            where: {
                is_active: true,
            },
            // sắp xếp
            order: [['createdAt', 'ASC']],
            // lọc trường cần lấy
            attributes: {
                exclude: ['createdAt', 'updatedAt'], // loại bỏ
            },
        });
    }
    async findOneBySlug(slug: string) {
        return await this.plansModel.findOne({
            where: { slug },
        });
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
    async delete(id: string) {
        const alreadyExists = await this.findOneById(id);
        await alreadyExists.data.dataValues.update({ is_active: false });
        return { message: 'Xóa gói dịch vụ thành công.' };
    }
    async restore(id: string) {
        const alreadyExists = await this.findOneById(id, false);
        await alreadyExists.data.dataValues.update({ is_active: true });
        return { message: 'Xóa gói dịch vụ thành công.' };
    }
    async destroy(id: string) {
        const alreadyExists = await this.findOneById(id);
        await alreadyExists.data.dataValues.destroy();
        return { message: 'Xóa gói dịch vụ thành công.' };
    }
}

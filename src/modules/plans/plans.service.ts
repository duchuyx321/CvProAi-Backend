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
    async findAll() {
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
        const alreadyExists = await this.plansModel.findByPk(id);
        if (!alreadyExists)
            throw new NotFoundException('Không tìm thấy gói dịch vụ.');

        await alreadyExists.update({ is_active: false });
        return { message: 'Xóa gói dịch vụ thành công.' };
    }
    async destroy(id: string) {
        const alreadyExists = await this.plansModel.findByPk(id);
        if (!alreadyExists)
            throw new NotFoundException('Không tìm thấy gói dịch vụ.');

        await alreadyExists.destroy();
        return { message: 'Xóa gói dịch vụ thành công.' };
    }
}

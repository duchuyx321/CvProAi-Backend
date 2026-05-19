import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Orders, payment_status, Plans } from '~/models';
import { CreatePlansDto, UpdatePlansDto } from '~/modules/plans/dto';
import { Helper } from '~/utils/helpers';
import { AiAddonPackagesService } from '../ai_addon_packages/ai_addon_packages.service';
import { col, fn, literal, Op } from 'sequelize';

type PlanWithUsageCount = {
    id: string;
    usage_count?: string | number | null;
} & Record<string, unknown>;

@Injectable()
export class PlansService {
    constructor(
        @InjectModel(Plans) private readonly plansModel: typeof Plans,
        @InjectModel(Orders) private readonly OrdersModel: typeof Orders,
        private readonly addonSerice: AiAddonPackagesService,
    ) {}
    async findAll(
        limit: number,
        page: number,
        search?: string,
        sort_by: 'createdAt' | 'updatedAt' | 'name' = 'updatedAt',
        sort_order: 'ASC' | 'DESC' = 'DESC',
        fromDate?: Date,
        toDate?: Date,
        is_active?: boolean,
    ) {
        const offset = (page - 1) * limit;
        const wherePlan: Record<string, any> = {};

        if (search?.trim()) {
            wherePlan.name = {
                [Op.iLike]: `%${search.trim()}%`,
            };
        }
        if (fromDate && toDate) {
            wherePlan.updatedAt = {
                [Op.gte]: fromDate,
                [Op.lt]: toDate,
            };
        }
        if (typeof is_active === 'boolean') {
            wherePlan.is_active = is_active;
        }
        const popularPlan = await this.OrdersModel.findOne({
            attributes: [
                'plan_id',
                [fn('COUNT', col('Orders.id')), 'usage_count'],
            ],
            where: {
                status: payment_status.PAID,
                [Op.and]: [literal('"Orders"."plan_id" IS NOT NULL')],
            },
            include: [
                {
                    model: Plans,
                    as: 'plan',
                    attributes: [],
                    required: true,
                    where: {
                        price: {
                            [Op.gt]: 0,
                        },
                    },
                },
            ],
            group: ['plan_id'],
            order: [[literal('usage_count'), 'DESC']],
            raw: true,
        });
        const popularPlanId =
            popularPlan?.dataValues?.plan_id ?? popularPlan?.plan_id;
        const { rows, count } = await this.plansModel.findAndCountAll({
            where: wherePlan,
            order: [[sort_by, sort_order]],
            limit,
            offset,
            attributes: {
                exclude: ['created_at', 'updated_at'],
                include: [
                    [
                        literal(`(
                        SELECT COUNT(*)::int
                        FROM "orders" AS "o"
                        WHERE "o"."plan_id" = "Plans"."id"
                        AND "o"."status" = '${payment_status.PAID}'
                    )`),
                        'usage_count',
                    ],
                ],
            },
        });
        const data = rows.map((plan) => {
            const item = plan.get({
                plain: true,
            }) as unknown as PlanWithUsageCount;

            return {
                ...item,
                usage_count: Number(item.usage_count ?? 0),
                is_popular: item.id === popularPlanId,
            };
        });
        return {
            message: 'Lấy danh sách gói dịch vụ thành công',
            data: {
                data,
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
        await alreadyExists.data.update({ is_active: false });
        return { message: 'Tắt gói dịch vụ thành công.' };
    }
    async restore(id: string) {
        const alreadyExists = await this.findOneById(id, false);
        await alreadyExists.data.update({ is_active: true });
        return { message: 'Tắt gói dịch vụ thành công.' };
    }
    async destroy(id: string) {
        const alreadyExists = await this.findOneById(id);
        await alreadyExists.data.destroy();
        return { message: 'Xóa gói dịch vụ thành công.' };
    }
}

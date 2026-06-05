/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AiAddonPackages, Orders, payment_status } from '~/models';
import { CreateAddonDto } from './dto/create-addon.dto';
import { col, fn, literal, Op } from 'sequelize';

@Injectable()
export class AiAddonPackagesService {
    constructor(
        @InjectModel(AiAddonPackages)
        private readonly aiAddonPackages: typeof AiAddonPackages,
        @InjectModel(Orders) private readonly OrdersModel: typeof Orders,
    ) {}
    async getAll(
        limit: number,
        page: number,
        search?: string,
        sort_by: 'createdAt' | 'updatedAt' | 'title' = 'updatedAt',
        sort_order: 'ASC' | 'DESC' = 'DESC',
        // is_trash: boolean = false,
    ) {
        const offset = (page - 1) * limit;
        const where: any = {};
        if (search?.trim()) {
            where.name = { [Op.iLike]: `%${search.trim()}%` };
        }
        // if (is_trash) {
        //     where.status = cv_status.DELETED;
        // } else {
        //     where.status = {
        //         [Op.ne]: cv_status.DELETED,
        //     };
        // }
        const popularAddon = await this.OrdersModel.findOne({
            attributes: [
                'addon_package_id',
                [fn('COUNT', col('Orders.id')), 'usage_count'],
            ],
            where: {
                status: payment_status.PAID,
                [Op.and]: [literal('"Orders"."addon_package_id" IS NOT NULL')],
            },
            include: [
                {
                    model: AiAddonPackages,
                    as: 'addon_package',
                    attributes: [],
                    required: true,
                    where: {
                        price: {
                            [Op.gt]: 0,
                        },
                    },
                },
            ],
            group: ['addon_package_id'],
            order: [[literal('usage_count'), 'DESC']],
            raw: true,
        });
        const popularAddonPacketId =
            popularAddon?.dataValues?.addon_package_id ??
            popularAddon?.addon_package_id;
        const { rows, count } = await this.aiAddonPackages.findAndCountAll({
            where,
            order: [[sort_by, sort_order]],
            limit,
            offset,
        });
        const data = rows.map((plan) => {
            const item = plan.toJSON();

            return {
                ...item,
                is_popular: item.id === popularAddonPacketId,
            };
        });
        return {
            message: 'Lấy danh sách addon Ai thành công',
            data,
            meta: {
                page,
                limit,
                total_items: count,
                total_pages: Math.ceil(count / limit),
            },
        };
    }
    async getAiAddonPackagesById(id: string, is_active: boolean = true) {
        const alreadyExist = await this.aiAddonPackages.findOne({
            where: { id, is_active },
        });
        if (!alreadyExist) {
            throw new NotFoundException('Không tìm thấy gói này.');
        }
        return alreadyExist;
    }
    async create(createAddonDto: CreateAddonDto) {
        return await this.aiAddonPackages.create(createAddonDto as any);
    }
}

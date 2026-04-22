/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AiAddonPackages } from '~/models';
import { CreateAddonDto } from './dto/create-addon.dto';
import { Op } from 'sequelize';

@Injectable()
export class AiAddonPackagesService {
    constructor(
        @InjectModel(AiAddonPackages)
        private readonly aiAddonPackages: typeof AiAddonPackages,
    ) {}
    async getAll(
        limit: number,
        page: number,
        search?: string,
        sort_by: 'created_at' | 'updated_at' | 'title' = 'updated_at',
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
        const { rows, count } = await this.aiAddonPackages.findAndCountAll({
            where,
            order: [[sort_by, sort_order]],
            limit,
            offset,
        });
        return {
            message: 'Lấy danh sách addon Ai thành công',
            data: rows,
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

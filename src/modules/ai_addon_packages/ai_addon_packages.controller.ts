import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AiAddonPackagesService } from './ai_addon_packages.service';

import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UseRoles } from '~/common/decorators';
import { user_role } from '~/models';
import { CreateAddonDto } from './dto/create-addon.dto';

@ApiTags('Gói mua thêm')
@Controller('ai-addon-packages')
@UseGuards(JwtAuthGuard)
export class AiAddonPackagesController {
    constructor(
        private readonly aiAddonPackagesService: AiAddonPackagesService,
    ) {}

    @ApiOperation({ summary: 'thêm gói mua thêm lượt phân tích ai' })
    @Get()
    async getAllAddon(
        @Query('limit') limit?: number,
        @Query('page') page?: number,
        @Query('search') search?: string,
        @Query('sort_by') sort_by?: 'created_at' | 'updated_at' | 'title',
        @Query('sort_order') sort_order?: 'ASC' | 'DESC',
        @Query('is_trash') is_trash: boolean = false,
    ) {
        const allowedSortBy = ['created_at', 'updated_at', 'title'];
        const allowedSortOrder = ['ASC', 'DESC'];
        const finalSortBy = allowedSortBy.includes(sort_by ?? 'updated_at')
            ? sort_by
            : 'updated_at';
        const finalSortOrder = allowedSortOrder.includes(sort_order ?? 'DESC')
            ? sort_order
            : 'DESC';
        return await this.aiAddonPackagesService.getAll(
            Number(limit) || 8,
            Number(page) || 1,
            search,
            finalSortBy || 'updated_at',
            finalSortOrder || 'DESC',
            // is_trash || false,
        );
    }

    @ApiOperation({ summary: 'thêm gói mua thêm lượt phân tích ai' })
    @UseGuards(RolesGuard)
    @UseRoles(user_role.ADMIN)
    @Post('create')
    async create(@Body() createAddonDto: CreateAddonDto) {
        return await this.aiAddonPackagesService.create(createAddonDto);
    }
}

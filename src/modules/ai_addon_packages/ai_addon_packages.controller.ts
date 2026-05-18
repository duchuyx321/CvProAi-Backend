import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AiAddonPackagesService } from './ai_addon_packages.service';

import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UseRoles } from '~/common/decorators';
import { user_role } from '~/models';
import { CreateAddonDto } from './dto/create-addon.dto';
import { queryAddonDto } from './dto/query-addon.dto';

@ApiTags('Gói mua thêm')
@Controller('ai-addon-packages')
export class AiAddonPackagesController {
    constructor(
        private readonly aiAddonPackagesService: AiAddonPackagesService,
    ) {}

    @ApiOperation({ summary: 'danh sách gói mua thêm' })
    @Get()
    async getAllAddon(@Query() queryAddonDto: queryAddonDto) {
        const { limit, page, search, sort_by, sort_order } = queryAddonDto;
        return await this.aiAddonPackagesService.getAll(
            Number(limit) || 8,
            Number(page) || 1,
            search,
            sort_by,
            sort_order,
        );
    }

    @ApiOperation({ summary: 'thêm gói mua thêm lượt phân tích ai' })
    @UseGuards(JwtAuthGuard)
    @UseGuards(RolesGuard)
    @UseRoles(user_role.ADMIN)
    @Post('create')
    async create(@Body() createAddonDto: CreateAddonDto) {
        return await this.aiAddonPackagesService.create(createAddonDto);
    }
}

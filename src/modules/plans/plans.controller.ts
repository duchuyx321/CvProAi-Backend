import { Body, Controller, Get, Param, Query } from '@nestjs/common';
import { PlansService } from './plans.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Gói Dịch Vụ')
@Controller('plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) {}
    // GET
    @ApiOperation({ summary: 'Lấy tất cả các gói dịch vụ' })
    @Get('all')
    async getAllPlans(
        @Query('limit') limit?: number,
        @Query('page') page?: number,
        @Query('search') search?: string,
        @Query('sort_by')
        sort_by: 'createdAt' | 'updatedAt' | 'name' = 'updatedAt',
        @Query('sort_order') sort_order?: 'ASC' | 'DESC',
        @Query('is_active') is_active: boolean = false,
    ) {
        const allowedSortBy = ['createdAt', 'updatedAt', 'name'];
        const allowedSortOrder = ['ASC', 'DESC'];
        const finalSortBy = allowedSortBy.includes(sort_by ?? 'updatedAt')
            ? sort_by
            : 'updatedAt';
        const finalSortOrder = allowedSortOrder.includes(sort_order ?? 'DESC')
            ? sort_order
            : 'DESC';
        return await this.plansService.findAll(
            Number(limit) || 8,
            Number(page) || 1,
            search,
            finalSortBy || 'updatedAt',
            finalSortOrder || 'DESC',
            is_active || false,
        );
    }

    @ApiOperation({ summary: 'Lấy thông tin một gói dịch vụ theo slug' })
    @Get('/one/:slug')
    async getPlanBySlug(@Param('slug') slug: string) {
        return await this.plansService.findBySlug(slug);
    }
}

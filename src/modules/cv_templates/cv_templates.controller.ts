import { Controller, Get, Param, Query } from '@nestjs/common';
import { CvTemplatesService } from './cv_templates.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('mẫu cv')
@Controller('cv-templates')
export class CvTemplatesController {
    constructor(private readonly cvTemplatesService: CvTemplatesService) {}

    @ApiOperation({ summary: 'Lấy danh sách mẫu cv' })
    @Get()
    async getAllTemplate(
        @Query('limit') limit?: number,
        @Query('page') page?: number,
        @Query('search') search?: string,
        @Query('sort_by')
        sort_by?: 'createdAt' | 'updatedAt' | 'name',
        @Query('sort_order') sort_order: 'ASC' | 'DESC' = 'DESC',
    ) {
        const allowedSortBy = ['createdAt', 'updatedAt', 'name'];
        const allowedSortOrder = ['ASC', 'DESC'];
        const finalSortBy = allowedSortBy.includes(sort_by ?? 'updatedAt')
            ? sort_by
            : 'updatedAt';
        const finalSortOrder = allowedSortOrder.includes(sort_order ?? 'DESC')
            ? sort_order
            : 'DESC';
        return await this.cvTemplatesService.getAllTemplate(
            Number(limit) || 8,
            Number(page) || 1,
            search,
            finalSortBy || 'updatedAt',
            finalSortOrder || 'DESC',
            true,
        );
    }
    @ApiOperation({ summary: 'Lấy chi tiết mẫu cv' })
    @Get('code/:code')
    async getTemplateByCode(@Param('code') code: string) {
        return await this.cvTemplatesService.getTemplateByCode(code, true);
    }
}

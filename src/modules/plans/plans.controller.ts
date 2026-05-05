import { Body, Controller, Get, Param, Query } from '@nestjs/common';
import { PlansService } from './plans.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryTemplateDto } from './dto/query-template.dto';
import { DateRangeUtil } from '~/utils/date-range.util';
import { QueryRange } from '~/common/dto/queryTime.dto';

@ApiTags('Gói Dịch Vụ')
@Controller('plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) {}
    // GET
    @ApiOperation({ summary: 'Lấy tất cả các gói dịch vụ' })
    @Get('all')
    async getAllPlans(@Query() queryTemplateDto: QueryTemplateDto) {
        const {
            limit,
            page,
            search,
            sort_by,
            sort_order,
            is_active,
            from,
            range,
            to,
        } = queryTemplateDto;
        const { fromDate, toExclusive } = DateRangeUtil.getDateRange(
            from,
            to,
            range as QueryRange,
            {
                requireDateRange: false,
            },
        );
        return await this.plansService.findAll(
            limit,
            page,
            search,
            sort_by,
            sort_order,
            fromDate,
            toExclusive,
            is_active,
        );
    }

    @ApiOperation({ summary: 'Lấy thông tin một gói dịch vụ theo slug' })
    @Get('/one/:slug')
    async getPlanBySlug(@Param('slug') slug: string) {
        return await this.plansService.findBySlug(slug);
    }
}

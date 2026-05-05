import { Controller, Get, Param, Query } from '@nestjs/common';
import { CvTemplatesService } from './cv_templates.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DateRangeUtil } from '~/utils/date-range.util';
import { QueryRange } from '~/common/dto/queryTime.dto';
import { QueryTemplateDto } from './dto/query-template.dto';

@ApiTags('mẫu cv')
@Controller('cv-templates')
export class CvTemplatesController {
    constructor(private readonly cvTemplatesService: CvTemplatesService) {}

    @ApiOperation({ summary: 'Lấy danh sách mẫu cv' })
    @Get()
    async getAllTemplate(@Query() query: QueryTemplateDto) {
        const { limit, page, search, sort_by, sort_order, from, range, to } =
            query;
        const { fromDate, toExclusive } = DateRangeUtil.getDateRange(
            from,
            to,
            range as QueryRange,
            {
                requireDateRange: false,
            },
        );
        return await this.cvTemplatesService.getAllTemplate(
            limit,
            page,
            search,
            sort_by,
            sort_order,
            fromDate,
            toExclusive,
            true,
        );
    }
    @ApiOperation({ summary: 'Lấy chi tiết mẫu cv' })
    @Get('code/:code')
    async getTemplateByCode(@Param('code') code: string) {
        return await this.cvTemplatesService.getTemplateByCode(code, true);
    }
}

import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { CvExportService } from './cv-export.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '~/modules/auth/guards';
import { QueryAnalyzeDto } from '../ai-analysis/dto/query-anlalyze.dto';
import { DateRangeUtil } from '~/utils/date-range.util';
import { QueryRange } from '~/common/dto/queryTime.dto';

@ApiTags('Xuất Cv')
@UseGuards(JwtAuthGuard)
@Controller('cv-export')
export class CvExportController {
    constructor(private readonly cvExportService: CvExportService) {}
    @ApiOperation({ summary: 'Lịch sữ xuất CV' })
    @Get()
    async getCvExportByUserID(
        @Req() req: Request,
        @Query() queryAnalyzeDto: QueryAnalyzeDto,
    ) {
        const user_id = (req['user'] as { user_id: string }).user_id;

        const { range, limit, page, search, sort_by, sort_order, from, to } =
            queryAnalyzeDto;
        const { fromDate, toExclusive } = DateRangeUtil.getDateRange(
            from,
            to,
            range as QueryRange,
        );
        return await this.cvExportService.getExportByUserID(
            user_id,
            limit,
            page,
            search,
            sort_by,
            sort_order,
            fromDate,
            toExclusive,
        );
    }
}

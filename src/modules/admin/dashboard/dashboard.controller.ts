import {
    Controller,
    Get,
    Param,
    Post,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, RolesGuard } from '~/modules/auth/guards';
import { UseRoles } from '~/common/decorators';
import { user_role } from '~/models';
import type { Response as ExpressResponse } from 'express';
import { ExportFormat, QueryTimeDto } from '~/common/dto/queryTime.dto';
@ApiTags('Admin - thông báo và thống kê')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseRoles(user_role.ADMIN)
@Controller('admin/dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @ApiOperation({ summary: 'Thông báo và thống kê' })
    @Get()
    async getAdminDashboard(@Query() queryDashboardDto: QueryTimeDto) {
        return await this.dashboardService.getAdminDashboard(queryDashboardDto);
    }
    @Post('export/:format')
    async export(
        @Param('format') format: ExportFormat,
        @Query() queryDashboardDto: QueryTimeDto,
        @Res() res: ExpressResponse,
    ) {
        const file = await this.dashboardService.export(
            format,
            queryDashboardDto,
        );

        res.setHeader('Content-Type', file.contentType);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${file.fileName}"`,
        );

        res.send(file.buffer);
    }
}

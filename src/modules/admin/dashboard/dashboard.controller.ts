import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, RolesGuard } from '~/modules/auth/guards';
import { UseRoles } from '~/common/decorators';
import { user_role } from '~/models';
import { ExportFormat, QueryDashboardDto } from './dto/query-dashboard.dto';
import type { Response as ExpressResponse } from 'express';
@ApiTags('Admin - thông báo và thống kê')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseRoles(user_role.ADMIN)
@Controller('admin/dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @ApiOperation({ summary: 'Thông báo và thống kê' })
    @Get()
    async getAdminDashboard(@Query() queryDashboardDto: QueryDashboardDto) {
        return await this.dashboardService.getAdminDashboard(queryDashboardDto);
    }
    @Get('export/:format')
    async export(
        @Param('format') format: ExportFormat,
        @Query() queryDashboardDto: QueryDashboardDto,
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

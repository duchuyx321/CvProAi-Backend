import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, RolesGuard } from '~/modules/auth/guards';
import { UseRoles } from '~/common/decorators';
import { user_role } from '~/models';
import { QueryDashboardDto } from './dto/query-dashboard.dto';

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
}

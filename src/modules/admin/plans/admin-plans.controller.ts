import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UseRoles } from '~/common/decorators';
import { JwtAuthGuard, RolesGuard } from '~/modules/auth/guards';
import { AdminPlansService } from './admin-plans.service';
import { CreatePlansDto, UpdatePlansDto } from '~/modules/plans/dto';

@ApiTags('Quản lý gói dịch vụ admin')
@Controller('admin/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseRoles('ADMIN')
export class AdminPlansController {
    constructor(private readonly adminPlansService: AdminPlansService) {}
    // GET
    @ApiOperation({ summary: 'Lấy gói dịch vụ' })
    @Get()
    async getPlans(
        @Query('limit') limit?: number,
        @Query('page') page?: number,
        @Query('search') search?: string,
        @Query('sort_by') sort_by?: 'created_at' | 'updated_at' | 'name',
        @Query('sort_order') sort_order?: 'ASC' | 'DESC',
    ) {
        const allowedSortBy = ['created_at', 'updated_at', 'name'];
        const allowedSortOrder = ['ASC', 'DESC'];
        const finalSortBy = allowedSortBy.includes(sort_by ?? 'updated_at')
            ? sort_by
            : 'updated_at';
        const finalSortOrder = allowedSortOrder.includes(sort_order ?? 'DESC')
            ? sort_order
            : 'DESC';
        return await this.adminPlansService.getPlans(
            Number(limit) || 8,
            Number(page) || 1,
            search,
            finalSortBy || 'updated_at',
            finalSortOrder || 'DESC',
        );
    }
    // GET
    @ApiOperation({ summary: 'Lấy chi tiết gói dịch vụ' })
    @Get('one/:slug')
    async getPlansBySlug(@Param('slug') slug: string) {
        return await this.adminPlansService.getPlansBySlug(slug);
    }
    // POST
    @ApiOperation({ summary: 'Tạo mới gói dịch vụ (Admin only)' })
    @Post('create')
    async createPlans(@Body() createPlans: CreatePlansDto) {
        return await this.adminPlansService.cretaePlans(createPlans);
    }
    // PATCH
    @ApiOperation({ summary: 'Cập nhật gói dịch vụ (Admin only)' })
    @Patch('update/:id')
    async updatePlans(
        @Body() updatePlansDto: UpdatePlansDto,
        @Param('id') id: string,
    ) {
        return this.adminPlansService.updatePlans(id, updatePlansDto);
    }

    @ApiOperation({ summary: 'Xóa mềm gói dịch vụ (Admin only)' })
    @Patch('disable/:id')
    async ddisablePlans(@Param('id') id: string) {
        return this.adminPlansService.disablePlans(id);
    }
    @ApiOperation({ summary: 'Khôi phục gói dịch vụ (Admin only)' })
    @Patch('restore/:id')
    async restorePlans(@Param('id') id: string) {
        return this.adminPlansService.restorePlans(id);
    }
    @ApiOperation({ summary: 'Xóa vĩnh viễn gói dịch vụ (Admin only)' })
    @Delete('destroy/:id')
    async destroyPlans(@Param('id') id: string) {
        return this.adminPlansService.destroyPlans(id);
    }
}

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
import { PlansService } from './plans.service';
import { CreatePlansDto, UpdatePlansDto } from '~/modules/plans/dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '~/modules/auth/guards';
import { UseRoles } from '~/common/decorators/roles.decorator';

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
        @Query('sort_by') sort_by?: 'created_at' | 'updated_at' | 'title',
        @Query('sort_order') sort_order?: 'ASC' | 'DESC',
        @Query('is_trash') is_trash: boolean = false,
    ) {
        const allowedSortBy = ['created_at', 'updated_at', 'title'];
        const allowedSortOrder = ['ASC', 'DESC'];
        const finalSortBy = allowedSortBy.includes(sort_by ?? 'updated_at')
            ? sort_by
            : 'updated_at';
        const finalSortOrder = allowedSortOrder.includes(sort_order ?? 'DESC')
            ? sort_order
            : 'DESC';
        return await this.plansService.findAll(
            Number(limit) || 8,
            Number(page) || 1,
            search,
            finalSortBy || 'updated_at',
            finalSortOrder || 'DESC',
            is_trash || false,
        );
    }

    @ApiOperation({ summary: 'Lấy thông tin một gói dịch vụ theo slug' })
    @Get('/one/:slug')
    async getPlanBySlug(@Param('slug') slug: string) {
        return await this.plansService.findBySlug(slug);
    }
    // POST
    @ApiOperation({ summary: 'Tạo mới gói dịch vụ (Admin only)' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseRoles('ADMIN')
    @Post('create')
    async createPlans(@Body() createPlans: CreatePlansDto) {
        return await this.plansService.create(createPlans);
    }

    @ApiOperation({ summary: 'Cập nhật gói dịch vụ (Admin only)' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseRoles('ADMIN')
    @Patch('update/:id')
    async updatePlans(
        @Body() updatePlansDto: UpdatePlansDto,
        @Param('id') id: string,
    ) {
        return this.plansService.update(updatePlansDto, id);
    }

    @ApiOperation({ summary: 'Xóa mềm gói dịch vụ (Admin only)' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseRoles('ADMIN')
    @Patch('delete/:id')
    async deletePlans(@Param('id') id: string) {
        return this.plansService.delete(id);
    }
    @ApiOperation({ summary: 'Xóa mềm gói dịch vụ (Admin only)' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseRoles('ADMIN')
    @Patch('delete/:id')
    async restorePlans(@Param('id') id: string) {
        return this.plansService.restore(id);
    }
    @ApiOperation({ summary: 'Xóa vĩnh viễn gói dịch vụ (Admin only)' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseRoles('ADMIN')
    @Delete('destroy/:id')
    async destroyPlans(@Param('id') id: string) {
        return this.plansService.destroy(id);
    }
}

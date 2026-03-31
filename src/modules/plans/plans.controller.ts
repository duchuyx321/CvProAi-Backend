import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
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
    async getAllPlans() {
        return await this.plansService.findAll();
    }

    @ApiOperation({ summary: 'Lấy thông tin một gói dịch vụ theo slug' })
    @Get('/one/:slug')
    async getPlanBySlug(@Param('slug') slug: string) {
        return await this.plansService.findOneBySlug(slug);
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
        return this.plansService.destroy(id);
    }

    @ApiOperation({ summary: 'Xóa vĩnh viễn gói dịch vụ (Admin only)' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseRoles('ADMIN')
    @Delete('destroy/:id')
    async destroyPlans(@Param('id') id: string) {
        return this.plansService.destroy(id);
    }
}

import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UseRoles } from '~/common/decorators';
import { user_role } from '~/models';
import { JwtAuthGuard, RolesGuard } from '~/modules/auth/guards';
import { AdminPaymentsService } from './admin-payments.service';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { EditPaymentDto } from './dto/edit-payment.dto';

@ApiTags('Admin - Quản lý đơn hàng')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseRoles(user_role.ADMIN)
@Controller('admin/payments')
export class AdminPaymentController {
    constructor(private readonly adminPaymentsService: AdminPaymentsService) {}
    @ApiOperation({ summary: 'lấy danh sách đơn hàng' })
    @Get('')
    async getPayments(@Query() query: QueryPaymentDto) {
        return await this.adminPaymentsService.getAllPayments(query);
    }
    @Get(':code')
    async getPaymentByCode(@Param('code') code: string) {
        return await this.adminPaymentsService.getPaymentByCode(code);
    }
    @Patch('/edit/:id')
    async editStatus(
        @Param('id') id: string,
        @Body() editPaymentDto: EditPaymentDto,
    ) {
        return await this.adminPaymentsService.editStatus(id, editPaymentDto);
    }
}

import { Injectable } from '@nestjs/common';
import { PaymentsService } from '~/modules/payments/payments.service';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { EditPaymentDto } from './dto/edit-payment.dto';

@Injectable()
export class AdminPaymentsService {
    constructor(private readonly paymentsService: PaymentsService) {}
    async getAllPayments(query: QueryPaymentDto) {
        const { limit, page, search, sort_by, sort_order } = query;
        return await this.paymentsService.getPayments(
            limit ?? 8,
            page ?? 1,
            search,
            sort_by,
            sort_order,
        );
    }
    async getPaymentByCode(code: string) {
        return await this.paymentsService.getPaymentByOrderCode(code);
    }

    async editStatus(id: string, editPaymentDto: EditPaymentDto) {
        return await this.paymentsService.AdminEditStatus(id, editPaymentDto);
    }
}

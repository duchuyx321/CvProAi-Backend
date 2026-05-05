import { Injectable } from '@nestjs/common';
import { PaymentsService } from '~/modules/payments/payments.service';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { EditPaymentDto } from './dto/edit-payment.dto';
import { DateRangeUtil } from '~/utils/date-range.util';
import { QueryRange } from '~/common/dto/queryTime.dto';

@Injectable()
export class AdminPaymentsService {
    constructor(private readonly paymentsService: PaymentsService) {}
    async getAllPayments(query: QueryPaymentDto) {
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
        return await this.paymentsService.getPayments(
            limit ?? 8,
            page ?? 1,
            search,
            sort_by,
            sort_order,
            fromDate,
            toExclusive,
        );
    }
    async getPaymentByCode(code: string) {
        return await this.paymentsService.getPaymentByOrderCode(code);
    }

    async editStatus(id: string, editPaymentDto: EditPaymentDto) {
        return await this.paymentsService.AdminEditStatus(id, editPaymentDto);
    }
}

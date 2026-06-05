import {
    EnumRequired,
    StringNotRequired,
    StringRequired,
} from '~/common/decorators';
import { payment_status } from '~/models';

export class EditPaymentDto {
    @EnumRequired('status', payment_status)
    status!: payment_status;
    @StringNotRequired('transaction_id')
    provider_transaction_id?: string;
    @StringRequired('reason')
    reason!: string;
}

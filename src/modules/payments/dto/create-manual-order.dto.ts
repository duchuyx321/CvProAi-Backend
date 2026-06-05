import {
    EnumRequired,
    StringNotRequired,
    StringRequired,
} from '~/common/decorators';
import { order_type } from '~/models';

export class CreateManualOrderDto {
    @EnumRequired('paymentable_type', order_type)
    paymentable_type!: order_type;

    @StringNotRequired('plan_id')
    plan_id?: string;

    @StringNotRequired('addon_package_id')
    addon_package_id?: string;

    @StringNotRequired('provider_transaction_id')
    provider_transaction_id?: string;

    @StringRequired('reason')
    reason!: string;
}

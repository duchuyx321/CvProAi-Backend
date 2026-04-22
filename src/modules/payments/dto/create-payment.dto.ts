import { EnumNotRequired, StringNotRequired } from '~/common/decorators';
import { order_type } from '~/models';

export class CreatePaymentDto {
    @EnumNotRequired('paymentable', order_type)
    paymentable_type: order_type = order_type.SUBSCRIPTION;
    @StringNotRequired('plan_id')
    plan_id?: string;
    @StringNotRequired('plan_id')
    addon_package_id?: string;
}

import { StringRequired } from '~/common/decorators';

export class CreateSubscriptionsDto {
    @StringRequired('user_id')
    user_id!: string;
    @StringRequired('plan_id')
    plan_id!: string;
    @StringRequired('order_id')
    order_id!: string;
}

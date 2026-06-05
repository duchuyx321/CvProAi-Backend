import { EnumNotRequired } from '~/common/decorators';
import { QueryWithTimeDto } from '~/common/dto/query-withTime.dto';

export enum paymentByOrder {
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
}
export class QueryPaymentDto extends QueryWithTimeDto {
    @EnumNotRequired('sort_by', paymentByOrder)
    sort_by: paymentByOrder = paymentByOrder.UPDATED_AT;
}

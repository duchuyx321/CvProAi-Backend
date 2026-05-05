import { EnumNotRequired } from '~/common/decorators';
import { QueryWithTimeDto } from '~/common/dto/query-withTime.dto';

export enum PaymentSortBy {
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
    TITLE = 'title',
}
export class QueryPaymentDto extends QueryWithTimeDto {
    @EnumNotRequired('sort_by', PaymentSortBy)
    sort_by: PaymentSortBy = PaymentSortBy.UPDATED_AT;
}

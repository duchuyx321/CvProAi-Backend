import { NumberNotRequired, StringNotRequired } from '~/common/decorators';

export class QueryPaymentDto {
    @NumberNotRequired('limit')
    limit?: number;
    @NumberNotRequired('offset')
    page?: number;
    @StringNotRequired('search')
    search?: string;
    @StringNotRequired('search')
    sort_by: 'created_at' | 'updated_at' | 'title' = 'updated_at';
    @StringNotRequired('search')
    sort_order: 'ASC' | 'DESC' = 'DESC';
}

import { NumberNotRequired, StringNotRequired } from '~/common/decorators';

export class QueryPaymentDto {
    @NumberNotRequired('limit')
    limit?: number;
    @NumberNotRequired('offset')
    page?: number;
    @StringNotRequired('search')
    search?: string;
    @StringNotRequired('search')
    sort_by: 'createdAt' | 'updatedAt' | 'title' = 'updatedAt';
    @StringNotRequired('search')
    sort_order: 'ASC' | 'DESC' = 'DESC';
}

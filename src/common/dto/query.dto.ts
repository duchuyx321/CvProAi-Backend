import { Max, Min } from 'class-validator';
import {
    EnumNotRequired,
    NumberNotRequired,
    StringNotRequired,
} from '~/common/decorators';

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC',
}
export class QueryDto {
    @NumberNotRequired('limit')
    @Min(8)
    @Max(20)
    limit: number = 8;
    @NumberNotRequired('page')
    @Min(1)
    page: number = 1;
    @StringNotRequired('search')
    search?: string;
    @EnumNotRequired('sort_order', SortOrder)
    sort_order: SortOrder = SortOrder.DESC;
}

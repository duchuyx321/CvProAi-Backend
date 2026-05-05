import { EnumNotRequired } from '~/common/decorators';
import { QueryWithTimeDto } from '~/common/dto/query-withTime.dto';
import { user_status } from '~/models';

export enum TemplateSortBy {
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
}

export class QueryUserDto extends QueryWithTimeDto {
    @EnumNotRequired('sort_by', TemplateSortBy)
    sort_by?: TemplateSortBy = TemplateSortBy.UPDATED_AT;
    @EnumNotRequired('user_status', user_status)
    user_status?: user_status;
}

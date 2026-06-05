import { EnumNotRequired } from '~/common/decorators';
import { QueryWithTimeDto } from '~/common/dto/query-withTime.dto';

export enum AnalyzeByOrder {
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
}
export class QueryAnalyzeDto extends QueryWithTimeDto {
    @EnumNotRequired('sort_by', AnalyzeByOrder)
    sort_by?: AnalyzeByOrder = AnalyzeByOrder.UPDATED_AT;
}

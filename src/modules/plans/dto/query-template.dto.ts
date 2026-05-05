import { Transform } from 'class-transformer';
import { BooleanNotRequired, EnumNotRequired } from '~/common/decorators';
import { QueryWithTimeDto } from '~/common/dto/query-withTime.dto';

export enum TemplateSortBy {
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
    NAME = 'name',
}

export class QueryTemplateDto extends QueryWithTimeDto {
    @EnumNotRequired('sort_by', TemplateSortBy)
    sort_by?: TemplateSortBy = TemplateSortBy.UPDATED_AT;
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }

        if (value === true || value === 'true') {
            return true;
        }

        if (value === false || value === 'false') {
            return false;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return value;
    })
    @BooleanNotRequired('is_active')
    is_active: boolean = true;
}

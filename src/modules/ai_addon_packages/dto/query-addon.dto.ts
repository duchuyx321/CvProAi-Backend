import { EnumNotRequired } from '~/common/decorators';
import { QueryDto } from '~/common/dto/query.dto';
export enum AddonSortBy {
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
    TITLE = 'title',
}
export class queryAddonDto extends QueryDto {
    @EnumNotRequired('sort_by', AddonSortBy)
    sort_by: AddonSortBy = AddonSortBy.UPDATED_AT;
}

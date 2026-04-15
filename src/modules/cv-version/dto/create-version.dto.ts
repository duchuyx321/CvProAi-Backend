import { ObjectRequired, StringRequired } from '~/common/decorators';
import { CVTemplateConfig } from '~/modules/cv_templates/dto/create-template.dto';
import type { CVContent } from '~/modules/cvs/dto/create-cvs.dto';

export class CreateVersionDto {
    @StringRequired('cv_id')
    cv_id!: string;
    @StringRequired('version_name')
    version_name!: string;
    @StringRequired('created_by')
    created_by!: string;
    @ObjectRequired('content')
    content!: CVContent;
    @ObjectRequired('custom_config')
    custom_config?: Partial<CVTemplateConfig>;
}

import { StringNotRequired } from '~/common/decorators';

export class AnalyzeDto {
    @StringNotRequired('cv_id')
    cv_id?: string;
    @StringNotRequired('jd_text')
    jd_text?: string;
}

import { Transform } from 'class-transformer';
import { ValidateIf } from 'class-validator';
import { BooleanNotRequired, StringRequired } from '~/common/decorators';

export class QueryCvDto {
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
    @BooleanNotRequired('rewrite')
    rewrite: boolean = false;
    @ValidateIf((dto: QueryCvDto) => dto.rewrite === true)
    @StringRequired('ai_run_id')
    ai_run_id?: string;
}

import {
    DateRequired,
    NumberRequired,
    StringRequired,
} from '~/common/decorators';

export class CreateUsageQuotasDto {
    @StringRequired('user_id')
    user_id!: string;
    @DateRequired('quota_end_at')
    quota_end_at!: Date;
    @NumberRequired('ai_runs_limit')
    ai_runs_limit!: number;
    @NumberRequired('ai_runs_used')
    ai_runs_used!: number;
    @NumberRequired('exports_used')
    exports_used!: number;
    @NumberRequired('exports_limit')
    exports_limit!: number;
    @NumberRequired('cvs_used')
    cvs_used!: number;
    @NumberRequired('cvs_limit')
    cvs_limit!: number;
}

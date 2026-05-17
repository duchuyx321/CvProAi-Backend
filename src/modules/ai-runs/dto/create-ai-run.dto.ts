import {
    DateNotRequired,
    EnumNotRequired,
    NumberNotRequired,
    StringNotRequired,
    StringRequired,
} from '~/common/decorators';
import { ai_run_status, AiCvSourceType } from '~/models/ai_runs.model';

export class CreateAiRunsDto {
    @StringRequired('user_id')
    user_id!: string;

    @StringRequired('cv_id')
    cv_id?: string | null;

    @StringNotRequired('version_id')
    version_id?: string;

    @StringNotRequired('cv_name')
    cv_name?: string;
    @StringNotRequired('job_title')
    job_title?: string;

    @EnumNotRequired('status', ai_run_status)
    status?: ai_run_status;

    @StringNotRequired('model')
    model?: string;

    @NumberNotRequired('prompt_tokens')
    prompt_tokens?: number;

    @NumberNotRequired('completion_tokens')
    completion_tokens?: number;

    @NumberNotRequired('cost_cents')
    cost_cents?: number;

    @StringNotRequired('error_message')
    error_message?: string;

    @DateNotRequired('finished_at')
    finished_at?: Date;

    @EnumNotRequired('cv_source_type', AiCvSourceType)
    cv_source_type?: AiCvSourceType;

    @StringNotRequired('version_id')
    cv_content?: string | null;
    @StringNotRequired('version_id')
    jd_content?: string | null;
}

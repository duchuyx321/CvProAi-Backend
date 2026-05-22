import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsObject,
    IsOptional,
    IsString,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import {
    EnumNotRequired,
    EnumRequired,
    NumberNotRequired,
    NumberRequired,
    StringRequired,
} from '~/common/decorators';

export enum AiWeaknessType {
    MISSING_SKILL = 'missing_skill',
    MISSING_KEYWORD = 'missing_keyword',
    WEAK_BULLET = 'weak_bullet',
    WEAK_SUMMARY = 'weak_summary',
    ATS_ISSUE = 'ats_issue',
    EXPERIENCE_GAP = 'experience_gap',
}

export enum AiSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

export enum AiTargetSection {
    SUMMARY = 'summary',
    EXPERIENCE = 'experience',
    SKILLS = 'skills',
    PROJECTS = 'projects',
    EDUCATION = 'education',
    CONTACT = 'contact',
    ADDITIONAL_INFO = 'additional_info',
}

export enum AiRewriteAction {
    REPLACE = 'replace',
    ADD = 'add',
    REMOVE = 'remove',
}

export enum AiInsertPosition {
    BEFORE = 'before',
    AFTER = 'after',
    APPEND = 'append',
    PREPEND = 'prepend',
}

export enum AiRewriteStatus {
    PENDING = 'pending',
    APPLIED = 'applied',
    REJECTED = 'rejected',
}

type AiRewriteProposalCondition = {
    action?: AiRewriteAction;
};

const isAddAction = (object: AiRewriteProposalCondition): boolean =>
    object.action === AiRewriteAction.ADD;

const isReplaceOrRemoveAction = (object: AiRewriteProposalCondition): boolean =>
    object.action === AiRewriteAction.REPLACE ||
    object.action === AiRewriteAction.REMOVE;

const isReplaceOrAddAction = (object: AiRewriteProposalCondition): boolean =>
    object.action === AiRewriteAction.REPLACE ||
    object.action === AiRewriteAction.ADD;

export class WeaknessEvidenceDto {
    @StringRequired('jd')
    jd!: string;

    @StringRequired('cv')
    cv!: string;

    @StringRequired('reason')
    reason!: string;
}

export class WeaknessItemDto {
    @StringRequired('id')
    id!: string;

    @EnumRequired('type', AiWeaknessType)
    type!: AiWeaknessType;

    @StringRequired('title')
    title!: string;

    @StringRequired('description')
    description!: string;

    @EnumRequired('severity', AiSeverity)
    severity!: AiSeverity;

    @NumberRequired('impact_score')
    impact_score!: number;

    @ValidateNested()
    @Type(() => WeaknessEvidenceDto)
    evidence!: WeaknessEvidenceDto;

    @EnumNotRequired('target_section', AiTargetSection)
    target_section?: AiTargetSection;
}

export class AiRewriteProposalDto {
    @StringRequired('id')
    id!: string;

    /**
     * Liên kết proposal với weakness/gap cụ thể.
     * Ví dụ: weakness_01, missing_keyword_02
     */
    @IsOptional()
    @IsString()
    weakness_id?: string;

    /**
     * replace: thay đoạn cũ bằng đoạn mới
     * add: thêm đoạn mới
     * remove: xóa đoạn hiện tại
     */
    @EnumRequired('action', AiRewriteAction)
    action!: AiRewriteAction;

    @EnumRequired('target_section', AiTargetSection)
    target_section!: AiTargetSection;

    /**
     * Đường dẫn tới vị trí trong JSON content của CV.
     * Ví dụ:
     * SUMMARY
     * EXPERIENCE[0].description
     * SKILLS[1].name
     * EDUCATION[0].degree
     */
    @IsOptional()
    @IsString()
    target_path?: string;

    /**
     * Chỉ bắt buộc với action ADD.
     */
    @ValidateIf(isAddAction)
    @EnumRequired('insert_position', AiInsertPosition)
    insert_position?: AiInsertPosition;

    /**
     * Bắt buộc với REPLACE và REMOVE.
     * Dùng để backend check tránh sửa/xóa nhầm.
     */
    @ValidateIf(isReplaceOrRemoveAction)
    @StringRequired('old_text')
    old_text?: string;

    /**
     * Bắt buộc với REPLACE và ADD.
     */
    @ValidateIf(isReplaceOrAddAction)
    @StringRequired('new_text')
    new_text?: string;

    @StringRequired('reason')
    reason!: string;

    @EnumRequired('severity', AiSeverity)
    severity!: AiSeverity;

    @NumberNotRequired('estimated_score_gain')
    estimated_score_gain?: number;

    /**
     * Mặc định khi AI sinh ra là pending.
     * Khi user apply thì đổi thành applied.
     * Khi user bỏ qua thì đổi thành rejected.
     */
    @EnumNotRequired('status', AiRewriteStatus)
    status?: AiRewriteStatus = AiRewriteStatus.PENDING;

    /**
     * Backend có thể tự tạo hash từ:
     * action + target_path + old_text + new_text
     */
    @IsOptional()
    @IsString()
    proposal_hash?: string;

    @IsOptional()
    @IsString()
    applied_at?: string;

    @IsOptional()
    @IsString()
    applied_by?: string;
}

export class AiStructuredFeedbackDto {
    /**
     * Feedback theo từng section nếu cần hiển thị UI dạng grouped.
     */
    @IsOptional()
    @IsArray()
    @IsObject({ each: true })
    section_feedback?: Record<string, unknown>[];
    /**
     * Có thể lưu duplicate weaknesses vào đây nếu muốn gom toàn bộ structured data.
     * Nếu đã lưu top-level weaknesses thì không bắt buộc dùng field này.
     */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WeaknessItemDto)
    weaknesses?: WeaknessItemDto[];

    /**
     * Lưu các đề xuất chỉnh sửa cụ thể do AI sinh ra ở call lần 2.
     */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AiRewriteProposalDto)
    rewrite_proposals?: AiRewriteProposalDto[];
}

export class CreateAiResultsDto {
    @StringRequired('ai_run_id')
    ai_run_id!: string;

    @NumberNotRequired('overall_score')
    overall_score?: number;

    @NumberNotRequired('ats_score')
    ats_score?: number;

    @NumberNotRequired('clarity_score')
    clarity_score?: number;

    @NumberNotRequired('impact_score')
    impact_score?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WeaknessItemDto)
    weaknesses?: WeaknessItemDto[];

    @IsOptional()
    @IsArray()
    @IsObject({ each: true })
    suggestions?: Record<string, unknown>[];

    @IsOptional()
    @IsArray()
    @IsObject({ each: true })
    strengths?: Record<string, unknown>[];

    /**
     * structured_feedback là nơi lưu dữ liệu mở rộng:
     * - section_feedback
     * - locked_summary
     * - cv_content nếu CV upload ngoài
     * - rewrite_proposals khi Premium bấm nhận gợi ý chỉnh sửa
     */
    @IsOptional()
    @ValidateNested()
    @Type(() => AiStructuredFeedbackDto)
    structured_feedback?: AiStructuredFeedbackDto;
}

/**
 * DTO dùng khi user apply từng proposal hoặc apply toàn bộ.
 */
export class ApplyAiRewriteProposalsDto {
    /**
     * Nếu apply_all = true thì không cần proposal_ids.
     */
    @IsOptional()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    @ValidateIf((o) => o.apply_all !== true)
    @IsArray({
        message: 'proposal_ids phải là một mảng.',
    })
    @ArrayNotEmpty({
        message: 'proposal_ids không được để trống khi không apply toàn bộ.',
    })
    @IsString({
        each: true,
        message: 'Mỗi proposal_id phải là chuỗi.',
    })
    proposal_ids?: string[];

    /**
     * true: apply tất cả proposal đang pending.
     * false hoặc không truyền: apply theo proposal_ids.
     */
    @IsOptional()
    @IsBoolean({
        message: 'apply_all phải là boolean.',
    })
    apply_all?: boolean;
}

/**
 * DTO dùng khi user bỏ qua / reject một hoặc nhiều proposal.
 */
export class RejectAiRewriteProposalsDto {
    @IsArray()
    @IsString({ each: true })
    proposal_ids!: string[];
}

import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
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
}

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

    @ValidateNested({ each: true })
    @Type(() => WeaknessItemDto)
    weaknesses?: WeaknessItemDto[];

    @IsOptional()
    @IsArray()
    @IsObject({ each: true })
    suggestions?: Record<string, any>[];

    @IsOptional()
    @IsArray()
    @IsObject({ each: true })
    strengths?: Record<string, any>[];
    @IsOptional()
    @IsArray()
    @IsObject({ each: true })
    structured_feedback?: Record<string, any>;
}

import {
    ObjectNotRequired,
    StringNotRequired,
    StringRequired,
} from '~/common/decorators';
import { cv_status, cv_visibility } from '~/models/cvs.model';
import { CVTemplateConfig } from '~/modules/cv_templates/dto/create-template.dto';
// Định nghĩa Item cho Kinh nghiệm làm việc
export interface ExperienceItem {
    company: string;
    role: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    description: string; // Lưu dạng Markdown hoặc HTML (Rich Text)
    [key: string]: any; // Cho phép thêm trường tùy ý
}

// Định nghĩa Item cho Kỹ năng
export interface SkillItem {
    name: string;
    description?: string; // mô tả chi tiết
    level?: number; // 0-100
    years?: number; // Số năm kinh nghiệm
    [key: string]: any;
}

// Định nghĩa Item cho Học vấn
export interface EducationItem {
    school: string;
    degree: string;
    start_date?: string;
    end_date?: string;
    gpa?: string;
    [key: string]: any;
}

// Cấu trúc Content tổng thể
export interface CVContent {
    // Phần bắt buộc (Standard Sections)
    profile_header: {
        full_name: string;
        headline: string;
        avatar_url?: string;
        [key: string]: any;
    };
    CONTACT: {
        email: string;
        phone: string;
        address: string;
        [key: string]: any;
    };
    SUMMARY?: string;
    EXPERIENCE?: ExperienceItem[];
    SKILLS?: SkillItem[];
    EDUCATION?: EducationItem[];
    [key: string]: any;
}
export class CreateCVSDto {
    @StringRequired('template_id')
    template_id!: string;
    @StringRequired('title')
    title!: string;
    @StringNotRequired('preview_url')
    preview_url?: string = '';
    @StringNotRequired('language')
    language: string = 'vi';
    @StringNotRequired('status')
    status: cv_status = cv_status.DRAFT;
    @StringNotRequired('visibility')
    visibility: cv_visibility = cv_visibility.PRIVATE;
    @ObjectNotRequired('content')
    content?: CVContent;
    @ObjectNotRequired('custom_config')
    custom_config?: Partial<CVTemplateConfig>;
    createCVSDto: any;
}

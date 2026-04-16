export const CV_JD_ANALYSIS_SYSTEM_PROMPT = `
Bạn là một Chuyên gia Tuyển dụng (TA) và Cố vấn Nghề nghiệp chuyên phân tích mức độ phù hợp giữa CV và Job Description.

Chỉ trả về JSON.

Quy tắc:
- Chỉ phân tích CV dựa trên JD được cung cấp.
- Mọi kết luận phải bám sát nội dung có trong CV và JD.
- Không được tự bịa thêm kỹ năng, kinh nghiệm, dự án, thành tựu hoặc bằng cấp.
- Nếu CV không có bằng chứng cho một yêu cầu trong JD, hãy xem đó là một khoảng thiếu (gap).
- Chỉ nêu các điểm yếu thực sự ảnh hưởng đến mức độ phù hợp.
- Mỗi weakness phải có bằng chứng từ JD, bằng chứng từ CV và reason ngắn gọn.
- Suggestions chỉ mang tính gợi ý, không tự sửa CV của người dùng.
- Toàn bộ nội dung phân tích phải bằng tiếng Việt.
- Có thể giữ nguyên tên công nghệ, framework, ngôn ngữ lập trình, công cụ và keyword kỹ thuật bằng tiếng Anh nếu đó là thuật ngữ chuyên môn.
- Văn phong ngắn gọn, chuyên nghiệp, rõ ràng theo góc nhìn tuyển dụng.
`.trim();
export function buildCvJdAnalysisUserPrompt(input: {
    cvMarkdown: string;
    jdMarkdown: string;
}): string {
    return `
# Nhiệm vụ
Phân tích mức độ phù hợp giữa CV ứng viên và Job Description.

# Mục tiêu đầu ra
Trả về JSON đúng theo schema đã cung cấp.

# Nguyên tắc chấm điểm
- Mỗi điểm số nằm trong khoảng từ 0 đến 100.
- Đánh giá nghiêm túc nhưng công bằng.
- Không đưa một yêu cầu đã khớp vào weaknesses.
- Nếu thiếu yêu cầu, phải giải thích rõ vì sao nó làm giảm mức độ phù hợp.

# Yêu cầu ngôn ngữ
- Toàn bộ phần phân tích phải bằng tiếng Việt.
- Có thể giữ nguyên thuật ngữ kỹ thuật bằng tiếng Anh.
- Evidence phải bám sát nội dung gốc trong CV và JD.

# CV
${input.cvMarkdown}

# Job Description
${input.jdMarkdown}
`.trim();
}
export const CV_JD_ANALYSIS_JSON_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: [
        'overall_score',
        'ats_score',
        'clarity_score',
        'impact_score',
        'weaknesses',
        'suggestions',
        'strengths',
        'structured_feedback',
    ],
    properties: {
        overall_score: { type: 'number' },
        ats_score: { type: 'number' },
        clarity_score: { type: 'number' },
        impact_score: { type: 'number' },
        weaknesses: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: [
                    'id',
                    'type',
                    'title',
                    'description',
                    'severity',
                    'impact_score',
                    'evidence',
                    'target_section',
                ],
                properties: {
                    id: { type: 'string' },
                    type: {
                        type: 'string',
                        enum: [
                            'missing_skill',
                            'missing_keyword',
                            'weak_bullet',
                            'weak_summary',
                            'ats_issue',
                            'experience_gap',
                        ],
                    },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    severity: {
                        type: 'string',
                        enum: ['low', 'medium', 'high'],
                    },
                    impact_score: { type: 'number' },
                    evidence: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['jd', 'cv', 'reason'],
                        properties: {
                            jd: { type: 'string' },
                            cv: { type: 'string' },
                            reason: { type: 'string' },
                        },
                    },
                    target_section: {
                        type: 'string',
                        enum: [
                            'summary',
                            'experience',
                            'skills',
                            'projects',
                            'education',
                        ],
                    },
                },
            },
        },
        suggestions: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['title', 'action'],
                properties: {
                    title: { type: 'string' },
                    action: { type: 'string' },
                },
            },
        },
        strengths: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['point', 'detail'],
                properties: {
                    point: { type: 'string' },
                    detail: { type: 'string' },
                },
            },
        },
        structured_feedback: {
            type: 'object',
            additionalProperties: false,
            required: ['summary_feedback', 'format_feedback'],
            properties: {
                summary_feedback: { type: 'string' },
                format_feedback: { type: 'string' },
            },
        },
    },
} as const;

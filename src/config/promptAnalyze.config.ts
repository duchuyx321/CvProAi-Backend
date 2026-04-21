export const CV_JD_ANALYSIS_SYSTEM_PROMPT = `
Bạn là chuyên gia tuyển dụng, chuyên đánh giá độ phù hợp giữa CV và Job Description.

Chỉ trả về JSON đúng schema.

Trước khi phân tích, hãy kiểm tra CV và JD có hợp lệ không. Nếu một trong hai bị rỗng, quá ngắn, không đủ cấu trúc để nhận diện, hoặc là văn bản ngẫu nhiên, thì không phân tích. Khi đó vẫn trả JSON đúng schema với:
- overall_score = 0
- ats_score = 0
- clarity_score = 0
- impact_score = 0
- strengths = []
- weaknesses chỉ phản ánh lỗi input
- suggestions chỉ hướng dẫn cung cấp lại CV/JD
- structured_feedback nêu rõ lý do không thể phân tích

Quy tắc:
- Chỉ đánh giá theo nội dung có trong CV và JD.
- Không bịa thêm kỹ năng, kinh nghiệm, dự án, thành tựu hoặc bằng cấp.
- Thiếu bằng chứng trong CV cho yêu cầu của JD = gap.
- Chỉ nêu weaknesses thực sự ảnh hưởng đến mức độ phù hợp.
- Mỗi weakness phải có jd, cv và reason.
- Suggestions chỉ là gợi ý, không viết lại CV.
- Phân tích bằng tiếng Việt, được giữ nguyên technical terms tiếng Anh.
- Văn phong ngắn gọn, rõ ràng, chuyên nghiệp.
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

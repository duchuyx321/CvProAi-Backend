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
export const CV_JD_WRITE_SYSTEM_PROMPT = `
Bạn là chuyên gia tối ưu CV theo Job Description.

Nhiệm vụ của bạn là tạo gợi ý chỉnh sửa CV dựa trên CV, JD và kết quả phân tích đã có.
Không chấm điểm lại.
Không trả markdown.
Không giải thích ngoài JSON.
Chỉ trả JSON đúng schema được yêu cầu.
Không bịa thêm kinh nghiệm, công ty, bằng cấp, kỹ năng, số liệu hoặc dự án không có trong CV.
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

// ai-rewrite.prompt.ts

export const CV_REWRITE_SUGGESTION_SYSTEM_PROMPT = `
Bạn là chuyên gia phân tích và tối ưu CV theo Job Description.

Nhiệm vụ của bạn:
1. Đọc CV, JD và kết quả phân tích đã có.
2. Nếu CV là file upload dạng text, chuyển CV thành JSON cv_content theo schema hệ thống.
3. Tạo rewrite_proposals để người dùng review và áp dụng vào CV.
4. Chỉ đề xuất chỉnh sửa có giá trị thực sự cho CV theo JD.

Bạn KHÔNG được:
- Không chấm điểm lại CV.
- Không trả về overall_score, ats_score, clarity_score, impact_score.
- Không giải thích ngoài JSON.
- Không trả markdown.
- Không bịa thêm kinh nghiệm, công ty, bằng cấp, dự án, số liệu, chứng chỉ, ngoại ngữ hoặc kỹ năng mà CV không có cơ sở.
- Không nhét keyword từ JD vào CV nếu CV không có bằng chứng.
- Không tạo proposal dạng lời khuyên chung chung.
- Không tạo proposal trùng ý, trùng target_path hoặc trùng new_text.

Quy tắc bắt buộc:
- Chỉ trả về JSON đúng schema.
- new_text phải là nội dung có thể đưa trực tiếp vào CV.
- Không dùng các cụm như: "có thể nhấn mạnh", "nên bổ sung", "ứng viên nên", "cần làm rõ", "có thể thêm".
- Nếu thông tin có thể đúng nhưng CV chưa xác nhận, vẫn được đề xuất nhưng phải đặt requires_confirmation = true.
- Nếu requires_confirmation = true, reason phải ghi rõ: "Chỉ áp dụng nếu ứng viên xác nhận thông tin này là đúng".
- Nếu skill đã tồn tại trong SKILLS thì không tạo proposal add lại skill đó.
- Nếu JD yêu cầu skill đã có trong SKILLS nhưng chưa có bằng chứng trong EXPERIENCE, hãy đề xuất cải thiện EXPERIENCE.description thay vì thêm trùng skill.
- Không sửa tên trường học, tên công ty, tên dự án để nhét keyword.
- Không đưa kỹ năng mềm hoặc ngoại ngữ vào EDUCATION.school hoặc SKILLS.name nếu đó không phải tên kỹ năng độc lập.
- Ưu tiên proposal dạng replace thay vì add nếu có thể cải thiện câu hiện có.
- Tối đa 5 proposal.
- Ưu tiên chất lượng hơn số lượng.
- status luôn là "pending".
- proposal_hash để chuỗi rỗng "".
- applied_at để chuỗi rỗng "".
- applied_by để chuỗi rỗng "".
- Nội dung tiếng Việt tự nhiên, chuyên nghiệp, phù hợp CV.
- Giữ nguyên technical terms tiếng Anh như React.js, Node.js, Express.js, NestJS, PostgreSQL, MongoDB, JWT, REST API.

Quy tắc action:
- action = "replace": dùng khi sửa lại nội dung đã có. Bắt buộc có old_text và new_text.
- action = "add": dùng khi thêm nội dung mới có cơ sở. old_text có thể là "".
- action = "remove": dùng khi loại bỏ nội dung sai hoặc thừa. new_text có thể là "".
- Với action = "add", insert_position phải là before, after, append hoặc prepend.
- Với action = "replace" hoặc "remove", insert_position có thể là "".

Quy tắc target_section:
Chỉ dùng một trong các giá trị:
summary, experience, skills, education, contact, additional_info

Quy tắc target_path:
- target_path phải trỏ đúng field thật trong CVContent.
- Không dùng target_path mơ hồ.
- Ví dụ hợp lệ:
  SUMMARY
  EXPERIENCE[0].description
  SKILLS[0].description
  EDUCATION[0].degree
  CONTACT.github
  ADDITIONAL_INFO[0]

Phân biệt source type:
- Nếu cv_source_type = "internal":
  - CV đã có trong hệ thống.
  - Chỉ trả rewrite_proposals.
  - Không trả cv_content.

- Nếu cv_source_type = "uploaded":
  - CV là text parse từ PDF/DOCX.
  - Bắt buộc convert thành cv_content.
  - Sau đó tạo rewrite_proposals dựa trên cv_content vừa convert.
`.trim();

export function buildCvRewriteSuggestionUserPrompt(input: {
    cvSourceType: 'internal' | 'uploaded';
    cvContent: string;
    jdContent: string;
    analysisResult: unknown;
}): string {
    return `
# Nhiệm vụ
Tạo gợi ý chỉnh sửa CV theo JD dựa trên kết quả phân tích đã có.

# CV Source Type
${input.cvSourceType}

# CV Content
${input.cvContent}

# Job Description
${input.jdContent}

# Analysis Result
${JSON.stringify(input.analysisResult, null, 2)}

# Yêu cầu đầu ra
- Trả về JSON đúng schema.
- Không chấm điểm lại.
- Không trả overall_score, ats_score, clarity_score, impact_score.
- Chỉ trả cv_content và rewrite_proposals.

# Quy tắc cho cv_content
- Nếu CV Source Type là "internal": trả cv_content = null.
- Nếu CV Source Type là "uploaded": convert CV text thành object CVContent:
  {
    "profile_header": {
      "full_name": "",
      "headline": ""
    },
    "CONTACT": {
      "email": "",
      "phone": "",
      "address": ""
    },
    "SUMMARY": "",
    "EXPERIENCE": [],
    "SKILLS": [],
    "EDUCATION": []
  }

# Quy tắc cho rewrite_proposals
- Chỉ tạo proposal có ích cho việc cải thiện CV theo JD.
- Ưu tiên sửa SUMMARY, EXPERIENCE, SKILLS.
- Không tạo quá nhiều proposal. Tối đa 8 proposal.
- Mỗi proposal phải đủ dữ liệu để backend apply sau này.
- Với CV uploaded, target_path phải trỏ vào cv_content đã convert.
- Với CV internal, target_path phải trỏ vào JSON CV hiện tại.

# Ví dụ proposal hợp lệ
{
  "id": "proposal_01",
  "weakness_id": "weakness_01",
  "action": "replace",
  "target_section": "experience",
  "target_path": "EXPERIENCE[0].description",
  "old_text": "Tham gia phát triển website quản lý CV.",
  "new_text": "Phát triển module quản lý CV bằng NestJS và PostgreSQL, hỗ trợ tạo, chỉnh sửa, lưu phiên bản và xuất PDF cho người dùng.",
  "reason": "Làm rõ công nghệ, vai trò và giá trị công việc phù hợp hơn với JD.",
  "severity": "high",
  "estimated_score_gain": 8,
  "status": "pending",
  "proposal_hash": "",
  "applied_at": "",
  "applied_by": ""
}
`.trim();
}
export function buildUploadedCvImportAndRewritePrompt(input: {
    cvText: string;
    jdContent: string;
    analysisResult: unknown;
}): string {
    return `
# Nhiệm vụ
CV này được upload từ bên ngoài và chỉ có dạng text đã parse từ PDF/DOCX.

Bạn cần làm 2 việc:
1. Convert CV text thành cv_content theo schema CVContent của hệ thống.
2. Tạo rewrite_proposals dựa trên cv_content vừa convert, JD và kết quả phân tích đã có.

Không chấm điểm lại.
Không trả về overall_score, ats_score, clarity_score, impact_score.

# Schema CVContent cần convert
{
  "profile_header": {
    "full_name": "",
    "headline": ""
  },
  "CONTACT": {
    "email": "",
    "phone": "",
    "address": ""
  },
  "SUMMARY": "",
  "EXPERIENCE": [
    {
      "company": "",
      "role": "",
      "start_date": "",
      "end_date": "",
      "is_current": false,
      "description": ""
    }
  ],
  "SKILLS": [
    {
      "name": "",
      "description": "",
      "level": 0,
      "years": 0
    }
  ],
  "EDUCATION": [
    {
      "school": "",
      "degree": "",
      "start_date": "",
      "end_date": "",
      "gpa": ""
    }
  ]
}

# Quy tắc convert CV
- Chỉ lấy thông tin có trong CV text.
- Không bịa thêm công ty, kỹ năng, bằng cấp, dự án, số liệu, chứng chỉ hoặc ngoại ngữ.
- Phải cố gắng giữ lại đầy đủ dữ liệu gốc quan trọng: ngày sinh, giới tính, email, phone, address, Github, website, chứng chỉ, khóa học, thông tin thêm, link project, số lượng thành viên nếu có.
- Nếu CV có Github cá nhân, đưa vào CONTACT.github.
- Nếu CV có ngày sinh, đưa vào CONTACT.date_of_birth.
- Nếu CV có giới tính, đưa vào CONTACT.gender.
- Nếu CV có khóa học, chứng chỉ hoặc thông tin thêm, đưa vào ADDITIONAL_INFO.
- Nếu project có link Github, đưa link vào EXPERIENCE[index].project_links.
- Nếu project có số lượng thành viên, đưa vào EXPERIENCE[index].team_size.
- Nếu thiếu field thì để chuỗi rỗng "", array rỗng [] hoặc false với is_current.
- EXPERIENCE.description có thể chuẩn hóa lỗi chính tả và format từ bullet gốc, nhưng không được thêm thông tin không có cơ sở.
- SKILLS phải tách thành từng item name ngắn gọn, ví dụ "React.js", "Node.js", "NestJS".
- Không nhét mô tả dài, tiếng Anh, teamwork hoặc keyword JD vào SKILLS.name.
- Nếu không xác định được level hoặc years thì để 0.

# Quy tắc rewrite_proposals
- Proposal phải trỏ vào cv_content đã convert.
- target_path phải dùng key thật của CVContent.
- Chỉ tạo proposal thật sự có thể cải thiện CV theo JD.
- Không tạo proposal trùng ý, trùng target_path hoặc trùng new_text.
- Không tạo nhiều proposal cho cùng một weakness nếu nội dung sửa gần giống nhau.
- new_text phải là nội dung có thể đưa trực tiếp vào CV.
- Không viết new_text dưới dạng lời khuyên, nhận xét hoặc hướng dẫn.
- Không dùng các cụm như: "có thể nhấn mạnh", "nên bổ sung", "ứng viên nên", "cần làm rõ".
- Không thêm thông tin không có trong CV, ví dụ: kinh nghiệm teamwork, tiếng Anh, công nghệ, thành tích, số liệu nếu CV không có bằng chứng.
- Nếu thông tin có thể đúng nhưng CV chưa xác nhận, đặt requires_confirmation = true.
- Nếu requires_confirmation = true, reason phải ghi rõ: "Chỉ áp dụng nếu ứng viên xác nhận thông tin này là đúng".
- Nếu skill đã tồn tại trong SKILLS thì không tạo proposal add lại skill đó.
- Nếu JD yêu cầu skill đã có trong SKILLS nhưng chưa có bằng chứng ở EXPERIENCE, hãy đề xuất cải thiện mô tả EXPERIENCE thay vì thêm trùng skill.
- Không sửa EDUCATION.school để thêm keyword.
- Không sửa SKILLS.name để nhét thêm mô tả dài.
- Ưu tiên proposal dạng replace ở SUMMARY và EXPERIENCE.description.
- Tối đa 5 proposal.
- status luôn là "pending".
- proposal_hash để chuỗi rỗng "".
- applied_at để chuỗi rỗng "".
- applied_by để chuỗi rỗng "".
- Nội dung trả về bằng tiếng Việt, giữ technical terms tiếng Anh khi cần.

# Quy tắc action
- action = "replace": bắt buộc có old_text và new_text.
- action = "add": bắt buộc có new_text và insert_position.
- action = "remove": bắt buộc có old_text.

# Ví dụ target_path
SUMMARY
EXPERIENCE[0].description
SKILLS[0].name
EDUCATION[0].school

# CV Text
${input.cvText}

# Job Description
${input.jdContent}

# Analysis Result
${JSON.stringify(input.analysisResult, null, 2)}

# Output JSON schema
{
  "cv_content": {
    "profile_header": {
      "full_name": "",
      "headline": ""
    },
    "CONTACT": {
      "email": "",
      "phone": "",
      "address": ""
    },
    "SUMMARY": "",
    "EXPERIENCE": [],
    "SKILLS": [],
    "EDUCATION": []
  },
  "rewrite_proposals": [
    {
      "id": "proposal_01",
      "weakness_id": "weakness_01",
      "action": "replace",
      "target_section": "experience",
      "target_path": "EXPERIENCE[0].description",
      "old_text": "",
      "new_text": "",
      "insert_position": "",
      "reason": "",
      "severity": "high",
      "estimated_score_gain": 0,
      "status": "pending",
      "proposal_hash": "",
      "applied_at": "",
      "applied_by": ""
    }
  ]
}

Chỉ trả về JSON. Không markdown. Không giải thích ngoài JSON.
`.trim();
}
export function buildInternalCvRewritePrompt(input: {
    cvContent: unknown;
    jdContent: string;
    analysisResult: unknown;
}): string {
    return `
# Nhiệm vụ
Tạo danh sách đề xuất chỉnh sửa CV theo Job Description dựa trên kết quả phân tích đã có.

Đây là CV đã có trong hệ thống.
CV input đã là JSON.
Không cần convert CV.
Không chấm điểm lại.
Không trả overall_score, ats_score, clarity_score, impact_score.
Chỉ trả rewrite_proposals.

# Quy tắc tạo rewrite_proposals
- Chỉ tạo proposal thật sự giúp CV tốt hơn theo JD.
- Không tạo proposal trùng ý, trùng target_path hoặc trùng new_text.
- Không tạo nhiều proposal gần giống nhau cho cùng một weakness.
- new_text phải là nội dung có thể đưa trực tiếp vào CV.
- Không viết new_text như lời khuyên hoặc nhận xét.
- Không dùng các cụm: "có thể nhấn mạnh", "nên bổ sung", "ứng viên nên", "cần làm rõ", "có thể thêm".
- Không thêm thông tin không có trong CV.
- Không bịa teamwork, tiếng Anh, kinh nghiệm, công nghệ, số liệu, thành tích, chứng chỉ.
- Nếu thông tin có thể đúng nhưng CV chưa xác nhận, đặt requires_confirmation = true.
- Nếu requires_confirmation = true, reason phải ghi rõ: "Chỉ áp dụng nếu ứng viên xác nhận thông tin này là đúng".
- Nếu skill đã có trong SKILLS thì không tạo proposal add lại skill đó.
- Nếu JD yêu cầu skill đã có trong SKILLS nhưng EXPERIENCE chưa thể hiện rõ, hãy viết lại EXPERIENCE.description để thể hiện tốt hơn.
- Không sửa tên trường học, tên công ty, tên dự án để thêm keyword.
- Không đưa kỹ năng mềm hoặc ngoại ngữ vào EDUCATION.school hoặc SKILLS.name nếu đó không phải tên kỹ năng độc lập.
- Không sửa CONTACT để thêm thông tin không có trong CV hiện tại.
- Ưu tiên sửa SUMMARY và EXPERIENCE.description.
- Ưu tiên action = "replace" hơn action = "add" nếu có thể.
- Tối đa 5 proposal.
- Nếu không có proposal thật sự tốt, trả array rỗng [].

# Quy tắc action
- action = "replace": dùng khi thay thế nội dung cũ bằng nội dung tốt hơn.
- action = "add": dùng khi thêm nội dung mới có cơ sở từ CV.
- action = "remove": dùng khi loại bỏ nội dung sai, thừa hoặc gây bất lợi.
- Với replace: old_text phải là đoạn đang tồn tại trong CV JSON.
- Với add: old_text có thể là "".
- Với remove: new_text có thể là "".
- Với add: insert_position phải là before, after, append hoặc prepend.
- Với replace/remove: insert_position có thể là "".

# Target path hợp lệ
SUMMARY
EXPERIENCE[0].description
SKILLS[0].description
EDUCATION[0].degree
CONTACT.github
ADDITIONAL_INFO[0]

# Ví dụ proposal tốt
{
  "id": "proposal_01",
  "weakness_id": "weakness_01",
  "action": "replace",
  "target_section": "experience",
  "target_path": "EXPERIENCE[0].description",
  "old_text": "Xây dựng Website SrcPlace.",
  "new_text": "Tự phát triển website SrcPlace với React.js, Node.js và Express.js, xây dựng các chức năng đăng ký, đăng nhập, JWT token rotation, giỏ hàng, thanh toán MoMo và trang quản trị quản lý người dùng, hóa đơn, dự án.",
  "insert_position": "",
  "reason": "Viết lại mô tả dự án rõ vai trò, công nghệ và chức năng đã triển khai, phù hợp hơn với JD backend/frontend intern.",
  "severity": "high",
  "estimated_score_gain": 8,
  "requires_confirmation": false,
  "status": "pending",
  "proposal_hash": "",
  "applied_at": "",
  "applied_by": ""
}

# Ví dụ proposal xấu không được tạo
- "Dự án cá nhân, tuy nhiên có thể nhấn mạnh khả năng làm việc độc lập."
- "Ứng viên nên bổ sung kỹ năng teamwork."
- "Đại Học Duy Tân (có khả năng đọc hiểu tài liệu tiếng Anh)"
- "React.js (có khả năng đọc hiểu tài liệu kỹ thuật tiếng Anh)"

# CV Content JSON
${JSON.stringify(input.cvContent, null, 2)}

# Job Description
${input.jdContent}

# Analysis Result
${JSON.stringify(input.analysisResult, null, 2)}

# Output JSON schema
{
  "rewrite_proposals": [
    {
      "id": "proposal_01",
      "weakness_id": "weakness_01",
      "action": "replace",
      "target_section": "experience",
      "target_path": "EXPERIENCE[0].description",
      "old_text": "",
      "new_text": "",
      "insert_position": "",
      "reason": "",
      "severity": "high",
      "estimated_score_gain": 0,
      "requires_confirmation": false,
      "status": "pending",
      "proposal_hash": "",
      "applied_at": "",
      "applied_by": ""
    }
  ]
}

Chỉ trả về JSON hợp lệ. Không markdown. Không giải thích ngoài JSON.
`.trim();
}
export const CV_CONTENT_JSON_SCHEMA = {
    type: 'object',
    properties: {
        profile_header: {
            type: 'object',
            properties: {
                full_name: { type: 'string' },
                headline: { type: 'string' },
                avatar_url: { type: 'string' },
            },
            required: ['full_name', 'headline'],
        },
        CONTACT: {
            type: 'object',
            properties: {
                email: { type: 'string' },
                phone: { type: 'string' },
                address: { type: 'string' },
            },
            required: ['email', 'phone', 'address'],
        },
        SUMMARY: { type: 'string' },
        EXPERIENCE: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    company: { type: 'string' },
                    role: { type: 'string' },
                    start_date: { type: 'string' },
                    end_date: { type: 'string' },
                    is_current: { type: 'boolean' },
                    description: { type: 'string' },
                },
                required: [
                    'company',
                    'role',
                    'start_date',
                    'is_current',
                    'description',
                ],
            },
        },
        SKILLS: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    level: { type: 'number' },
                    years: { type: 'number' },
                },
                required: ['name'],
            },
        },
        EDUCATION: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    school: { type: 'string' },
                    degree: { type: 'string' },
                    start_date: { type: 'string' },
                    end_date: { type: 'string' },
                    gpa: { type: 'string' },
                },
                required: ['school', 'degree'],
            },
        },
    },
    required: ['profile_header', 'CONTACT'],
} as const;

export const REWRITE_PROPOSAL_JSON_SCHEMA = {
    type: 'object',
    properties: {
        id: { type: 'string' },

        weakness_id: { type: 'string' },

        action: {
            type: 'string',
            enum: ['replace', 'add', 'remove'],
        },

        target_section: {
            type: 'string',
            enum: [
                'summary',
                'experience',
                'skills',
                'projects',
                'education',
                'contact',
                'additional_info',
            ],
        },

        target_path: { type: 'string' },

        old_text: { type: 'string' },

        new_text: { type: 'string' },

        insert_position: {
            type: 'string',
            enum: ['', 'before', 'after', 'append', 'prepend'],
        },

        reason: { type: 'string' },

        severity: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
        },

        estimated_score_gain: { type: 'number' },

        /**
         * true nếu proposal cần người dùng xác nhận vì CV chưa có bằng chứng rõ ràng.
         */
        requires_confirmation: { type: 'boolean' },

        status: {
            type: 'string',
            enum: ['pending'],
        },

        proposal_hash: { type: 'string' },
        applied_at: { type: 'string' },
        applied_by: { type: 'string' },
    },
    required: [
        'id',
        'weakness_id',
        'action',
        'target_section',
        'target_path',
        'old_text',
        'new_text',
        'insert_position',
        'reason',
        'severity',
        'estimated_score_gain',
        'requires_confirmation',
        'status',
        'proposal_hash',
        'applied_at',
        'applied_by',
    ],
} as const;

export const CV_JD_WRITE_INTERNAL_JSON_SCHEMA = {
    type: 'object',
    properties: {
        rewrite_proposals: {
            type: 'array',
            items: REWRITE_PROPOSAL_JSON_SCHEMA,
        },
    },
    required: ['rewrite_proposals'],
} as const;

export const CV_JD_WRITE_UPLOADED_JSON_SCHEMA = {
    type: 'object',
    properties: {
        cv_content: CV_CONTENT_JSON_SCHEMA,
        rewrite_proposals: {
            type: 'array',
            items: REWRITE_PROPOSAL_JSON_SCHEMA,
        },
    },
    required: ['cv_content', 'rewrite_proposals'],
} as const;

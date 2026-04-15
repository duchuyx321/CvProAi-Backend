import {
    BooleanRequired,
    ObjectRequired,
    StringNotRequired,
    StringRequired,
} from '~/common/decorators';

/**
 * Định nghĩa các kiểu bố cục tổng thể của trang CV
 */
export enum layoutConfig {
    STACK = 'STACK', // Các phần xếp chồng lên nhau từ trên xuống dưới (1 cột)
    SPLIT = 'SPLIT', // Chia trang thành các cột dọc (thường là Sidebar và Main Content)
    BANNER_SPLIT = 'BANNER_SPLIT', // Có một banner lớn ở trên đầu, phía dưới chia cột
}

/**
 * Cấu trúc nhóm các trường thông tin (Dùng để xử lý layout phức tạp bên trong 1 section)
 * Ví dụ: Avatar nằm bên trái, Họ tên và Headline nằm bên phải
 */
export type FieldGroup = {
    layout: 'STACK' | 'SPLIT'; // Sắp xếp các item bên trong theo hàng dọc hay cột nang
    items: (string | FieldGroup)[]; // Chứa tên field (string) hoặc tiếp tục chứa một nhóm con (đệ quy)
};

/**
 * Các loại Section (Phần nội dung) có trong một mẫu CV
 */
export enum SectionType {
    PROFILE = 'profile_header', // Phần đầu trang: Ảnh, tên, vị trí
    CONTACT = 'CONTACT', // Thông tin liên hệ: Email, Số điện thoại, Địa chỉ
    SKILLS = 'SKILLS', // Danh sách kỹ năng
    EXPERIENCE = 'EXPERIENCE', // Kinh nghiệm làm việc (Timeline)
    EDUCATION = 'EDUCATION', // Học vấn (Trường học, bằng cấp)
    PROJECTS = 'PROJECTS', // Các dự án cá nhân/thực tế
}

export type CVTemplateConfig = {
    version: number; // Phiên bản của schema (dùng để migration nếu sau này đổi cấu trúc JSON)

    layout: {
        key: string; // Mã định danh duy nhất của layout (ví dụ: 'classic_split')
        page: {
            size: 'A4'; // Kích thước chuẩn là A4
            margin: {
                // Khoảng cách lề trang (đơn vị thường là px hoặc mm)
                top: number;
                right: number;
                bottom: number;
                left: number;
            };
        };
        body: {
            layout: layoutConfig; // Kiểu bố cục chọn từ enum layoutConfig
            columns: {
                // Cấu hình chi tiết cho từng cột (nếu dùng SPLIT)
                id: string; // Định danh cột (ví dụ: 'left_col', 'right_col')
                width: number; // Chiều rộng tính theo % (ví dụ: 30, 70)
            }[];
        };
    };
    //{ "left_col": ["PROFILE", "CONTACT"], "right_col": ["EXPERIENCE"] }
    zones: Record<string, string[]>;

    sections: Record<
        string,
        {
            type: SectionType; // Loại section
            title: string; // Tiêu đề hiển thị
            variant?: string; // Các biến thể giao diện
            fields?: (string | FieldGroup)[]; // Danh sách các trường dữ liệu và cách sắp xếp chúng
            styles?: string; // Các custom CSS hoặc class dành riêng cho section này
        }
    >;
    theme: {
        fontFamily: string; // Font chữ sử dụng (Inter, Roboto, Arial...)
        colors: {
            primary: string; // Màu chủ đạo (Tiêu đề, icon)
            accent: string; // Màu nhấn (Badge, link, border)
        };
        prefix?: string; // Tiền tố cho tiêu đề section
        spacing: {
            sectionGap: number; // Khoảng cách giữa các Section lớn
            itemGap: number; // Khoảng cách giữa các dòng nội dung bên trong Section
        };
    };
};

export class CreateTemplateDTO {
    @StringRequired('Code')
    code!: string; // Mã code duy nhất của Template (ví dụ: 'CV_PROFESSIONAL_01')

    @StringRequired('name')
    name!: string; // Tên hiển thị của mẫu CV

    @BooleanRequired('is_premium')
    is_premium: boolean = false; // Đánh dấu mẫu CV này có phải trả phí (VIP) hay không
    @StringNotRequired('preview_url')
    preview_url?: string = '';
    @ObjectRequired('config')
    config!: CVTemplateConfig; // Toàn bộ cấu hình JSON của Template
}

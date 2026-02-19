# CVPro AI — Backend Service

Backend service cho hệ thống **CVPro AI**  
Nền tảng tạo CV trực tuyến tích hợp trí tuệ nhân tạo (AI), hỗ trợ đánh giá và gợi ý cải thiện nội dung CV, đồng thời triển khai cơ chế thanh toán gói dịch vụ nâng cao.

---

## 📌 Giới thiệu dự án

**CVPro AI** là hệ thống hỗ trợ người dùng:

- Tạo và quản lý CV trực tuyến
- Lưu lịch sử chỉnh sửa theo phiên bản (Versioning)
- Đánh giá CV theo mô tả công việc bằng AI
- Xuất CV ra file (PDF/DOCX tùy phạm vi triển khai)
- Đăng ký và thanh toán gói dịch vụ Premium

Backend chịu trách nhiệm xử lý toàn bộ nghiệp vụ hệ thống, quản lý dữ liệu, xác thực người dùng và cung cấp API cho frontend.

---

## 🚀 Chức năng chính

### 1. Quản lý tài khoản

- Đăng ký / Đăng nhập
- Quản lý hồ sơ cá nhân
- Phân quyền người dùng

### 2. Quản lý CV

- Tạo mới, chỉnh sửa, xóa CV
- Chọn template
- Lưu nội dung theo từng phiên bản
- Quản lý trạng thái và hiển thị

### 3. Đánh giá CV bằng AI

- Tạo lượt chấm điểm
- Phân tích mức độ phù hợp với mô tả công việc
- Lưu kết quả đánh giá và gợi ý cải thiện

### 4. Xuất file

- Xuất CV theo phiên bản cụ thể
- Lưu lịch sử xuất file

### 5. Thanh toán & Gói dịch vụ

- Quản lý gói Free / Premium
- Subscription theo chu kỳ
- Đơn hàng và giao dịch thanh toán

### 6. Quản trị hệ thống (tuỳ phạm vi)

- Quản lý người dùng
- Quản lý template và gói dịch vụ
- Theo dõi đơn hàng và nhật ký hệ thống

---

## 🗄️ Cơ sở dữ liệu

Hệ thống sử dụng PostgreSQL với 18 bảng chính, được chia theo các nhóm:

- Người dùng & phân quyền
- CV & Template
- AI Review
- Thanh toán & Subscription
- Nhật ký hệ thống

Thiết kế đảm bảo tính mở rộng, tách biệt nghiệp vụ và phù hợp triển khai thực tế.

---

## 👨‍💻 Thông tin tác giả

**Tên đề tài:**  
Xây dựng hệ thống tạo CV trực tuyến tích hợp AI đánh giá và hỗ trợ thanh toán dịch vụ – _CVPro AI_

**Tác giả:** Lê Đức Huy  
**Email:** duchuyx321@gmail.com  
**Năm thực hiện:** 2026

---

© 2026 CVPro AI. All rights reserved.

---
name: qtdyentho-hrm
version: 1.0.0
description: "Quy chuẩn Kỹ thuật & Nghiệp vụ Quản trị Nhân sự, Tín nhiệm & Hồ sơ Cán bộ (HRM Portal) - Quỹ Tín Dụng Nhân Dân Yên Thọ: Zero AI/Tech Jargon, Zero Technical ID Exposure, Cấm Font Mono, Enterprise Export Suite (In A4 2C/TCTD, Word, Excel), Phân quyền & Cấu hình Phân hệ"
category: hrm-portal-engineering

triggers:
  - "hrm"
  - "nhân sự"
  - "cán bộ"
  - "hồ sơ cán bộ"
  - "tín nhiệm"
  - "đánh giá tín nhiệm"
  - "luân chuyển"
  - "đào tạo"
  - "chứng chỉ"
  - "2c/tctd"
  - "in trích ngang"
  - "xuất word"
  - "xuất excel"
  - "quản trị nhân sự"
  - "thâm niên"
  - "qtdyentho-hrm"

intents:
  - "feature"
  - "bug_fix"
  - "refactor"
  - "ui_ux"
  - "data_change"

file_patterns:
  - "*employees*"
  - "*trust*"
  - "*exportUtils*"
  - "*hrm*"
  - "*Employee*"
  - "*firestore.rules*"
  - "*Transfer*"
  - "*Training*"

requires:
  - "cbi_impact"
  - "cbi_context_packet"
  - "security"
  - "ui-ux"

mcp_tools:
  - "cbi_search"
  - "cbi_context"
  - "cbi_impact"
  - "cbi_security_impact"

risk_level: high

auto_execute:
  analysis: true
  safe_fix: true
---

# QUY CHUẨN KỸ THUẬT & NGHIỆP VỤ PHÂN HỆ QUẢN TRỊ NHÂN SỰ & TÍN NHIỆM (QTDYENTHO-HRM)
# 5 NGUYÊN TẮC VÀNG DÀNH CHO CỔNG QUẢN TRỊ NHÂN SỰ QTDND YÊN THỌ

---

## 🏛️ 1. NGUYÊN TẮC 1: KHÔNG DÙNG NGÔN TỪ AI HOẶC KỸ THUẬT DƯ THỪA (ZERO AI / TECH JARGON)
1. **Tuyệt đối cấm các thuật ngữ AI và công nghệ trên UI**:
   - Cấm triệt để: "tự động nén qua Canvas", "chuẩn WebP", "Chuẩn Free Tier", "AI", "thuật toán", "bất biến", "tự động tối ưu dung lượng", "bảo toàn 100% token".
2. **Văn phong chuẩn mực cơ quan tài chính / Quỹ TDND**:
   - Toàn bộ nhãn (labels), tiêu đề, gợi ý nhập liệu (placeholders), thông báo hệ thống (toast messages), modal, và văn bản in ấn phải sử dụng 100% ngôn ngữ nghiệp vụ ngân hàng hợp tác.
   - Ngắn gọn, súc tích, trang trọng, chuẩn xác theo quy chế tổ chức và hoạt động của Quỹ TDND Yên Thọ.

---

## 🔒 2. NGUYÊN TẮC 2: ẨN TOÀN BỘ MÃ KỸ THUẬT KHỎI GIAO DIỆN (ZERO TECHNICAL ID EXPOSURE)
1. **Các mã kỹ thuật bắt buộc phải ẩn hoàn toàn khỏi UI**:
   - **UUID v4**: Chuỗi định danh ngẫu nhiên RFC 4122 (ví dụ: `8a2e4b3c-9df1-4a2e-...`) tuyệt đối không bao giờ hiển thị trên màn hình người dùng.
   - **Mã cán bộ kỹ thuật**: Các mã định danh hệ thống (`CB01`, `CB02`, `CB07`, `CB13`...) chỉ phục vụ logic ngầm định trong CSDL, không render ra danh bạ, thẻ cán bộ, bảng phân tích hay bản in.
   - **Mã chức vụ / vị trí**: Các mã như `pos-01`, `pos-02` được ẩn hoàn toàn; chỉ hiển thị tên chức danh chuẩn mực (Chủ tịch HĐQT, Giám đốc, Kế toán trưởng, Cán bộ Tín dụng...).
   - **Vai trò phân quyền hệ thống**: Các nhãn `role: 'admin'`, `role: 'staff'`, `super_admin` không hiển thị dạng thô; chỉ hiển thị trạng thái công tác hoặc chức vụ chuyên môn.
2. **Bảo toàn tính toàn vẹn CSDL ngầm định**:
   - Mọi bản ghi `employees`, `work_history`, `employee_training`, `evaluations_trust` vẫn bắt buộc lưu trữ đầy đủ `id` (UUID v4) và `code` để đảm bảo không bao giờ trùng lặp khóa chính/khóa ngoại, hỗ trợ liên kết mở rộng đa phân hệ trong tương lai.

---

## 🔤 3. NGUYÊN TẮC 3: CHUẨN MỰC TYPOGRAPHY - TUYỆT ĐỐI CẤM FONT MONO
1. **Cấm triệt để class `font-mono`**:
   - Giao diện tài chính - nhân sự của Quỹ TDND không sử dụng font monospace răng cưa cho họ tên, chức vụ, mã số, ngày tháng, hay số quyết định.
2. **Bộ font tiêu chuẩn**:
   - Sử dụng font sans-serif chất lượng cao (`Be Vietnam Pro` / `Inter` / system-ui) cho toàn bộ tiêu đề, nhãn và nội dung.
   - Các trường số liệu (năm thâm niên, số CCCD 12 số, số điện thoại, ngày cấp, số quyết định) sử dụng tính năng font số thẳng hàng: `tabular-nums` (`font-variant-numeric: tabular-nums`).

---

## 📄 4. NGUYÊN TẮC 4: BỘ CÔNG CỤ XUẤT BÁO CÁO DOANH NGHIỆP (ENTERPRISE EXPORT SUITE)
1. **In trích ngang A4 chuẩn mẫu 2C/TCTD**:
   - Hỗ trợ modal xem trước bản in khổ A4 dọc, căn lề chuẩn 15-20mm.
   - Hiển thị đầy đủ Quốc hiệu - Tiêu ngữ, ảnh chân dung 3x4cm, các thông tin định danh cá nhân, bảng tóm tắt Quá trình công tác và Bảng Văn bằng chứng chỉ chuyên môn.
   - Hỗ trợ phím tắt in trực tiếp qua trình duyệt (`window.print()`) với CSS `@media print` ẩn hoàn toàn các thanh điều hướng và nút bấm.
2. **Xuất file Microsoft Word (.docx)**:
   - Sử dụng thư viện `docx` tạo file văn bản hành chính `.docx` theo đúng bố cục 2C/TCTD của Ngân hàng Nhà nước.
   - Bảng biểu được tạo bằng cấu trúc Paragraph/Table chuẩn với đường viền mảnh thanh lịch, tiêu đề in hoa đậm nét, phần ký tên xác nhận của Cán bộ và Đại diện Lãnh đạo Quỹ.
3. **Xuất file Microsoft Excel (.xlsx)**:
   - Sử dụng thư viện `xlsx` (SheetJS) qua dynamic import để tối ưu bundle size.
   - Hai chế độ xuất file chuyên biệt:
     + **Xuất Toàn Bộ Danh Bạ Cán Bộ**: Xuất toàn bộ 13 cán bộ với đầy đủ thông tin: Họ tên, Giới tính, Ngày sinh, CCCD, Điện thoại, Email, Phòng ban, Chức danh, Ngày vào làm, Thâm niên, Đảng viên, Địa bàn phụ trách.
     + **Xuất Sơ Yếu Lý Lịch Cá Nhân**: Xuất trích ngang hồ sơ cán bộ chi tiết bao gồm Thông tin chung, Bảng Quá trình công tác, Bảng Chứng chỉ đào tạo.

---

## ⚙️ 5. NGUYÊN TẮC 5: CẤU HÌNH PHÂN HỆ & PHÂN QUYỀN TRUY CẬP (RBAC & MODULE CONFIGURATION)
1. **Lưu trữ cấu hình tại Cloud Firestore**:
   - Đường dẫn CSDL: `system_settings/module_hr` với cơ chế realtime listener `subscribeSubsystemConfig('hr')`.
2. **Các tham số cấu hình cốt lõi**:
   - `allowStaffViewDirectory` (boolean):
     + `true`: Cho phép toàn bộ cán bộ nhân viên xem danh bạ toàn Quỹ (mặc định mở).
     + `false`: Chế độ bảo mật cá nhân — Cán bộ thường (`staff`) chỉ được xem duy nhất hồ sơ cá nhân của mình, không truy cập được hồ sơ cán bộ khác. Ban Lãnh đạo (`admin`) luôn có quyền xem toàn bộ 13 cán bộ.
   - `transferMaxMonths` (number): Chu kỳ luân chuyển cán bộ tối đa theo quy định NHNN (mặc định: 36 tháng = 3 năm).
   - `transferWarningMonths` (number): Thời gian bắt đầu cảnh báo trước hạn luân chuyển (mặc định: 6 tháng).
   - `canStaffUploadTraining` (boolean): Cho phép cán bộ nhân viên tự gửi/cập nhật hồ sơ văn bằng, chứng chỉ của mình.
3. **Bảo mật và Nguyên tắc Zero Mock Data**:
   - 100% dữ liệu đọc/ghi trực tiếp từ Cloud Firestore, tuyệt đối không dùng dữ liệu giả (mock data).
   - Thao tác sửa cấu hình và thêm mới cán bộ chỉ dành cho Ban Lãnh đạo / Quản trị viên (`canManage = true`).

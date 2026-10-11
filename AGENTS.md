# QUY TẮC PHÁT TRIỂN & TRÍ NHỚ VĨNH VIỄN CHO AI AGENT - DỰ ÁN QTDYENTHO-HRM
# (Project Master Agent Rules & Architecture Memory)

Tài liệu này là **Quy tắc Bắt buộc & Trí nhớ Cốt lõi** dành cho mọi AI Agent (Antigravity/Gemini) làm việc trong dự án `QtdYenTho-HRM` (Cổng Thông Tin & Quản Trị Nhân Sự - Quỹ Tín Dụng Nhân Dân Yên Thọ).

---

## 🎯 1. PHẠM VI KHÔNG GIAN LÀM VIỆC (WORKSPACE BOUNDARY)
- **THƯ MỤC DỰ ÁN DUY NHẤT**: `d:\Antigravity Projects\QtdYenTho-HRM`
- **QUY TẮC BẤT DI BẤT DỊCH**: Mọi thao tác tìm kiếm, đọc tệp, sửa đổi mã nguồn, cập nhật tài liệu `.md` **CHỈ ĐƯỢC PHÉP THỰC HIỆN TRONG THƯ MỤC DỰ ÁN `QtdYenTho-HRM`**. Tuyệt đối không quét hoặc can thiệp ra ngoài thư mục dự án.

---

## 🛡️ 2. NGUYÊN TẮC BẤT XÂM PHẠM & CÔ LẬP PHÂN HỆ (MODULE ISOLATION & NON-INTERFERENCE)

> **YÊU CẦU CỐT LÕI TỪ NGƯỜI DÙNG**:
> Các phân hệ đã hoạt động tốt và ổn định (như **Phân hệ Đánh giá Tín nhiệm `MODULE_TRUST`**, **Phân hệ Cấu hình & Quản trị Hệ thống `MODULE_SETTINGS`**, **Cổng Điều Hướng Ô Lưới `MODULE_PORTAL`**) là **BẤT XÂM PHẠM**.

1. **Không Gây Tác Động Tiêu Cực Đến Module Đang Ổn Định**:
   - Khi triển khai, mở rộng hoặc nâng cấp các module khác (như `MODULE_HR`, `MODULE_KPI`, `MODULE_PLANNING`, `MODULE_TIMEKEEPING`, `MODULE_PAYROLL`):
     * Tuyệt đối không phá vỡ hợp đồng dữ liệu (Data Contract) hay schema của các bảng đang phục vụ các module hoạt động tốt (`trust_criteria`, `evaluation_periods`, `evaluations_trust`, `period_configs`, `system_settings`, `accounts`, `roles_permissions`).
     * Không chỉnh sửa cấu trúc định tuyến (routing), auth logic hay permissions matrix dùng chung làm mất quyền truy cập vào các module hiện có.
2. **Cô Lập Mã Nguồn Phân Hệ (Modular Decoupling)**:
   - Mỗi phân hệ chức năng sở hữu vùng chứa (container) và components riêng biệt đặt tại `src/features/<module_name>/`.
   - Các logic tính toán chuyên biệt không được gộp vào global context gây tràn lỗi (Cascading Failure).

---

## 🔄 3. QUY CHUẨN ĐỒNG BỘ CSDL VÀ MÃ NGUỒN (CODE & DATABASE IN-SYNC PROTOCOL)

> **QUY TẮC BẮT BUỘC**:
> Khi có bất kỳ thay đổi nào về thiết kế bảng/collection CSDL, **BẮT BUỘC ĐỒNG BỘ 100% CẢ VỀ MÃ NGUỒN VÀ CSDL**. Tuyệt đối không để xảy ra tình trạng bảng chỉ có trên tài liệu hoặc chỉ có trong CSDL mà mã nguồn không có định nghĩa.

Mỗi lần thay đổi cấu trúc bảng CSDL, AI Agent phải cập nhật đồng bộ các tệp sau trong cùng một phiên làm việc:
1. `src/lib/schema.js`: Định nghĩa Schema, TypeScript types/JSDoc, hàm validation và giá trị mặc định của bảng.
2. `src/lib/systemDefaults.js`: Khai báo dữ liệu mẫu (Seed Data) chuẩn mực của bảng, bảo đảm Zero Mock Policy.
3. `src/lib/services.js`: Viết các hàm nghiệp vụ chuẩn (`get`, `subscribe`, `save`, `delete`) kết nối Firestore.
4. `src/lib/autoInitDb.js`:
   - Bổ sung tên collection vào danh sách `CORE_COLLECTIONS`.
   - Thêm logic tự động khởi tạo/đồng bộ vào `autoSyncDatabaseSchema()` và `autoInitializeFirebaseDatabase()`.
   - Cập nhật số phiên bản `CURRENT_SCHEMA_VERSION`.
5. `firestore.rules`: Khai báo quy tắc bảo mật đọc/ghi tương ứng trên collection mới.
6. `docs/DATABASE_SCHEMA_HRM_TRUST.md`: Cập nhật đặc tả schema chi tiết trong tài liệu tương ứng.

---

## 🗄️ 4. PHƯƠNG ÁN NÂNG CẤP CSDL AN TOÀN (ZERO-DOWNTIME DATABASE MIGRATION PLAN)

Khi cần mở rộng CSDL cho các phân hệ mới:
1. **Mở Rộng Không Phá Vỡ (Additive Non-Breaking Changes)**:
   - Luôn thêm trường mới dưới dạng tùy chọn (Optional / Nullable) kèm fallback giá trị mặc định ở tầng Presentation.
   - Không đổi tên (rename) hoặc xóa cột của các bảng đang chạy.
2. **Bảo Toàn 100% Dữ Liệu Hiện Hữu (Zero Data Loss)**:
   - Thao tác ghi đè cấu hình phải sử dụng `{ merge: true }` (`setDoc(..., payload, { merge: true })`).
3. **Cơ Chế Tự Chữa Lành (Self-Healing Schema)**:
   - Hệ thống tự động so khớp `CURRENT_SCHEMA_VERSION` với `system_metadata/schema`. Nếu phát hiện phiên bản mới hoặc thiếu bảng, hệ thống sẽ tự động bù đắp mà không làm gián đoạn người dùng.

---

## 🏛️ 5. BẢN ĐỒ 18 COLLECTIONS NÒNG CỐT HIỆN TẠI (SCHEMA V5.3)

Hệ thống quản trị CSDL Firestore hiện tại quản lý chính xác 18 Collections nòng cốt (Schema `2026.10.11_v5.3_flexible_transfer_rules_and_full_training_lifecycle`):
1. `accounts`: Danh sách tài khoản đăng nhập, xác thực và phân quyền.
2. `employees`: Danh bạ Cán bộ Nhân viên chính thức của Quỹ (`emp-001` .. `emp-013`).
3. `system_metadata`: Siêu dữ liệu phiên bản CSDL và lịch sử đồng bộ (`schema_status`).
4. `system_modules`: Danh mục 8 phân hệ chức năng hệ thống.
5. `system_settings`: Cấu hình thông tin pháp nhân, tham số chung và phân hệ (bao gồm `transferRules` linh hoạt).
6. `roles_permissions`: Ma trận phân quyền RBAC toàn hệ thống.
7. `departments`: Danh mục 5 phòng ban chuẩn của Quỹ.
8. `positions`: Danh mục chức vụ và vị trí công tác.
9. `trust_criteria`: 10 tiêu chí đánh giá tín nhiệm chuẩn mực NHNN.
10. `evaluation_periods`: Danh mục các đợt đánh giá & lấy phiếu tín nhiệm.
11. `period_configs`: Bảng cấu hình độc lập cho từng đợt đánh giá.
12. `users`: Hồ sơ cán bộ nhân viên và tài khoản quản trị (`emp-root`, `emp-001` .. `emp-013`).
13. `work_history`: Quá trình luân chuyển điều động & bổ nhiệm cán bộ (`trans-001` .. `trans-005`).
14. `evaluations_trust`: Phiếu đánh giá tín nhiệm chi tiết.
15. `evaluations_kpi`: Dữ liệu đánh giá hiệu quả KPI 3 cấp.
16. `evaluations_planning`: Dữ liệu bỏ phiếu quy hoạch cán bộ nguồn.
17. `employee_training`: Hồ sơ văn bằng, chứng chỉ và chu trình đào tạo chuyên sâu toàn diện.
18. `employee_kpi_history`: Lịch sử diễn biến kết quả xếp loại KPI nhiều năm.

---

## 👥 6. CHUẨN HÓA ĐỊNH DANH CÁN BỘ & MÃ UUID BẤT BIẾN RFC 4122 V4 (ZERO DUPLICATE POLICY)

> **QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ 100%)**:
> - Mỗi Cán bộ Nhân viên sở hữu một mã `uuid` chuẩn RFC 4122 v4 (36 ký tự phân tách bằng dấu gạch ngang) bảo đảm duy nhất, không trùng lặp toàn hệ thống.
> - Tuyệt đối không để xảy ra hiện tượng trùng lặp danh bạ CBNV, lặp đôi tên cán bộ trong danh sách cử tri ("Chưa nộp phiếu", "Đã nộp phiếu") hay danh mục đối tượng được đánh giá.

1. **Chuẩn Hóa Mã UUID & ID Cán Bộ**:
   - Trường `uuid`: Lưu mã UUID v4 bất biến cho 100% cán bộ trong Firestore (`employees` và `users`). Hàm `createEmployeeProfile` tự động gán `uuid = generateUUID()` khi thêm mới nhân sự.
   - Trường `id`: Sử dụng định danh chuẩn: `emp-001` đến `emp-013` (13 Cán bộ Nhân viên chính thức của Quỹ).
   - Tài khoản Quản trị Cấp cao hệ thống: `emp-root` (code: `ROOT`, email: `qtdyentho@gmail.com`).
   - Các collection phụ thuộc (`work_history`, `employee_training`, `employee_kpi_history`) lưu trữ đồng thời cả `employeeId` và `employeeUuid` để phục vụ liên thông và mở rộng về sau.
2. **Cấu Trúc Các Table Lưu Trữ Độc Lập Phục Vụ Mở Rộng**:
   - Mọi thực thể nghiệp vụ nhân sự chuyên sâu được lưu vào các collection riêng biệt: `work_history`, `employee_training`, `employee_kpi_history`, `departments`, `positions`.
   - Thiết kế này bảo đảm khi mở rộng phân hệ mới (như Chấm công `MODULE_TIMEKEEPING`, Tính lương `MODULE_PAYROLL` hay Khen thưởng `MODULE_AWARDS`) sẽ không làm xáo trộn các bảng hiện hữu.
3. **Kiến Trúc Giao Diện Master - Detail 2 Phần Kế Thừa Phân Hệ Đánh Giá**:
   - Phân hệ Quản trị Nhân sự (`MODULE_HR` / `/employees`) kế thừa trọn vẹn bố cục Master-Detail iPad 2 phần:
     * **Cột trái (Master Sidebar)**: Tìm kiếm, lọc theo phòng ban, danh sách thẻ cán bộ mini với Avatar nén an toàn, huy hiệu thâm niên và chỉ báo cảnh báo luân chuyển động theo `hrConfig.transferRules`.
     * **Cột phải (Detail Panel)**: 5 Tab chức năng (*Hồ sơ trích ngang 2C/TCTD*, *Theo dõi luân chuyển công tác*, *Hồ sơ đào tạo & chứng chỉ*, *Cơ cấu & Thống kê*, *Cấu hình phân hệ & chức vụ*).
     * **Thanh Bottom Navigation Di Động**: 5 icon điều hướng cố định đáy màn hình mobile/tablet.
   - 100% responsive, triệt tiêu toàn bộ từ ngữ AI hay giải thích thừa thãi, tập trung vào nghiệp vụ ngân hàng hợp tác.
4. **Cơ Chế Luân Chuyển Linh Hoạt & Đào Tạo Toàn Diện**:
   - Vị trí nào phải luân chuyển và thời hạn cụ thể từng vị trí được đưa vào Cấu hình CSDL (`hrConfig.transferRules`), không gắn cứng cố định.
   - Tab Luân chuyển công tác thuần túy phục vụ **theo dõi tiến độ thâm niên và cảnh báo**, không lập quyết định tại phân hệ này.
   - Phân hệ Đào tạo theo dõi toàn diện: Khóa đào tạo, Đơn vị tổ chức (NHNN, Hiệp hội QTDND...), Quyết định/Kế hoạch cử đi học, Thời gian (từ ngày - đến ngày), Địa điểm, Nội dung đào tạo, Chứng chỉ cấp (tên, số hiệu, ngày cấp/hạn, xếp loại, xem ảnh scan).
   - Đầy đủ CRUD cán bộ: Thêm mới, chỉnh sửa và xóa an toàn có xác nhận với quyền `canManage`.
   - Bổ sung Thống kê Cơ cấu Trình độ Chuyên môn / Học vấn toàn Quỹ.

---

## 🚀 7. QUY TRÌNH NGHIỆM THU & DEPLOY 4 TẦNG BẮT BUỘC
Sau mọi thay đổi mã nguồn hoặc cấu hình:
1. **Kiểm tra linter**: `npm run lint` $\rightarrow$ Đảm bảo **0 errors**.
2. **Kiểm tra build**: `npm run build` $\rightarrow$ Đảm bảo **Exit Code 0**.
3. **Kiểm thử tự động**: `npx playwright test` $\rightarrow$ Đảm bảo **11/11 tests PASS 100%**.
4. **Commit & Push Git**: Commit tường minh và push lên nhánh `master` (`git push origin master`).
5. **Deploy Firebase**: Deploy Hosting và Firestore Rules (`npm run ship "<thông điệp>"`, hoặc `npm run ship:all "<thông điệp>"`).
6. **Kiểm tra URL trực tiếp**: [https://qtdyentho-hrm.web.app](https://qtdyentho-hrm.web.app).

---

## 🛡️ 8. CHUẨN MỰC NGÔN NGỮ & VĂN PHONG HÀNH CHÍNH
- 100% tiếng Việt chuẩn mực theo ngôn ngữ quản trị điều hành của Quỹ tín dụng nhân dân Việt Nam.
- **TUYỆT ĐỐI KHÔNG DÙNG TỪ NGỮ AI, CHATBOT HAY THUẬT NGỮ KỸ THUẬT RƯỜM RÀ** trên giao diện người dùng.
- Định danh chuẩn mực:
  - Đơn vị: **Quỹ tín dụng nhân dân Yên Thọ**
  - Địa chỉ: **Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa**
  - Thời gian: Định dạng chuẩn `dd/mm/yyyy` theo giờ Việt Nam GMT+7.

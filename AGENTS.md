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

## 🏛️ 5. BẢN ĐỒ 16 COLLECTIONS NÒNG CỐT HIỆN TẠI (SCHEMA V4.0)

Hệ thống quản trị CSDL Firestore hiện tại quản lý chính xác 16 Collections nòng cốt:
1. `accounts`: Danh sách tài khoản đăng nhập, xác thực và phân quyền.
2. `employees`: Danh bạ Cán bộ Nhân viên chính thức của Quỹ.
3. `system_metadata`: Siêu dữ liệu phiên bản CSDL và lịch sử đồng bộ (`schema`).
4. `system_modules`: Danh mục 8 phân hệ chức năng hệ thống.
5. `system_settings`: Cấu hình thông tin pháp nhân, tham số chung và phân hệ.
6. `roles_permissions`: Ma trận phân quyền RBAC toàn hệ thống.
7. `departments`: Danh mục 5 phòng ban chuẩn của Quỹ.
8. `positions`: Danh mục chức vụ và vị trí công tác.
9. `trust_criteria`: 10 tiêu chí đánh giá tín nhiệm chuẩn mực NHNN.
10. `evaluation_periods`: Danh mục các đợt đánh giá & lấy phiếu tín nhiệm.
11. `period_configs`: Bảng cấu hình độc lập cho từng đợt đánh giá.
12. `users`: Hồ sơ cán bộ nhân viên (tương thích ngược).
13. `work_history`: Quá trình luân chuyển điều động & bổ nhiệm cán bộ.
14. `evaluations_trust`: Phiếu đánh giá tín nhiệm chi tiết.
15. `evaluations_kpi`: Dữ liệu đánh giá hiệu quả KPI 3 cấp.
16. `evaluations_planning`: Dữ liệu bỏ phiếu quy hoạch cán bộ nguồn.

---

## 🚀 6. QUY TRÌNH NGHIỆM THU & DEPLOY 4 TẦNG BẮT BUỘC
Sau mọi thay đổi mã nguồn hoặc cấu hình:
1. **Kiểm tra linter**: `npm run lint` $\rightarrow$ Đảm bảo **0 errors**.
2. **Kiểm tra build**: `npm run build` $\rightarrow$ Đảm bảo **Exit Code 0**.
3. **Commit & Push Git**: Commit tường minh và push lên nhánh `master` (`git push origin master`).
4. **Deploy Firebase**: Deploy Hosting và Firestore Rules (`npm run ship "<thông điệp>"`, hoặc `npm run ship:all "<thông điệp>"`).
5. **Kiểm tra URL trực tiếp**: [https://qtdyentho-hrm.web.app](https://qtdyentho-hrm.web.app).

---

## 🛡️ 7. CHUẨN MỰC NGÔN NGỮ & VĂN PHONG HÀNH CHÍNH
- 100% tiếng Việt chuẩn mực theo ngôn ngữ quản trị điều hành của Quỹ tín dụng nhân dân Việt Nam.
- **TUYỆT ĐỐI KHÔNG DÙNG TỪ NGỮ AI, CHATBOT HAY THUẬT NGỮ KỸ THUẬT RƯỜM RÀ** trên giao diện người dùng.
- Định danh chuẩn mực:
  - Đơn vị: **Quỹ tín dụng nhân dân Yên Thọ**
  - Địa chỉ: **Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa**
  - Thời gian: Định dạng chuẩn `dd/mm/yyyy` theo giờ Việt Nam GMT+7.

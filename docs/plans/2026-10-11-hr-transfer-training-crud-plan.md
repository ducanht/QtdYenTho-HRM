# Kế Hoạch Chi Tiết: Nâng Cấp Phân Hệ Quản Trị Nhân Sự (HRM)
## Cấu Hình Luân Chuyển Linh Hoạt, Theo Dõi Đào Tạo Chuyên Sâu, CRUD Cán Bộ & Thống Kê Trình Độ

> **Mục tiêu:** Nâng cấp toàn diện phân hệ Quản trị Nhân sự:
> 1. Đưa vị trí luân chuyển và thời hạn vào cấu hình CSDL linh hoạt (không gán cứng).
> 2. Phân hệ luân chuyển công tác chỉ dùng để theo dõi (loại bỏ lập quyết định).
> 3. Quản lý và theo dõi đầy đủ thông tin các khóa đào tạo nghiệp vụ (Đơn vị tổ chức, Quyết định/Kế hoạch, Thời gian, Địa điểm, Nội dung, Chứng chỉ cấp).
> 4. Hoàn thiện bộ tính năng Thêm, Chỉnh sửa, Xóa cán bộ nhân viên với xác nhận an toàn.
> 5. Bổ sung Thống kê Trình độ chuyên môn/học vấn trong Tab Cơ cấu & Thống kê.
> 6. Tự động đồng bộ CSDL Firestore qua phiên bản schema `2026.10.11_v5.3_flexible_transfer_rules_and_full_training_lifecycle`.

---

### Task 1: Cấu Trúc Dữ Liệu & Thiết Lập Mặc Định (`systemDefaults.js`, `schema.js`, `services.js`)
- [ ] Thêm mảng `transferRules` vào `DEFAULT_MODULE_HR_SETTINGS` trong `src/lib/systemDefaults.js`.
- [ ] Cập nhật hàm `saveEmployeeTraining` trong `src/lib/services.js` để lưu đầy đủ các trường: `organizer`, `decisionNo`, `startDate`, `endDate`, `location`, `content`, `certificateName`, `certificateNumber`, `issueDate`, `expireDate`, `grade`, `certificateImage`.
- [ ] Cập nhật hàm `deleteEmployeeProfile` trong `src/lib/services.js` để hỗ trợ xóa an toàn tài liệu trong `employees` và `users`.

### Task 2: Nâng Cấp Cấu Hình Luân Chuyển Theo Chức Vụ (`EmployeeSettingsTab.jsx`)
- [ ] Xây dựng bảng cấu hình vị trí luân chuyển: Danh sách tất cả chức vụ với nút bật/tắt `requiresTransfer`, ô nhập `maxMonths` (thời hạn luân chuyển) và `warningMonths` (cảnh báo trước).
- [ ] Kết nối hàm lưu cấu hình vào Firestore `system_settings/module_hr`.

### Task 3: Chuyển Đổi Tab Luân Chuyển Thành Chỉ Theo Dõi (`EmployeeTransferHistory.jsx`, `EmployeesContainer.jsx`)
- [ ] Loại bỏ nút và luồng "Lập quyết định luân chuyển" khỏi `EmployeeTransferHistory.jsx`.
- [ ] Tích hợp `hrConfig.transferRules` để xác định động vị trí của cán bộ có thuộc diện luân chuyển hay không và thời hạn luân chuyển là bao nhiêu tháng (thay vì kiểm tra cứng 36 tháng).
- [ ] Hiển thị thông báo trạng thái rõ ràng đối với các vị trí không thuộc diện luân chuyển định kỳ.

### Task 4: Nâng Cấp Quản Lý Khóa Đào Tạo Nghiệp Vụ (`AddTrainingModal.jsx`, `EmployeeTrainingTab.jsx`)
- [ ] Bổ sung các trường nhập liệu trong `AddTrainingModal.jsx`: Đơn vị tổ chức (NHNN, Hiệp hội QTDND...), Số QĐ/Kế hoạch cử đi học, Thời gian (Từ ngày - Đến ngày), Địa điểm, Nội dung đào tạo, Tên chứng chỉ, Số hiệu, Ngày cấp, Hạn hiệu lực, Xếp loại, Ảnh scan.
- [ ] Cập nhật giao diện thẻ khóa đào tạo trong `EmployeeTrainingTab.jsx`: Hiển thị chi tiết đơn vị tổ chức, số quyết định, thời gian, địa điểm, nội dung tóm tắt và chứng chỉ cấp.

### Task 5: Hoàn Thiện Thêm, Chỉnh Sửa, Xóa Cán Bộ Nhân Viên (`EmployeeProfileDetail.jsx`, `EmployeesContainer.jsx`)
- [ ] Thêm nút "Xóa cán bộ" trong `EmployeeProfileDetail.jsx` (chỉ hiển thị cho Admin/Lãnh đạo `canManage = true`).
- [ ] Tạo Modal/Hộp thoại xác nhận xóa an toàn cán bộ (yêu cầu gõ lại tên cán bộ hoặc bấm xác nhận).
- [ ] Đảm bảo nút "Chỉnh sửa hồ sơ" và "Thêm mới" hoạt động đồng bộ với Firestore.

### Task 6: Bổ Sung Thống Kê Trình Độ Học Vấn & Cập Nhật Giám Sát Linh Hoạt (`EmployeeAnalyticsTab.jsx`)
- [ ] Tính toán cơ cấu trình độ học vấn/chuyên môn (Thạc sĩ, Đại học, Cao đẳng, Trung cấp, Khác) từ `employees.education`.
- [ ] Hiển thị Khối Báo Cáo Cơ Cấu Trình Độ Chuyên Môn kèm số lượng và tỷ lệ %.
- [ ] Cập nhật Bảng giám sát luân chuyển toàn Quỹ sử dụng quy tắc động từ `hrConfig.transferRules`.

### Task 7: Cập Nhật Auto-Sync CSDL, Kiểm Thử Playwright, Documentation & Git
- [ ] Cập nhật `autoInitDb.js`: Tăng `CURRENT_SCHEMA_VERSION` lên `2026.10.11_v5.3_flexible_transfer_rules_and_full_training_lifecycle`.
- [ ] Cập nhật các file tài liệu: `docs/modules/03_HR_EMPLOYEES_AND_TRANSFERS.md`, `docs/DATABASE_SCHEMA_HRM_TRUST.md`, `AGENTS.md`, `.agent/skills/qtdyentho-hrm/SKILL.md`.
- [ ] Chạy `npm run lint`, `npm run build`, `npx playwright test`.
- [ ] Thực hiện Git commit và push lên remote repo.

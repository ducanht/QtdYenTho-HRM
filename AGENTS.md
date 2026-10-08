# QUY TẮC PHÁT TRIỂN & TRÍ NHỚ VĨNH VIỄN CHO AI AGENT - DỰ ÁN QTDYENTHO-HRM
# (Project Master Agent Rules & Architecture Memory)

Tài liệu này là **Quy tắc Bắt buộc & Trí nhớ Cốt lõi** dành cho mọi AI Agent (Antigravity/Gemini) làm việc trong dự án `QtdYenTho-HRM` (Cổng Thông Tin & Quản Trị Nhân Sự - Quỹ Tín Dụng Nhân Dân Yên Thọ).

---

## 🚀 1. QUY TẮC TỐI THƯỢNG: TỰ ĐỘNG GIT PUSH & FIREBASE DEPLOY SAU MỖI THAY ĐỔI
### (Immediate Atomic Git Commit, Push & Firebase Deploy Rule)

> **YÊU CẦU CỐT LÕI TỪ NGƯỜI DÙNG**:
> Sau **BẤT KỲ LẦN THAY ĐỔI MÃ NGUỒN**, hoàn thành tính năng, sửa lỗi, cập nhật giao diện hoặc cấu hình trong dự án `QtdYenTho-HRM`:
> AI Agent **BẮT BUỘC** phải tự động chạy toàn bộ quy trình:
> 1. Kiểm tra chất lượng & lint: `npm run lint`
> 2. Kiểm tra build sản xuất: `npm run build`
> 3. Tự động commit Git với thông điệp rõ ràng theo chuẩn Conventional Commits (`feat:`, `fix:`, `refactor:`, `perf:`...).
> 4. Tự động Push mã nguồn lên GitHub: `git push origin master`.
> 5. Tự động Deploy lên Google Firebase Hosting: `firebase.cmd deploy --only hosting` (hoặc `npm run ship "<commit message>"`).
> 6. Báo cáo bằng chứng thực thi thành công kèm URL chạy trực tiếp: `https://qtdyentho-hrm.web.app`.

### Lệnh tắt nhanh chuẩn hoá:
```bash
# Tự động thực hiện toàn bộ 4 bước chỉ trong 1 lệnh duy nhất:
npm run ship "feat(module): nội dung cập nhật tính năng"

# Hoặc nếu deploy cả Firestore Rules & Indexes:
npm run ship:all "feat(schema): cập nhật firestore rules"
```

---

## 🏛️ 2. Thông Tin Dự Án & Cấu Hình Môi Trường
- **Tên dự án**: `qtdyentho-hrm` (Cổng Quản Trị Nhân Sự & Tín Nhiệm - QTDND Yên Thọ)
- **Đơn vị áp dụng**: Quỹ Tín Dụng Nhân Dân Yên Thọ (Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa)
- **Tech Stack**:
  - React 19 + Vite 8
  - Tailwind CSS v4 (`@tailwindcss/vite`)
  - Lucide React icons & Recharts
  - Firebase Authentication + Cloud Firestore
- **Live URL**: [https://qtdyentho-hrm.web.app](https://qtdyentho-hrm.web.app)
- **Firebase Console**: [https://console.firebase.google.com/project/qtdyentho-hrm/overview](https://console.firebase.google.com/project/qtdyentho-hrm/overview)
- **GitHub Repository**: [https://github.com/ducanht/QtdYenTho-HRM.git](https://github.com/ducanht/QtdYenTho-HRM.git) (Nhánh mặc định: `master`)

---

## 🛡️ 3. Quy Tắc Nghiệp Vụ & Kỹ Thuật Bắt Buộc
1. **Chuẩn Mực Ngôn Ngữ Hành Chính & Văn Hóa Tổ Chức**:
   - 100% tiếng Việt chính quy theo chuẩn nghiệp vụ Quỹ tín dụng nhân dân Việt Nam.
   - **Tuyệt đối không dùng văn phong AI hay thuật ngữ kỹ thuật xa lạ** trên giao diện người dùng.
2. **Quy Định Đánh Giá Tín Nhiệm & Bỏ Phiếu Kín**:
   - Hình thức `Ẩn danh` (Bỏ phiếu kín) hay `Công khai` (Định danh) do Ban Lãnh đạo cấu hình ở cấp Đợt (`evaluation_periods`), cán bộ không tự ý chọn.
3. **Phân Quyền & Bảo Mật RBAC**:
   - 4 nhóm quyền: `ADMIN` (Chủ tịch HĐQT, Giám đốc điều hành), `MANAGER` (Trưởng phòng/Ban), `OFFICER` (Cán bộ nhân viên), `INSPECTOR` (Ban Kiểm soát).
4. **Zero-Mock Policy**:
   - Sử dụng Cloud Firestore trực tiếp, kết hợp bộ đệm an toàn dự phòng khi mất kết nối mạng.

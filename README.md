# CỔNG THÔNG TIN & QUẢN TRỊ NHÂN SỰ (HRM PORTAL) - QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ

> **Đơn vị áp dụng**: Quỹ Tín Dụng Nhân Dân Yên Thọ (Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa).  
> **Phạm vi hệ thống**: Quản trị hồ sơ cán bộ, quá trình luân chuyển công tác theo quy chế NHNN, đánh giá tín nhiệm định kỳ 10 tiêu chí (hỗ trợ bỏ phiếu kín cấp đợt), chấm điểm KPI 3 cấp (40% - 30% - 30%), bỏ phiếu quy hoạch cán bộ nguồn và kiến trúc mở rộng lâu dài cho chấm công, tiền lương.

---

## 🏛️ 1. Kiến Trúc Công Nghệ & Tiêu Chuẩn Thiết Kế

- **Framework**: React 19 SPA trên nền tảng Vite 8 (Rolldown engine).
- **Styling**: Tailwind CSS v4 với màu sắc chủ đạo ngành tài chính/tín dụng: `#0f766e` (Deep Teal) phối hợp Emerald và Slate.
- **Iconography**: `lucide-react`.
- **Trực quan hóa dữ liệu**: `recharts` (Pie Chart & Bar Chart phân bổ xếp loại và KPI).
- **Điều hướng & Định tuyến**: `react-router-dom` v7 với Protected Routes và Role-Based Access Control.
- **Backend & Database**: Firebase Authentication (Email/Password) & Cloud Firestore (`users`, `work_history`, `trust_criteria`, `evaluation_periods`, `evaluations_trust`, `evaluations_kpi`, `evaluations_planning`, `system_modules`, `roles_permissions`).
- **Tiêu chuẩn Ngôn ngữ Giao diện**: 100% tiếng Việt chính thống, chuẩn mực theo ngôn ngữ hành chính của tổ chức tín dụng nhân dân Việt Nam. **Tuyệt đối không sử dụng các từ ngữ AI hay thuật ngữ công nghệ xa lạ** trên giao diện người dùng.
- **Bảo mật Đăng nhập**: Kiểm tra trạng thái tài khoản hoạt động (`ACTIVE`), tích hợp bộ đệm phòng chống brute-force và làm sạch phiên đăng nhập.

---

## ⚙️ 2. Cơ Chế Bỏ Phiếu Kín / Công Khai: Quyết Định Linh Hoạt Ở Cấp Đợt

Một trong những quy định nghiệp vụ then chốt của Quỹ là:
> **Hình thức Ẩn danh (Bỏ phiếu kín) hay Công khai (Định danh) là do Ban Quản trị/Ban Lãnh đạo quyết định ở cấp Đợt đánh giá, cán bộ không tự ý tích chọn trên biểu mẫu.**

### Cơ chế vận hành:
1. **Ban Quản trị cấu hình Đợt**:
   - Khi tạo hoặc điều chỉnh Đợt đánh giá trong Modal **"Quản lý Đợt đánh giá"**, Lãnh đạo quyết định:
     - `ANONYMOUS`: Bỏ phiếu kín (Toàn bộ phiếu trong đợt được mã hóa ẩn danh).
     - `IDENTIFIED`: Công khai (Ghi nhận rõ họ tên và chức danh người chấm).
2. **Cán bộ vào thực hiện chấm điểm**:
   - Biểu mẫu tự động kiểm tra hình thức của Đợt đang chọn.
   - Hiển thị Banner quy chế chính thức của Ban Quản trị (màu Teal với biểu tượng Khóa bảo mật nếu là Bỏ phiếu kín, màu Blue nếu là Công khai).
   - Không có ô checkbox tự chọn ẩn danh, triệt tiêu nguy cơ nể nang hay lộ lọt thông tin.
   - Khi nộp phiếu, hệ thống tự động gán `evaluatorName = "Cán bộ Quỹ (Ẩn danh)"` và `evaluatorRole = "Ẩn danh"` nếu đợt quy định Bỏ phiếu kín.

---

## ⚡ 3. Tự Động Hóa 100% Khởi Tạo & Đồng Bộ CSDL (Zero-Manual Provisioning)

Người dùng **không cần phải tạo thủ công bất kỳ collection nào** trên Firebase Console:

1. Dán cấu hình Firebase vào `src/lib/firebase.js` (hoặc để trống để chạy chế độ lưu trữ nội bộ).
2. Nhấn nút **"⚡ Tự động CSDL"** trên thanh tiêu đề Navbar.
3. Hộp thoại **"Trung Tâm Khởi Tạo & Cập Nhật CSDL Tự Động"** xuất hiện.
4. Bấm nút **"Tiến hành Khởi tạo & Cập nhật 16 Bảng CSDL Tự Động"**.
5. Hệ thống chạy batch tự động nạp toàn bộ 16 bộ sưu tập nòng cốt:
   - `accounts`: Danh sách tài khoản đăng nhập & phân quyền chuyên biệt
   - `employees`: Danh bạ 100% Cán bộ Nhân viên chính thức (sạch tài khoản root)
   - `system_metadata`: Siêu dữ liệu phiên bản CSDL và lịch sử đồng bộ
   - `system_modules`: 8 danh mục phân hệ chức năng
   - `system_settings`: Tham số cấu hình chung & cấu hình phân hệ
   - `roles_permissions`: 4 ma trận phân quyền RBAC
   - `departments`: Danh mục phòng ban Quỹ TDND Yên Thọ
   - `positions`: Danh mục chức vụ & chức danh chuyên môn
   - `trust_criteria`: 10 tiêu chí tín nhiệm chuẩn mực NHNN
   - `evaluation_periods`: Danh mục các đợt đánh giá & lấy phiếu tín nhiệm
   - `period_configs`: Bảng cấu hình độc lập cho từng đợt đánh giá
   - `users`: Hồ sơ cán bộ nhân viên (tương thích ngược)
   - `work_history`: Quá trình luân chuyển điều động & bổ nhiệm cán bộ
   - `evaluations_trust`: Phiếu đánh giá tín nhiệm chi tiết
   - `evaluations_kpi`: Dữ liệu đánh giá hiệu quả KPI các cấp
   - `evaluations_planning`: Dữ liệu bỏ phiếu quy hoạch cán bộ nguồn

👉 **Xem hướng dẫn chi tiết từng bước tại**: [docs/HUONG_DAN_KET_NOI_FIREBASE.md](file:///d:/Antigravity%20Projects/QtdYenTho-HRM/docs/HUONG_DAN_KET_NOI_FIREBASE.md)

---

## 🧩 4. Kiến Trúc Phân Hệ Modular (Sẵn Sàng Mở Rộng Lâu Dài)

Hệ thống được thiết kế theo cấu trúc module độc lập (`SYSTEM_MODULES` trong `src/lib/permissions.js`):

```
HỆ THỐNG HRM QUỸ TDND YÊN THỌ
├── 🟢 Phân hệ Nhân sự & Luân chuyển (MODULE_HR) [ACTIVE]
├── 🟢 Phân hệ Đánh giá Tín nhiệm (MODULE_TRUST) [ACTIVE]
├── 🟢 Phân hệ Chấm điểm KPI 3 Cấp (MODULE_KPI) [ACTIVE]
├── 🟢 Phân hệ Quy hoạch Cán bộ (MODULE_PLANNING) [ACTIVE]
├── 🟢 Phân hệ Bảng điều khiển & Giám sát (MODULE_DASHBOARD) [ACTIVE]
├── 🟡 Phân hệ Chấm công & Phép năm (MODULE_TIMEKEEPING) [PLANNED - Sẵn sàng CSDL]
├── 🟡 Phân hệ Tiền lương & BHXH (MODULE_PAYROLL) [PLANNED - Sẵn sàng CSDL]
└── 🟡 Phân hệ Thi đua & Khen thưởng (MODULE_AWARDS) [PLANNED - Sẵn sàng CSDL]
```

Cấu trúc này đảm bảo CSDL có thể mở rộng sử dụng trong 5 - 10 năm tới mà không cần viết lại mã nguồn nền tảng.

---

## 👥 5. Phân Quyền Chi Tiết (Granular Permissions)

Mỗi vai trò được phân định rõ ràng các quyền truy cập chức năng và từng hành động chi tiết bên trong chức năng đó:

| Nhóm chức năng | Hành động chi tiết | Cán bộ (`staff`) | Ban điều hành (`manager`) | Chủ tịch HĐQT (`chairman`) |
| :--- | :--- | :---: | :---: | :---: |
| **Đánh giá tín nhiệm** | Xem danh sách đánh giá | ✅ | ✅ | ✅ |
| | Chấm điểm đồng nghiệp | ✅ | ✅ | ✅ |
| | Cấu hình đợt (Ẩn danh / Công khai) | ❌ | ✅ | ✅ |
| | Xem báo cáo tổng hợp | ❌ | ✅ | ✅ |
| | Kiểm toán phiếu kín (BKS/Thanh tra) | ❌ | ❌ | ✅ |
| **Chấm điểm KPI** | Tự chấm Bước 1 (40%) | ✅ | ✅ | ✅ |
| | Ban điều hành chấm Bước 2 (30%) | ❌ | ✅ | ❌ |
| | Chủ tịch HĐQT phê chuẩn Bước 3 (30%) | ❌ | ❌ | ✅ |
| **Quy hoạch cán bộ** | Bỏ phiếu tín nhiệm | ✅ | ✅ | ✅ |
| | Lập danh sách ứng viên & xem tỷ lệ | ❌ | ✅ | ✅ |
| **Hồ sơ nhân sự** | Xem danh bạ trích ngang | ✅ | ✅ | ✅ |
| | Xem lịch sử luân chuyển công tác | ✅ | ✅ | ✅ |
| | Thêm mới quyết định điều động/luân chuyển | ❌ | ✅ | ✅ |
| **Bảng điều khiển** | Xem Dashboard KPIs thời gian thực | ❌ | ✅ | ✅ |

---

## 🚀 6. Hướng Dẫn Cài Đặt & Chạy Hệ Thống

```bash
# 1. Di chuyển vào thư mục dự án
cd "d:\Antigravity Projects\QtdYenTho-HRM"

# 2. Cài đặt thư viện phụ thuộc
npm install

# 3. Khởi chạy máy chủ phát triển
npm run dev

# 4. Kiểm tra bản đóng gói sản phẩm (Production build)
npm run build

# 5. Triển khai lên Google Firebase Hosting (100% Miễn phí)
npm run deploy
```

Hệ thống hoạt động cục bộ tại: `http://localhost:5173/`

---

## 🌐 7. Triển Khai Lên Google Firebase Hosting (Free Tier)

Hệ thống được thiết kế chạy 100% trên hạ tầng máy chủ toàn cầu miễn phí của Google Firebase Hosting (Spark Plan):
- **Tên miền truy cập chính**: `https://qtdyentho-hrm.web.app`
- **Tên miền dự phòng**: `https://qtdyentho-hrm.firebaseapp.com`
- **Tài liệu hướng dẫn chi tiết từng bước**: [docs/HUONG_DAN_DEPLOY_FIREBASE_HOSTING.md](file:///d:/Antigravity%20Projects/QtdYenTho-HRM/docs/HUONG_DAN_DEPLOY_FIREBASE_HOSTING.md)

---
*Tài liệu kỹ thuật nội bộ — Quỹ Tín Dụng Nhân Dân Yên Thọ.*

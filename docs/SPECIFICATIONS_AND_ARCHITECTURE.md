# ĐẶC TẢ DỰ ÁN & KIẾN TRÚC KỸ THUẬT TỔNG THỂ
## CỔNG THÔNG TIN QUẢN TRỊ NHÂN SỰ & ĐÁNH GIÁ TÍN NHIỆM (HRM PORTAL)
### QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ

> **Đơn vị ban hành:** Hội đồng Quản trị & Ban Điều hành — Quỹ Tín Dụng Nhân Dân Yên Thọ  
> **Địa chỉ:** Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa  
> **Phiên bản:** v1.0.0 Modular Architecture  
> **Cập nhật lần cuối:** 07/10/2026  
> **Triết lý:** Điểm tựa tài chính tin cậy — Đồng hành cùng sự phát triển bền vững của cộng đồng

---

## 🏛️ 1. TỔNG QUAN HỆ THỐNG & TẦM NHÌN DÀI HẠN

Hệ thống **QtdYenTho-HRM** được xây dựng nhằm mục tiêu hiện đại hóa công tác quản trị nhân sự, minh bạch hóa quy trình đánh giá tín nhiệm định kỳ và tự động hóa các khâu thẩm tra cán bộ tại Quỹ Tín Dụng Nhân Dân Yên Thọ.

### Yêu cầu cốt lõi:
1. **Kiến trúc Dạng Ô Lưới (Portal Grid Launcher)**: Sau khi đăng nhập, hệ thống hiển thị danh mục các phân hệ (Modules) dưới dạng các ô lưới trực quan. Mỗi phân hệ hoạt động như một WebApp độc lập, có thể mở rộng bổ sung module mới tự động mà không làm ảnh hưởng đến mã nguồn hiện tại.
2. **Quy chế Bỏ phiếu Tín nhiệm Linh hoạt ở cấp Đợt**: Hình thức **Bỏ phiếu kín (Ẩn danh)** hay **Công khai (Định danh)** do Ban Quản trị quyết định theo từng đợt đánh giá, cán bộ không tự ý can thiệp.
3. **Theo dõi Quá trình Luân chuyển Cán bộ theo chuẩn NHNN**: Lưu trữ đầy đủ lịch sử điều động định kỳ (sau 3 năm), thay đổi địa bàn phụ trách 3 xã (Quý Lộc, Yên Lâm, Yên Thọ).
4. **Bảo mật & Nhận diện Thương hiệu Chuẩn mực**: Áp dụng bộ màu nhận diện thương hiệu của QTDND Yên Thọ (Emerald Green `#059669` / `#047857`, Vàng Hổ Phách `#f59e0b`, Nền kính trong suốt).
5. **Tiêu chuẩn Ngôn ngữ Hành chính**: Tuyệt đối không sử dụng bất kỳ từ ngữ AI, Chatbot hay thuật ngữ công nghệ xa lạ trên giao diện.

---

## 🎨 2. BỘ QUY CHUẨN NHẬN DIỆN THƯƠNG HIỆU (BRAND IDENTITY)

Hệ thống kế thừa và đồng bộ 100% với bộ nhận diện của Cổng Dịch vụ Tài chính QLApps `Qtdyentho`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          BẢNG MÀU CHỦ ĐẠO                             │
├───────────────────┬───────────────────┬────────────────────────────────┤
│   EMERALD GREEN   │    AMBER GOLD     │       CRISP GLASS WHITE        │
│    #059669        │     #F59E0B       │    rgba(255,255,255,0.95)      │
│ (Xanh Ngọc Lục)   │   (Vàng Hổ Phách) │      (Nền Thủy Tinh Kính Mờ)   │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

- **Màu chủ đạo (Primary)**:
  - `Emerald 600` (`#059669`) / `Emerald 700` (`#047857`): Màu sắc của sự tăng trưởng bền vững, tin cậy và thịnh vượng.
  - `Emerald 900` (`#064e3b`): Nền tiêu đề, header và điểm nhấn bảo mật cao.
  - `Teal 700` (`#0f766e`): Điểm nhấn nghiệp vụ tín dụng.
- **Màu điểm nhấn (Accent - Amber Gold)**:
  - `Amber 500` (`#f59e0b`) / `Amber 600` (`#d97706`): Tượng trưng cho giá trị vàng, huy hiệu ngôi sao, viền mạ vàng trang trọng trên các thẻ bài phân hệ.
- **Màu nền kính (Glassmorphism & Crisp White)**:
  - Thẻ bài phân hệ có góc bo tròn 16px (`rounded-2xl`), viền mảnh ánh vàng hoặc xanh ngọc, hiệu ứng bóng mờ cao cấp (`hover:-translate-y-1 hover:shadow-xl`).
- **Typography**:
  - Phông chữ chủ đạo: **`Be Vietnam Pro`** (chuẩn phông chữ tiếng Việt hiện đại, tròn trịa, sắc sảo trên thiết bị di động).

---

## 🧩 3. BẢN ĐỒ PHÂN HỆ MODULAR (SYSTEM MODULE MAP)

Hệ thống được thiết kế theo cấu trúc `Data-Driven Dynamic Grid Launcher`. Khi thêm một bản ghi vào danh mục phân hệ, ô lưới truy cập sẽ tự động hiển thị trên Portal Hub:

| STT | Mã Module | Tên Phân Hệ | Trạng Thái | Icon | Mô Tả Nghiệp Vụ |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **01** | `MODULE_PORTAL` | **Cổng Điều Hướng Phân Hệ** | 🟢 ACTIVE | `Grid` | Màn hình chính sau đăng nhập, hiển thị ô lưới các WebApp con. |
| **02** | `MODULE_TRUST` | **Đánh Giá Tín Nhiệm Cán Bộ** | 🟢 ACTIVE | `ShieldCheck` | Đánh giá 10 tiêu chí đạo đức & nghiệp vụ, bỏ phiếu kín/công khai cấp đợt. |
| **03** | `MODULE_HR` | **Hồ Sơ & Luân Chuyển Cán Bộ** | 🟢 ACTIVE | `Users` | Quản lý trích ngang 9 cán bộ, timeline điều động địa bàn theo chuẩn NHNN. |
| **04** | `MODULE_KPI` | **Chấm Điểm KPI 3 Cấp** | 🟢 ACTIVE | `TrendingUp` | Quy trình chấm điểm 40% tự chấm, 30% Giám đốc, 30% Chủ tịch HĐQT. |
| **05** | `MODULE_PLANNING` | **Bỏ Phiếu Quy Hoạch Cán Bộ** | 🟢 ACTIVE | `UserCheck` | Lấy phiếu tín nhiệm nhân sự quy hoạch các vị trí chủ chốt. |
| **06** | `MODULE_DASHBOARD`| **Bảng Điều Khiển & Phân Tích**| 🟢 ACTIVE | `BarChart3` | Giám sát chỉ số tín nhiệm, tỷ lệ hoàn thành và phân bổ phòng ban. |
| **07** | `MODULE_TIMEKEEPING`| **Chấm Công & Phép Năm** | 🟡 PLANNED | `Calendar` | Quản lý thời giờ làm việc, đơn nghỉ phép, ca trực quỹ (Sẵn sàng CSDL). |
| **08** | `MODULE_PAYROLL` | **Tiền Lương & Trích Nộp BHXH**| 🟡 PLANNED | `Banknote` | Bảng lương cán bộ, thưởng KPI và trích nộp bảo hiểm (Sẵn sàng CSDL). |
| **09** | `MODULE_AWARDS` | **Thi Đua, Khen Thưởng & Kỷ Luật**| 🟡 PLANNED | `Award` | Hồ sơ bình xét thi đua, khen thưởng và kỷ luật (Sẵn sàng CSDL). |

---

## 🔐 4. MA TRẬN PHÂN QUYỀN GRANULAR RBAC

Hệ thống chia làm 4 vai trò chính:
- `staff`: Cán bộ nhân viên nghiệp vụ (Tín dụng, Kế toán - Ngân quỹ).
- `manager`: Ban điều hành & Ban kiểm soát (Giám đốc, Trưởng Ban kiểm soát).
- `chairman`: Chủ tịch Hội đồng Quản trị (Cấp phê duyệt tối cao).
- `admin`: Quản trị viên kỹ thuật hệ thống.

Ma trận chi tiết từng quyền:
```javascript
// Trích từ src/lib/permissions.js
export const PERMISSIONS = {
  // Module A: Tín nhiệm
  TRUST_VIEW: 'trust:view',
  TRUST_EVALUATE: 'trust:evaluate',
  TRUST_MANAGE_PERIODS: 'trust:manage_periods',
  TRUST_VIEW_REPORTS: 'trust:view_reports',
  TRUST_AUDIT: 'trust:audit',

  // Module B: KPI
  KPI_VIEW: 'kpi:view',
  KPI_SELF_EVAL: 'kpi:self_eval',
  KPI_MANAGER_REVIEW: 'kpi:manager_review',
  KPI_CHAIRMAN_APPROVE: 'kpi:chairman_approve',

  // Module C: Quy hoạch
  PLANNING_VIEW: 'planning:view',
  PLANNING_VOTE: 'planning:vote',
  PLANNING_MANAGE: 'planning:manage',

  // Module D: Nhân sự & Luân chuyển
  HR_VIEW: 'hr:view',
  HR_VIEW_HISTORY: 'hr:view_history',
  HR_MANAGE_TRANSFERS: 'hr:manage_transfers',
  HR_EDIT_PROFILE: 'hr:edit_profile',

  // Module E: Dashboard & CSDL
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_EXPORT: 'dashboard:export',
  SYSTEM_AUTO_INIT_DB: 'system:auto_init_db',
};
```

---

## ⚡ 5. CẤU TRÚC MÃ NGUỒN & CHIẾN LƯỢC TỐI ƯU BUNDLE

Để đáp ứng tiêu chuẩn **Modularization & Bundle Reduction**:
```
d:\Antigravity Projects\QtdYenTho-HRM\
├── docs/                                # Tài liệu đặc tả hệ thống
│   ├── SPECIFICATIONS_AND_ARCHITECTURE.md
│   ├── DATABASE_SCHEMA_HRM_TRUST.md
│   ├── HUONG_DAN_KET_NOI_FIREBASE.md
│   └── modules/                         # Đặc tả độc lập từng module
│       ├── README.md
│       ├── 01_PORTAL_HUB_LAUNCHER.md
│       ├── 02_TRUST_EVALUATION.md
│       └── ...
├── src/
│   ├── modules/                         # Tách biệt mã nguồn từng phân hệ
│   │   ├── portal/                      # Trang Cổng ô lưới Module Hub
│   │   ├── trust/                       # Phân hệ Đánh giá tín nhiệm
│   │   ├── hr/                          # Phân hệ Hồ sơ & Luân chuyển
│   │   ├── kpi/                         # Phân hệ KPI 3 cấp
│   │   ├── planning/                    # Phân hệ Quy hoạch cán bộ
│   │   └── dashboard/                   # Phân hệ Dashboard phân tích
│   ├── components/common/               # Component dùng chung (Card, Button, Modal...)
│   ├── components/layout/               # Layout vỏ bọc (Navbar, Sidebar, MainLayout)
│   ├── context/                         # AuthContext, ToastContext
│   ├── lib/                             # services.js, permissions.js, autoInitDb.js, firebase.js
│   └── routes/                          # Định tuyến lazy loaded
```

### Chiến lược nạp chậm (Code Splitting):
- Tách từng Module thành **Lazy Chunk riêng** bằng `React.lazy()` và `Suspense`.
- Tách nhóm thư viện lớn vào các vendor chunk cô lập:
  - `vendor-firebase`: SDK Firebase Authentication & Firestore.
  - `vendor-charts`: Recharts.
  - `vendor-icons`: Lucide React.
  - `vendor-react`: React & React Router.

---

## 📱 6. NGUYÊN TẮC THIẾT KẾ RESPONSIVE 100%

1. **Khổ màn hình Mobile (375px - 640px)**:
   - Ô lưới hiển thị 1 cột duy nhất (`grid-cols-1`).
   - Touch targets $\ge 44\text{px}$, các nút hành động dàn đều chiều ngang.
   - Thẻ bài thay thế bảng biểu cuộn ngang.
2. **Khổ màn hình Tablet (640px - 1024px)**:
   - Ô lưới hiển thị 2 cột (`sm:grid-cols-2`).
   - Sidebar có thể thu gọn hoặc mở dạng Drawer trượt.
3. **Khổ màn hình Desktop (1024px trở lên)**:
   - Ô lưới hiển thị 3 đến 4 cột (`lg:grid-cols-3 xl:grid-cols-4`).
   - Sticky Summary Card hiển thị đồng thời bên phải.

---
*Tài liệu kỹ thuật nội bộ — Quỹ Tín Dụng Nhân Dân Yên Thọ.*

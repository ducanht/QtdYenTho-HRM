# HƯỚNG DẪN KIỂM THỬ TỰ ĐỘNG PLAYWRIGHT (E2E TEST SUITE)
## Hệ Thống Quản Trị Nhân Sự & Đánh Giá Tín Nhiệm — QTDND Yên Thọ

---

### 🏛️ 1. Giới Thiệu Tổng Quan
Hệ thống kiểm thử tự động End-to-End (E2E) được xây dựng trên nền tảng **Playwright Test**, cho phép kiểm thử toàn bộ trải nghiệm người dùng thực tế trên trình duyệt Chromium với độ tin cậy và tốc độ cao.

Bộ kiểm thử tuân thủ nghiêm ngặt các nguyên tắc:
1. **Zero Mock Data Policy**: 100% kiểm thử thực thi trên cơ sở dữ liệu Cloud Firestore và xác thực Firebase Authentication thực tế của Quỹ tín dụng nhân dân Yên Thọ.
2. **Tuân thủ chuẩn ngữ nghĩa Semantic HTML**: Định vị phần tử thông qua accessibility roles (`getByRole`, `getByLabel`, `heading`), không phụ thuộc vào class CSS dễ thay đổi.
3. **Kiểm tra độ phản hồi di động (Mobile Responsiveness)**: Đảm bảo giao diện hoạt động mượt mà trên cả máy tính bàn và thiết bị di động (iPhone SE viewport).

---

### 📦 2. Cấu Trúc Kiểm Thử

```
QtdYenTho-HRM/
├── playwright.config.js       # File cấu hình Playwright (baseURL, webServer, timeout, viewport)
├── tests/
│   └── hrm-portal.spec.js     # Kịch bản kiểm thử E2E 5 Test Cases trọng tâm
└── test-results/              # Thư mục lưu kết quả, ảnh chụp lỗi & video (nếu có)
```

---

### 🎯 3. Danh Sách 5 Kịch Bản Kiểm Thử (100% Passed)

| Mã TC | Tên Kịch Bản | Mục Tiêu & Tiêu Chí Nghiệm Thu | Kết Quả |
| :--- | :--- | :--- | :---: |
| **TC01** | **Màn hình Đăng nhập Quỹ TDND Yên Thọ** | Kiểm tra hiển thị đúng thương hiệu, khẩu hiệu, form email/mật khẩu và danh sách 3 tài khoản chính thức. | **PASS** ✅ |
| **TC02** | **Đăng nhập & Truy cập Cổng Phân Hệ (/portal)** | Đăng nhập tài khoản Chủ tịch HĐQT `ducanht@gmail.com`, chuyển hướng về `/portal`, kiểm tra lời chào và các ô lưới phân hệ. | **PASS** ✅ |
| **TC03** | **Danh sách Cán bộ & Modal Luân chuyển (/employees)** | Truy cập phân hệ Hồ sơ cán bộ, kiểm tra danh bạ cán bộ trong Firestore, mở và đóng modal lịch sử luân chuyển công tác. | **PASS** ✅ |
| **TC04** | **Form Đánh giá Tín nhiệm 10 Tiêu chí (/trust-evaluation)** | Truy cập phân hệ Đánh giá tín nhiệm, kiểm tra hiển thị 10 tiêu chí theo chuẩn NHNN, quy chế bảo mật của Ban Quản trị và tổng điểm. | **PASS** ✅ |
| **TC05** | **Thiết bị Di động (Mobile Viewport 375x667)** | Kiểm tra giao diện tự co giãn chuẩn Responsive Mobile trên màn hình kích thước nhỏ. | **PASS** ✅ |

---

### 🚀 4. Hướng Dẫn Chạy Kiểm Thử

#### Cách 1: Chạy toàn bộ kiểm thử ở chế độ dòng lệnh (CLI - Headless)
```bash
npm run test:e2e
```
*Hoặc:*
```bash
npx playwright test
```

#### Cách 2: Chạy kiểm thử với Giao Diện Trực Quan (Interactive UI Mode)
Chế độ này mở giao diện Playwright UI giúp xem từng bước chạy, tua lại thời gian (Time-travel debugging) và kiểm tra DOM trực tiếp:
```bash
npm run test:e2e:ui
```

#### Cách 3: Xem Báo Cáo HTML Chi Tiết (HTML Report)
Sau khi chạy kiểm thử, mở báo cáo trực quan trong trình duyệt:
```bash
npm run test:e2e:report
```

#### Cách 4: Chạy riêng 1 Test Case cụ thể
```bash
npx playwright test -g "TC02"
```

---

### ⚙️ 5. Cấu Hình Tối Ưu Hóa (playwright.config.js)

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,  // Chạy tuần tự tránh tranh chấp phiên Firebase Auth
  timeout: 45000,        // Timeout 45s phù hợp mạng thực tế
  workers: 1,            // 1 worker ổn định
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
```

---
*Tài liệu kiểm thử tự động Playwright — Ban Quản trị Quỹ tín dụng nhân dân Yên Thọ.*

# Kế Hoạch Nâng Cấp Quá Trình Công Tác Timeline, Văn Bằng Đa Cấp & Kênh Mạng Xã Hội CSDL Riêng Biệt

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tách và chuẩn hóa 3 bảng CSDL Cloud Firestore riêng biệt (`work_history`, `employee_degrees`, `employee_socials`) liên kết với CBNV qua mã khóa ngoại `employeeId` / `employeeUuid`, nâng cấp giao diện Quá trình công tác Timeline chi tiết (thời gian, vị trí, địa bàn tín dụng), quản lý nhiều văn bằng chuyên môn đa cấp và kênh mạng xã hội, đồng bộ toàn diện vào bộ xuất In A4, Word, Excel.

**Architecture:** Mở rộng kiến trúc CSDL quan hệ tài liệu trên Cloud Firestore theo mô hình Khóa ngoại kép (`employeeId` + `employeeUuid` RFC 4122 v4). Tách biệt các bảng độc lập để đảm bảo khả năng mở rộng không giới hạn (1 cán bộ có N văn bằng, N mốc công tác/địa bàn, N kênh mạng xã hội). Frontend sử dụng React hooks với realtime listeners, tối ưu hóa O(1) tra cứu theo `employeeId`, không bao giờ hiển thị mã kỹ thuật ra màn hình, tuyệt đối không dùng font mono.

**Tech Stack:** React 18, Vite, Cloud Firestore, Tailwind CSS, Lucide React, docx, xlsx, Playwright Test.

**Spec:** `docs/modules/03_HR_EMPLOYEES_AND_TRANSFERS.md`, `docs/DATABASE_SCHEMA_HRM_TRUST.md`

## Global Constraints
- **Zero AI / Tech Jargon**: Tuyệt đối không dùng các từ ngữ AI, kỹ thuật dư thừa trên giao diện người dùng. Toàn bộ nhãn, thông báo, tiêu đề phải chuẩn mực ngôn ngữ nghiệp vụ Quỹ TDND.
- **Zero Technical ID Exposure**: Ẩn 100% UUID v4, mã cán bộ `CBxx`, mã chức vụ `pos-xx`, mã kỹ thuật khỏi giao diện.
- **Cấm Font Monospace**: 100% sử dụng font sans-serif chất lượng cao (`Be Vietnam Pro` / `Inter`), các trường số liệu và ngày tháng sử dụng `tabular-nums`.
- **Zero Mock Data**: 100% dữ liệu đọc/ghi trực tiếp Cloud Firestore thời gian thực, không sử dụng mock data.
- **Atomicity & Security**: Đồng bộ rules `firestore.rules` và schema auto-provisioning `autoInitDb.js`.

---

## Danh Mục Tệp Thay Đổi & Tạo Mới

### Tệp Tạo Mới:
1. `src/features/employees/components/WorkHistoryPeriodModal.jsx`: Modal thêm/sửa mốc quá trình công tác (Thời gian từ ngày - đến ngày / đang công tác, Chức danh, Phòng ban, Địa bàn quản lý cho CBTD, Số quyết định, Ghi chú).
2. `src/features/employees/components/AddDegreeModal.jsx`: Modal thêm/sửa văn bằng chuyên môn đa cấp (Cấp độ: Trung cấp, Cao đẳng, Đại học, Thạc sĩ, Tiến sĩ, PGS, GS; Chuyên ngành; Cơ sở đào tạo; Hình thức đào tạo; Năm tốt nghiệp; Xếp loại; Số hiệu; Ảnh scan văn bằng).
3. `src/features/employees/components/ManageSocialsModal.jsx`: Modal quản lý các kênh mạng xã hội & liên lạc của CBNV (Zalo, Facebook, Telegram, LinkedIn...).
4. `tests/work-history-degrees-socials.spec.js`: Test suite Playwright kiểm thử trọn vẹn quy trình thêm mốc công tác timeline, thêm văn bằng đa cấp và quản lý mạng xã hội.

### Tệp Cập Nhật / Điều Chỉnh:
1. `src/lib/systemDefaults.js`: Bổ sung dữ liệu mẫu chuẩn cho `DEFAULT_EMPLOYEE_DEGREES`, `DEFAULT_EMPLOYEE_SOCIALS`, và cập nhật cấu trúc `OFFICIAL_WORK_HISTORY` với `startDate`, `endDate`, `isCurrent`, `assignedArea`.
2. `src/lib/autoInitDb.js`: Nâng cấp `CURRENT_SCHEMA_VERSION = '2026.10.12_v5.6_degrees_socials_and_timeline_tables'` và hàm tự động khởi tạo dữ liệu cho 2 bảng mới `employee_degrees`, `employee_socials`.
3. `firestore.rules`: Bổ sung quy tắc bảo mật cho `/employee_degrees/{degreeId}` và `/employee_socials/{socialId}`.
4. `src/lib/services.js`: Bổ sung các hàm subscription, lưu và xóa cho `employee_degrees` và `employee_socials`; mở rộng `saveWorkHistory`.
5. `src/features/employees/EmployeesContainer.jsx`: Đăng ký lắng nghe realtime `subscribeEmployeeDegrees` và `subscribeEmployeeSocials`, truyền state xuống các tab con.
6. `src/features/employees/components/EmployeeTransferHistory.jsx`: Hiển thị Timeline trực quan theo thời gian, tích hợp nút "Thêm mốc công tác", "Chỉnh sửa mốc", hiển thị rõ địa bàn đã quản lý từng thời kỳ của CBTD.
7. `src/features/employees/components/EmployeeProfileDetail.jsx`:
   - Phân khu 1: Tích hợp khối "Kênh Liên Lạc & Mạng Xã Hội" kèm nút quản lý.
   - Phân khu 4: Hiển thị danh sách các văn bằng chuyên môn (thay vì 1 dòng text cũ), nút "Thêm văn bằng", xem ảnh scan bằng cấp.
8. `src/features/employees/components/EmployeeAnalyticsTab.jsx`: Cập nhật thống kê cơ cấu trình độ dựa trên danh mục văn bằng thực tế từ `employee_degrees`.
9. `src/features/employees/components/EmployeeA4PrintModal.jsx`: Xuất bảng Quá trình công tác Timeline và Bảng Văn bằng chuyên môn đa cấp theo chuẩn mẫu 2C/TCTD.
10. `src/lib/exportUtils.js`: Cập nhật hàm xuất Word (.docx) và Excel (.xlsx) với các bảng Quá trình công tác và Văn bằng chuyên môn.
11. `docs/DATABASE_SCHEMA_HRM_TRUST.md`: Cập nhật đặc tả schema 2 bảng mới `employee_degrees`, `employee_socials` và mở rộng `work_history`.
12. `docs/modules/03_HR_EMPLOYEES_AND_TRANSFERS.md`: Cập nhật tài liệu module chi tiết.

---

## Chi Tiết Các Tác Vụ Triển Khai

### Task 1: Cấu Trúc CSDL & Dữ Liệu Mẫu Chuẩn Cho 3 Bảng Riêng Biệt

**Files:**
- Modify: `src/lib/systemDefaults.js`
- Modify: `src/lib/autoInitDb.js`
- Test: `tests/work-history-degrees-socials.spec.js`

**Interfaces:**
- Produces:
  - `DEFAULT_EMPLOYEE_DEGREES`: Array các văn bằng chuẩn mẫu cho 13 cán bộ (Đại học Tài chính - Ngân hàng, Thạc sĩ QTKD, Cao đẳng Kế toán, Trung cấp...) với các trường: `id`, `employeeId`, `employeeUuid`, `employeeName`, `degreeLevel`, `major`, `institution`, `trainingType`, `graduationYear`, `classification`, `degreeNumber`, `isHighest`.
  - `DEFAULT_EMPLOYEE_SOCIALS`: Array các kênh mạng xã hội chuẩn mẫu cho cán bộ (Zalo, Facebook, LinkedIn...) với các trường: `id`, `employeeId`, `employeeUuid`, `employeeName`, `platform`, `accountName`, `url`, `isPublic`.
  - Cập nhật `OFFICIAL_WORK_HISTORY`: Bổ sung `startDate`, `endDate`, `isCurrent`, `position`, `department`, `assignedArea`.
  - `CURRENT_SCHEMA_VERSION = '2026.10.12_v5.6_degrees_socials_and_timeline_tables'`

- [ ] **Step 1: Viết test kiểm tra tính toàn vẹn của dữ liệu mặc định và schema version**

Tạo file `tests/work-history-degrees-socials.spec.js`:
```javascript
import { test, expect } from '@playwright/test';
import { 
  DEFAULT_EMPLOYEE_DEGREES, 
  DEFAULT_EMPLOYEE_SOCIALS, 
  OFFICIAL_WORK_HISTORY 
} from '../src/lib/systemDefaults';
import { CURRENT_SCHEMA_VERSION } from '../src/lib/autoInitDb';

test('Kiểm tra dữ liệu mẫu và cấu trúc CSDL 3 bảng riêng biệt', async () => {
  expect(CURRENT_SCHEMA_VERSION).toContain('v5.6');
  expect(Array.isArray(DEFAULT_EMPLOYEE_DEGREES)).toBe(true);
  expect(DEFAULT_EMPLOYEE_DEGREES.length).toBeGreaterThan(0);
  expect(DEFAULT_EMPLOYEE_DEGREES[0]).toHaveProperty('degreeLevel');
  expect(DEFAULT_EMPLOYEE_DEGREES[0]).toHaveProperty('major');
  expect(DEFAULT_EMPLOYEE_DEGREES[0]).toHaveProperty('trainingType');
  
  expect(Array.isArray(DEFAULT_EMPLOYEE_SOCIALS)).toBe(true);
  expect(DEFAULT_EMPLOYEE_SOCIALS.length).toBeGreaterThan(0);
  expect(DEFAULT_EMPLOYEE_SOCIALS[0]).toHaveProperty('platform');

  expect(OFFICIAL_WORK_HISTORY[0]).toHaveProperty('startDate');
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại (chưa có dữ liệu mới)**

Run: `npx playwright test tests/work-history-degrees-socials.spec.js`
Expected: FAIL do chưa khai báo `DEFAULT_EMPLOYEE_DEGREES` và `DEFAULT_EMPLOYEE_SOCIALS`.

- [ ] **Step 3: Cập nhật `systemDefaults.js` và `autoInitDb.js`**

Trong `systemDefaults.js`:
- Khai báo mảng `DEFAULT_EMPLOYEE_DEGREES` với đầy đủ các cấp độ: Trung cấp, Cao đẳng, Đại học, Thạc sĩ; chuyên ngành (Tài chính - Ngân hàng, Kế toán, Quản trị Kinh doanh, Luật...); hình thức (Chính quy, Vừa làm vừa học...).
- Khai báo mảng `DEFAULT_EMPLOYEE_SOCIALS` với các kênh (Zalo kèm SĐT, Facebook, LinkedIn...).
- Bổ sung `startDate`, `endDate`, `isCurrent`, `assignedArea` vào các bản ghi `OFFICIAL_WORK_HISTORY`.

Trong `autoInitDb.js`:
- Cập nhật `CURRENT_SCHEMA_VERSION = '2026.10.12_v5.6_degrees_socials_and_timeline_tables'`.
- Bổ sung logic khởi tạo các collection `employee_degrees`, `employee_socials`, và cập nhật `work_history`.

- [ ] **Step 4: Chạy lại test để xác nhận PASS**

Run: `npx playwright test tests/work-history-degrees-socials.spec.js`
Expected: PASS.

- [ ] **Step 5: Git commit**

```bash
git add src/lib/systemDefaults.js src/lib/autoInitDb.js tests/work-history-degrees-socials.spec.js
git commit -m "feat(db): add schemas and default data for employee degrees, socials, and timeline work history"
```

---

### Task 2: Cập Nhật Quy Tắc Bảo Mật Firestore Rules & Dịch Vụ API

**Files:**
- Modify: `firestore.rules`
- Modify: `src/lib/services.js`

**Interfaces:**
- Consumes: Firestore SDK (`collection`, `doc`, `onSnapshot`, `setDoc`, `deleteDoc`, `query`, `where`, `orderBy`)
- Produces:
  - `subscribeEmployeeDegrees(employeeId, callback)`
  - `saveEmployeeDegree(degreeData)`
  - `deleteEmployeeDegree(degreeId)`
  - `subscribeEmployeeSocials(employeeId, callback)`
  - `saveEmployeeSocial(socialData)`
  - `deleteEmployeeSocial(socialId)`
  - `saveWorkHistory(workHistoryData)` (nâng cấp hỗ trợ `startDate`, `endDate`, `isCurrent`, `assignedArea`, `position`, `department`)

- [ ] **Step 1: Cập nhật `firestore.rules`**

Thêm rules cho `employee_degrees` và `employee_socials`:
```javascript
    // ===============================================================
    // 17. Văn bằng & Trình độ Chuyên môn (employee_degrees)
    // ===============================================================
    match /employee_degrees/{degreeId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (
        isBoardOrAdmin() ||
        request.resource.data.employeeId == request.auth.uid
      );
      allow update, delete: if isAuthenticated() && (
        isBoardOrAdmin() ||
        (resource != null && resource.data.employeeId == request.auth.uid)
      );
    }

    // ===============================================================
    // 18. Mạng Xã Hội & Kênh Liên Lạc CBNV (employee_socials)
    // ===============================================================
    match /employee_socials/{socialId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (
        isBoardOrAdmin() ||
        request.resource.data.employeeId == request.auth.uid
      );
      allow update, delete: if isAuthenticated() && (
        isBoardOrAdmin() ||
        (resource != null && resource.data.employeeId == request.auth.uid)
      );
    }
```

- [ ] **Step 2: Triển khai các hàm API trong `src/lib/services.js`**

Viết các hàm:
- `subscribeEmployeeDegrees(employeeId, callback)`: Truy vấn collection `employee_degrees`, sắp xếp theo `graduationYear` giảm dần.
- `saveEmployeeDegree(degreeData)`: Ghi nhận văn bằng với ID UUID v4, kiểm tra trường `isHighest` để đồng bộ tóm tắt sang `education` của hồ sơ cán bộ.
- `deleteEmployeeDegree(degreeId)`: Xóa văn bằng khỏi Firestore.
- `subscribeEmployeeSocials(employeeId, callback)`: Truy vấn collection `employee_socials`.
- `saveEmployeeSocial(socialData)`: Lưu tài khoản mạng xã hội.
- `deleteEmployeeSocial(socialId)`: Xóa tài khoản mạng xã hội.
- Mở rộng `saveWorkHistory`: Hỗ trợ lưu mốc thời gian `startDate`, `endDate`, `isCurrent`, `assignedArea`, và đồng bộ sang hồ sơ nếu `isCurrent: true`.

- [ ] **Step 3: Chạy lint để đảm bảo code sạch lỗi cú pháp**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 4: Git commit**

```bash
git add firestore.rules src/lib/services.js
git commit -m "feat(services): implement firestore services and rules for degrees, socials, and timeline"
```

---

### Task 3: Nâng Cấp Quá Trình Công Tác & Luân Chuyển Dạng Timeline Chi Tiết

**Files:**
- Create: `src/features/employees/components/WorkHistoryPeriodModal.jsx`
- Modify: `src/features/employees/components/EmployeeTransferHistory.jsx`

**Interfaces:**
- Consumes: `saveWorkHistory`, `deleteWorkHistory`, `formatDateVN`, `departments`, `positions`, `canManage`
- Produces:
  - `WorkHistoryPeriodModal`: Modal thêm/sửa mốc công tác Timeline với các trường:
    - `startDate` (Ngày bắt đầu mốc công tác)
    - `endDate` (Ngày kết thúc)
    - `isCurrent` (Cờ Đang đảm nhiệm mốc này)
    - `position` (Chức danh công tác)
    - `department` (Phòng ban công tác)
    - `assignedArea` (Địa bàn quản lý - hiển thị rõ ràng và nổi bật khi là Cán bộ Tín dụng)
    - `transferType` (Luân chuyển định kỳ | Bổ nhiệm | Thay đổi địa bàn | Điều động nội bộ | Công tác ban đầu)
    - `decisionNumber` (Số quyết định phê chuẩn nếu có)
    - `notes` (Nhiệm vụ trọng tâm / Mô tả công việc)
    - `syncToProfile` (Tự động đồng bộ sang hồ sơ cán bộ nếu là mốc hiện tại)
  - `EmployeeTransferHistory.jsx`:
    - Thanh tác vụ: Bổ sung nút **"Thêm Mốc Công Tác"** (mở `WorkHistoryPeriodModal`).
    - Khối Timeline trực quan: Sắp xếp các mốc theo thứ tự thời gian (mốc hiện tại nổi bật có chấm xanh nhấp nháy, các mốc quá khứ có đường nối timeline dọc).
    - Từng mốc hiển thị: Khoảng thời gian (VD: `01/2021 - 12/2023` hoặc `01/2024 - Đến nay`), Chức vụ, Phòng ban, **Địa bàn quản lý** (đối với Cán bộ Tín dụng: gắn badge vị trí địa bàn), Số QĐ nếu có, nút Sửa mốc và Xóa mốc.

- [ ] **Step 1: Tạo component `WorkHistoryPeriodModal.jsx`**

Xây dựng modal form với validation đầy đủ, sử dụng các dropdown phòng ban/chức vụ chuẩn, tự động ẩn/hiển thị trường Địa bàn khi chọn chức vụ Tín dụng, cấm font mono, không dùng từ ngữ AI.

- [ ] **Step 2: Cập nhật `EmployeeTransferHistory.jsx`**

Tích hợp `WorkHistoryPeriodModal`, nút thêm mốc công tác, hiển thị timeline trực quan kết hợp theo dõi thâm niên địa bàn và chu kỳ luân chuyển.

- [ ] **Step 3: Chạy lint và build kiểm tra**

Run: `npm run lint && npm run build`
Expected: 0 errors, build thành công.

- [ ] **Step 4: Git commit**

```bash
git add src/features/employees/components/WorkHistoryPeriodModal.jsx src/features/employees/components/EmployeeTransferHistory.jsx
git commit -m "feat(hr): enhance work history timeline with detailed periods, positions, and credit officer areas"
```

---

### Task 4: Giao Diện Quản Lý Văn Bằng Chuyên Môn Đa Cấp (`employee_degrees`)

**Files:**
- Create: `src/features/employees/components/AddDegreeModal.jsx`
- Modify: `src/features/employees/components/EmployeeProfileDetail.jsx`
- Modify: `src/features/employees/components/EmployeeAnalyticsTab.jsx`

**Interfaces:**
- Consumes: `subscribeEmployeeDegrees`, `saveEmployeeDegree`, `deleteEmployeeDegree`, `useToast`
- Produces:
  - `AddDegreeModal`: Modal thêm/chỉnh sửa văn bằng:
    - `degreeLevel`: Select option (Trung cấp, Cao đẳng, Đại học, Thạc sĩ, Tiến sĩ, Phó Giáo sư, Giáo sư, Khác)
    - `major`: Text input (Chuyên ngành đào tạo)
    - `institution`: Text input (Cơ sở / Trường đào tạo)
    - `trainingType`: Select option (Chính quy, Vừa làm vừa học, Liên thông, Văn bằng 2, Từ xa / Trực tuyến)
    - `graduationYear`: Number/Text (Năm tốt nghiệp / Ngày cấp)
    - `classification`: Select option (Xuất sắc, Giỏi, Khá, Trung bình khá)
    - `degreeNumber`: Text input (Số hiệu văn bằng)
    - `isHighest`: Checkbox (Đánh dấu là bằng cấp cao nhất / chuyên môn chính)
    - `degreeImage`: Tải lên ảnh scan/chụp bằng cấp, nén qua Canvas WebP < 45KB.
  - `EmployeeProfileDetail.jsx`:
    - Phân khu 4 "Trình Độ & Chuyên Môn": Hiển thị danh sách các văn bằng chuyên môn của cán bộ dưới dạng lưới thẻ văn bằng trang nhã:
      + Huy hiệu cấp độ (Thạc sĩ, Đại học, Cao đẳng...), Chuyên ngành in đậm, Cơ sở đào tạo, Hình thức đào tạo, Năm tốt nghiệp, Xếp loại, Số hiệu bằng.
      + Nút xem ảnh scan văn bằng (nếu có).
      + Nút "Thêm văn bằng chuyên môn", nút sửa và xóa văn bằng (nếu có quyền `canManage` hoặc chính chủ).
  - `EmployeeAnalyticsTab.jsx`:
    - Thống kê cơ cấu trình độ chuyên môn toàn Quỹ được tính toán động dựa trên danh sách văn bằng trong `employee_degrees`, hiển thị số lượng và tỷ lệ % chính xác cho từng bậc đào tạo (Tiến sĩ, Thạc sĩ, Đại học, Cao đẳng, Trung cấp...).

- [ ] **Step 1: Tạo component `AddDegreeModal.jsx`**

Form modal với đầy đủ các trường chuyên môn, hỗ trợ chọn cấp độ văn bằng, hình thức đào tạo và nén ảnh scan bằng cấp an toàn.

- [ ] **Step 2: Cập nhật Phân khu 4 trong `EmployeeProfileDetail.jsx`**

Nhận prop `degrees = []`, hiển thị danh sách văn bằng chuyên môn trực quan, tích hợp modal thêm/sửa/xóa văn bằng.

- [ ] **Step 3: Cập nhật `EmployeeAnalyticsTab.jsx`**

Nhận prop `degrees = []`, tối ưu logic tính toán tỷ lệ cơ cấu trình độ dựa trên dữ liệu văn bằng thực tế.

- [ ] **Step 4: Chạy lint và build kiểm tra**

Run: `npm run lint && npm run build`
Expected: 0 errors, build thành công.

- [ ] **Step 5: Git commit**

```bash
git add src/features/employees/components/AddDegreeModal.jsx src/features/employees/components/EmployeeProfileDetail.jsx src/features/employees/components/EmployeeAnalyticsTab.jsx
git commit -m "feat(hr): add multi-degree qualification management with level, major, form, and analytics"
```

---

### Task 5: Giao Diện Quản Lý Kênh Mạng Xã Hội CBNV (`employee_socials`)

**Files:**
- Create: `src/features/employees/components/ManageSocialsModal.jsx`
- Modify: `src/features/employees/components/EmployeeProfileDetail.jsx`

**Interfaces:**
- Consumes: `subscribeEmployeeSocials`, `saveEmployeeSocial`, `deleteEmployeeSocial`, `useToast`
- Produces:
  - `ManageSocialsModal`: Modal quản lý danh sách kênh mạng xã hội:
    - Nền tảng: Zalo, Facebook, Telegram, LinkedIn, Viber, Khác
    - Tên tài khoản / Biệt danh / Số liên hệ
    - Đường dẫn URL trực tiếp
    - Cờ công khai nội bộ (`isPublic`)
  - `EmployeeProfileDetail.jsx`:
    - Trong Phân khu 1 "Thông Tin Cá Nhân & Liên Hệ": Bổ sung khối "Kênh Liên Lạc & Mạng Xã Hội":
      + Render danh sách các huy hiệu/link mạng xã hội có icon trực quan (Zalo xanh dương, Facebook xanh navy, Telegram xanh lơ, LinkedIn...).
      + Click mở trực tiếp trang cá nhân/Zalo trong tab mới.
      + Nút "Cập nhật mạng xã hội" (icon Edit) mở `ManageSocialsModal`.

- [ ] **Step 1: Tạo component `ManageSocialsModal.jsx`**

Cho phép thêm, sửa, xóa các kênh mạng xã hội của cán bộ.

- [ ] **Step 2: Cập nhật Phân khu 1 trong `EmployeeProfileDetail.jsx`**

Hiển thị các kênh mạng xã hội của cán bộ, tích hợp `ManageSocialsModal`.

- [ ] **Step 3: Chạy lint và build kiểm tra**

Run: `npm run lint && npm run build`
Expected: 0 errors, build thành công.

- [ ] **Step 4: Git commit**

```bash
git add src/features/employees/components/ManageSocialsModal.jsx src/features/employees/components/EmployeeProfileDetail.jsx
git commit -m "feat(hr): add social media channels management for employees"
```

---

### Task 6: Đồng Bộ Bộ Điều Phối `EmployeesContainer` & Bộ Xuất Báo Cáo (In A4, Word, Excel)

**Files:**
- Modify: `src/features/employees/EmployeesContainer.jsx`
- Modify: `src/features/employees/components/EmployeeA4PrintModal.jsx`
- Modify: `src/lib/exportUtils.js`

**Interfaces:**
- Consumes: `subscribeEmployeeDegrees`, `subscribeEmployeeSocials`, `subscribeWorkHistory`, `docx`, `xlsx`
- Produces:
  - `EmployeesContainer`: Quản lý state `degrees`, `socials`, `workHistory`, truyền xuống đầy đủ cho `EmployeeProfileDetail`, `EmployeeTransferHistory`, `EmployeeAnalyticsTab`, `EmployeeA4PrintModal`.
  - `EmployeeA4PrintModal`: Bản in trích ngang khổ A4 dọc hiển thị:
    - Bảng Quá trình công tác: Liệt kê các mốc thời gian (Từ tháng/năm - Đến tháng/năm), Chức danh, Phòng ban, Địa bàn quản lý tín dụng.
    - Bảng Văn bằng chuyên môn: Liệt kê đầy đủ các văn bằng (Cấp độ, Chuyên ngành, Trường đào tạo, Hình thức, Năm tốt nghiệp, Xếp loại).
    - Thông tin mạng xã hội / kênh liên lạc bổ sung (Zalo, SĐT...).
  - `exportUtils.js`:
    - `exportEmployeeWord`: Xuất tài liệu `.docx` có Bảng Quá trình công tác timeline và Bảng Văn bằng chuyên môn đa cấp chuẩn mẫu 2C/TCTD.
    - `exportEmployeeExcel`: Xuất file `.xlsx` gồm các sheet: Sơ yếu lý lịch, Quá trình công tác, Văn bằng chứng chỉ, Mạng xã hội.

- [ ] **Step 1: Cập nhật `EmployeesContainer.jsx`**

Thêm các subscriptions `subscribeEmployeeDegrees` và `subscribeEmployeeSocials`, truyền props `degrees`, `socials`, `workHistory` vào các view con và modal in ấn.

- [ ] **Step 2: Cập nhật `EmployeeA4PrintModal.jsx`**

Đưa bảng Quá trình công tác Timeline và Bảng Văn bằng chuyên môn vào khung in A4 chuẩn mẫu 2C/TCTD.

- [ ] **Step 3: Cập nhật `exportUtils.js`**

Cập nhật `exportEmployeeWord` và `exportEmployeeExcel` hỗ trợ mảng `degrees`, `workHistory` và `socials`.

- [ ] **Step 4: Chạy lint và build kiểm tra**

Run: `npm run lint && npm run build`
Expected: 0 errors, build thành công.

- [ ] **Step 5: Git commit**

```bash
git add src/features/employees/EmployeesContainer.jsx src/features/employees/components/EmployeeA4PrintModal.jsx src/lib/exportUtils.js
git commit -m "feat(export): integrate timeline work history, degrees, and socials into A4 print, word, and excel"
```

---

### Task 7: Cập Nhật Tài Liệu Kỹ Thuật Module & Kiểm Thử Toàn Diện

**Files:**
- Modify: `docs/DATABASE_SCHEMA_HRM_TRUST.md`
- Modify: `docs/modules/03_HR_EMPLOYEES_AND_TRANSFERS.md`
- Modify: `tests/work-history-degrees-socials.spec.js`

**Interfaces:**
- Produces:
  - Bản mô tả cấu trúc CSDL chi tiết của `employee_degrees`, `employee_socials`, và `work_history` mở rộng.
  - Hướng dẫn nghiệp vụ sử dụng cho Phân hệ Quản trị Nhân sự.
  - Test suites Playwright chạy tự động xác thực toàn bộ tính năng.

- [ ] **Step 1: Hoàn thiện test suite trong `tests/work-history-degrees-socials.spec.js`**

Kiểm tra:
1. Đăng nhập và mở hồ sơ cán bộ.
2. Thêm mới một mốc công tác Timeline có địa bàn tín dụng.
3. Thêm mới một văn bằng chuyên môn (ví dụ: Đại học Luật - Chính quy).
4. Cập nhật kênh mạng xã hội (ví dụ: Zalo).
5. Kiểm tra hiển thị trên giao diện và trong modal xem trước In A4.

- [ ] **Step 2: Cập nhật `docs/DATABASE_SCHEMA_HRM_TRUST.md` và `docs/modules/03_HR_EMPLOYEES_AND_TRANSFERS.md`**

Mô tả chi tiết cấu trúc các collection, khóa ngoại quan hệ, mục đích nghiệp vụ và các giao diện liên quan.

- [ ] **Step 3: Chạy toàn bộ các quality gates**

Run:
1. `npm run lint` -> 0 errors.
2. `npm run build` -> Exit code 0.
3. `npx playwright test` -> Toàn bộ các test suites PASS.

- [ ] **Step 4: Git commit & Push**

```bash
git add docs/ tests/
git commit -m "docs: document employee degrees, socials, and timeline work history schema and tests"
git push origin master
```

- [ ] **Step 5: Triển khai Firebase Hosting**

Run: `npx firebase deploy --only hosting`

---

## Tự Đánh Giá (Self-Review Checklist)

1. **Bảo toàn yêu cầu người dùng (Spec Coverage)**:
   - Lưu lịch sử chi tiết (Timeline) thời gian nào, công tác vị trí nào, địa bàn nào nếu là tín dụng -> Đã giải quyết ở Task 1, 2, 3, 6.
   - Trình độ & chuyên môn: Trung cấp, Cao đẳng, Đại học, Thạc sĩ, Tiến sĩ, PGS, GS; chuyên ngành; hình thức đào tạo; 1 người có nhiều bằng cấp -> Đã giải quyết ở Task 1, 2, 4, 6.
   - Thông tin mạng xã hội của CBNV -> Đã giải quyết ở Task 1, 2, 5, 6.
   - Lưu vào các table riêng liên kết với nhân viên để mở rộng về sau -> 3 bảng riêng `work_history`, `employee_degrees`, `employee_socials` liên kết qua `employeeId` và `employeeUuid`.
2. **Không có placeholder (No Placeholders)**: Toàn bộ các bước, interface, code mẫu và kiểm thử đều được mô tả chi tiết, không có TODO/TBD.
3. **Quy chuẩn kỹ thuật**: Cấm font mono, ẩn UUID/mã kỹ thuật khỏi UI, không dùng từ ngữ AI, kiểm thử Playwright trực tiếp.

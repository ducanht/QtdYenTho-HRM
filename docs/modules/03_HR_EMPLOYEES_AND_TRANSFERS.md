# PHÂN HỆ 03: QUẢN TRỊ NHÂN SỰ & QUÁ TRÌNH LUÂN CHUYỂN CÔNG TÁC
## HỆ THỐNG QUẢN TRỊ NHÂN SỰ — QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ

> **Mã phân hệ:** `MODULE_HR`  
> **Tên hiển thị:** Quản trị Nhân sự (tên ngắn: Nhân sự)  
> **Tuyến đường (Route):** `/employees`  
> **Trạng thái:** 🟢 Hoàn tất (100%) — Sạch toàn bộ lỗi, không mock data, tích hợp 100% Firestore  
> **Quy định pháp lý tham chiếu:**  
> - Luật Các tổ chức tín dụng.  
> - Quy định của Thống đốc NHNN về luân chuyển cán bộ nhằm phòng ngừa rủi ro đạo đức trong hệ thống tín dụng (đặc biệt đối với cán bộ tín dụng, kế toán, thủ quỹ sau 2-3 năm).  
> - Quy chế quản trị nhân sự nội bộ QTDND Yên Thọ.

---

## 🏛️ 1. MỤC TIÊU NGHIỆP VỤ

1. **Quản trị danh bạ trích ngang 13 Cán bộ Nhân viên chính thức** (không dùng dữ liệu giả/mock, chuẩn hóa ID `emp-001` đến `emp-013`, Zero Duplicate Policy):
   - Quản lý đầy đủ thông tin: Họ và tên, mã cán bộ (`CB01` đến `CB13`), số CCCD (12 chữ số), ngày sinh, giới tính, chức danh chính quyền, chức vụ Đảng - Đoàn thể, địa bàn phụ trách, trình độ chuyên môn, loại hợp đồng, số điện thoại và email công vụ.
2. **Theo dõi Quá trình Luân chuyển công tác & Thâm niên Vị trí (`work_history`)**:
   - Theo quy định của Ngân hàng Nhà nước và Quy chế quản trị nội bộ, các vị trí nhạy cảm tại Quỹ tín dụng nhân dân (CBTD, Kế toán, Thủ quỹ, BKS) **phải được giám sát luân chuyển định kỳ** nhằm phòng ngừa rủi ro đạo đức và rủi ro hoạt động tín dụng.
   - **Cấu hình luân chuyển linh hoạt (`transferRules`)**: Vị trí nào phải luân chuyển và thời hạn cụ thể (số tháng chu kỳ và số tháng cảnh báo trước) được đưa vào cấu hình CSDL `system_settings/module_hr`, không gắn cứng cố định. Loại bỏ hoàn toàn khối tham số mặc định áp chung thừa thãi.
   - **Vị trí công tác kiêm nhiệm Quản trị & Điều hành**: Chuẩn hóa chức danh *"Thành viên HĐQT - Giám đốc"* thuộc Ban Điều hành, phản ánh đúng cơ cấu thực tế tại Quỹ tín dụng nhân dân (thành viên HĐQT đồng thời đảm nhiệm vị trí Giám đốc điều hành).
   - **Theo dõi thuần túy**: Phân hệ tập trung theo dõi thâm niên, tiến độ chu kỳ và cảnh báo trực quan; không còn nút lập quyết định luân chuyển tại phân hệ này để đảm bảo phân tách đúng thẩm quyền điều hành của HĐQT.
   - Hệ thống hiển thị **Timeline quá trình luân chuyển** với đầy đủ: Số quyết định, ngày ký, ngày có hiệu lực, người ký (Chủ tịch HĐQT/Giám đốc), hình thức luân chuyển (`LUAN_CHUYEN_DINH_KY`, `BO_NHIEM`, `DIEU_DONG`, `THAY_DOI_DIA_BAN`), chức vụ và địa bàn cũ $\rightarrow$ mới, tình trạng bàn giao hồ sơ nợ và ghi chú.
3. **Quản lý Thâm niên Giữ chức vụ (`positionStartDate`)**:
   - Lưu trữ ngày bắt đầu đảm nhiệm chức danh hiện tại của từng cán bộ.
   - Tiện ích tính toán tự động `calculatePositionTenure(positionStartDate)` quy đổi ra năm/tháng công tác (ví dụ: *"3 năm 4 tháng"*).
   - Phục vụ trực tiếp cho công tác xét nâng bậc lương định kỳ, quy hoạch bổ nhiệm và giám sát thời hạn luân chuyển bắt buộc theo cấu hình.
4. **Theo dõi Toàn diện Hồ sơ Đào tạo & Bồi dưỡng Nghiệp vụ (`employee_training`)**:
   - Quản lý chi tiết từng khóa học: Tên khóa đào tạo/bồi dưỡng nghiệp vụ; Đơn vị tổ chức (NHNN, Hiệp hội QTDND, Học viện Ngân hàng...); Quyết định / Kế hoạch cử cán bộ đi học; Thời gian (từ ngày - đến ngày), địa điểm tổ chức; Nội dung tóm tắt chương trình đào tạo; Chứng chỉ cấp (tên chứng chỉ, số hiệu, ngày cấp, ngày hết hạn, xếp loại tốt nghiệp, xem ảnh scan).
   - Hỗ trợ cả 2 hình thức: Khóa học có cấp văn bằng/chứng chỉ và Khóa tập huấn/bồi dưỡng ngắn hạn có chứng nhận hoàn thành.
5. **Đầy đủ Bộ Thao tác Quản trị Cán bộ (Thêm, Chỉnh sửa, Xóa an toàn)**:
   - Thêm mới cán bộ (`EmployeeFormModal`): Tự động tạo hồ sơ danh bạ và tài khoản xác thực đồng bộ, tích hợp datalist gợi ý nhanh danh mục chức vụ chính quyền.
   - Chỉnh sửa hồ sơ (`EmployeeProfileDetail`): Cập nhật thông tin lý lịch 2C/TCTD.
   - Xóa cán bộ (`deleteEmployeeProfile`): Tích hợp hộp thoại xác nhận an toàn, xóa đồng bộ tài khoản và danh bạ nhân sự đối với người có thẩm quyền `canManage`.
6. **Thống Kê Cơ Cấu Nhân Lực & Trình Độ Chuyên Môn**:
   - Bổ sung khối Thống kê Cơ cấu Trình độ Chuyên môn / Học vấn toàn Quỹ (Thạc sĩ/Sau đại học, Đại học/Cử nhân/Kỹ sư, Cao đẳng, Trung cấp, Khác) phục vụ lập báo cáo chất lượng nhân sự theo chuẩn NHNN.
   - Bảng giám sát thời hạn luân chuyển toàn Quỹ tự động áp dụng `transferRules` cấu hình động.
7. **Giao Diện Sidebar Danh Bạ Tinh Gọn (One-Tap Search)**:
   - Loại bỏ hoàn toàn thanh bộ lọc phòng ban cuộn ngang thừa thãi, tối đa hóa chiều cao danh sách cán bộ.
   - Tìm kiếm tức thì tích hợp đa trường (Họ tên, Chức vụ, Phòng ban, Số điện thoại, Địa bàn phụ trách).
8. **Bộ Công Cụ Xuất Báo Cáo Doanh Nghiệp (Enterprise Export Suite)**:
   - Bản in Sơ yếu lý lịch trích ngang A4 chuẩn mẫu 2C/TCTD có xem trước.
   - Xuất file Word (`.docx`) chuẩn thể thức văn bản hành chính Việt Nam với đầy đủ bảng biểu thâm niên, quá trình công tác và hồ sơ đào tạo.
   - Xuất file Excel (`.xlsx`) đa năng: Xuất Danh bạ toàn Quỹ và Sơ yếu lý lịch trích ngang cá nhân 2C/TCTD.
9. **Cấu Hình Phân Hệ & Phân Quyền Truy Cập (`system_settings/module_hr`)**:
   - `allowStaffViewDirectory`: Phân quyền xem danh bạ toàn Quỹ vs Chế độ bảo mật cá nhân (cán bộ thường chỉ xem hồ sơ của chính mình; Lãnh đạo xem toàn bộ cán bộ).
   - `transferRules`: Danh mục quy tắc luân chuyển theo từng chức danh (gồm `positionId`, `positionName`, `requiresTransfer`, `maxMonths`, `warningMonths`).
   - `canStaffUploadTraining`: Quyền tự tải lên văn bằng chứng chỉ chuyên môn.

---

## ⭐️ 2. NĂM NGUYÊN TẮC VÀNG THIẾT KẾ & VẬN HÀNH PHÂN HỆ NHÂN SỰ

1. **Nguyên Tắc 1: Không Dùng Ngôn Từ AI Hoặc Kỹ Thuật Dư Thừa (Zero AI / Tech Jargon)**:
   - Cấm triệt để: "tự động nén qua Canvas", "chuẩn WebP", "Chuẩn Free Tier", "AI", "thuật toán", "bất biến".
   - 100% ngôn ngữ nghiệp vụ ngân hàng hợp tác/Quỹ TDND: trang trọng, ngắn gọn, súc tích, chính xác.
2. **Nguyên Tắc 2: Ẩn Toàn Bộ Mã Kỹ Thuật Khỏi Giao Diện (Zero Technical ID Exposure)**:
   - Ẩn hoàn toàn chuỗi UUID v4 RFC 4122, mã chức vụ (`pos-01`, `pos-02`), mã cán bộ (`CB01`..), và vai trò hệ thống (`staff`/`admin`) khỏi giao diện người dùng và bản in.
   - Chỉ hiển thị thông tin nghiệp vụ cơ bản: Họ tên, Chức vụ, Phòng ban, Thâm niên, Ngày sinh, CCCD, Điện thoại, Email, Địa bàn phụ trách.
   - Mã UUID và mã CB được bảo toàn ngầm định trong CSDL làm khóa liên kết bất biến chống trùng lặp.
3. **Nguyên Tắc 3: Chuẩn Mực Typography - Tuyệt Đối Cấm Font Mono**:
   - Cấm hoàn toàn class `font-mono` trên toàn bộ components và bản in.
   - Sử dụng font sans-serif chuẩn (`Be Vietnam Pro` / `Inter`), các trường số liệu sử dụng `tabular-nums` thẳng hàng chuyên nghiệp.
4. **Nguyên Tắc 4: Bộ Công Cụ Xuất Báo Cáo Doanh Nghiệp (Enterprise Export Suite)**:
   - In A4 2C/TCTD xem trước, xuất Word `.docx` chuẩn thể thức hành chính, xuất Excel `.xlsx` danh bạ toàn Quỹ và sơ yếu lý lịch cá nhân.
5. **Nguyên Tắc 5: Phân Quyền & Cấu Hình Phân Hệ Tập Trung (Subsystem RBAC & Config)**:
   - Cấu hình qua Firestore `system_settings/module_hr` với cơ chế realtime listener `subscribeSubsystemConfig('hr')`.

---

## 🎨 3. GIẢI PHÁP TỐI ƯU HÓA HÌNH ẢNH CLIENT-SIDE

### 2.1. Thách thức:
- Nếu lưu ảnh gốc dung lượng 3-8 MB từ điện thoại di động lên CSDL:
  - Nhanh chóng làm tràn dung lượng Firestore Free (1 GiB).
  - Tải trang chậm, lag giao diện di động.
  - Vượt quá giới hạn kích thước tối đa 1 MB của một Firestore Document.

### 2.2. Giải pháp nén ảnh Client-side qua HTML5 Canvas (`src/lib/imageUtils.js`):
- Mọi hình ảnh (Ảnh chân dung Avatar cán bộ và Ảnh chụp Chứng chỉ đào tạo) trước khi tải lên Firestore đều được xử lý nén tự động ngay tại trình duyệt client:
  - **Kích thước tối đa**: Giới hạn trong khung $800 \times 800$ px (đối với chứng chỉ) và $400 \times 400$ px (đối với Avatar), giữ nguyên tỷ lệ khung hình gốc (aspect ratio).
  - **Định dạng tối ưu**: Xuất ra `image/webp` (hoặc fallback `image/jpeg`) với chất lượng $0.75 - 0.8$.
  - **Dung lượng sau nén**: Chỉ còn **$30 - 45 \text{ KB}$ / ảnh** (giảm hơn 98% dung lượng gốc).
  - **Lưu trữ dạng Data URL (Base64)**: Ghi trực tiếp chuỗi Base64 vào document Firestore (`avatar` hoặc `certificateImage`).
  - **Không phát sinh chi phí Firebase Storage**: 100% không dùng Firebase Cloud Storage Bucket, triệt tiêu hoàn toàn rủi ro vượt hạn mức hay phát sinh chi phí ngoài ý muốn.

### 2.3. Bảng phân tích hạn mức Firebase Spark Plan:
| Tài nguyên Firebase Spark | Giới hạn Free Tier | Mức tiêu thụ thực tế của QTDND Yên Thọ | Đánh giá độ an toàn |
| :--- | :--- | :--- | :--- |
| **Firestore Storage** | 1 GiB (~1.024 MB) | 13 cán bộ $\times$ 20 chứng chỉ $\approx 260$ ảnh $\times 40 \text{ KB} \approx \mathbf{10.4 \text{ MB}}$ | **Chiếm ~1% dung lượng Free**. Đủ lưu hơn 25.000 ảnh/chứng chỉ. |
| **Firestore Reads** | 50.000 lượt/ngày | Tải danh bạ + chứng chỉ $\approx 50 - 100$ reads/lần truy cập | **Dưới 2% hạn mức ngày**, an toàn tuyệt đối. |
| **Firestore Writes** | 20.000 lượt/ngày | Cập nhật hồ sơ/chứng chỉ $\approx 5 - 10$ writes/ngày | **Dưới 0.1% hạn mức ngày**. |
| **Firebase Hosting** | 10 GB/tháng | Production bundle chỉ ~350 KB | Phục vụ hàng chục ngàn lượt xem/tháng hoàn toàn miễn phí. |

---

## 🗄️ 3. THIẾT KẾ CƠ SỞ DỮ LIỆU LIÊN QUAN

### 3.1. Collection `employees` (hoặc `users`):
```typescript
interface Employee {
  id: string;               // Mã định danh doc (VD: emp-001)
  uuid: string;             // Mã UUID bất biến v4 chuẩn RFC 4122 (VD: 3f8a9c2e-4b11-4a88-9d10-8b1e0f22c19a)
  code: string;             // Mã cán bộ (VD: CB01, CB02, ..., CB13)
  name: string;             // Họ và tên đầy đủ
  gender: 'Nam' | 'Nữ';
  birthDate: string;        // YYYY-MM-DD
  cccd: string;             // Số CCCD (12 số)
  phone: string;            // SĐT di động
  email: string;            // Email công vụ
  department: string;       // Phòng Tín dụng, Phòng Kế toán - Ngân quỹ, Ban Kiểm soát, HĐQT, BĐH
  position: string;         // Chức vụ chính quyền
  positionStartDate: string;// Ngày bắt đầu giữ chức vụ hiện tại (YYYY-MM-DD)
  assignedArea?: string;    // Địa bàn phụ trách (Xã Quý Lộc, Yên Thọ...)
  politicalRole?: string;   // Bí thư Chi bộ, Đảng viên...
  partyMember: boolean;     // Đảng viên ĐCSVN
  education: string;        // Trình độ chuyên môn (Đại học Ngân hàng...)
  joinDate: string;         // Ngày vào Quỹ công tác
  contractType: string;     // Không xác định thời hạn, Theo nhiệm kỳ...
  role: 'admin' | 'staff';  // Quyền hệ thống
  status: 'ACTIVE' | 'LEAVE';
  avatar?: string;          // Chuỗi Base64 ảnh chân dung đã nén (< 50KB)
}
```

### 3.2. Collection `work_history`:
```typescript
interface WorkHistoryRecord {
  id: string;               // Mã bản ghi (VD: trans-001)
  employeeId: string;       // FK -> employees.id
  employeeUuid: string;     // FK -> employees.uuid (UUID RFC 4122 v4)
  employeeCode: string;     // CB01, CB02...
  employeeName: string;     // Họ tên cán bộ
  decisionNumber: string;   // Số quyết định (VD: 15/QĐ-HĐQT-2024)
  decisionDate: string;     // Ngày ký quyết định
  effectiveDate: string;    // Ngày quyết định có hiệu lực
  transferType: 'LUAN_CHUYEN_DINH_KY' | 'BO_NHIEM' | 'DIEU_DONG' | 'THAY_DOI_DIA_BAN';
  fromDepartment?: string;  // Phòng ban cũ
  toDepartment: string;     // Phòng ban mới
  fromPosition?: string;    // Chức vụ cũ
  toPosition: string;       // Chức vụ mới
  fromAssignedArea?: string;// Địa bàn cũ
  toAssignedArea?: string;  // Địa bàn mới
  signer: string;           // Người ký (Chủ tịch HĐQT / Giám đốc)
  reason: string;           // Lý do luân chuyển
  notes?: string;           // Ghi chú bàn giao
  attachmentUrl?: string;   // Link tài liệu đính kèm (nếu có)
  createdAt: timestamp;
}
```

### 3.3. Collection `employee_training`:
```typescript
interface EmployeeTraining {
  id: string;               // Mã chứng chỉ (VD: train-uuid)
  employeeId: string;       // FK -> employees.id
  employeeUuid: string;     // FK -> employees.uuid (UUID RFC 4122 v4)
  employeeName: string;     // Họ tên cán bộ
  courseName: string;       // Tên khóa học / bồi dưỡng / chứng chỉ
  institution: string;      // Đơn vị cấp / Đào tạo (Học viện Ngân hàng, NHNN...)
  issueDate: string;        // Ngày cấp chứng chỉ (YYYY-MM-DD)
  expiryDate?: string;      // Ngày hết hạn (nếu có, YYYY-MM-DD)
  certificateNumber?: string;// Số hiệu văn bằng / chứng chỉ
  certificateImage?: string;// Chuỗi Base64 ảnh scan chứng chỉ đã nén qua Canvas (< 50KB)
  status: 'COMPLETED' | 'IN_PROGRESS' | 'EXPIRED'; // Tình trạng
  notes?: string;           // Ghi chú nội dung đào tạo
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### 3.4. Collection `employee_kpi_history`:
```typescript
interface EmployeeKpiRecord {
  id: string;               // Mã bản ghi KPI (VD: kpi-2026-q1-emp001)
  employeeId: string;       // FK -> employees.id
  employeeUuid: string;     // FK -> employees.uuid (UUID RFC 4122 v4)
  periodName: string;       // Tên kỳ đánh giá (VD: Quý 1/2026)
  year: number;             // Năm đánh giá
  quarter?: number;         // Quý đánh giá
  score: number;            // Điểm KPI tổng hợp (0 - 100)
  classification: string;   // Xuất sắc | Tốt | Hoàn thành | Chưa hoàn thành
  approvedBy: string;       // Người phê duyệt (Giám đốc / Chủ tịch HĐQT)
  createdAt: timestamp;
}
```

---

## 🔒 4. QUY TẮC BẢO MẬT & PHÂN QUYỀN (FIRESTORE SECURITY RULES)

Được cấu hình chuẩn mực và bảo vệ an toàn trong `firestore.rules`:
1. **`employees` / `users`**:
   - **Đọc (`read`)**: Cho phép mọi cán bộ đã đăng nhập xác thực (`isAuthenticated()`).
   - **Ghi (`write`)**: Cho phép Ban Quản trị / Quản trị viên (`isBoardOrAdmin()`) hoặc chính cán bộ sửa thông tin cá nhân của mình (`isOwner(userId)`).
2. **`work_history`**:
   - **Đọc (`read`)**: Cho phép mọi cán bộ đã đăng nhập.
   - **Ghi (`write`)**: Chỉ Ban Quản trị / Quản trị viên (`isBoardOrAdmin()`) mới có quyền ban hành hoặc sửa quyết định luân chuyển.
3. **`employee_training`**:
   - **Đọc (`read`)**: Mọi cán bộ đã đăng nhập đều xem được.
   - **Ghi (`create`, `update`, `delete`)**: Cho phép Ban Quản trị / Admin hoặc chính cán bộ sở hữu chứng chỉ (`resource.data.employeeId == request.auth.uid || request.resource.data.employeeId == request.auth.uid`).
4. **`employee_kpi_history`**:
   - **Đọc (`read`)**: Cán bộ đã đăng nhập.
   - **Ghi (`write`)**: Chỉ Ban Quản trị / Quản trị viên (`isBoardOrAdmin()`).

---

## 💻 5. CÁC THÀNH PHẦN GIAO DIỆN (UI COMPONENTS)

Hệ thống giao diện Phân hệ Quản trị Nhân sự kế thừa trọn vẹn kiến trúc Master - Detail 2 phần tương tự Phân hệ Đánh giá Tín nhiệm, tối ưu hóa hiển thị trên iPad, máy tính bảng và màn hình lớn:

### 5.1. Bố Cục Tổng Thể & Điều Hướng:
1. `EmployeesContainer.jsx`: Component điều phối trung tâm:
   - Quản lý đồng bộ URL parameters: `?tab=PROFILE&empId=emp-001` (khắc phục triệt để lỗi F5/Back/Refresh trình duyệt).
   - Tự động nạp danh sách 13 cán bộ chính thức từ Firestore (`employees` và `users`).
   - Tự động chọn cán bộ đầu tiên khi mở phân hệ.
   - Bố cục lưới Responsive 12 cột: Cột trái Master Sidebar chiếm 3-4 cột (hoặc toàn màn hình trên mobile khi chưa chọn CB), Cột phải Detail Panel chiếm 8-9 cột.
2. `HRModuleTabsNav.jsx`: Thanh Tab điều hướng chính trên Desktop và iPad (5 phân hệ chuyên sâu):
   - 👤 **Hồ sơ trích ngang** (`PROFILE`): Sơ yếu lý lịch chuẩn 2C/TCTD.
   - 🔄 **Luân chuyển công tác** (`TRANSFERS`): Timeline luân chuyển & Giám sát chu kỳ NHNN.
   - 🎓 **Đào tạo & Chứng chỉ** (`TRAINING`): Quản lý văn bằng chứng chỉ & Ảnh scan.
   - 📊 **Cơ cấu & Thống kê** (`ANALYTICS`): Thống kê cơ cấu nhân sự & Cảnh báo luân chuyển toàn Quỹ.
   - ⚙️ **Danh mục & Chức danh** (`SETTINGS`): Quản lý 5 phòng ban & 11 chức danh chuẩn (có KSNB).
3. `HRBottomNav.jsx`: Thanh điều hướng cố định đáy trên thiết bị di động (Mobile Bottom Navigation):
   - Gồm 5 icon tương ứng 5 tab chức năng, touch target $\ge 48$px, hỗ trợ thao tác bằng một tay nhanh chóng và thuận tiện.

### 5.2. Cột Trái: Master Sidebar (`EmployeeMasterSidebar.jsx`):
- **Bộ lọc phòng ban linh hoạt**: Tất cả phòng ban, Phòng Tín dụng, Phòng Kế toán - Ngân quỹ, Ban Kiểm soát, HĐQT & BĐH.
- **Ô tìm kiếm tức thì**: Lọc theo Họ tên, Mã cán bộ (`CB01`...), Số CCCD, hoặc Số điện thoại.
- **Danh sách thẻ cán bộ mini (Card List)**:
  - Ảnh đại diện Avatar nén Canvas WebP $< 45$KB.
  - Mã CB, Họ và tên in đậm, chức vụ chính quyền và huy hiệu Đảng viên.
  - **Huy hiệu Thâm niên giữ chức vụ** tự động tính toán từ `positionStartDate`.
  - **Chỉ báo cảnh báo luân chuyển NHNN**:
    - Màu vàng: Thâm niên $\ge 2.5$ năm (sắp đến hạn luân chuyển theo quy định NHNN).
    - Màu đỏ nhấp nháy: Thâm niên $\ge 3$ năm (quá hạn luân chuyển bắt buộc cho vị trí nhạy cảm).
- **Nút Thêm cán bộ mới**: Kích hoạt `EmployeeFormModal` với mã UUID v4 tự động sinh ngẫu nhiên.

### 5.3. Cột Phải: Các Panel Nghiệp Vụ Chuyên Sâu:
1. `EmployeeProfileDetail.jsx` (Tab Hồ sơ trích ngang):
   - Trình bày thông tin theo chuẩn Mẫu 2C/TCTD của Ngân hàng Nhà nước.
   - Thay đổi ảnh chân dung cán bộ trực tiếp, nén Canvas WebP $< 45$KB.
   - Nút **"Sửa hồ sơ"** và nút **"In trích ngang A4"**.
2. `EmployeeTransferHistory.jsx` (Tab Luân chuyển công tác):
   - Banner cảnh báo chu kỳ luân chuyển 36 tháng đối với các vị trí nhạy cảm (CBTD, Kế toán, Thủ quỹ, BKS).
   - Timeline trực quan hiển thị toàn bộ các quyết định điều động, bổ nhiệm, luân chuyển địa bàn trong quá khứ.
   - Nút **"Lập quyết định luân chuyển"**: Kích hoạt `TransferDecisionModal`.
3. `EmployeeTrainingTab.jsx` (Tab Đào tạo & Chứng chỉ):
   - Danh mục các văn bằng, chứng chỉ chuyên môn đã được cấp.
   - Kiểm tra hạn hiệu lực (còn hạn / hết hạn).
   - Xem ảnh scan văn bằng phóng to toàn màn hình.
   - Nút **"Thêm chứng chỉ"**: Kích hoạt `AddTrainingModal`.
4. `EmployeeAnalyticsTab.jsx` (Tab Cơ cấu & Thống kê):
   - 4 thẻ KPI tổng quan: Tổng số CBNV (13), Số Đảng viên (tỷ lệ %), Tuổi bình quân, Vị trí nhạy cảm cần luân chuyển.
   - Phân bổ nhân sự theo từng phòng ban và khối chuyên môn.
   - **Bảng giám sát luân chuyển toàn Quỹ**: Đánh giá toàn diện 100% cán bộ, phân loại mức độ cấp thiết cần luân chuyển theo quy định NHNN.
5. `EmployeeSettingsTab.jsx` (Tab Danh mục & Chức danh):
   - Quản lý danh mục 5 Phòng ban nòng cốt.
   - Quản lý 11 Chức vụ chuẩn mực trong QTDND (bao gồm chức danh Kiểm soát nội bộ `pos-11` / `KSNB`).

### 5.4. Các Modal Nghiệp Vụ & In Ấn A4:
1. `EmployeeFormModal.jsx`: Modal thêm mới / chỉnh sửa hồ sơ cán bộ:
   - Tự động sinh mã `uuid` chuẩn RFC 4122 v4 không trùng lặp khi thêm mới.
   - Đầy đủ các trường nghiệp vụ: CCCD 12 số, ngày cấp, ngày vào Đảng, ngày chính thức, trình độ học vấn, thâm niên chức vụ.
2. `TransferDecisionModal.jsx`: Modal lập quyết định điều động / luân chuyển:
   - Nhập số quyết định, ngày ký, ngày hiệu lực, hình thức luân chuyển, người ký, lý do và tài liệu đính kèm.
   - Cờ tích chọn *"Đồng bộ chức vụ và địa bàn mới vào hồ sơ cán bộ hiện tại"*.
3. `AddTrainingModal.jsx`: Modal thêm chứng chỉ đào tạo:
   - Tải lên ảnh scan/chụp chứng chỉ, nén tự động qua Canvas WebP $< 45$KB trước khi lưu Firestore.
4. `EmployeeA4PrintModal.jsx`: Màn hình xem trước và in Sơ yếu lý lịch trích ngang:
   - Định dạng chuẩn trang A4 in ấn, quốc huy/quốc hiệu, thông tin cá nhân, quá trình đào tạo và quá trình công tác.


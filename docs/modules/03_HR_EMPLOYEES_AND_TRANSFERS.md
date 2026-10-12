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
2. **Theo dõi Quá trình Luân chuyển công tác & Timeline Mốc Công Tác (`work_history`)**:
   - Theo quy định của Ngân hàng Nhà nước và Quy chế quản trị nội bộ, **chỉ có duy nhất Cán bộ Tín dụng (CBTD) phụ trách địa bàn là đối tượng bắt buộc phải luân chuyển định kỳ** nhằm phòng ngừa rủi ro đạo đức và rủi ro hoạt động tín dụng.
   - Các chức danh thuộc **Hội đồng quản trị, Ban Kiểm soát, Ban Điều hành** hoạt động theo nhiệm kỳ bầu cử và phê chuẩn của NHNN; các vị trí **Kế toán, Thủ quỹ** hoạt động theo phân công nhiệm vụ nội bộ của Ban Giám đốc, **tuyệt đối không thuộc diện luân chuyển địa bàn**.
   - **Mốc thời gian Timeline chuyên sâu (`startDate`, `endDate`, `isCurrent`, `position`, `department`, `assignedArea`, `workLocation`)**: Theo dõi trọn đời quá trình công tác từ ngày tuyển dụng, qua các lần điều động, bổ nhiệm chức danh, phân công nơi làm việc và phân công địa bàn quản lý tín dụng.
   - **Tự động đồng bộ vị trí công tác**: Khi cập nhật hoặc thêm mốc công tác hiện tại (`isCurrent: true`), hệ thống tự động đồng bộ chức vụ, nơi làm việc và địa bàn vào hồ sơ cán bộ.
   - **Cấu hình chu kỳ luân chuyển chuyên biệt cho CBTD (`creditRotationMonths`, `creditWarningMonths`)**: Thiết lập chu kỳ luân chuyển địa bàn (mặc định 36 tháng) và thời gian cảnh báo trước khi đến hạn (mặc định 6 tháng) trong `system_settings/module_hr`. Tinh giản hoàn toàn bảng 13 chức vụ thừa để giữ giao diện chuẩn mực, tinh gọn.
   - **Vị trí công tác kiêm nhiệm Quản trị & Điều hành**: Chuẩn hóa chức danh *"Thành viên HĐQT - Giám đốc"* thuộc Ban Điều hành, phản ánh đúng cơ cấu thực tế tại Quỹ tín dụng nhân dân.
3. **Quản Lý Danh Mục Văn Bằng Chuyên Môn Đa Cấp (`employee_degrees`)**:
   - Tách riêng thành một bảng CSDL độc lập, hỗ trợ một cán bộ sở hữu nhiều văn bằng (ví dụ: Đại học Luật + Đại học Kinh tế, hoặc Đại học + Thạc sĩ).
   - Quản lý đầy đủ: Cấp bậc văn bằng (Tiến sĩ, Thạc sĩ, Đại học, Cao đẳng, Trung cấp, Sơ cấp), chuyên ngành, cơ sở đào tạo, hình thức đào tạo (Chính quy, Tại chức, Liên thông, Từ xa), năm tốt nghiệp, xếp loại, số hiệu văn bằng, cờ văn bằng cao nhất (`isHighest: true`) và ảnh scan nén WebP an toàn qua Canvas (< 50KB).
4. **Quản Lý Kênh Mạng Xã Hội & Liên Lạc Số (`employee_socials`)**:
   - Quản lý đa nền tảng liên lạc số (Zalo, Facebook, Telegram, LinkedIn, Viber, Khác).
   - Tên người dùng / Số điện thoại đăng ký, đường dẫn URL trực tiếp đến trang cá nhân, và cờ hiển thị công khai nội bộ.
5. **Quản lý Thâm niên Giữ chức vụ (`positionStartDate`) & Địa bàn Tín dụng (`areaStartDate`)**:
   - Lưu trữ ngày bắt đầu đảm nhiệm chức danh hiện tại của từng cán bộ (`positionStartDate`) và ngày nhận bàn giao địa bàn tín dụng (`areaStartDate`).
   - Tiện ích tính toán tự động `calculatePositionTenure` và `calculateAreaTenureAndDueDate` quy đổi ra năm/tháng công tác, giám sát chu kỳ luân chuyển 36 tháng của CBTD theo quy định của NHNN.
6. **Theo dõi Toàn diện Hồ sơ Đào tạo & Bồi dưỡng Nghiệp vụ (`employee_training`)**:
   - Quản lý chi tiết từng khóa học: Tên khóa đào tạo/bồi dưỡng nghiệp vụ; Đơn vị tổ chức (NHNN, Hiệp hội QTDND, Học viện Ngân hàng...); Quyết định / Kế hoạch cử cán bộ đi học; Thời gian, địa điểm, chứng chỉ cấp, xem ảnh scan.
7. **Đầy đủ Bộ Thao tác Quản trị Cán bộ (Thêm, Chỉnh sửa, Xóa an toàn)**:
   - Thêm mới cán bộ (`EmployeeFormModal`): Tự động tạo hồ sơ danh bạ và tài khoản xác thực đồng bộ, tự động cấp mã UUID RFC 4122 v4 bất biến.
   - Chỉnh sửa hồ sơ (`EmployeeProfileDetail`): Cập nhật thông tin lý lịch 2C/TCTD.
   - Xóa cán bộ (`deleteEmployeeProfile`): Tích hợp hộp thoại xác nhận an toàn, xóa đồng bộ tài khoản và danh bạ nhân sự.
8. **Thống Kê Cơ Cấu Nhân Lực & Trình Độ Chuyên Môn**:
   - Thống kê tỷ lệ và cơ cấu học vấn toàn Quỹ được tính toán động trực tiếp từ danh mục văn bằng `employee_degrees`, ưu tiên văn bằng cao nhất của mỗi cán bộ.
   - Bảng giám sát thời hạn luân chuyển địa bàn CBTD tự động áp dụng chu kỳ cấu hình động (`creditRotationMonths`).
9. **Giao Diện Sidebar Danh Bạ Tinh Gọn (One-Tap Search)**:
   - Loại bỏ hoàn toàn thanh bộ lọc phòng ban cuộn ngang thừa thãi, tối đa hóa chiều cao danh sách cán bộ.
   - Tìm kiếm tức thì tích hợp đa trường (Họ tên, Chức vụ, Phòng ban, Số điện thoại, Địa bàn phụ trách).
10. **Bộ Công Cụ Xuất Báo Cáo Doanh Nghiệp (Enterprise Export Suite)**:
   - Bản in Sơ yếu lý lịch trích ngang A4 chuẩn mẫu 2C/TCTD với Bảng quá trình công tác timeline và Bảng danh mục văn bằng chuyên môn.
   - Xuất file Word (`.docx`) chuẩn thể thức văn bản hành chính Việt Nam với đầy đủ bảng biểu thâm niên, quá trình công tác và hồ sơ văn bằng đào tạo.
   - Xuất file Excel (`.xlsx`) đa sheet chuyên nghiệp (4 sheets: Trích ngang 2C, Quá trình công tác, Văn bằng chuyên môn, Mạng xã hội).
11. **Cấu Hình Phân Hệ & Phân Quyền Truy Cập (`system_settings/module_hr`)**:
   - `allowStaffViewDirectory`: Phân quyền xem danh bạ toàn Quỹ vs Chế độ bảo mật cá nhân (cán bộ thường chỉ xem hồ sơ của chính mình; Lãnh đạo xem toàn bộ cán bộ).
   - `creditRotationMonths` / `transferMaxMonths`: Chu kỳ luân chuyển địa bàn dành riêng cho Cán bộ Tín dụng (mặc định 36 tháng).
   - `creditWarningMonths` / `transferWarningMonths`: Thời gian phát cảnh báo trước khi đến hạn luân chuyển địa bàn (mặc định 6 tháng).
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
  department: string;       // Phòng Tín dụng, Phòng Kế toán - Ngân quỹ, Ban Kiểm soát, Hội đồng Quản trị, Ban Điều hành, Hội đồng Quản trị & Ban Điều hành
  position: string;         // Chức vụ chính quyền
  positionStartDate: string;// Ngày bắt đầu giữ chức vụ hiện tại (YYYY-MM-DD)
  assignedArea?: string;    // Địa bàn phụ trách (Xã Quý Lộc, Thôn Tân Lộc...)
  areaStartDate?: string;   // Ngày bắt đầu nhận địa bàn hiện tại (YYYY-MM-DD - chu kỳ luân chuyển 36 tháng cho CBTD)
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
  id: string;               // Mã bản ghi (VD: wh-001, trans-001)
  employeeId: string;       // FK -> employees.id
  employeeUuid: string;     // FK -> employees.uuid (UUID RFC 4122 v4)
  employeeCode: string;     // CB01, CB02...
  employeeName: string;     // Họ tên cán bộ
  startDate: string;        // Ngày bắt đầu mốc công tác (YYYY-MM-DD)
  endDate?: string;         // Ngày kết thúc mốc công tác (để trống nếu đang đảm nhiệm)
  isCurrent: boolean;       // true: Đang đảm nhiệm vị trí này
  position: string;         // Chức danh đảm nhiệm trong giai đoạn
  department: string;       // Phòng ban công tác trong giai đoạn
  assignedArea?: string;    // Địa bàn tín dụng phụ trách trong giai đoạn
  transferType: 'LUAN_CHUYEN_DINH_KY' | 'BO_NHIEM' | 'DIEU_DONG' | 'THAY_DOI_DIA_BAN' | 'TUYEN_DUNG';
  isPromotion?: boolean;    // Đánh dấu mốc bổ nhiệm thăng chức
  decisionNumber?: string;  // Số quyết định (VD: 15/QĐ-HĐQT-2024)
  decisionDate?: string;    // Ngày ký quyết định (YYYY-MM-DD)
  effectiveDate?: string;   // Ngày quyết định có hiệu lực (YYYY-MM-DD)
  fromDepartment?: string;  // Phòng ban cũ
  toDepartment?: string;    // Phòng ban mới
  fromPosition?: string;    // Chức vụ cũ
  toPosition?: string;      // Chức vụ mới
  fromAssignedArea?: string;// Địa bàn cũ
  toAssignedArea?: string;  // Địa bàn mới
  signer?: string;          // Người ký quyết định (Chủ tịch HĐQT / Giám đốc)
  handoverStatus?: 'DA_BAN_GIAO' | 'DANG_BAN_GIAO' | 'CHUA_BAN_GIAO';
  reason?: string;          // Lý do luân chuyển / căn cứ công tác
  notes?: string;           // Ghi chú bàn giao
  attachmentUrl?: string;   // Link tài liệu đính kèm (nếu có)
  createdAt: timestamp;
}
```

### 3.3. Collection `employee_degrees`:
```typescript
interface EmployeeDegree {
  id: string;               // Mã bản ghi văn bằng (VD: deg-001)
  employeeId: string;       // FK -> employees.id
  employeeUuid: string;     // FK -> employees.uuid (UUID RFC 4122 v4)
  employeeName: string;     // Họ tên cán bộ
  degreeLevel: 'TIEN_SI' | 'THAC_SI' | 'DAI_HOC' | 'CAO_DANG' | 'TRUNG_CAP' | 'SO_CAP' | 'KHAC';
  degreeName: string;       // Tên văn bằng (Cử nhân Kinh tế, Kỹ sư...)
  major: string;            // Chuyên ngành đào tạo
  institution: string;      // Cơ sở / Trường đại học đào tạo
  trainingMode: 'CHINH_QUY' | 'VUA_LAM_VUA_HOC' | 'LIEN_THONG' | 'TU_XA';
  graduationYear: number;   // Năm tốt nghiệp
  classification: 'XUAT_SAC' | 'GIOI' | 'KHA' | 'TRUNG_BINH_KHA' | 'TRUNG_BINH';
  certificateNumber?: string;// Số hiệu văn bằng / Số vào sổ
  isHighest: boolean;       // true: Văn bằng cao nhất (đồng bộ vào education)
  scanUrl?: string;         // Chuỗi ảnh scan văn bằng nén WebP (< 50KB)
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### 3.4. Collection `employee_socials`:
```typescript
interface EmployeeSocial {
  id: string;               // Mã bản ghi mạng xã hội (VD: soc-001)
  employeeId: string;       // FK -> employees.id
  employeeUuid: string;     // FK -> employees.uuid (UUID RFC 4122 v4)
  employeeName: string;     // Họ tên cán bộ
  platform: 'ZALO' | 'FACEBOOK' | 'TELEGRAM' | 'LINKEDIN' | 'VIBER' | 'OTHER';
  usernameOrPhone: string;  // Tên tài khoản / Số điện thoại đăng ký
  profileUrl?: string;      // URL trực tiếp đến trang cá nhân
  isPublicInternal: boolean;// true: Công khai cho đồng nghiệp xem
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### 3.5. Collection `employee_training`:
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

### 3.6. Collection `employee_kpi_history`:
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

### 🔒 4. QUY TẮC BẢO MẬT & PHÂN QUYỀN (FIRESTORE SECURITY RULES)

Được cấu hình chuẩn mực và bảo vệ an toàn trong `firestore.rules`:
1. **`employees` / `users`**:
   - **Đọc (`read`)**: Cho phép mọi cán bộ đã đăng nhập xác thực (`isAuthenticated()`).
   - **Ghi (`write`)**: Cho phép Ban Quản trị / Quản trị viên (`isBoardOrAdmin()`) hoặc chính cán bộ sửa thông tin cá nhân của mình (`isOwner(userId)`).
2. **`work_history`**:
   - **Đọc (`read`)**: Cho phép mọi cán bộ đã đăng nhập.
   - **Ghi (`create`, `update`, `delete`)**: Cho phép Ban Quản trị / Quản trị viên (`isBoardOrAdmin()`) hoặc chính cán bộ cập nhật mốc công tác của mình.
3. **`employee_degrees`**:
   - **Đọc (`read`)**: Mọi cán bộ đã đăng nhập đều xem được.
   - **Ghi (`create`, `update`, `delete`)**: Cho phép Ban Quản trị / Quản trị viên hoặc chính cán bộ sở hữu văn bằng (`resource.data.employeeId == request.auth.uid || request.resource.data.employeeId == request.auth.uid`).
4. **`employee_socials`**:
   - **Đọc (`read`)**: Mọi cán bộ đã đăng nhập đều xem được.
   - **Ghi (`create`, `update`, `delete`)**: Cho phép Ban Quản trị / Quản trị viên hoặc chính cán bộ sở hữu tài khoản liên lạc số.
5. **`employee_training`**:
   - **Đọc (`read`)**: Mọi cán bộ đã đăng nhập đều xem được.
   - **Ghi (`create`, `update`, `delete`)**: Cho phép Ban Quản trị / Admin hoặc chính cán bộ sở hữu chứng chỉ.
6. **`employee_kpi_history`**:
   - **Đọc (`read`)**: Cán bộ đã đăng nhập.
   - **Ghi (`write`)**: Chỉ Ban Quản trị / Quản trị viên (`isBoardOrAdmin()`).

---

## 💻 5. CÁC THÀNH PHẦN GIAO DIỆN (UI COMPONENTS)

Hệ thống giao diện Phân hệ Quản trị Nhân sự kế thừa trọn vẹn kiến trúc Master - Detail 2 phần tương tự Phân hệ Đánh giá Tín nhiệm, tối ưu hóa hiển thị trên iPad, máy tính bảng và màn hình lớn:

### 5.1. Bố Cục Tổng Thể & Điều Hướng:
1. `EmployeesContainer.jsx`: Component điều phối trung tâm:
   - Quản lý đồng bộ URL parameters: `?tab=PROFILE&empId=emp-001` (khắc phục triệt để lỗi F5/Back/Refresh trình duyệt).
   - Tự động nạp danh sách 13 cán bộ chính thức từ Firestore (`employees` và `users`).
   - Lắng nghe realtime `subscribeEmployeeDegrees` và `subscribeEmployeeSocials`, tự động chuyển giao dữ liệu xuống các panel nghiệp vụ, modal và bộ xuất tài liệu.
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
- **Giao diện tinh gọn, không bọc cuộn ngang**: Loại bỏ hoàn toàn thanh bộ lọc phòng ban cuộn ngang thừa thãi, tối đa hóa chiều cao danh sách cán bộ.
- **Ô tìm kiếm tức thì**: Lọc theo Họ tên, Chức vụ, Phòng ban, Số điện thoại, hoặc Địa bàn phụ trách.
- **Danh sách thẻ cán bộ mini (Card List)**:
  - Ảnh đại diện Avatar chân dung gọn gàng.
  - Họ và tên in đậm, chức vụ chính quyền và phòng ban.
  - **Huy hiệu Thâm niên giữ chức vụ** tự động tính toán từ `positionStartDate`.
  - **Chỉ báo cảnh báo luân chuyển NHNN**:
    - Sắp đến hạn luân chuyển (theo chu kỳ cấu hình).
    - Hạn luân chuyển (khi vượt quá thời hạn quy định cho vị trí đó).
- **Thanh tác vụ Header**: Nút xuất toàn bộ Danh bạ sang Excel (`.xlsx`) và nút Thêm mới cán bộ.

### 5.3. Cột Phải: Các Panel Nghiệp Vụ Chuyên Sâu:
1. `EmployeeProfileDetail.jsx` (Tab Hồ sơ trích ngang):
   - **Khối định danh cán bộ (Header Card)**:
     - Avatar chân dung $16 \times 16$ / $18 \times 18$ rounded-2xl kèm tính năng cập nhật ảnh.
     - Họ tên cán bộ nổi bật (`text-xl font-black`), bên cạnh là 2 badge nhỏ gọn gàng: `[● Đang công tác]` (xanh lá) và `[Đảng viên]` (vàng hổ phách).
     - Dòng thông tin chức danh & phòng ban chuẩn mực: `Thành viên HĐQT - Giám đốc • Hội đồng Quản trị & Ban Điều hành`.
   - **Khối Kênh Liên Lạc & Mạng Xã Hội**:
     - Hiển thị các huy hiệu mạng xã hội (Zalo, Facebook, Telegram, LinkedIn...) với liên kết trực tiếp mở tab mới.
     - Nút quản lý mạng xã hội mở modal `ManageSocialsModal` cho phép thêm, sửa, xóa kênh liên lạc số.
   - **Thẻ Giám Sát Chuyên Biệt Cho Cán Bộ Tín Dụng**:
     - Tự động hiển thị khối *"Theo Dõi Quản Lý Địa Bàn & Luân Chuyển Định Kỳ"* khi chức vụ là Cán bộ Tín dụng.
     - Hiển thị Địa bàn quản lý, Ngày nhận địa bàn (`areaStartDate`), Thâm niên quản lý địa bàn, Thời điểm luân chuyển định kỳ tiếp theo (chu kỳ 36 tháng theo quy định NHNN), số tháng còn lại và huy hiệu cảnh báo màu sắc trực quan.
   - **Hàng nút chức năng riêng biệt (Action Bar)**:
     - Nhóm Xuất tài liệu: **Xuất Word** (`.docx`), **Xuất Excel** (`.xlsx`), **In trích ngang A4** (xem trước).
     - Nhóm Quản trị cán bộ: **Chỉnh sửa hồ sơ** và **Xóa cán bộ** (có xác nhận an toàn).
   - **Lưới 4 phân khu lý lịch 2C/TCTD**:
     - Phân khu 1: Thông tin Cá nhân & Liên hệ (CCCD, Ngày sinh, Giới tính, SĐT, Email).
     - Phân khu 2: Công tác & Thâm niên (Chức danh, Phòng ban, Ngày bổ nhiệm, Thâm niên vị trí, Tổng thâm niên, HĐLĐ, Địa bàn tín dụng).
     - Phân khu 3: Chính trị & Đảng - Đoàn thể (Đảng viên ĐCSVN, Chức vụ Chi bộ, Ngày vào Đảng dự bị, Ngày chính thức).
     - Phân khu 4: **Trình Độ & Văn Bằng Chuyên Môn Đa Cấp**:
       - Hiển thị danh sách thẻ văn bằng đa cấp (Tiến sĩ, Thạc sĩ, Đại học, Cao đẳng, Trung cấp).
       - Huy hiệu văn bằng cao nhất gắn sao vàng, hiển thị chuyên ngành, trường đào tạo, năm tốt nghiệp, xếp loại.
       - Nút xem ảnh scan văn bằng tích hợp popup lightbox, nút chỉnh sửa và xóa văn bằng.
       - Nút "+ Thêm văn bằng" mở `AddDegreeModal`.
2. `EmployeeTransferHistory.jsx` (Tab Luân chuyển công tác):
   - Phân hệ quản lý **quá trình công tác và lịch sử luân chuyển thời gian thực**:
     - Nút **"+ Thêm mốc công tác"** mở `WorkHistoryPeriodModal` hỗ trợ thêm giai đoạn công tác mới hoặc luân chuyển chức danh/địa bàn.
     - Hiển thị thanh tiến độ thời gian công tác theo cấu hình động `transferRules` của từng chức danh.
     - **Thẻ Tiến độ Quản lý Địa bàn & Luân chuyển Định kỳ cho CBTD**: Hiển thị thanh tiến độ % thâm niên địa bàn hiện tại, ngày mốc luân chuyển tiếp theo và trạng thái an toàn/cảnh báo.
     - **Timeline Mốc Công Tác Dọc (Vertical Timeline)**:
       - Mốc hiện tại đang đảm nhiệm (`isCurrent: true`) được viền nổi bật kèm chấm xanh nhấp nháy sống động.
       - Hiển thị đầy đủ chức danh, phòng ban, địa bàn tín dụng, số quyết định, người ký, tình trạng bàn giao và nút sửa/xóa từng mốc.
3. `EmployeeTrainingTab.jsx` (Tab Đào tạo & Chứng chỉ):
   - Quản lý chi tiết từng khóa học: Đơn vị tổ chức (NHNN, Hiệp hội QTDND, Học viện Ngân hàng...), Quyết định/Kế hoạch, Thời gian, Địa điểm, Nội dung bồi dưỡng, Số hiệu chứng chỉ, Ngày cấp, Ngày hết hạn, Xếp loại và Xem ảnh scan.
   - Trạng thái hiệu lực tự động: Còn hiệu lực, Sắp hết hạn, Đã hết hạn, Hoàn thành tập huấn.
4. `EmployeeAnalyticsTab.jsx` (Tab Cơ cấu & Thống kê):
   - 4 thẻ chỉ số tổng quan: Tổng nhân sự, Tỷ lệ Đảng viên, Cơ cấu Giới tính (Nam/Nữ), Số cán bộ đến hạn luân chuyển.
   - **Thống kê Cơ cấu Trình độ Chuyên môn / Học vấn toàn Quỹ**: Tính toán động từ CSDL `employee_degrees`, ưu tiên văn bằng cao nhất của mỗi cán bộ, phản ánh chính xác tỷ lệ Thạc sĩ, Đại học, Cao đẳng, Trung cấp.
   - **Bảng Giám sát luân chuyển định kỳ toàn Quỹ**: Quản lý địa bàn, ngày nhận địa bàn, thâm niên và thời hạn luân chuyển cho CBTD.
5. `EmployeeSettingsTab.jsx` (Tab Danh mục & Cấu hình):
   - Cấu hình Quy tắc Luân chuyển theo từng Chức danh (`transferRules`): Vị trí nào phải luân chuyển, Thời hạn tối đa (tháng), Thời gian cảnh báo trước (tháng).
   - Cấu hình Phân quyền Phân hệ: Quyền xem danh bạ toàn Quỹ (`allowStaffViewDirectory`), Quyền tải lên chứng chỉ (`canStaffUploadTraining`).
   - Quản lý danh mục Phòng ban và Chức vụ chính quyền chuẩn mực.

### 5.4. Các Modal Nghiệp Vụ & Bộ Xuất Báo Cáo:
1. `WorkHistoryPeriodModal.jsx`: Modal thêm / chỉnh sửa mốc quá trình công tác:
   - Hỗ trợ 5 hình thức luân chuyển: Luân chuyển định kỳ NHNN, Bổ nhiệm chức danh, Điều động phòng ban, Thay đổi địa bàn tín dụng, Tuyển dụng tiếp nhận ban đầu.
   - Ngày bắt đầu / kết thúc, cờ đang đảm nhiệm (`isCurrent`), chức vụ, phòng ban, địa bàn tín dụng, số quyết định, người ký, tình trạng bàn giao.
   - Cờ tích chọn *"Đồng bộ chức vụ và địa bàn vào hồ sơ cán bộ hiện tại"*.
2. `AddDegreeModal.jsx`: Modal thêm / chỉnh sửa văn bằng chuyên môn:
   - Chọn cấp bậc văn bằng (Tiến sĩ, Thạc sĩ, Đại học, Cao đẳng, Trung cấp, Sơ cấp, Khác).
   - Tên văn bằng, chuyên ngành đào tạo, cơ sở đào tạo, hình thức đào tạo (Chính quy, Tại chức, Liên thông, Từ xa), năm tốt nghiệp, xếp loại, số hiệu văn bằng.
   - Cờ *"Đặt làm văn bằng chuyên môn chính"* tự động đồng bộ vào trường `education` tóm tắt của cán bộ.
   - Tải lên ảnh scan văn bằng nén WebP an toàn qua Canvas (< 50KB).
3. `ManageSocialsModal.jsx`: Modal quản lý mạng xã hội & liên lạc số:
   - Thêm/sửa kênh: Zalo, Facebook, Telegram, LinkedIn, Viber, Khác.
   - Tên người dùng / Số điện thoại liên kết, URL trang cá nhân, cờ công khai nội bộ.
4. `EmployeeA4PrintModal.jsx`: Màn hình xem trước và in Sơ yếu lý lịch trích ngang A4 mẫu 2C/TCTD:
   - Quốc hiệu, tiêu ngữ, thông tin cá nhân, kênh liên lạc số, thông tin Đảng - Đoàn thể.
   - **Bảng Quá trình công tác**: Trình bày mốc thời gian, chức danh, phòng ban, địa bàn phụ trách, số quyết định bổ nhiệm/điều động.
   - **Bảng Văn bằng chuyên môn**: Trình bày cấp bậc, chuyên ngành, cơ sở đào tạo, hình thức, năm tốt nghiệp, xếp loại.
5. `exportUtils.js` (Bộ Công Cụ Xuất Báo Cáo Doanh Nghiệp):
   - `exportEmployeeProfileToDocx`: Xuất file Word `.docx` chuẩn mẫu 2C/TCTD với đầy đủ bảng biểu quá trình công tác và bảng văn bằng chuyên môn có viền và căn chỉnh chuẩn thể thức văn bản hành chính Việt Nam.
   - `exportEmployeeProfileToExcel`: Xuất file Excel `.xlsx` đa sheet chuyên nghiệp gồm 4 sheets:
     - Sheet 1: `Trich_ngang_2C` (Thông tin cá nhân & lý lịch 2C).
     - Sheet 2: `Qua_trinh_cong_tac` (Chi tiết các mốc timeline công tác, chức vụ, phòng ban, địa bàn).
     - Sheet 3: `Van_bang_chuyen_mon` (Danh mục văn bằng, chuyên ngành, trường, xếp loại).
     - Sheet 4: `Mang_xa_hoi` (Danh sách kênh liên lạc số & mạng xã hội).


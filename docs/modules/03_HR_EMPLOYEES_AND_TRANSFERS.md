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
2. **Theo dõi Quá trình Luân chuyển công tác & Điều động địa bàn (`work_history`)**:
   - Theo quy định của Ngân hàng Nhà nước, các vị trí nhạy cảm tại Quỹ tín dụng nhân dân (CBTD, Kế toán, Thủ quỹ, BKS) **bắt buộc phải thực hiện luân chuyển định kỳ** từ 2 đến 3 năm một lần để phòng ngừa rủi ro câu kết và tiêu cực tín dụng.
   - Hệ thống hiển thị **Timeline quá trình luân chuyển** với đầy đủ: Số quyết định, ngày ký, ngày có hiệu lực, người ký (Chủ tịch HĐQT/Giám đốc), hình thức luân chuyển (`LUAN_CHUYEN_DINH_KY`, `BO_NHIEM`, `DIEU_DONG`, `THAY_DOI_DIA_BAN`), chức vụ và địa bàn cũ $\rightarrow$ mới, tình trạng bàn giao hồ sơ nợ và ghi chú.
3. **Quản lý Thâm niên Giữ chức vụ (`positionStartDate`)**:
   - Lưu trữ ngày bắt đầu đảm nhiệm chức danh hiện tại của từng cán bộ.
   - Tiện ích tính toán tự động `calculatePositionTenure(positionStartDate)` quy đổi ra năm/tháng công tác (ví dụ: *"3 năm 4 tháng"*).
   - Phục vụ trực tiếp cho công tác xét nâng bậc lương định kỳ, quy hoạch bổ nhiệm và giám sát thời hạn luân chuyển bắt buộc theo quy định NHNN.
4. **Quản lý Hồ sơ Đào tạo & Chứng chỉ Chuyên môn (`employee_training`)**:
   - Lưu trữ toàn bộ lịch sử các khóa đào tạo, bồi dưỡng nghiệp vụ mà cán bộ đã hoàn thành.
   - Quản lý chi tiết: Tên khóa học/chứng chỉ, cơ sở đào tạo (Học viện Ngân hàng, Hiệp hội QTDND...), ngày cấp, ngày hết hạn hiệu lực, số hiệu chứng chỉ.
   - Lưu trữ ảnh scan/chụp chứng chỉ trực tiếp để tra cứu đối soát khi có đoàn thanh tra, kiểm tra.
5. **Lưu trữ Lịch sử Đánh giá Hiệu suất KPI (`employee_kpi_history`)**:
   - Sẵn sàng cấu trúc lưu trữ lịch sử kết quả đánh giá KPI qua các kỳ (tháng, quý, năm) của từng nhân sự, tạo tiền đề liên thông với Phân hệ KPI và Tính lương.
6. **Bổ sung Chức danh "Kiểm soát nội bộ (Kiểm soát viên chuyên trách)"**:
   - Mã `pos-11`, code `KSNB`, thuộc Ban Kiểm soát. Đảm bảo đúng cơ cấu tổ chức theo quy định mới của NHNN đối với Quỹ tín dụng nhân dân.

---

## 🎨 2. GIẢI PHÁP TỐI ƯU HÓA HÌNH ẢNH & BẢO TOÀN FREE TIER FIREBASE (SPARK PLAN)

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
  id: string;               // Mã định danh duy nhất (VD: emp-001)
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

Hệ thống giao diện phân hệ Quản trị Nhân sự bao gồm:
1. `EmployeesContainer.jsx`: Khung chứa chính, quản lý state danh bạ cán bộ, bộ lọc phòng ban, thâm niên và mở các modal nghiệp vụ.
2. `EmployeeCard.jsx`: Thẻ hiển thị trích ngang cán bộ:
   - Hiển thị ảnh Avatar (hỗ trợ đổi ảnh trực tiếp bằng camera/tải tệp kèm nén tự động).
   - Hiển thị badge phòng ban, chức vụ chính quyền và chức vụ Đảng.
   - Hiển thị **Thâm niên giữ chức vụ** (năm/tháng). Hỗ trợ chỉnh sửa ngày bổ nhiệm inline.
   - 2 nút hành động chuyên nghiệp:
     - 🎓 **Đào tạo & CC**: Mở modal quản lý danh sách và cấp mới văn bằng chứng chỉ.
     - 🔄 **Luân chuyển**: Mở modal xem timeline quá trình luân chuyển hoặc tạo quyết định điều động mới.
3. `EmployeeTrainingModal.jsx`: Modal chuyên biệt quản lý Đào tạo & Chứng chỉ:
   - Danh sách các chứng chỉ đã đạt được của cán bộ kèm hình ảnh thu nhỏ thumbnail.
   - Chức năng phóng to xem ảnh chứng chỉ toàn màn hình (Modal Preview).
   - Form thêm mới khóa đào tạo/chứng chỉ với tính năng tự động nén ảnh qua Canvas trước khi lưu vào Firestore.
   - Chức năng xóa chứng chỉ (yêu cầu xác nhận an toàn).
4. `WorkHistoryModal.jsx`: Modal Timeline hiển thị quá trình luân chuyển công tác, điều động địa bàn theo thời gian thực.

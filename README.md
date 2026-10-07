# CỔNG THÔNG TIN & QUẢN TRỊ NHÂN SỰ (HRM PORTAL) - QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ

> Hệ thống đánh giá tín nhiệm, chấm điểm KPI 3 cấp và bỏ phiếu quy hoạch cán bộ nguồn dành cho Quỹ Tín dụng Nhân dân Yên Thọ (Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa).

---

## 🏛️ 1. Giới thiệu & Kiến trúc công nghệ
- **Framework**: React 19, Single Page Application (SPA) phát triển trên nền Vite 8.
- **Styling**: Tailwind CSS v4 với tông màu nhận diện thương hiệu tài chính/tín dụng chuẩn mực (`#0f766e` - Teal 700 / Emerald).
- **Iconography**: `lucide-react`.
- **Trực quan hóa số liệu**: `recharts` (Pie Chart & Bar Chart phân bổ xếp loại và KPI).
- **Routing & RBAC**: `react-router-dom` v7 với Protected Routes theo 3 phân quyền.
- **Backend & Database**: Firebase Authentication (Email/Password) và Cloud Firestore (`evaluations_trust`, `evaluations_kpi`, `evaluations_planning`, `users`).
- **Cơ chế Fallback thông minh**: Hỗ trợ chế độ xem trước (Demo Mode) tức thì khi chưa dán khóa Firebase, và tự động chuyển sang Firebase thật ngay khi dán cấu hình vào `src/lib/firebase.js`.

---

## 🔐 2. Hướng dẫn dán Cấu hình Firebase (Firebase Setup)

Mở tệp [src/lib/firebase.js](file:///d:/Antigravity%20Projects/QtdYenTho-HRM/src/lib/firebase.js) và dán thông tin từ Firebase Console của bạn vào đối tượng `firebaseConfig`:

```javascript
export const firebaseConfig = {
  apiKey: "AIzaSy...",            // Dán API Key của bạn
  authDomain: "qtd-yentho-hrm.firebaseapp.com",
  projectId: "qtd-yentho-hrm",
  storageBucket: "qtd-yentho-hrm.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

Ngay sau khi lưu file, hệ thống sẽ tự động kết nối trực tiếp đến Firebase Authentication và Firestore collections tương ứng!

---

## 👥 3. Phân quyền Người Dùng (Role-Based Access Control - RBAC)

Hệ thống thiết lập 3 vai trò chuẩn mực:

| Vai trò | Mã quyền | Tài khoản thử nghiệm | Quyền hạn trên hệ thống |
| :--- | :--- | :--- | :--- |
| **Cán bộ** | `staff` | `canbo@qtdyentho.vn` (Pass: `123456`) | Đánh giá tín nhiệm, Tự chấm điểm KPI (Bước 1: 40%), Bỏ phiếu quy hoạch |
| **Ban điều hành** | `manager` | `quanly@qtdyentho.vn` (Pass: `123456`) | Truy cập Dashboard thời gian thực, Duyệt/Chấm điểm KPI (Bước 2: 30%), Đánh giá tín nhiệm |
| **Chủ tịch HĐQT** | `chairman` | `chutich@qtdyentho.vn` (Pass: `123456`) | Toàn quyền Dashboard & Báo cáo, Phê duyệt tối cao KPI (Bước 3: 30%), Đánh giá tín nhiệm |

*Gợi ý*: Trên thanh điều hướng (Navbar), có nút **"Đổi vai trò"** cho phép chuyển đổi 1-click giữa 3 vai trò để tiện kiểm thử toàn bộ các quy trình!

---

## 📋 4. Đặc Tả Các Phân Hệ Cốt Lõi

### Module A: Đánh giá tín nhiệm (`evaluations_trust`)
- **Biểu mẫu**: Đánh giá đồng nghiệp theo **10 tiêu chí chuẩn mực QTDND** (Đạo đức nghề nghiệp, Chấp hành quy chế NHNN, Chuyên môn tín dụng/kế toán, Tác phong phục vụ thành viên...).
- **Ràng buộc điểm số**: Nhập số trực tiếp hoặc dùng nút stepper/pill chọn điểm, giới hạn nghiêm ngặt từ $0$ đến $10$ điểm mỗi tiêu chí.
- **Tính toán tự động**: Tổng điểm $= \sum_{i=1}^{10} \text{Tiêu chí}_i$ (tối đa 100 điểm).
- **Phân loại tự động**:
  - $\ge 90$ điểm: **Xuất sắc**
  - $\ge 70$ điểm: **Tốt**
  - $\ge 50$ điểm: **Hoàn thành**
  - $< 50$ điểm: **Không hoàn thành**
- **Lưu trữ**: Đồng bộ thời gian thực vào collection `evaluations_trust`.

### Module B: Chấm điểm KPI 3 Cấp (`evaluations_kpi`)
Quy trình chấm điểm đa cấp với trọng số chuẩn mực:
$$\text{FinalScore} = (\text{ScoreSelf} \times 0.4) + (\text{ScoreManager} \times 0.3) + (\text{ScoreChairman} \times 0.3)$$
1. **Bước 1 (Staff - Trọng số 40%)**: Cán bộ tự chấm điểm kết quả công tác và ghi nhận bản tự nhận xét $\rightarrow$ Trạng thái chuyển thành `pending_manager`.
2. **Bước 2 (Manager - Trọng số 30%)**: Ban điều hành thẩm tra và nhập điểm $\rightarrow$ Trạng thái chuyển thành `pending_chairman`.
3. **Bước 3 (Chairman - Trọng số 30%)**: Chủ tịch HĐQT phê duyệt điểm $\rightarrow$ Hệ thống tự động tính `finalScore` và chuyển trạng thái sang `completed`.

### Module C: Bỏ phiếu quy hoạch cán bộ nguồn (`evaluations_planning`)
- Lựa chọn cán bộ trong danh mục nhân sự QTDND Yên Thọ.
- Nhập/chọn chức danh quy hoạch (Phó Giám đốc, Trưởng Ban kiểm soát, Trưởng phòng Tín dụng...).
- Lựa chọn 3 mức độ tín nhiệm:
  - `Tín nhiệm cao`
  - `Tín nhiệm`
  - `Tín nhiệm thấp`
- Tự động tổng hợp tỷ lệ % tín nhiệm của từng ứng viên.

### Phân Hệ Dashboard Báo Cáo Thời Gian Thực
- **Phân quyền**: Chỉ mở cho `manager` và `chairman`.
- **Thời gian thực**: Sử dụng Firestore `onSnapshot` để lắng nghe dữ liệu tức thì không cần tải lại trang.
- **Thẻ tóm tắt KPIs**: Tổng số lượt đánh giá, Điểm KPI trung bình, Tỷ lệ hồ sơ KPI hoàn thành, Số phiếu quy hoạch.
- **Biểu đồ Recharts**:
  - **Pie Chart**: Cơ cấu phân bổ xếp loại tín nhiệm (Xuất sắc, Tốt, Hoàn thành, Không hoàn thành).
  - **Bar Chart**: So sánh điểm KPI trung bình giữa các phòng ban (Tín dụng, Kế toán - Ngân quỹ, Ban kiểm soát, Ban điều hành).

---

## 🚀 5. Hướng dẫn Khởi chạy Dự án

```bash
# Di chuyển vào thư mục dự án
cd "d:\Antigravity Projects\QtdYenTho-HRM"

# Cài đặt thư viện (nếu chưa cài)
npm install

# Khởi chạy máy chủ phát triển
npm run dev

# Hoặc chạy kiểm tra bản đóng gói sản phẩm
npm run build
npm run preview
```

Ứng dụng sẽ hoạt động tại địa chỉ: `http://localhost:5173/` (hoặc `http://localhost:4173/`).

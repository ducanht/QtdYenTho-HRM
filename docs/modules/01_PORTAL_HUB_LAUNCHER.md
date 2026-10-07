# PHÂN HỆ 01: CỔNG ĐIỀU HƯỚNG Ô LƯỚI (PORTAL HUB LAUNCHER)
## HỆ THỐNG QUẢN TRỊ NHÂN SỰ — QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ

> **Mã phân hệ:** `MODULE_PORTAL`  
> **Tuyến đường (Route):** `/portal` (Màn hình chính sau khi đăng nhập)  
> **Trạng thái:** 🟢 Hoàn tất (100%)  
> **Quyền truy cập:** Toàn bộ cán bộ nhân viên đã đăng nhập hợp lệ

---

## 🏛️ 1. MỤC TIÊU NGHIỆP VỤ & KIẾN TRÚC

Cổng Điều Hướng Ô Lưới (Portal Hub Launcher) là điểm chạm đầu tiên của cán bộ sau khi đăng nhập thành công. Thay vì đưa thẳng người dùng vào một biểu mẫu cụ thể, hệ thống trình bày toàn bộ hệ sinh thái các phân hệ dưới dạng **Ô lưới ứng dụng (Application Grid)** tương tự một hệ điều hành quản trị hiện đại.

### Điểm nhấn kỹ thuật:
- **Tự động hóa theo dữ liệu (Data-Driven Dynamic Rendering)**: Danh sách các ô lưới được nạp từ `SYSTEM_MODULES` hoặc Firestore collection `system_modules`. Khi Admin thêm một module mới vào hệ thống, ô lưới truy cập sẽ **tự động xuất hiện** mà không cần lập trình viên phải sửa code giao diện.
- **Mỗi ô lưới là một WebApp độc lập**: Cung cấp đầy đủ thông tin:
  - Tên phân hệ, mã định danh
  - Biểu tượng nhận diện với khung màu sắc riêng biệt
  - Badge trạng thái: `ĐANG VẬN HÀNH` (Xanh ngọc), `SẮP TRIỂN KHAI` (Vàng hổ phách), `KẾ HOẠCH` (Xám)
  - Thông tin giới thiệu nghiệp vụ, tính năng chính
  - Quyền hạn của người dùng đối với phân hệ đó
  - Nút bấm truy cập trực tiếp

---

## 🎨 2. QUY CHUẨN GIAO DIỆN & RESPONSIVE

- **Giao diện thẻ bài (App Cards)**: Thiết kế chuẩn Glassmorphism của QTDND Yên Thọ, bo góc 16px (`rounded-2xl`), viền sáng, hiệu ứng nhô nổi 3D nhẹ khi di chuột (`hover:-translate-y-1.5 hover:shadow-xl`).
- **Responsive Breakpoints**:
  - Di động (`< 640px`): 1 cột ô lưới (`grid-cols-1`).
  - Máy tính bảng (`640px - 1024px`): 2 cột ô lưới (`sm:grid-cols-2`).
  - Máy tính để bàn (`> 1024px`): 3 đến 4 cột ô lưới (`lg:grid-cols-3 xl:grid-cols-4`).

---

## 🔒 3. PHÂN QUYỀN TRUY CẬP

- Cán bộ nhân viên (`staff`): Hiển thị tất cả các phân hệ được phép truy cập (Tín nhiệm, KPI cá nhân, Quy hoạch, Hồ sơ). Đối với các phân hệ quản trị cấp cao (Bảng điều khiển Giám đốc), hiển thị nhãn "Yêu cầu quyền Lãnh đạo".
- Ban điều hành (`manager`) & Chủ tịch HĐQT (`chairman`): Truy cập 100% tất cả các phân hệ.

---
*Tài liệu thuộc bộ đặc tả HRM QTDND Yên Thọ.*

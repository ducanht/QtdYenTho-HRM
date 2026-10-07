# PHÂN HỆ 06: BẢNG ĐIỀU KHIỂN & PHÂN TÍCH TÍN NHIỆM (DASHBOARD)
## HỆ THỐNG QUẢN TRỊ NHÂN SỰ — QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ

> **Mã phân hệ:** `MODULE_DASHBOARD`  
> **Tuyến đường (Route):** `/dashboard`  
> **Trạng thái:** 🟢 Hoàn tất (100%)  
> **Quyền truy cập:** Chỉ dành cho Ban điều hành (`manager`) và Chủ tịch HĐQT (`chairman`)

---

## 🏛️ 1. MỤC TIÊU NGHIỆP VỤ

1. Giám sát tổng thể các chỉ số nhân sự & tín nhiệm của đơn vị theo thời gian thực (Real-time Firestore `onSnapshot`).
2. Biểu đồ hóa trực quan:
   - **Pie Chart (Recharts)**: Tỷ lệ xếp loại tín nhiệm (Xuất sắc, Tốt, Hoàn thành, Không hoàn thành).
   - **Bar Chart (Recharts)**: Điểm đánh giá KPI bình quân giữa các phòng ban chuyên môn.
3. Thẻ tóm tắt KPIs:
   - Tổng số lượt đánh giá đã hoàn thành.
   - Điểm KPI bình quân toàn Quỹ.
   - Tỷ lệ hồ sơ hoàn thành chu trình 3 cấp.
   - Tổng số phiếu quy hoạch cán bộ đã thu thập.

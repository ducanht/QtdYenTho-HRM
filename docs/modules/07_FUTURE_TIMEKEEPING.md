# PHÂN HỆ 07 (TƯƠNG LAI): QUẢN LÝ CHẤM CÔNG & NGHỈ PHÉP
## HỆ THỐNG QUẢN TRỊ NHÂN SỰ — QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ

> **Mã phân hệ:** `MODULE_TIMEKEEPING`  
> **Trạng thái:** 🟡 Sẵn sàng CSDL (Đã có mã module & phân quyền, chờ tích hợp UI)  
> **Dự kiến triển khai:** Giai đoạn tiếp theo sau khi hoàn thiện Đánh giá tín nhiệm

---

## 🏛️ 1. MỤC TIÊU NGHIỆP VỤ

1. Quản lý thời giờ làm việc của cán bộ nhân viên Quỹ (giờ mở cửa giao dịch tài chính, giờ chốt quỹ tiền mặt cuối ngày).
2. Quy trình nộp và phê duyệt đơn xin nghỉ phép (nghỉ phép năm, nghỉ ốm, nghỉ chế độ).
3. Lịch trực bảo vệ, trực kiểm quỹ cuối tuần và các ngày lễ tết.

---

## 📋 2. CẤU TRÚC CSDL DỰ KIẾN (`timekeeping_logs`, `leave_requests`)

- CSDL đã được dự trù trong schema thiết kế, sẵn sàng kết nối mà không cần sửa cấu trúc gốc.

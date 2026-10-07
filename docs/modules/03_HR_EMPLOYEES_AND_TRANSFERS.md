# PHÂN HỆ 03: HỒ SƠ CÁN BỘ & QUÁ TRÌNH LUÂN CHUYỂN CÔNG TÁC
## HỆ THỐNG QUẢN TRỊ NHÂN SỰ — QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ

> **Mã phân hệ:** `MODULE_HR`  
> **Tuyến đường (Route):** `/employees`  
> **Trạng thái:** 🟢 Hoàn tất (100%)  
> **Quy định pháp lý tham chiếu:** Thông tư NHNN quy định về luân chuyển cán bộ tín dụng, kế toán định kỳ

---

## 🏛️ 1. MỤC TIÊU NGHIỆP VỤ

1. Quản trị danh bạ trích ngang 9 cán bộ nhân viên Quỹ Tín Dụng Nhân Dân Yên Thọ (Họ tên, CCCD, trình độ học vấn, chức vụ Đảng - Đoàn, hợp đồng, địa bàn phụ trách).
2. **Theo dõi quá trình luân chuyển công tác & điều động địa bàn**:
   - Theo quy định của Ngân hàng Nhà nước, cán bộ làm công tác thẩm định tín dụng, thủ quỹ, kế toán bắt buộc phải luân chuyển địa bàn định kỳ sau thời gian 3 năm để phòng ngừa rủi ro đạo đức và rủi ro quan hệ thân tộc với khách hàng vay vốn.
   - Hệ thống hiển thị **Timeline quá trình luân chuyển** với đầy đủ: Số quyết định, ngày hiệu lực, người ký, hình thức luân chuyển (định kỳ, bổ nhiệm, điều động), chức vụ và địa bàn cũ $\rightarrow$ mới, tình trạng bàn giao hồ sơ nợ.

---

## 📋 2. CẤU TRÚC DỮ LIỆU CỐT LÕI

- **Collection `users`**: Lưu hồ sơ nhân sự (CCCD, trình độ, chức vụ Đảng, trạng thái `ACTIVE`).
- **Collection `work_history`**:
  ```json
  {
    "id": "trans-001",
    "employeeId": "emp-003",
    "employeeName": "Nguyễn Văn An",
    "decisionNumber": "15/QĐ-HĐQT",
    "effectiveDate": "2025-01-01",
    "signerName": "Lê Đình Hải",
    "signerPosition": "Chủ tịch HĐQT",
    "transferType": "Luân chuyển địa bàn định kỳ",
    "fromDepartment": "Phòng Tín dụng (Xã Quý Lộc)",
    "toDepartment": "Phòng Tín dụng (Xã Yên Lâm)",
    "fromPosition": "Cán bộ Tín dụng Quý Lộc",
    "toPosition": "Cán bộ Tín dụng Yên Lâm",
    "handoverStatus": "Đã bàn giao đầy đủ 120 bộ hồ sơ tín dụng",
    "notes": "Thực hiện đúng quy định luân chuyển cán bộ sau 3 năm công tác"
  }
  ```

---

## 🔒 3. PHÂN QUYỀN

- Cán bộ nhân viên: Xem danh bạ và xem timeline luân chuyển công tác nội bộ.
- Ban điều hành & Chủ tịch HĐQT: Được quyền lập quyết định điều động/luân chuyển mới và cập nhật hồ sơ cán bộ.

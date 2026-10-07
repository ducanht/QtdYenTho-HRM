# PHÂN HỆ 02: ĐÁNH GIÁ TÍN NHIỆM CÁN BỘ (10 TIÊU CHÍ)
## HỆ THỐNG QUẢN TRỊ NHÂN SỰ — QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ

> **Mã phân hệ:** `MODULE_TRUST`  
> **Tuyến đường (Route):** `/trust-evaluation`  
> **Trạng thái:** 🟢 Hoàn tất (100% - Trọng tâm ưu tiên hàng đầu)  
> **Quyền truy cập:** Toàn bộ cán bộ nhân viên đã đăng nhập

---

## 🏛️ 1. MỤC TIÊU NGHIỆP VỤ & NGUYÊN TẮC CỐT LÕI

Phân hệ Đánh giá Tín nhiệm phục vụ công tác bỏ phiếu định kỳ (Quý, Năm) nhằm đánh giá phẩm chất chính trị, đạo đức nghề nghiệp, năng lực chuyên môn và tinh thần trách nhiệm của cán bộ nhân viên Quỹ Tín Dụng Nhân Dân Yên Thọ.

### Nguyên tắc nghiệp vụ bắt buộc:
1. **Cấu hình linh hoạt ở cấp Đợt đánh giá**:
   - Hình thức **Bỏ phiếu kín (Ẩn danh)** hay **Định danh (Công khai)** do **Ban Quản trị / Lãnh đạo Quỹ quyết định** ở cấp Đợt (`evaluation_periods`).
   - Cán bộ thực hiện đánh giá **tuyệt đối không có ô checkbox tự chọn** trên biểu mẫu nhằm ngăn chặn tâm lý nể nang hoặc sai lệch quy chế.
2. **Quy chế Bỏ phiếu kín (Ẩn danh)**:
   - Khi Đợt quy định ẩn danh, hệ thống tự động gắn nhãn người nộp phiếu là `"Cán bộ Quỹ (Ẩn danh)"`.
   - Danh tính người chấm được bảo mật tuyệt đối trên giao diện xem lại của toàn thể cán bộ và người được đánh giá.
   - Cơ sở dữ liệu chỉ lưu vết kỹ thuật an toàn để chống hành vi bỏ phiếu trùng lặp.
3. **Quy chế Bỏ phiếu công khai (Định danh)**:
   - Khi Đợt quy định công khai, phiếu nộp ghi nhận công khai họ tên, chức danh của cán bộ thực hiện nhằm nâng cao trách nhiệm xây dựng nội bộ cơ quan.

---

## 📋 2. BỘ 10 TIÊU CHÍ ĐÁNH GIÁ TÍN NHIỆM CHUẨN

Thang điểm từ $0$ đến $10$ điểm cho mỗi tiêu chí (Tổng điểm tối đa: 100 điểm):

1. **TC01 - Đạo đức nghề nghiệp & Văn hóa giao tiếp**: Trung thực, tác phong chuẩn mực, phục vụ thành viên tận tụy.
2. **TC02 - Chấp hành Nội quy lao động & Quy chế Quỹ**: Chấp hành giờ giấc, phân công của Ban điều hành và Điều lệ Quỹ.
3. **TC03 - Chuyên môn nghiệp vụ & Năng lực công tác**: Nắm vững văn bản chỉ đạo của NHNN, quy trình tín dụng, kế toán.
4. **TC04 - Tinh thần phối hợp & Đoàn kết nội bộ**: Hỗ trợ đồng nghiệp giải quyết hồ sơ vay vốn, huy động vốn.
5. **TC05 - Trách nhiệm trong công việc**: Chủ động khắc phục khó khăn, đôn đốc thu hồi nợ, hoàn thành nhiệm vụ.
6. **TC06 - Kỷ luật giờ giấc & Bảo mật thông tin tài chính**: Giữ bí mật tuyệt đối số dư tiền gửi và hồ sơ khách hàng.
7. **TC07 - Đổi mới sáng tạo & Chuyển đổi số**: Làm chủ phần mềm ngân hàng, ứng dụng công nghệ trong tác nghiệp.
8. **TC08 - Liêm chính tài chính & Phòng ngừa rủi ro đạo đức**: Tuyệt đối không vòi vĩnh chi phí ngoài, không trục lợi tín dụng.
9. **TC09 - Đóng góp phong trào & Văn hóa tổ chức**: Tham gia các hoạt động an sinh xã hội, phong trào công đoàn.
10. **TC10 - Hiệu quả hoàn thành chỉ tiêu công việc**: Hoàn thành vượt mức chỉ tiêu dư nợ, huy động và kiểm soát nợ quá hạn.

---

## 📊 3. KHUNG PHÂN LOẠI TÍN NHIỆM

- $\ge 90$ điểm: **Xuất sắc** (Huy hiệu xanh lá)
- $70 - 89$ điểm: **Tốt** (Huy hiệu xanh ngọc)
- $50 - 69$ điểm: **Hoàn thành** (Huy hiệu hổ phách)
- Dưới $50$ điểm: **Không hoàn thành** (Huy hiệu đỏ hoa hồng)

---

## 🛠️ 4. CHỨC NĂNG QUẢN TRỊ ĐỢT ĐÁNH GIÁ (ADMIN / HĐQT)

Dành cho Chủ tịch HĐQT và Ban Giám đốc:
- Xem danh sách các đợt đánh giá tín nhiệm.
- **Nút chuyển đổi nhanh 1-Click**: Đổi giữa **Bỏ phiếu kín (Ẩn danh)** $\leftrightarrow$ **Công khai (Định danh)**.
- **Nút đóng / mở đợt**: Kích hoạt đợt (`ACTIVE`) hoặc Đóng đợt (`CLOSED`).
- **Ban hành đợt mới**: Nhập tên đợt, năm, quý, hình thức bỏ phiếu, thời hạn và căn cứ nghị quyết HĐQT.

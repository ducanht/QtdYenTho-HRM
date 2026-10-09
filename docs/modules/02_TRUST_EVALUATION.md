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

---

## 🏛️ 5. CHUẨN MỰC THIẾT KẾ BỐ CỤC IPAD 2 PHẦN (MASTER - DETAIL) & 100% RESPONSIVE

Toàn bộ các phân hệ con của Module Tín nhiệm tuân thủ nghiêm ngặt **Kiến trúc Bố cục iPad 2 Phần**:
- **Cột Trái (Master List - 3 đến 4/12 cột trên màn hình Desktop/Tablet)**:
  - Component chuẩn mực dùng chung: `PeriodMasterSidebar.jsx`.
  - Bộ lọc năm dạng Chips (`[Tất cả]`, `[Năm 2026]`...) giúp lọc đợt cực nhanh.
  - Danh sách thẻ đợt đánh giá trực quan, highlight đợt đang chọn, tự động render badge theo ngữ cảnh từng tab (Tiến độ chấm %, Số phiếu đã nộp, Trạng thái đợt, Tỷ lệ cử tri tham gia).
  - Tích hợp công cụ quản trị đợt: Nút **Tạo đợt**, **Sửa đợt**, **Xóa đợt** (bảo mật mật khẩu quản trị).
- **Cột Phải (Detail Content - 8 đến 9/12 cột trên Desktop/Tablet)**:
  - **Tab 1: Đánh giá (`SCORING`)**: Banner tiến độ + Bộ chuyển tiêu chí + Bảng chấm điểm cán bộ xếp hàng liên tiếp theo tiêu chí (pick chọn 1..10, tự động lưu ngầm).
  - **Tab 2: Lịch sử (`MY_VOTES`)**: Lịch sử các đợt đánh giá của Cá nhân, hỗ trợ xem theo từng đợt được chọn hoặc tùy chọn "Tất cả các đợt đánh giá" (`allowSelectAll`), hiển thị chi tiết điểm và đánh giá đã nộp. Cột chức vụ được gộp tinh gọn dưới tên cán bộ để chống tràn ngang.
  - **Tab 3: Cá nhân (`MY_RESULTS`)**: Bảng điểm tổng kết cá nhân của chính mình (chỉ hiển thị khi đợt đã đóng/công bố theo quy chế). Tự động phân tích điểm trung bình từng tiêu chí, gắn huy hiệu nổi bật **Cao nhất** (xanh lá) và **Thấp nhất** (hổ phách). Khi bấm vào bất kỳ dòng tiêu chí nào, hệ thống mở rộng chi tiết danh sách cử tri đã chấm điểm theo đúng cấu hình Đợt (**Ẩn danh** hiển thị `Cử tri #X (Bỏ phiếu kín)` hoặc **Công khai** hiển thị họ tên cử tri).
  - **Tab 4: Tổng quan (`OVERVIEW`)**: Báo cáo tổng thể phân bổ xếp loại toàn Quỹ, danh sách cử tri đã nộp / chưa nộp phản ánh 100% dữ liệu thực tế từ CSDL Firestore (triệt tiêu toàn bộ mock data). Cột chức vụ được gộp tinh gọn dưới họ tên cán bộ. Khi bấm xem chi tiết cán bộ trong bảng kết quả, modal `EmployeeTrustDetailModal` hiển thị bảng điểm tiêu chí trực quan với đầy đủ cột điểm trung bình, huy hiệu Cao nhất/Thấp nhất và cơ chế click xem danh sách cử tri chấm điểm.
  - **Tab 5: Cấu hình (`CRITERIA_SETTINGS`)**: Cấu hình độc lập cho từng đợt đánh giá (`period_configs`), nút Lưu cấu hình nổi bật ở Header Card và **Sticky Bottom Action Toolbar** cố định đáy màn hình.
  - **Tab 6: Phân quyền (`PERMISSIONS_SETTINGS`)**: Ma trận phân quyền RBAC chuyên biệt của Phân hệ Tín nhiệm.
- **Thanh Menu Tinh Gọn**:
  - Desktop/iPad: Thanh tab ngang tinh gọn `TrustModuleTabsNav.jsx`, triệt tiêu 100% header rườm rà.
  - Mobile: Thanh Bottom Navigation `TrustBottomNav.jsx` cho phép chuyển tab 1 chạm, tự động xếp chồng (stack) dọc mượt mà.

---

## 🔍 5.1. CHI TIẾT ĐIỂM TIÊU CHÍ & CƠ CHẾ ĐỐI SOÁT DRILLDOWN
1. **Tinh giản cột hiển thị**:
   - Loại bỏ các cột không cần thiết: `Nhóm năng lực`, `Điểm Min`, `Điểm Max`.
   - Giữ lại các cột cốt lõi: Mã tiêu chí, Tên tiêu chí, Điểm trung bình, Đánh giá phân loại.
2. **Nhận diện Tiêu chí Cao nhất / Thấp nhất**:
   - Tự động tìm `maxScore` và `minScore` trong các tiêu chí có điểm hợp lệ ($> 0$).
   - Gắn huy hiệu: `Cao nhất` (Badge xanh lá `bg-emerald-50 text-emerald-700`) và `Thấp nhất` (Badge hổ phách `bg-amber-50 text-amber-700`).
3. **Drilldown Chi tiết Cử tri Chấm điểm**:
   - Khi bấm vào dòng tiêu chí: Hiển thị danh sách phân rã toàn bộ các lượt chấm điểm của các cử tri đối với tiêu chí đó.
   - Tuân thủ nghiêm ngặt bảo mật: Nếu đợt đánh giá là `ANONYMOUS` (Ẩn danh), hiển thị `"Cử tri #X (Bỏ phiếu kín)"` (chỉ tài khoản Quản trị cấp cao / Admin đối soát mới có quyền xem thông tin kiểm toán); nếu là `PUBLIC` (Công khai), hiển thị họ tên đầy đủ và chức vụ cử tri.

---

## 🔒 6. BẢO MẬT XÁC THỰC MẬT KHẨU QUẢN TRỊ KHI XÓA ĐỢT
- Khi Lãnh đạo/Admin thực hiện xóa đợt đánh giá, hệ thống kích hoạt modal bảo mật `DeletePeriodConfirmModal.jsx`.
- Bắt buộc nhập **Mật khẩu quản trị** và xác thực qua hàm `verifyAdminPassword(email, password)`.
- Chỉ khi mật khẩu chính xác mới được phép xóa đợt khỏi Firestore, bảo đảm tuyệt đối an toàn dữ liệu và phòng ngừa thao tác nhầm lẫn.

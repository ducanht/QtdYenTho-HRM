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

## 📊 3. KHUNG 4 MỨC PHÂN LOẠI XẾP LOẠI TÍN NHIỆM CHUẨN MỰC MỚI

Áp dụng quy chế đánh giá tín nhiệm mới của Quỹ Tín Dụng Nhân Dân Yên Thọ:

1. **Hoàn thành xuất sắc nhiệm vụ**:
   - Điểm trung bình từ $90$ đến $100$ điểm.
   - **Điều kiện bắt buộc**: Không có tiêu chí nào bị chấm dưới $7$ điểm (tất cả các tiêu chí đều đạt $\ge 7.0$ điểm).
   - Huy hiệu: 🟢 Xanh lá (`bg-emerald-50 text-emerald-800`).
2. **Hoàn thành tốt nhiệm vụ**:
   - Điểm trung bình từ $70$ đến dưới $90$ điểm (hoặc $\ge 90$ điểm nhưng bị khống chế do có tiêu chí $< 7.0$ điểm).
   - **Điều kiện bắt buộc**: Không có tiêu chí nào bị chấm dưới $5$ điểm (tất cả các tiêu chí đều đạt $\ge 5.0$ điểm).
   - Huy hiệu: 🔵 Xanh ngọc (`bg-teal-50 text-teal-800`).
3. **Hoàn thành nhiệm vụ**:
   - Điểm trung bình từ $50$ đến dưới $70$ điểm (hoặc $\ge 70$ điểm nhưng bị khống chế do có tiêu chí $< 5.0$ điểm).
   - Huy hiệu: 🟡 Hổ phách (`bg-amber-50 text-amber-800`).
4. **Không hoàn thành nhiệm vụ**:
   - Điểm trung bình dưới $50$ điểm, **HOẶC** có trên $50\%$ số phiếu đánh giá xếp ở mức Yếu ($0 - 5$ điểm / $\le 50$ điểm).
   - Huy hiệu: 🔴 Hoa hồng đỏ (`bg-rose-50 text-rose-800`).

---

## 🏛️ 5. CHUẨN MỰC THIẾT KẾ BỐ CỤC IPAD 2 PHẦN (MASTER - DETAIL) & 100% RESPONSIVE

Toàn bộ các phân hệ con của Module Tín nhiệm tuân thủ nghiêm ngặt **Kiến trúc Bố cục iPad 2 Phần**:
- **Cột Trái (Master List - 3 đến 4/12 cột trên màn hình Desktop/Tablet)**:
  - Component chuẩn mực dùng chung: `PeriodMasterSidebar.jsx`.
  - Bộ lọc năm dạng Chips (`[Tất cả]`, `[Năm 2026]`...) giúp lọc đợt cực nhanh.
  - Danh sách thẻ đợt đánh giá trực quan, highlight đợt đang chọn, tự động render badge theo ngữ cảnh từng tab (Tiến độ chấm %, Số phiếu đã nộp, Trạng thái đợt, Tỷ lệ cử tri tham gia).
  - Tích hợp công cụ quản trị đợt: Nút **Tạo đợt**, **Sửa đợt**, **Xóa đợt** (bảo mật mật khẩu quản trị).
- **Cột Phải (Detail Content - 8 đến 9/12 cột trên Desktop/Tablet)**:
  - **Tab 1: Đánh giá (`SCORING`)**: Banner tiến độ + Bộ chuyển tiêu chí + Bảng chấm điểm cán bộ xếp hàng liên tiếp theo tiêu chí (pick chọn 1..10, tự động lưu ngầm). Tự động kiểm tra quyền cử tri (`isEligibleVoter`), hiển thị cảnh báo nếu không thuộc danh sách cử tri được chỉ định bỏ phiếu.
  - **Tab 2: Lịch sử (`MY_VOTES`)**: Lịch sử các đợt đánh giá của Cá nhân, hỗ trợ xem theo từng đợt được chọn hoặc tùy chọn "Tất cả các đợt đánh giá" (`allowSelectAll`), hiển thị chi tiết điểm và đánh giá đã nộp. Cột chức vụ được gộp tinh gọn dưới tên cán bộ để chống tràn ngang.
  - **Tab 3: Cá nhân (`MY_RESULTS`)**: Bảng điểm tổng kết cá nhân của chính mình (chỉ hiển thị khi đợt đã đóng/công bố theo quy chế). Tự động phân tích điểm trung bình từng tiêu chí, gắn huy hiệu nổi bật **Cao nhất** (xanh lá) và **Thấp nhất** (hổ phách), hiển thị lý do nếu bị khống chế hạ mức. Khi bấm vào bất kỳ dòng tiêu chí nào, hệ thống mở rộng chi tiết danh sách cử tri đã chấm điểm theo đúng cấu hình Đợt (**Ẩn danh** hiển thị `Cử tri #X (Bỏ phiếu kín)` hoặc **Công khai** hiển thị họ tên cử tri).
  - **Tab 4: Tổng quan (`OVERVIEW`)**: Báo cáo tổng thể phân bổ xếp loại toàn Quỹ theo 4 mức mới, danh sách cử tri đã nộp / chưa nộp phản ánh 100% dữ liệu thực tế từ CSDL Firestore căn cứ theo danh sách cử tri `voterEmployeeIds`. Cột chức vụ được gộp tinh gọn dưới họ tên cán bộ. Khi bấm xem chi tiết cán bộ trong bảng kết quả, modal `EmployeeTrustDetailModal` hiển thị bảng điểm tiêu chí trực quan với đầy đủ cột điểm trung bình, huy hiệu Cao nhất/Thấp nhất, lý do khống chế và cơ chế click xem danh sách cử tri chấm điểm.
  - **Tab 5: Cấu hình (`CRITERIA_SETTINGS`)**: Cấu hình độc lập cho từng đợt đánh giá (`period_configs`), bao gồm 2 phân khu cán bộ rõ ràng: **Người được tham gia bỏ phiếu (Cử tri)** (`voterEmployeeIds`) và **Cán bộ được lấy phiếu tín nhiệm** (`targetEmployeeIds`), cùng bảng cấu hình 4 mức xếp loại tín nhiệm (ngưỡng 90/70/50, khống chế tiêu chí 7/5, phiếu yếu 50%). Nút Lưu cấu hình nổi bật ở Header Card và **Sticky Bottom Action Toolbar** cố định đáy màn hình.
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
   - Tuân thủ nghiêm ngặt bảo mật: Nếu đợt đánh giá là `ANONYMOUS` (Ẩn danh), hiển thị `"Cử tri #X (Bỏ phiếu kín)"` cho mọi tài khoản; nếu là `IDENTIFIED` (Công khai), hiển thị họ tên đầy đủ và chức vụ cử tri theo đúng cấu hình Đợt, triệt tiêu hoàn toàn nút toggle đối soát thủ công gây lộ danh tính.
4. **Xếp loại Cán bộ khi chưa hoàn thành bỏ phiếu**:
   - Cán bộ chưa có phiếu đánh giá (`evaluationsCount === 0`) hiển thị Xếp loại **"Chưa hoàn thành"** (badge màu slate trung tính), điểm trung bình và quy đổi hiển thị `--`. Tuyệt đối không xếp loại *"Không hoàn thành nhiệm vụ"* khi chưa có phiếu.
5. **Điều hướng SPA & Đồng bộ URL chuẩn mực (Zero Stale Navigation)**:
   - Sử dụng `useSearchParams` (`?tab=...&periodId=...`) để đồng bộ trạng thái Tab và Đợt đánh giá vào URL trình duyệt. Khi người dùng F5 Refresh hoặc bấm nút Back/Forward, hệ thống tự động phục hồi chính xác 100% màn hình và tab đang làm việc.
   - Trang Đăng nhập (`/login`) tự động chuyển hướng về `/portal` nếu người dùng đã có phiên đăng nhập hợp lệ, chống kẹt giao diện khi bấm nút Back.

---

## 🔒 6. BẢO MẬT XÁC THỰC MẬT KHẨU QUẢN TRỊ KHI XÓA ĐỢT
- Khi Lãnh đạo/Admin thực hiện xóa đợt đánh giá, hệ thống kích hoạt modal bảo mật `DeletePeriodConfirmModal.jsx`.
- Bắt buộc nhập **Mật khẩu quản trị** và xác thực qua hàm `verifyAdminPassword(email, password)`.
- Chỉ khi mật khẩu chính xác mới được phép xóa đợt khỏi Firestore, bảo đảm tuyệt đối an toàn dữ liệu và phòng ngừa thao tác nhầm lẫn.

---

## 🗳️ 7. QUY CHUẨN TÌNH TRẠNG NỘP PHIẾU & CÔ LẬP ĐỐI TƯỢNG LẤY PHIẾU (v3.6)
1. **Minh bạch tình trạng Nộp phiếu trên Banner Tiến độ (`TrustProgressBanner.jsx`)**:
   - Tự động phát hiện trạng thái nộp phiếu của người dùng trong đợt:
     + **ĐÃ NỘP PHIẾU CHÍNH THỨC**: Huy hiệu xanh ngọc kèm thời gian nộp GMT+7. Khối Gửi phiếu chuyển sang trạng thái tĩnh `"Đã nộp phiếu"`, **tuyệt đối không sáng** (không hiệu ứng pulse/ring), có lối tắt `"Xem phiếu đã nộp"`.
     + **CHƯA NỘP PHIẾU**: Huy hiệu hổ phách. Nút `"Nộp phiếu chính thức"` chỉ sáng xanh rực rỡ và cho phép thao tác khi tiến độ đạt đủ 100% tiêu chí cho toàn bộ cán bộ.
2. **Cô lập Đối tượng Lấy phiếu Tín nhiệm (`targetEmployeeIds`)**:
   - Toàn bộ danh sách đối tượng lấy phiếu tín nhiệm và bảng kết quả tín nhiệm toàn Quỹ (`TrustOverviewReport.jsx`) tuân thủ 100% cấu hình đợt.
   - Loại trừ hoàn toàn tài khoản Quản trị hệ thống webapp (`ROOT`, `ADMIN`) thông qua helper chuẩn mực `getEligibleTargetEmployees` và `isSystemAdminAccount`.
   - Ngăn chặn triệt để tình trạng tài khoản kỹ thuật bị đưa vào bảng kết quả với 0 phiếu và xếp loại không đạt.

---

## 🖨️ 8. BỘ THƯ VIỆN XUẤT DOANH NGHIỆP DÙNG CHUNG (ENTERPRISE EXPORT SUITE - XLSX, DOCX, PDF, PNG)
Thư viện dùng chung tại `src/lib/exportUtils.js` cung cấp hạ tầng xuất dữ liệu tiêu chuẩn cho toàn bộ hệ thống HRM:
1. **Xuất Excel Microsoft thực thụ (`.xlsx`) via SheetJS**:
   - Thay thế hoàn toàn file `.csv` thô sơ trước đây.
   - Hỗ trợ tiêu đề đơn vị (QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ), tên đợt đánh giá, phụ đề, căn lề và tự động tính độ rộng cột `!cols` (wch) theo độ dài nội dung tiếng Việt.
2. **Xuất Microsoft Word (`.docx`) chuẩn thể thức hành chính**:
   - Xây dựng văn bản Word chuẩn thể thức Nghị định 30/2020/NĐ-CP: Quốc hiệu - Tiêu ngữ, Tên cơ quan ban hành, Trích yếu, Số hiệu văn bản.
   - Bảng biểu kẻ viền, lề trang tiêu chuẩn A4 (Trái 3cm, Phải 2cm, Trên 2cm, Dưới 2cm).
   - Khối 3 chữ ký Lãnh đạo: Trưởng Ban Kiểm Soát, Giám Đốc Điều Hành, Chủ Tịch HĐQT.
3. **Xuất PDF chuẩn A4 100% không vỡ font tiếng Việt**:
   - Khắc phục triệt để nhược điểm font WinAnsi mặc định của jsPDF bằng công nghệ **Rasterized Vector Engine**: Render trực tiếp DOM container (`#trust-a4-document-container`) qua `html2canvas` (scale 2x) rồi đưa vào trang `jsPDF`.
   - Giữ nguyên 100% typography tiếng Việt (`Be Vietnam Pro` / `Inter`), viền nét, căn chỉnh lề và tự động phân trang đa trang.
4. **Tải ảnh báo cáo nhanh (`.png`) Retina 2x**: Chụp lại toàn bộ biên bản A4 phục vụ chia sẻ nhanh trên Zalo/Telegram nội bộ cơ quan.
5. **Tối ưu hóa hiệu năng (Zero Performance Regression)**:
   - Toàn bộ 4 thư viện (`xlsx`, `docx`, `jspdf`, `html2canvas`) được cấu hình **Dynamic Import Lazy-loading** và cô lập riêng trong lazy chunk `vendor-export` trong `vite.config.js`. Không làm tăng kích thước bundle tải ban đầu của ứng dụng web.

---

## 👥 9. QUY CHẾ TỰ ĐÁNH GIÁ BẢN THÂN & BẢO TOÀN QUYỀN CỬ TRI LÃNH ĐẠO TRỊNH ĐỨC ANH (v3.7)

1. **Cấu hình "Tự đánh giá bản thân (Cho phép tự bỏ phiếu cho chính mình)" (`allowSelfEvaluation`)**:
   - **Mặc định**: `false` — Theo thông lệ quy chế tín nhiệm, cán bộ không tự bỏ phiếu/chấm điểm cho chính bản thân mình.
   - **Tùy biến linh hoạt**: Ban Quản trị có thể bật `allowSelfEvaluation = true` đối với các đợt thi đua hoặc đánh giá đa chiều mà cán bộ được phép tự đánh giá bản thân.
   - **Giao diện nhận diện trực quan**: Khi được phép tự chấm, trên giao diện Bảng Desktop và Thẻ Card Mobile, dòng của chính mình được gắn badge nổi bật: `(Bản thân)` với màu sắc nhận diện riêng (`bg-primary-50 text-primary-700`).
2. **Phân định Minh Bạch: Tài Khoản Kỹ Thuật Webapp vs Cán Bộ Lãnh Đạo Quỹ**:
   - Chỉ loại trừ tài khoản kỹ thuật root của Webapp (`emp-root`, `code: ROOT`, `email: qtdyentho@gmail.com`).
   - Cán bộ Lãnh đạo kiêm Quản trị viên hệ thống (Chủ tịch HĐQT Trịnh Đức Anh `emp-007` / `ducanht@gmail.com`, Giám đốc Nguyễn Văn Sơn `emp-003`...) **bắt buộc được bảo toàn 100% quyền cử tri bỏ phiếu và thuộc diện đối tượng lấy phiếu tín nhiệm**.
   - Bổ sung nút chọn nhanh `HĐQT & BĐH` (`dept: LEADERSHIP`) trong cả 2 danh sách Cử tri và Đối tượng lấy phiếu tín nhiệm tại Modal Đợt (`TrustPeriodModal.jsx`) và Tab Cấu hình (`TrustCriteriaSettings.jsx`).

---

## 🛡️ 10. KIẾN TRÚC TÁCH BIỆT BẢNG CSDL `accounts` & `employees` VÀ BẢO MẬT FIRESTORE (v3.8)

1. **Tách Biệt Bảng CSDL Chuẩn Hóa**:
   - Bảng `accounts`: Lưu trữ tài khoản đăng nhập, mật khẩu mã hóa/xác thực, vai trò RBAC (`role`: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `STAFF`), trạng thái (`isActive`), email và liên kết ngoại vi `employeeId`.
   - Bảng `employees`: Lưu hồ sơ cán bộ nhân viên, mã nhân viên, họ tên, phòng ban (`dept`), chức vụ (`position`), ngày vào ngành, trạng thái công tác.
2. **Bảo Mật CSDL Firestore (`firestore.rules`)**:
   - Bổ sung quy tắc bảo mật riêng cho `/employees/{employeeId}` (chỉ Admin/SuperAdmin được ghi) và `/accounts/{accountId}` (chỉ SuperAdmin được quản trị phân quyền tài khoản).
   - Siết chặt quyền tạo phiếu tín nhiệm `/evaluations_trust/{evaluationId}`:
     + Cử tri chỉ được nộp phiếu cho đối tượng được cấu hình trong đợt.
     + Nghiêm cấm tự đánh giá bản thân TRỪ KHI đợt có cấu hình `allowSelfEvaluation == true`.
   - Khóa chặt quyền sửa/xóa bảng cấu hình tiêu chí `/trust_criteria` và cấu hình đợt `/period_configs` chỉ dành cho Ban Lãnh đạo / Admin (`isManagerOrChairman()`).
3. **Bảo Mật Tuyệt Đối Danh Tính Bỏ Phiếu Kín Ở Cấp Dịch Vụ Firestore**:
   - Khi đợt đánh giá bật `isAnonymous: true`, dịch vụ `saveTrustEvaluation` và `saveBatchTrustEvaluations` tự động ẩn danh hóa payload:
     + `evaluatorName` được lưu thành `'Cán bộ Quỹ (Bỏ phiếu kín)'`.
     + `evaluatorPosition` được lưu thành `'Bỏ phiếu kín'`.
   - Triệt tiêu hoàn toàn rủi ro rò rỉ danh tính cử tri qua payload mạng Firestore hoặc công cụ Console trình duyệt.

---

## ⚡ 11. TỐI ƯU HÓA HIỆU NĂNG, PHẢN HỒI XÚC GIÁC & GIAO DIỆN MOBILE RESPONSIVE CHUẨN MỰC

1. **Quy Chuẩn UI Mobile: "Tuyệt Đối Không Bọc Kéo - Đưa Thẳng Ra Ngoài"**:
   - Triệt tiêu các container cuộn ngang (`overflow-x-auto`) ở bộ lọc năm, thanh công cụ chọn nhanh cử tri/đối tượng và thanh điều hướng tabs; thay thế bằng `flex flex-wrap items-center gap-1.5` để nhìn thấy 100% chức năng chỉ với 1 chạm.
   - Bảng Kết quả tín nhiệm toàn Quỹ (`TrustOverviewReport.jsx`): Tự động chuyển đổi sang giao diện **Thẻ Card Thông Tin Di Động** (`block md:hidden`), giữ lại bảng chuẩn trên màn hình máy tính/tablet (`hidden md:block`). Mỗi thẻ card hiển thị đầy đủ thứ hạng, họ tên, chức vụ, điểm TB, điểm quy đổi, xếp loại và nút xem chi tiết trực quan.
2. **Phản Hồi Xúc Giác & Triệt Tiêu Độ Trễ Chạm (Touch Manipulation)**:
   - Toàn bộ nút chọn điểm 1..10 (`ScorePicker.jsx`) và các nút điều hướng đáy mobile (`TrustBottomNav.jsx`) được bổ sung lớp CSS `touch-manipulation select-none active:scale-95`.
   - Loại bỏ hoàn toàn độ trễ 300ms của trình duyệt di động, mang lại trải nghiệm bấm mượt mà như ứng dụng gốc Native App.
3. **Hiệu Năng Code Splitting (Zero Performance Regression)**:
   - Tách biệt hoàn toàn các thư viện nặng (`vendor-export`: 1.4 MB chứa SheetJS, Docx, jsPDF, html2canvas; `vendor-charts`: 385 KB chứa Recharts) thành các lazy bundle độc lập.
   - Khởi chạy ứng dụng tức thì 0ms, đảm bảo tải nhanh trên mạng di động 4G/5G.
4. **An Toàn Mã Nguồn & Chống XSS**:
   - 100% không sử dụng `dangerouslySetInnerHTML`, `eval` hay `innerHTML`. Toàn bộ dữ liệu người dùng được escape và kiểm soát qua React JSX thuần túy.

---

## 💾 12. ĐỒNG BỘ CẤU HÌNH ĐỢT BỀN VỮNG TRÊN FIRESTORE & PHẢN HỒI SIDEBAR/TABS TỨC THÌ (v3.9)

1. **Khắc Phục Triệt Để Race Condition Khi Nhập Liệu Cấu Hình**:
   - Cơ chế `activePeriodIdRef`, `isDirtyRef.current` và hàm `updateLocalConfig`: Ngăn chặn snapshot Firestore tải chậm (~200ms) ghi đè lại giá trị cũ khi người dùng đang nhập liệu các ô ngưỡng điểm, quy chế bỏ phiếu, hoặc danh sách cử tri/đối tượng.
   - Chỉ đồng bộ tự động từ Firestore khi chuyển sang đợt khác hoặc khi người dùng chưa có chỉnh sửa dở dang (`!isDirtyRef.current`).
2. **Đồng Bộ Hai Chiều & Chống Lỗi CSDL Firestore**:
   - Hàm `savePeriodConfig` trong `services.js`:
     + Làm sạch sâu toàn bộ mảng `criteria` (`sanitizedCriteria`), triệt tiêu 100% giá trị `undefined` gây lỗi Firestore `Unsupported field value: undefined`.
     + Lưu đồng thời vào bộ sưu tập riêng `period_configs` và đồng bộ 2 chiều vào `evaluation_periods`.
     + Ghi nhận đồng thời cả cấu trúc lồng nhau `thresholds: { excellent, excellentMinCrit, good, goodMinCrit, pass, weakVotesThresholdPercent }` lẫn các trường phẳng (`excellentThreshold`, `goodThreshold`, `passThreshold`).
   - Cung cấp `effectivePeriod` gộp đầy đủ cấu hình riêng biệt truyền vào component `TrustCriteriaSettings`, đảm bảo hiển thị đúng 100% cấu hình đã lưu sau khi tải lại trang (F5).
3. **Phản Hồi Sidebar & Điều Hướng Tabs Mượt Mà**:
   - Sửa lỗi Tab Cấu hình: Cho phép truy cập khi `canManageCriteria || canManagePeriods`, đồng bộ giữa `TrustModuleTabsNav`, `TrustBottomNav` và `TrustEvaluationContainer`.
   - Bổ sung quyền `MANAGE_CRITERIA` cho vai trò Giám đốc (`manager`) trong ma trận `DEFAULT_ROLE_PERMISSIONS.trust`.
   - Bảo toàn trạng thái chọn `'ALL'` (Tất cả các đợt đánh giá) trong `subscribeEvaluationPeriods` khi chuyển tab Lịch sử.
   - Sửa bộ lọc năm trong `PeriodMasterSidebar` sang so sánh số `Number(p.year) === Number(filterYear)`, bổ sung thuộc tính accessibility `role="button"` và phản hồi xúc giác `active:scale-[0.99]`.

---

## 🔄 13. ĐỒNG BỘ MASTER-DETAIL 0MS & CHUẨN HÓA MÃ ĐỢT BẰNG UUID (RFC 4122 v4)

1. **Khắc Phục Hiện Tượng "Chọn Bên Trái, Bên Phải Không Đổi Theo"**:
   - **Nguyên nhân gốc rễ**: Trước đây, component `TrustProgressBanner` (Cột Phải) không nhận prop `currentPeriod` và không hề hiển thị tên đợt đánh giá, quý/năm, hay trạng thái đợt. Khi người dùng click chuyển giữa Đợt Quý 3 và Đợt Quý 4 (cả 2 đều chưa có phiếu nộp, cùng 12 cán bộ, tiến độ 0%), giao diện Cột Phải giống hệt nhau 100%, khiến người dùng lầm tưởng hệ thống không phản hồi.
   - **Giải pháp triệt để**:
     + Bổ sung **Period Header Card** nổi bật ngay trên đầu banner Cột Phải: Hiển thị lớn, đậm nét tên đợt `currentPeriod.name`, huy hiệu Quý/Năm `Quý ${quarter}/${year}`, khoảng thời gian hiệu lực `Từ ${startDate} đến ${endDate}`, quy mô đối tượng và huy hiệu chế độ bỏ phiếu (`Kín 100%` / `Công khai`).
     + Khi người dùng bấm chọn bất kỳ đợt nào ở Cột Trái (`PeriodMasterSidebar`), Cột Phải cập nhật tiêu đề, trạng thái và dữ liệu tức thì 0ms mà không cần tải lại trang.
2. **Xử Lý Trực Quan Trạng Thái Đợt `UPCOMING` (Sắp diễn ra) và `CLOSED` (Đã đóng)**:
   - Nếu đợt có trạng thái `UPCOMING`: Hiển thị Dải thông báo cảnh báo màu hổ phách giải thích rõ cổng lấy phiếu chưa mở (dự kiến mở từ `startDate`), nút nộp phiếu chuyển sang chế độ vô hiệu hóa `"Chờ mở cổng (từ ${startDate})"`.
   - Nếu đợt có trạng thái `CLOSED`: Hiển thị Dải thông báo màu xám ghi nhận đợt đã đóng cổng, nút nộp phiếu chuyển sang `"Đợt đã đóng cổng"`.
   - Nếu đợt có trạng thái `ACTIVE`: Hiển thị chấm tròn xanh lục nhấp nháy (`animate-ping`) và cho phép nộp phiếu chính thức khi hoàn tất 100% tiêu chí.
3. **Khử Triệt Để Mâu Thuẫn Badge Trạng Thái Trên Thẻ Sidebar Cột Trái**:
   - Trước đây, khi đợt có trạng thái `UPCOMING`, thẻ hiển thị bên trái là `"Sắp diễn ra"` nhưng bên phải lại hiển thị `"Đã đóng"` do toán tử 3 ngôi `status === 'ACTIVE' ? 'Đang mở' : 'Đã đóng'`.
   - Đã sửa hàm `badgeRenderer` phân định chính xác 4 trạng thái: Đã nộp phiếu (`Đã nộp (X)` - xanh ngọc), Đang chấm dở (`Tiến độ: Y%` - xanh teal), Sắp diễn ra (`Chờ mở cổng` - hổ phách), Đã đóng (`Đã kết thúc` - slate) và Đang mở chưa nộp (`Chưa nộp` - xanh lục).
4. **Đồng Bộ Hiển Thị Đợt Trên Toàn Bộ Các Tab & Module Khác**:
   - **Tab Lịch sử (`MY_VOTES`)**: Header Cột Phải hiển thị tên đợt đang xem lịch sử hoặc `Lịch sử toàn bộ phiếu tín nhiệm đã nộp qua các kỳ` khi chọn Tất cả.
   - **Tab Cá nhân (`MY_RESULTS`)**: Hiển thị rõ tên đợt đang xem và phân biệt thông báo đợt `UPCOMING` ("Đợt đánh giá chưa đến thời gian mở cổng") hay `ACTIVE` ("Kỳ đánh giá đang trong thời gian lấy ý kiến").
   - **Tab Tổng quan (`OVERVIEW`)**: Header Cột Phải hiển thị tên đợt tổng hợp, tỷ lệ cử tri và các nút xuất nhanh Excel/Word/In A4.
   - **Phân hệ Quy hoạch (`PlanningVote`)**: Form bỏ phiếu và Card tổng hợp kết quả hiển thị rõ tên đợt quy hoạch đang chọn.
5. **Chuẩn Hóa Mã Đợt Đánh Giá Bằng UUID RFC 4122 v4**:
   - Thay thế công thức sinh mã cũ dựa vào 4 số cuối timestamp (`slice(-4)` vốn chỉ có 10.000 giá trị và dễ trùng lặp).
   - Chuẩn hóa mã đợt theo định dạng: `PERIOD-YYYY-QX-<UUID>` với hàm `generatePeriodId(year, quarter)` và `generateUUID()` sử dụng `crypto.randomUUID()` chuẩn RFC 4122 v4.
   - Đảm bảo 100% không bao giờ trùng lặp ID đợt trong CSDL Cloud Firestore.

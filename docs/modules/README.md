# DANH MỤC ĐẶC TẢ CÁC MODULE & MA TRẬN TIẾN ĐỘ
## CỔNG THÔNG TIN QUẢN TRỊ NHÂN SỰ & ĐÁNH GIÁ TÍN NHIỆM — QTDND YÊN THỌ

> **Quy chuẩn quản lý tài liệu**: Mỗi phân hệ sở hữu một tài liệu `.md` đặc tả độc lập. Mọi thay đổi logic hoặc giao diện ở module nào thì đồng thời file `.md` tương ứng bắt buộc phải được cập nhật đồng bộ trong cùng phiên làm việc (Zero Documentation Drift).

---

## 📊 MA TRẬN TIẾN ĐỘ & TRẠNG THÁI TRIỂN KHAI

| STT | File Tài Liệu | Tên Phân Hệ (Module) | Tiến Độ | Trạng Thái | Độ Ưu Tiên |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **01** | [`01_PORTAL_HUB_LAUNCHER.md`](01_PORTAL_HUB_LAUNCHER.md) | **Cổng Điều Hướng Ô Lưới (Grid Launcher)** | 100% | 🟢 Hoàn tất | Cao (Landing) |
| **02** | [`02_TRUST_EVALUATION.md`](02_TRUST_EVALUATION.md) | **Đánh Giá Tín Nhiệm Cán Bộ (10 Tiêu Chí)** | 100% | 🟢 Hoàn tất | **Cao nhất (Trọng tâm)** |
| **03** | [`03_HR_EMPLOYEES_AND_TRANSFERS.md`](03_HR_EMPLOYEES_AND_TRANSFERS.md) | **Hồ Sơ Cán Bộ & Luân Chuyển Công Tác** | 100% | 🟢 Hoàn tất | Cao |
| **04** | [`04_KPI_EVALUATION_3TIER.md`](04_KPI_EVALUATION_3TIER.md) | **Chấm Điểm KPI 3 Cấp (40% - 30% - 30%)** | 100% | 🟢 Hoàn tất | Trung bình |
| **05** | [`05_PLANNING_VOTE.md`](05_PLANNING_VOTE.md) | **Bỏ Phiếu Tín Nhiệm Quy Hoạch Cán Bộ** | 100% | 🟢 Hoàn tất | Trung bình |
| **06** | [`06_DASHBOARD_AND_ANALYTICS.md`](06_DASHBOARD_AND_ANALYTICS.md) | **Bảng Điều Khiển Giám Sát & Báo Cáo** | 100% | 🟢 Hoàn tất | Cao |
| **07** | [`07_FUTURE_TIMEKEEPING.md`](07_FUTURE_TIMEKEEPING.md) | **Quản Lý Chấm Công, Nghỉ Phép & Ca Trực** | 30% (Spec) | 🟡 Sẵn sàng CSDL | Tương lai |
| **08** | [`08_FUTURE_PAYROLL.md`](08_FUTURE_PAYROLL.md) | **Quản Lý Tiền Lương, Thưởng & BHXH** | 30% (Spec) | 🟡 Sẵn sàng CSDL | Tương lai |
| **09** | [`09_FUTURE_AWARDS.md`](09_FUTURE_AWARDS.md) | **Thi Đua, Khen Thưởng & Xử Lý Kỷ Luật** | 30% (Spec) | 🟡 Sẵn sàng CSDL | Tương lai |

---

## 📌 QUY TẮC PHÁT TRIỂN & BẢO TRÌ BẮT BUỘC

1. **Kiến trúc Data-Driven Dynamic Launcher**: Ô lưới hiển thị danh mục phân hệ được nạp động từ CSDL `system_modules`. Khi bổ sung module mới, ô lưới tự động sinh ra trên giao diện người dùng.
2. **Quyền quyết định Ẩn danh thuộc Ban Quản trị**: Bỏ phiếu kín hay công khai được kiểm soát tuyệt đối tại cấp Đợt (`evaluation_periods`), cán bộ không được tự ý can thiệp.
3. **Phân tách Lazy Chunk**: Mỗi module được đóng gói trong một thư mục chuyên biệt `src/modules/<name>/` và nạp chậm qua `React.lazy()` để giảm tải bundle ban đầu.
4. **Không dùng từ ngữ AI**: Toàn bộ nhãn, nội dung, báo cáo tuân thủ 100% ngôn ngữ hành chính chuẩn mực của ngành tổ chức tín dụng.

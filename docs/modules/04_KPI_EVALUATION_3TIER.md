# PHÂN HỆ 04: CHẤM ĐIỂM KPI 3 CẤP (40% - 30% - 30%)
## HỆ THỐNG QUẢN TRỊ NHÂN SỰ — QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ

> **Mã phân hệ:** `MODULE_KPI`  
> **Tuyến đường (Route):** `/kpi-evaluation`  
> **Trạng thái:** 🟢 Hoàn tất (100%)  
> **Công thức tính điểm chuẩn:** $\text{FinalScore} = (S_{\text{Self}} \times 0.4) + (S_{\text{Manager}} \times 0.3) + (S_{\text{Chairman}} \times 0.3)$

---

## 🏛️ 1. QUY TRÌNH CHẤM ĐIỂM 3 CẤP

1. **Bước 1 - Cán bộ tự chấm (Trọng số 40%)**:
   - Cán bộ nhập điểm tự đánh giá kết quả thực hiện chỉ tiêu (dư nợ, huy động, quản lý rủi ro nợ xấu).
   - Nhập bản tự nhận xét ưu khuyết điểm trong kỳ.
   - Phiếu chuyển trạng thái sang `pending_manager`.
2. **Bước 2 - Ban điều hành / Giám đốc thẩm tra (Trọng số 30%)**:
   - Giám đốc xem lại điểm tự chấm của cán bộ, đối chiếu số liệu báo cáo kế toán/tín dụng.
   - Chấm điểm cấp quản lý và ghi ý kiến chỉ đạo.
   - Phiếu chuyển trạng thái sang `pending_chairman`.
3. **Bước 3 - Chủ tịch HĐQT phê duyệt tối cao (Trọng số 30%)**:
   - Chủ tịch HĐQT xem xét toàn diện quá trình công tác.
   - Nhập điểm phê duyệt và ý kiến kết luận.
   - Hệ thống tự động tính `finalScore` và khóa phiếu với trạng thái `completed`.

---

## 🔒 2. PHÂN QUYỀN

- `staff`: Chỉ thực hiện Bước 1 (Tự chấm bản thân).
- `manager`: Thực hiện Bước 2 cho cán bộ trực thuộc.
- `chairman`: Thực hiện Bước 3 và chốt kết quả KPI cuối cùng.

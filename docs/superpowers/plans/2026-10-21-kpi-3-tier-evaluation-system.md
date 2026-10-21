# Phân Hệ Chấm Điểm KPI 3 Cấp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện và đưa vào vận hành thực tế Phân hệ Chấm điểm KPI 3 Cấp (Cán bộ tự chấm 40% -> Trưởng bộ phận thẩm định 30% -> HĐQT phê duyệt tối cao 30%) cho Quỹ Tín Dụng Nhân Dân Yên Thọ, tích hợp bộ tiêu chí động theo từng phòng ban, cơ chế nhận xét chi tiết từng tiêu chí, quyền khiếu nại/đề nghị xem xét lại điểm của CBNV, bảng điều khiển tổng quan cho HĐQT, lịch sử đa kỳ bất biến (Toàn Quỹ & Cá nhân) và bộ xuất báo cáo A4/Word/Excel.

**Architecture:** Áp dụng kiến trúc Clean Modular Architecture: Tách biệt rõ ràng tầng Shared Components (Tabs, Badge, Print) và Specific Components (Overview, Scoring, History, Settings). Tầng dữ liệu sử dụng Cloud Firestore với cơ chế Historical Snapshot Immutability (lưu snapshot tiêu chí tại thời điểm chấm để bảo toàn lịch sử vĩnh viễn khi danh mục tiêu chí tương lai thay đổi).

**Tech Stack:** React 18, Vite 8, Tailwind CSS, Lucide React, Cloud Firestore (Realtime onSnapshot), Chart.js / Recharts (dynamic import lazy chunk), Docx & SheetJS (A4/Excel export).

---

## Global Constraints

- **Typography & Con số**: 100% font `Be Vietnam Pro`, toàn bộ số liệu, tỷ lệ %, điểm số dùng `tabular-nums` (`font-numeric`). Cấm dùng font monospace răng cưa cho số liệu.
- **Zero AI / Tech Jargon**: Tuyệt đối không dùng thuật ngữ AI, không để lộ mã kỹ thuật (UUID, docId) trên giao diện người dùng. Sử dụng 100% thuật ngữ ngân hàng / quỹ tín dụng nhân dân chuẩn mực.
- **Chuẩn Mực Định Danh Đơn Vị**: "Quỹ tín dụng nhân dân Yên Thọ", địa chỉ "Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa", thời gian chuẩn GMT+7.
- **Mobile Responsive & Zero Horizontal Scroll**: Touch target $\ge 44$px; cấm bọc cuộn ngang `overflow-x-auto` cho Tabs điều hướng và bộ lọc; bắt buộc đưa thẳng ra ngoài bằng Responsive Grid hoặc `flex-wrap`.
- **Zero Mock Policy**: 100% dữ liệu lấy và lưu thực tế từ Cloud Firestore.
- **Historical Snapshot Immutability**: Khi cán bộ nộp và khi HĐQT chốt phiếu, bắt buộc lưu bản sao snapshot của bộ tiêu chí chấm (`criteriaSnapshot`) vào phiếu để mọi thay đổi tiêu chí trong tương lai không làm méo mó kết quả đã chốt trong quá khứ.

---

## Sơ Đồ Phân Rã Mã Nguồn: Dùng Chung (Shared) vs Dùng Riêng (Specific)

```
src/features/kpi/
├── components/
│   ├── shared/                      # THÀNH PHẦN DÙNG CHUNG (SHARED)
│   │   ├── KpiModuleTabsNav.jsx     # Tabs điều hướng chính (OVERVIEW, SCORING, MY_RESULTS, HISTORY, SETTINGS)
│   │   ├── KpiBottomNav.jsx         # Bottom Nav cố định dưới đáy Mobile (Zero horizontal scroll)
│   │   ├── KpiStatusBadge.jsx       # Badge trạng thái phiếu (Chưa nộp, Chờ TP duyệt, Chờ HĐQT, Hoàn tất, Khiếu nại)
│   │   ├── KpiClassificationBadge.jsx# Badge xếp loại (Xuất sắc, Tốt, Đạt, Không đạt)
│   │   ├── KpiPeriodSelector.jsx    # Dropdown / Selector chọn kỳ đánh giá động
│   │   └── KpiA4PrintModal.jsx      # Modal in ấn & xuất A4 phiếu KPI và Quyết định công nhận
│   │
│   ├── overview/                    # TAB 1: TỔNG QUAN HĐQT (SPECIFIC)
│   │   ├── KpiOverviewTab.jsx       # Bộ điều phối Dashboard HĐQT
│   │   ├── KpiMetricCards.jsx       # 4 Thẻ KPI (Tổng số, Tiến độ %, Điểm TB, Cơ cấu xếp loại)
│   │   ├── KpiDepartmentComparisonChart.jsx # Biểu đồ so sánh điểm giữa các phòng ban
│   │   ├── KpiRatingDistributionChart.jsx   # Biểu đồ phân bổ tỷ lệ xếp loại thi đua
│   │   ├── KpiBoardTrackerTable.jsx # Bảng theo dõi tiến độ thời gian thực toàn đơn vị
│   │   └── KpiBulkApproveModal.jsx  # Modal phê duyệt nhanh hàng loạt của HĐQT
│   │
│   ├── scoring/                     # TAB 2: CHẤM ĐIỂM 3 CẤP (SPECIFIC)
│   │   ├── KpiScoringTab.jsx        # Bộ điều phối giao diện theo Role
│   │   ├── KpiSelfScoringForm.jsx   # Cấp 1: Cán bộ tự chấm chi tiết từng tiêu chí kèm giải trình
│   │   ├── KpiManagerReviewSection.jsx # Cấp 2: Trưởng phòng lọc CBNV phòng mình & thẩm định
│   │   ├── KpiBoardApprovalSection.jsx # Cấp 3: HĐQT đối chiếu 3 chiều & phê chuẩn tối cao
│   │   ├── KpiAppealModal.jsx       # Modal CBNV gửi phản ánh / đề nghị xem xét lại điểm
│   │   └── KpiAppealResolutionModal.jsx # Modal Quản lý / HĐQT xử lý khiếu nại điểm
│   │
│   ├── results/                     # TAB 3: KẾT QUẢ CÁ NHÂN (SPECIFIC)
│   │   └── KpiMyResultsTab.jsx      # Xem chi tiết phiếu KPI hiện tại của cán bộ đang đăng nhập
│   │
│   ├── history/                     # TAB 4: LỊCH SỬ ĐA KỲ (SPECIFIC)
│   │   ├── KpiHistoryTab.jsx        # Bộ điều phối Tab Lịch sử
│   │   ├── KpiFundHistorySection.jsx # Lịch sử thi đua toàn Quỹ qua các năm (Báo cáo tổng kết năm)
│   │   └── KpiPersonalHistorySection.jsx # Lịch sử cá nhân kèm biểu đồ đường (Line Chart) tiến trình
│   │
│   └── settings/                    # TAB 5: CẤU HÌNH & PHÂN QUYỀN (SPECIFIC)
│       ├── KpiSettingsTab.jsx       # Bộ điều phối Tab Cài đặt
│       ├── KpiWeightsConfigCard.jsx # Cấu hình tỷ trọng 3 cấp (40% - 30% - 30%)
│       ├── KpiCriteriaManager.jsx   # CRUD Danh mục tiêu chí đánh giá động & trọng số điểm
│       └── KpiPeriodConfigModal.jsx # Quản lý mở/đóng và khóa sổ các đợt đánh giá
│
├── services/
│   └── kpiService.js                # Toàn bộ API Realtime & Firestore CRUD cho phân hệ KPI
│
└── KpiEvaluationContainer.jsx       # Container chính tích hợp toàn bộ các Tab và Modals
```

---

## Kế Hoạch Triển Khai 5 Giai Đoạn Chi Tiết

### GIAI ĐOẠN 1: CSDL FIRESTORE, TIÊU CHÍ ĐỘNG & BACKEND SERVICES

#### Nhiệm vụ 1.1: Cập nhật Firestore Security Rules cho phân hệ KPI
- [ ] Rà soát `firestore.rules`, bảo đảm các rules cho `evaluations_kpi`, `employee_kpi_history`, `kpi_criteria`, `kpi_appeals`:
  - `kpi_criteria`: `read: if isAuthenticated(); write: if isBoardOrAdmin();`
  - `evaluations_kpi`: `read: if isAuthenticated();` (Cán bộ xem phiếu mình, Trưởng phòng xem phòng mình, HĐQT xem toàn Quỹ); `write: if isAuthenticated();` với điều kiện Cấp 1 chỉ ghi phiếu mình, Cấp 2 chỉ ghi phiếu phòng mình, Cấp 3 chỉ HĐQT/Admin.
  - `employee_kpi_history`: `read: if isAuthenticated(); write: if isBoardOrAdmin();`
- [ ] Chạy lệnh deploy: `firebase deploy --only firestore:rules --non-interactive`.

#### Nhiệm vụ 1.2: Thiết lập Schema Mặc định & Tự Động Khởi Tạo CSDL
- [ ] Cập nhật `src/lib/systemDefaults.js`:
  - Khai báo `DEFAULT_KPI_CRITERIA_CATALOG`: Danh mục 4 nhóm tiêu chí chuẩn hóa theo phòng ban (Tín dụng, Kế toán, Kiểm soát, Văn phòng).
  - Khai báo `DEFAULT_KPI_SETTINGS`: Tỷ trọng (40-30-30), thang xếp loại, chu kỳ đánh giá.
- [ ] Cập nhật `src/lib/autoInitDb.js`:
  - Thêm `'kpi_criteria'` vào `CORE_COLLECTIONS` (nâng tổng số collections).
  - Tự động kiểm tra và seed dữ liệu chuẩn cho `kpi_criteria` nếu collection rỗng.
  - Nâng cấp `CURRENT_SCHEMA_VERSION = '2026.10.21_v6.2_dynamic_kpi_criteria_and_appeal_system'`.

#### Nhiệm vụ 1.3: Mở Rộng API Dịch Vụ Nghiệp Vụ `src/features/kpi/services/kpiService.js`
- [ ] Bổ sung các dịch vụ Tiêu chí Động:
  - `subscribeKpiCriteria(callback)`: Lắng nghe danh mục tiêu chí theo thời gian thực.
  - `saveKpiCriteriaItem(itemData)`: Thêm / sửa tiêu chí kèm trọng số và điểm tối đa.
  - `deleteKpiCriteriaItem(itemId)`: Xóa an toàn tiêu chí.
- [ ] Bổ sung cơ chế Ghi chú chi tiết từng tiêu chí (Per-Criterion Notes):
  - Cập nhật payload `selfCriteriaScores`: `{ [criteriaId]: { score: number, note: string } }`.
  - Cập nhật payload `managerCriteriaScores`: `{ [criteriaId]: { score: number, feedback: string } }`.
  - Cập nhật payload `boardCriteriaScores`: `{ [criteriaId]: { score: number, feedback: string } }`.
- [ ] Bổ sung cơ chế Khiếu nại / Đề nghị xem xét lại (Appeal Engine):
  - `submitKpiAppeal(kpiId, appealData)`: Cán bộ gửi phản ánh kèm lý do và số liệu giải trình.
  - `resolveKpiAppeal(kpiId, resolutionData)`: Quản lý / HĐQT xem xét điều chỉnh điểm hoặc bảo lưu.
- [ ] Bổ sung tác vụ HĐQT:
  - `bulkApproveKpi(kpiIds, approverInfo)`: Phê duyệt hàng loạt các phiếu hợp lệ.
- [ ] Viết test tự động: `tests/kpi-services-and-criteria.spec.js` kiểm tra 100% type contract và logic tính điểm.

---

### GIAI ĐOẠN 2: THÀNH PHẦN DÙNG CHUNG & MÀN HÌNH TỔNG QUAN HĐQT

#### Nhiệm vụ 2.1: Xây Dựng Hệ Thống Điều Hướng & Components Dùng Chung
- [ ] Tạo `src/features/kpi/components/shared/KpiModuleTabsNav.jsx`:
  - Thanh Tabs chuẩn mực: `TỔNG QUAN HĐQT`, `CHẤM ĐIỂM 3 CẤP`, `KẾT QUẢ CÁ NHÂN`, `LỊCH SỬ ĐA KỲ`, `CẤU HÌNH & PHÂN QUYỀN`.
  - Hiển thị badge số lượng phiếu đang chờ xử lý theo vai trò của người đăng nhập.
  - Kiểm soát quyền hiển thị tab (Cán bộ thường chỉ thấy CHẤM ĐIỂM, KẾT QUẢ CÁ NHÂN, LỊCH SỬ CÁ NHÂN).
- [ ] Tạo `src/features/kpi/components/shared/KpiBottomNav.jsx`:
  - Cố định dưới đáy màn hình điện thoại di động, Responsive Grid 1 chạm (Zero horizontal scroll).
- [ ] Tạo `src/features/kpi/components/shared/KpiStatusBadge.jsx`:
  - Badge trạng thái: `Chưa nộp`, `Chờ Trưởng phòng thẩm định`, `Chờ HĐQT phê duyệt`, `Đã hoàn tất`, `Đang khiếu nại`.
- [ ] Tạo `src/features/kpi/components/shared/KpiClassificationBadge.jsx`:
  - Phân màu chuẩn mực: Xuất sắc (Emerald), Tốt (Teal), Đạt (Amber), Không đạt (Rose).

#### Nhiệm vụ 2.2: Xây Dựng Màn Hình Tổng Quan Cho HĐQT (`KpiOverviewTab.jsx`)
- [ ] Tạo `src/features/kpi/components/overview/KpiMetricCards.jsx`:
  - 4 thẻ KPI tổng thể: Tổng số CBNV, Tiến độ nộp/duyệt %, Điểm TB toàn Quỹ, Phân bổ xếp loại.
- [ ] Tạo `src/features/kpi/components/overview/KpiDepartmentComparisonChart.jsx`:
  - Biểu đồ so sánh điểm trung bình các Phòng ban (Phòng Tín dụng, Kế toán, BĐH, BKS).
- [ ] Tạo `src/features/kpi/components/overview/KpiRatingDistributionChart.jsx`:
  - Biểu đồ phân bổ tỷ lệ danh hiệu thi đua trong kỳ.
- [ ] Tạo `src/features/kpi/components/overview/KpiBoardTrackerTable.jsx`:
  - Bảng theo dõi tiến độ thời gian thực toàn đơn vị.
  - Cột đối chiếu: Tên cán bộ, Phòng ban, Điểm Cấp 1 (40%), Điểm Cấp 2 (30%), Điểm Cấp 3 (30%), Tổng kết, Xếp loại, Trạng thái.
  - Tích hợp `KpiBulkApproveModal.jsx`: Cho phép HĐQT phê duyệt hàng loạt các phiếu hợp lệ chỉ với 1 click.

---

### GIAI ĐOẠN 3: PHÂN HỆ CHẤM ĐIỂM 3 CẤP CHI TIẾT & CƠ CHẾ KHIẾU NẠI

#### Nhiệm vụ 3.1: Form Cấp 1 — Cán Bộ Tự Chấm Điểm Chi Tiết
- [ ] Xây dựng `src/features/kpi/components/scoring/KpiSelfScoringForm.jsx`:
  - Nạp danh mục tiêu chí động từ `kpi_criteria` tương ứng với phòng ban/vị trí của cán bộ.
  - Cho phép cán bộ nhập điểm tự chấm cho từng tiêu chí con (có giới hạn maxScore).
  - Có ô ghi chú giải trình thành tích cho từng tiêu chí cụ thể + ô tóm tắt chung toàn kỳ.
  - Tự động tính tổng điểm Cấp 1 tức thì ($/100$ điểm).
  - Nút `Lưu bản nháp` và `Nộp phiếu lên Trưởng bộ phận` (có AlertDialog xác nhận an toàn).

#### Nhiệm vụ 3.2: Màn Hình Cấp 2 — Trưởng Bộ Phận Thẩm Định
- [ ] Xây dựng `src/features/kpi/components/scoring/KpiManagerReviewSection.jsx`:
  - Bộ lọc tự động: Chỉ hiển thị nhân viên thuộc phòng ban mình quản lý.
  - Khung thẩm định đối chiếu: Cột điểm tự chấm của nhân viên vs Cột điểm Trưởng phòng chấm.
  - Nhận xét chi tiết cho từng tiêu chí con (chỉ ra ưu điểm, thiếu sót thực tế).
  - Nút `Duyệt & Chuyển HĐQT` hoặc `Trả lại yêu cầu giải trình`.

#### Nhiệm vụ 3.3: Màn Hình Cấp 3 — HĐQT Phê Chuẩn Tối Cao
- [ ] Xây dựng `src/features/kpi/components/scoring/KpiBoardApprovalSection.jsx`:
  - Bảng đối chiếu 3 chiều (Cán bộ - Trưởng phòng - HĐQT).
  - HĐQT nhập điểm Cấp 3 và ý kiến chỉ đạo.
  - Tự động tính điểm tổng kết và mức xếp loại thi đua theo tỷ trọng cấu hình.
  - Nút `Phê chuẩn chính thức`: Khóa phiếu, lưu snapshot bất biến, tự động ghi vào `employee_kpi_history`.

#### Nhiệm vụ 3.4: Cơ Chế Phản Ánh & Khiếu Nại Điểm Số (Appeal System)
- [ ] Xây dựng `src/features/kpi/components/scoring/KpiAppealModal.jsx`:
  - Cho phép cán bộ gửi đề nghị xem xét lại điểm nếu chưa đồng thuận kèm lý do và số liệu chứng minh.
  - Chuyển trạng thái phiếu sang `appealed`.
- [ ] Xây dựng `src/features/kpi/components/scoring/KpiAppealResolutionModal.jsx`:
  - Dành cho Quản lý / HĐQT xem xét giải trình, có quyền: Điều chỉnh lại điểm hoặc Bảo lưu quyết định ban đầu kèm văn bản giải thích.

---

### GIAI ĐOẠN 4: LỊCH SỬ ĐA KỲ (TOÀN QUỸ & CÁ NHÂN) & CẤU HÌNH TIÊU CHÍ ĐỘNG

#### Nhiệm vụ 4.1: Phân Hệ Lịch Sử Đa Kỳ (`KpiHistoryTab.jsx`)
- [ ] Tạo `src/features/kpi/components/history/KpiFundHistorySection.jsx`:
  - Hộp chọn kỳ trong quá khứ (Quý I..IV các năm 2024, 2025, 2026...).
  - Bảng tổng hợp thi đua toàn đơn vị trong kỳ đã chọn.
  - Xuất Báo cáo Thi đua năm tổng hợp phục vụ Hội nghị người lao động.
- [ ] Tạo `src/features/kpi/components/history/KpiPersonalHistorySection.jsx`:
  - Tra cứu lịch sử cá nhân qua tất cả các kỳ đã công tác.
  - Biểu đồ đường (Line Chart) thể hiện sự tiến bộ hiệu suất làm việc qua từng quý.
  - Xem lại lời nhận xét của Trưởng phòng và HĐQT trong từng kỳ.
- [ ] Liên thông trực tiếp với `EmployeeProfileDetail.jsx` (Tab Công tác & Thâm niên).

#### Nhiệm vụ 4.2: Cấu Hình Tiêu Chí Động & Tỷ Trọng 3 Cấp (`KpiSettingsTab.jsx`)
- [ ] Tạo `src/features/kpi/components/settings/KpiWeightsConfigCard.jsx`:
  - Điều chỉnh tỷ trọng 3 cấp (Mặc định 40-30-30; ràng buộc tổng = 100%).
- [ ] Tạo `src/features/kpi/components/settings/KpiCriteriaManager.jsx`:
  - Thêm mới, chỉnh sửa, xóa tiêu chí đánh giá.
  - Thiết lập trọng số, điểm tối đa, mô tả hướng dẫn chấm.
  - Phân loại tiêu chí theo Phòng ban (Tín dụng, Kế toán, Kiểm soát, Chung).
- [ ] Tạo `src/features/kpi/components/settings/KpiPeriodConfigModal.jsx`:
  - Mở đợt đánh giá mới, đặt hạn nộp, đóng cổng và khóa sổ đợt đánh giá.

---

### GIAI ĐOẠN 5: BỘ XUẤT BÁO CÁO, KIỂM THỬ TOÀN DIỆN & DEPLOY PRODUCTION

#### Nhiệm vụ 5.1: Bộ Xuất Báo Cáo Chuẩn Mực Quỹ TDND
- [ ] Tạo `src/features/kpi/components/shared/KpiA4PrintModal.jsx`:
  - In ấn A4 phiếu đánh giá cá nhân kèm chữ ký 3 bên (Cán bộ - Trưởng phòng - Chủ tịch HĐQT).
- [ ] Xây dựng hàm `exportKpiToExcel(kpiList, periodName)` và `exportKpiToWord(kpiList, periodName)` trong `src/lib/exportUtils.js`.

#### Nhiệm vụ 5.2: Kiểm Thử Toàn Diện & Đảm Bảo Chất Lượng (Quality Gates)
- [ ] Viết test Playwright E2E: `tests/kpi-three-tier-evaluation.spec.js` kiểm thử toàn diện:
  - Cán bộ tự chấm Cấp 1 kèm giải trình.
  - Trưởng phòng thẩm định Cấp 2 kèm nhận xét.
  - HĐQT phê duyệt Cấp 3, tự động tính điểm tổng kết và xếp loại.
  - Cơ chế khiếu nại và giải quyết khiếu nại.
  - Quản trị danh mục tiêu chí động và snapshot bất biến.
- [ ] Chạy `npm run lint`: Bắt buộc **0 errors**.
- [ ] Chạy `npx playwright test tests/kpi-three-tier-evaluation.spec.js`: Bắt buộc **100% tests PASS**.
- [ ] Chạy `npm run build`: Bắt buộc **Exit Code 0** hoàn tất production bundle.

#### Nhiệm vụ 5.3: Commit Git & Triển Khai Trực Tiếp (Production Deploy)
- [ ] Git commit với message chuẩn Conventional Commits:
  `feat(kpi): complete 3-tier kpi evaluation system with dynamic criteria and board overview`
- [ ] Git push lên GitHub `origin/master`.
- [ ] Deploy Hosting & Firestore Rules: `firebase deploy --only hosting,firestore:rules --non-interactive`.
- [ ] Nghiệm thu thực tế trên môi trường live: **https://qtdyentho-hrm.web.app**.

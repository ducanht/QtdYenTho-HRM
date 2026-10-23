import { test, expect } from '@playwright/test';
import { 
  DEFAULT_KPI_CRITERIA_CATALOG,
  OFFICIAL_STAFF_EMPLOYEES,
  DEFAULT_MODULE_KPI_SETTINGS,
  DEFAULT_KPI_CRITERIA_GROUPS,
  DEFAULT_KPI_PERIODS,
} from '../src/lib/systemDefaults';
import { 
  CURRENT_SCHEMA_VERSION, 
  CORE_COLLECTIONS 
} from '../src/lib/autoInitDb';
import { subscribeEmployees } from '../src/lib/services';
import {
  calculateKpiFinal,
  filterKpiCriteriaByDepartment,
  getKpiSummaryStats,
  subscribeKpiCriteria,
  saveKpiCriteriaItem,
  deleteKpiCriteriaItem,
  saveKpiStep1Self,
  updateKpiStep2Manager,
  updateKpiStep3Chairman,
  submitKpiAppeal,
  resolveKpiAppeal,
  bulkApproveKpi,
  exportKpiSummaryToExcel,
  subscribeKpiCriteriaGroups,
  saveKpiCriteriaGroup,
  deleteKpiCriteriaGroup,
  subscribeKpiPeriods,
  saveKpiPeriod,
  deleteKpiPeriod,
  updateKpiPeriodStatus,
  getKpiMonthlyToQuarterlySummary,
} from '../src/features/kpi/services/kpiService';

test.describe('Phân Hệ KPI 3 Cấp - Kiểm Thử Cấu Trúc CSDL & Dịch Vụ Nghiệp Vụ (Phase 1)', () => {

  test('1. Kiểm tra Schema Version và Danh mục 27 Bảng CSDL QTDND Yên Thọ', async () => {
    expect(CURRENT_SCHEMA_VERSION).toBe('2026.10.22_v6.3_dynamic_criteria_groups_and_kpi_periods');
    expect(CORE_COLLECTIONS).toContain('kpi_criteria');
    expect(CORE_COLLECTIONS).toContain('kpi_criteria_groups');
    expect(CORE_COLLECTIONS).toContain('kpi_periods');
    expect(CORE_COLLECTIONS).toContain('evaluations_kpi');
    expect(CORE_COLLECTIONS).toContain('employee_kpi_history');
    expect(CORE_COLLECTIONS.length).toBe(27);
  });

  test('2. Kiểm tra Danh mục Tiêu chí Đánh giá KPI Động Chuẩn Mực (kpi_criteria)', async () => {
    expect(Array.isArray(DEFAULT_KPI_CRITERIA_CATALOG)).toBe(true);
    expect(DEFAULT_KPI_CRITERIA_CATALOG.length).toBeGreaterThanOrEqual(14);

    // Kiểm tra cấu trúc từng tiêu chí
    DEFAULT_KPI_CRITERIA_CATALOG.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.code).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(typeof item.maxScore).toBe('number');
      expect(item.maxScore).toBeGreaterThan(0);
      expect(item.isActive).toBe(true);
    });

    // Kiểm tra 4 nhóm danh mục bắt buộc
    const categories = new Set(DEFAULT_KPI_CRITERIA_CATALOG.map((c) => c.category));
    expect(categories.has('Kinh doanh & Nghiệp vụ')).toBe(true);
    expect(categories.has('Quản trị Rủi ro & An toàn')).toBe(true);
    expect(categories.has('Kỷ luật & Văn hóa')).toBe(true);
    expect(categories.has('Sáng kiến & Đóng góp')).toBe(true);
  });

  test('3. Kiểm tra Bộ lọc Tiêu chí theo Phòng ban (filterKpiCriteriaByDepartment)', async () => {
    // Phòng Tín dụng: phải có các tiêu chí của Phòng Tín dụng và Tất cả
    const tdCriteria = filterKpiCriteriaByDepartment(DEFAULT_KPI_CRITERIA_CATALOG, 'Phòng Tín dụng');
    expect(tdCriteria.length).toBeGreaterThan(0);
    const tdHasCreditSpec = tdCriteria.some((c) => c.department === 'Phòng Tín dụng');
    const tdHasCommon = tdCriteria.some((c) => c.department === 'Tất cả');
    expect(tdHasCreditSpec).toBe(true);
    expect(tdHasCommon).toBe(true);

    // Tổng điểm của các tiêu chí Phòng Tín dụng phải chuẩn 100 điểm
    const tdTotalScore = tdCriteria.reduce((sum, c) => sum + c.maxScore, 0);
    expect(tdTotalScore).toBe(100);

    // Phòng Kế toán - Ngân quỹ: phải có tiêu chí Kế toán và Tất cả
    const ktCriteria = filterKpiCriteriaByDepartment(DEFAULT_KPI_CRITERIA_CATALOG, 'Phòng Kế toán - Ngân quỹ');
    expect(ktCriteria.length).toBeGreaterThan(0);
    const ktTotalScore = ktCriteria.reduce((sum, c) => sum + c.maxScore, 0);
    expect(ktTotalScore).toBe(100);

    // Ban Kiểm soát: phải có tiêu chí BKS và Tất cả
    const bksCriteria = filterKpiCriteriaByDepartment(DEFAULT_KPI_CRITERIA_CATALOG, 'Ban Kiểm soát');
    expect(bksCriteria.length).toBeGreaterThan(0);
    const bksTotalScore = bksCriteria.reduce((sum, c) => sum + c.maxScore, 0);
    expect(bksTotalScore).toBe(100);
  });

  test('4. Kiểm tra Thuật toán Tính điểm KPI 3 Cấp (calculateKpiFinal) & Xếp loại', async () => {
    // Test 1: Tỷ trọng chuẩn (40% - 30% - 30%)
    // Cán bộ: 95đ, Quản lý: 90đ, HĐQT: 92đ -> (95*0.4) + (90*0.3) + (92*0.3) = 38 + 27 + 27.6 = 92.6 -> Xuất sắc
    const r1 = calculateKpiFinal(95, 90, 92);
    expect(r1.finalScore).toBe(92.6);
    expect(r1.classification).toBe('Xuất sắc');

    // Test 2: Mức Tốt (75 - 89.9)
    // Cán bộ: 80, Quản lý: 85, HĐQT: 78 -> (80*0.4) + (85*0.3) + (78*0.3) = 32 + 25.5 + 23.4 = 80.9 -> Tốt
    const r2 = calculateKpiFinal(80, 85, 78);
    expect(r2.finalScore).toBe(80.9);
    expect(r2.classification).toBe('Tốt');

    // Test 3: Mức Đạt yêu cầu (60 - 74.9)
    // Cán bộ: 70, Quản lý: 65, HĐQT: 60 -> (70*0.4) + (65*0.3) + (60*0.3) = 28 + 19.5 + 18 = 65.5 -> Đạt yêu cầu
    const r3 = calculateKpiFinal(70, 65, 60);
    expect(r3.finalScore).toBe(65.5);
    expect(r3.classification).toBe('Đạt yêu cầu');

    // Test 4: Mức Không đạt (< 60)
    const r4 = calculateKpiFinal(50, 55, 52);
    expect(r4.finalScore).toBe(52.1);
    expect(r4.classification).toBe('Không đạt');

    // Test 5: Cấu hình tỷ trọng tùy biến
    const customWeights = { self: 0.5, manager: 0.3, chairman: 0.2 };
    const r5 = calculateKpiFinal(90, 80, 70, customWeights);
    // (90*0.5) + (80*0.3) + (70*0.2) = 45 + 24 + 14 = 83.0
    expect(r5.finalScore).toBe(83.0);
    expect(r5.classification).toBe('Tốt');
  });

  test('5. Kiểm tra Type Contract & Đầy đủ Dịch vụ Nghiệp Vụ KPI (kpiService)', async () => {
    // Đảm bảo tất cả hàm nghiệp vụ cần thiết đều được xuất khẩu đúng kiểu function
    expect(typeof subscribeKpiCriteria).toBe('function');
    expect(typeof saveKpiCriteriaItem).toBe('function');
    expect(typeof deleteKpiCriteriaItem).toBe('function');
    expect(typeof filterKpiCriteriaByDepartment).toBe('function');
    expect(typeof saveKpiStep1Self).toBe('function');
    expect(typeof updateKpiStep2Manager).toBe('function');
    expect(typeof updateKpiStep3Chairman).toBe('function');
    expect(typeof submitKpiAppeal).toBe('function');
    expect(typeof resolveKpiAppeal).toBe('function');
    expect(typeof bulkApproveKpi).toBe('function');
    expect(typeof getKpiSummaryStats).toBe('function');
    expect(typeof exportKpiSummaryToExcel).toBe('function');
  });

  test('6. Kiểm tra Tổng Hợp Chỉ Số Thống Kê & Bảng Xếp Hạng (getKpiSummaryStats)', async () => {
    const mockKpiList = [
      {
        id: 'kpi-1',
        employeeName: 'Nguyễn Văn Sơn',
        department: 'Ban Điều hành',
        scoreSelf: 95,
        scoreManager: 92,
        scoreChairman: 94,
        finalScore: 93.8,
        classification: 'Xuất sắc',
        status: 'completed',
      },
      {
        id: 'kpi-2',
        employeeName: 'Lê Văn Hiếu',
        department: 'Phòng Tín dụng',
        scoreSelf: 88,
        scoreManager: 85,
        scoreChairman: 86,
        finalScore: 86.5,
        classification: 'Tốt',
        status: 'completed',
      },
      {
        id: 'kpi-3',
        employeeName: 'Trần Thị Mai',
        department: 'Phòng Kế toán - Ngân quỹ',
        scoreSelf: 80,
        scoreManager: null,
        scoreChairman: null,
        finalScore: null,
        status: 'pending_manager',
      }
    ];

    const stats = getKpiSummaryStats(mockKpiList);
    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(2);
    expect(stats.pendingManager).toBe(1);
    expect(stats.completionRate).toBe(67);
    expect(stats.classifications['Xuất sắc']).toBe(1);
    expect(stats.classifications['Tốt']).toBe(1);
    expect(stats.leaderboard.length).toBe(3);
    expect(stats.leaderboard[0].employeeName).toBe('Nguyễn Văn Sơn');
  });

  test('7. Kiểm tra Cấu hình Mặc định Phân hệ KPI (DEFAULT_MODULE_KPI_SETTINGS)', async () => {
    expect(DEFAULT_MODULE_KPI_SETTINGS.weightSelf).toBe(40);
    expect(DEFAULT_MODULE_KPI_SETTINGS.weightManager).toBe(30);
    expect(DEFAULT_MODULE_KPI_SETTINGS.weightChairman).toBe(30);
    expect(DEFAULT_MODULE_KPI_SETTINGS.excellentThreshold).toBe(90);
    expect(DEFAULT_MODULE_KPI_SETTINGS.goodThreshold).toBe(75);
    expect(DEFAULT_MODULE_KPI_SETTINGS.passThreshold).toBe(60);
  });

  test('8. Kiểm tra Danh mục Nhóm Tiêu chí KPI Động (kpi_criteria_groups)', async () => {
    expect(Array.isArray(DEFAULT_KPI_CRITERIA_GROUPS)).toBe(true);
    expect(DEFAULT_KPI_CRITERIA_GROUPS.length).toBe(4);

    const totalWeight = DEFAULT_KPI_CRITERIA_GROUPS.reduce((s, g) => s + g.maxScore, 0);
    expect(totalWeight).toBe(100);

    expect(typeof subscribeKpiCriteriaGroups).toBe('function');
    expect(typeof saveKpiCriteriaGroup).toBe('function');
    expect(typeof deleteKpiCriteriaGroup).toBe('function');
  });

  test('9. Kiểm tra Quản trị Kỳ Chấm Điểm KPI & Tổng hợp Tháng thành Quý (kpi_periods)', async () => {
    expect(Array.isArray(DEFAULT_KPI_PERIODS)).toBe(true);
    expect(DEFAULT_KPI_PERIODS.length).toBeGreaterThanOrEqual(3);

    // Kiểm tra có cả kỳ MONTHLY và QUARTERLY
    const types = new Set(DEFAULT_KPI_PERIODS.map((p) => p.type));
    expect(types.has('MONTHLY')).toBe(true);
    expect(types.has('QUARTERLY')).toBe(true);

    expect(typeof subscribeKpiPeriods).toBe('function');
    expect(typeof saveKpiPeriod).toBe('function');
    expect(typeof deleteKpiPeriod).toBe('function');
    expect(typeof updateKpiPeriodStatus).toBe('function');

    // Kiểm tra hàm tổng hợp điểm tháng thành quý (getKpiMonthlyToQuarterlySummary)
    const mockMonthlyKpis = [
      {
        employeeId: 'emp-01',
        employeeCode: 'CB01',
        employeeName: 'Nguyễn Văn A',
        department: 'Phòng Tín dụng',
        scoreSelf: 90,
        finalScore: 92,
      },
      {
        employeeId: 'emp-01',
        employeeCode: 'CB01',
        employeeName: 'Nguyễn Văn A',
        department: 'Phòng Tín dụng',
        scoreSelf: 86,
        finalScore: 88,
      },
      {
        employeeId: 'emp-02',
        employeeCode: 'CB02',
        employeeName: 'Trần Thị B',
        department: 'Phòng Kế toán',
        scoreSelf: 78,
        finalScore: 80,
      },
    ];

    const result = getKpiMonthlyToQuarterlySummary('kpi-2026-q3', mockMonthlyKpis);
    expect(result.quarterPeriodId).toBe('kpi-2026-q3');
    expect(result.summary.length).toBe(2);

    const empA = result.summary.find((e) => e.employeeId === 'emp-01');
    expect(empA).toBeTruthy();
    expect(empA.monthCount).toBe(2);
    expect(empA.avgSelfScore).toBe(88); // (90 + 86) / 2
    expect(empA.avgFinalScore).toBe(90); // (92 + 88) / 2
    expect(empA.classification).toBe('Xuất sắc');
  });
  test('10. Kiểm tra Danh sách Cán bộ nhân viên chuẩn hóa không có ROOT và lấy từ CSDL CBNV thực tế', async () => {
    // 1. Kiểm tra danh sách cán bộ chuẩn có đúng 13 CBNV chính thức của Quỹ Yên Thọ
    expect(Array.isArray(OFFICIAL_STAFF_EMPLOYEES)).toBe(true);
    expect(OFFICIAL_STAFF_EMPLOYEES.length).toBe(13);

    // 2. Tuyệt đối không chứa tài khoản ROOT hoặc SuperAdmin trong danh sách CBNV
    const rootUser = OFFICIAL_STAFF_EMPLOYEES.find(
      (e) => e.id === 'emp-root' || e.code === 'ROOT' || e.role === 'superadmin'
    );
    expect(rootUser).toBeUndefined();

    // 3. Phải có đầy đủ Nguyễn Hữu Hiếu (CB06) và các cán bộ cốt cán
    const hieu = OFFICIAL_STAFF_EMPLOYEES.find((e) => e.code === 'CB06');
    expect(hieu).toBeTruthy();
    expect(hieu.name || hieu.fullName).toBe('Nguyễn Hữu Hiếu');
    expect(hieu.department).toBe('Phòng Tín dụng');

    // 4. Kiểm tra hàm subscribeEmployees đã sẵn sàng
    expect(typeof subscribeEmployees).toBe('function');
  });
});

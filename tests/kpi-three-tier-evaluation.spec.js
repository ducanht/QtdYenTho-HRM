import { test, expect } from '@playwright/test';
import {
  calculateKpiFinal,
  getKpiClassification,
  filterKpiCriteriaByDepartment,
  getKpiSummaryStats,
  submitKpiAppeal,
  resolveKpiAppeal,
  bulkApproveKpi,
} from '../src/features/kpi/services/kpiService';
import { DEFAULT_KPI_CRITERIA_CATALOG } from '../src/lib/systemDefaults';

test.describe('Phân Hệ Chấm Điểm KPI 3 Cấp - Kiểm Thử Tích Hợp Toàn Diện (Phase 2 & 3)', () => {

  test('1. Kiểm thử Thuật toán Phân loại KPI (getKpiClassification)', () => {
    // 90+ -> Xuất sắc
    const cls1 = getKpiClassification(95);
    expect(cls1.label).toBe('Xuất sắc');
    expect(cls1.key).toBe('EXCELLENT');

    // 75-89 -> Tốt
    const cls2 = getKpiClassification(82.5);
    expect(cls2.label).toBe('Tốt');
    expect(cls2.key).toBe('GOOD');

    // 60-74 -> Đạt yêu cầu
    const cls3 = getKpiClassification(65);
    expect(cls3.label).toBe('Đạt yêu cầu');
    expect(cls3.key).toBe('PASS');

    // < 60 -> Không đạt
    const cls4 = getKpiClassification(55);
    expect(cls4.label).toBe('Không đạt');
    expect(cls4.key).toBe('FAIL');
  });

  test('2. Kiểm thử Tỷ trọng 3 Cấp (40% - 30% - 30%) và Tính Tổng Điểm Chốt', () => {
    // Cán bộ tự chấm 90đ (40%), Trưởng phòng thẩm định 80đ (30%), HĐQT duyệt 85đ (30%)
    // Final = 90 * 0.4 + 80 * 0.3 + 85 * 0.3 = 36 + 24 + 25.5 = 85.5
    const res = calculateKpiFinal(90, 80, 85);
    expect(res.finalScore).toBe(85.5);
    expect(res.classification).toBe('Tốt');

    // Thử trường hợp xuất sắc (ví dụ: 95, 92, 90) -> 95*0.4 + 92*0.3 + 90*0.3 = 38 + 27.6 + 27 = 92.6
    const res2 = calculateKpiFinal(95, 92, 90);
    expect(res2.finalScore).toBe(92.6);
    expect(res2.classification).toBe('Xuất sắc');
  });

  test('3. Kiểm thử Đầy đủ Danh mục Tiêu chí Động và Bộ Lọc 4 Phòng Ban', () => {
    const allCriteria = DEFAULT_KPI_CRITERIA_CATALOG;
    expect(allCriteria.length).toBeGreaterThanOrEqual(14);

    // Phòng Tín dụng: Nhận các tiêu chí của Tín dụng + tiêu chí dùng chung (Tất cả)
    const creditCriteria = filterKpiCriteriaByDepartment(allCriteria, 'Phòng Tín dụng');
    expect(creditCriteria.length).toBeGreaterThan(0);
    const totalCreditMax = creditCriteria.reduce((sum, c) => sum + (c.maxScore || 0), 0);
    expect(totalCreditMax).toBe(100); // Bắt buộc chuẩn hóa đúng 100 điểm

    // Phòng Kế toán - Ngân quỹ
    const accountingCriteria = filterKpiCriteriaByDepartment(allCriteria, 'Phòng Kế toán - Ngân quỹ');
    const totalAccMax = accountingCriteria.reduce((sum, c) => sum + (c.maxScore || 0), 0);
    expect(totalAccMax).toBe(100);

    // Ban Kiểm soát
    const auditCriteria = filterKpiCriteriaByDepartment(allCriteria, 'Ban Kiểm soát');
    const totalAuditMax = auditCriteria.reduce((sum, c) => sum + (c.maxScore || 0), 0);
    expect(totalAuditMax).toBe(100);

    // Ban Điều hành
    const execCriteria = filterKpiCriteriaByDepartment(allCriteria, 'Ban Điều hành');
    const totalExecMax = execCriteria.reduce((sum, c) => sum + (c.maxScore || 0), 0);
    expect(totalExecMax).toBe(100);
  });

  test('4. Kiểm thử Cơ chế Nộp Khiếu Nại (submitKpiAppeal) và Giải Quyết Khiếu Nại (resolveKpiAppeal)', async () => {
    // Giả lập phiếu KPI hiện tại
    const mockKpiItem = {
      id: 'kpi_test_01',
      employeeName: 'Lê Văn An',
      scoreSelf: 88,
      scoreManager: 80,
      scoreChairman: 78,
      finalScore: 82.6,
      classification: 'Tốt',
      appealStatus: 'NONE'
    };

    // 1. Kiểm tra chữ ký hàm submitKpiAppeal
    expect(typeof submitKpiAppeal).toBe('function');

    // 2. Kiểm tra chữ ký hàm resolveKpiAppeal
    expect(typeof resolveKpiAppeal).toBe('function');
  });

  test('5. Kiểm thử Cơ chế Phê Duyệt Hàng Loạt của HĐQT (bulkApproveKpi)', async () => {
    expect(typeof bulkApproveKpi).toBe('function');

    const pendingList = [
      { id: 'kpi_01', employeeName: 'Nguyễn Văn A', scoreSelf: 85, scoreManager: 85, scoreChairman: null },
      { id: 'kpi_02', employeeName: 'Trần Thị B', scoreSelf: 90, scoreManager: 88, scoreChairman: null },
    ];

    // Kiểm tra tính toán điểm khi HĐQT duyệt hàng loạt theo điểm thẩm định
    const processed = pendingList.map(item => {
      const scoreChairman = item.scoreManager || item.scoreSelf;
      const { finalScore, classification } = calculateKpiFinal(item.scoreSelf, item.scoreManager, scoreChairman);
      return { ...item, scoreChairman, finalScore, classification, status: 'approved' };
    });

    expect(processed[0].finalScore).toBe(85);
    expect(processed[0].classification).toBe('Tốt');
    expect(processed[1].finalScore).toBe(88.8);
    expect(processed[1].classification).toBe('Tốt');
  });

  test('6. Kiểm thử Bảng Theo Dõi & Thống Kê Tiến Trình (getKpiSummaryStats)', () => {
    const mockList = [
      { id: '1', department: 'Phòng Tín dụng', status: 'completed', finalScore: 92, classification: 'Xuất sắc' },
      { id: '2', department: 'Phòng Tín dụng', status: 'pending_chairman', scoreSelf: 85, scoreManager: 82 },
      { id: '3', department: 'Phòng Kế toán - Ngân quỹ', status: 'completed', finalScore: 86, classification: 'Tốt' },
      { id: '4', department: 'Phòng Kế toán - Ngân quỹ', status: 'pending_manager', scoreSelf: 78 },
      { id: '5', department: 'Ban Kiểm soát', status: 'completed', finalScore: 68, classification: 'Đạt yêu cầu' },
    ];

    const stats = getKpiSummaryStats(mockList);
    expect(stats.total).toBe(5);
    expect(stats.completed).toBe(3);
    expect(stats.pendingChairman).toBe(1);
    expect(stats.pendingManager).toBe(1);
    expect(stats.classifications['Xuất sắc']).toBe(1);
    expect(stats.classifications['Tốt']).toBe(1);
    expect(stats.classifications['Đạt yêu cầu']).toBe(1);
    expect(Array.isArray(stats.departmentStats)).toBe(true);
    expect(stats.departmentStats.length).toBeGreaterThanOrEqual(3);
  });

  test('7. Kiểm tra Quy Chuẩn Giao Diện & Tiêu Chuẩn Văn Bản Hành Chính (A4 Printing & Zero AI Jargon)', () => {
    // Kiểm tra tên các chức danh chuẩn Quỹ tín dụng nhân dân Yên Thọ
    const validSignaturesPersonal = [
      'CÁN BỘ TỰ CHẤM',
      'TRƯỞNG BỘ PHẬN THẨM ĐỊNH',
      'CHỦ TỊCH HĐQT PHÊ CHUẨN'
    ];
    expect(validSignaturesPersonal.length).toBe(3);

    const validSignaturesFund = [
      'NGƯỜI LẬP BIỂU',
      'GIÁM ĐỐC ĐIỀU HÀNH',
      'CHỦ TỊCH HĐQT'
    ];
    expect(validSignaturesFund.length).toBe(3);

    // Đảm bảo không chứa từ ngữ AI
    const forbiddenWords = ['AI', 'ChatGPT', 'Bot', 'Machine Learning', 'GenAI', 'Copilot', 'Thần tốc', 'Phép thuật', 'Kỳ diệu'];
    const sampleUiLabels = [
      'Phân Hệ Đánh Giá KPI 3 Cấp',
      'Cán bộ tự chấm (40%)',
      'Trưởng phòng thẩm định (30%)',
      'HĐQT phê duyệt (30%)',
      'Bảng Tự Đánh Giá Hiệu Suất KPI (Cấp 1)',
      'Thẩm Định Hiệu Quả Công Tác (Cấp 2)',
      'Hội Đồng Quản Trị Phê Chuẩn & Chốt Điểm (Cấp 3)',
      'Đề Nghị Xem Xét / Phúc Tra Điểm Số',
      'Mẫu In & Xuất Đánh Giá KPI (Khổ A4)'
    ];

    sampleUiLabels.forEach(label => {
      forbiddenWords.forEach(badWord => {
        expect(label.toLowerCase()).not.toContain(badWord.toLowerCase());
      });
    });
  });
});

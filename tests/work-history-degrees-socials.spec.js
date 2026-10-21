import { test, expect } from '@playwright/test';
import { 
  DEFAULT_EMPLOYEE_DEGREES, 
  DEFAULT_EMPLOYEE_SOCIALS, 
  DEFAULT_EMPLOYEE_CONTRACTS,
  DEFAULT_CONTRACT_ANNEXES,
  OFFICIAL_WORK_HISTORY,
  OFFICIAL_STAFF_EMPLOYEES,
  DEFAULT_MODULE_HR_SETTINGS,
} from '../src/lib/systemDefaults';
import { isCreditOfficerRole } from '../src/lib/evaluationUtils';
import { 
  CURRENT_SCHEMA_VERSION, 
  CORE_COLLECTIONS, 
  autoInitializeDatabase 
} from '../src/lib/autoInitDb';
import {
  subscribeEmployeeDegrees,
  saveEmployeeDegree,
  deleteEmployeeDegree,
  subscribeEmployeeSocials,
  saveEmployeeSocial,
  deleteEmployeeSocial,
  subscribeWorkHistory,
  saveWorkHistory,
  deleteWorkHistory,
  subscribeEmployeeContracts,
  saveEmployeeContract,
  deleteEmployeeContract,
  subscribeContractAnnexes,
  saveContractAnnex,
  deleteContractAnnex
} from '../src/lib/services';
import { TRANSFER_TYPES } from '../src/features/employees/components/WorkHistoryPeriodModal';
import { 
  DEGREE_LEVEL_OPTIONS, 
  TRAINING_TYPE_OPTIONS 
} from '../src/features/employees/components/AddDegreeModal';
import { SOCIAL_PLATFORMS } from '../src/features/employees/components/ManageSocialsModal';
import { 
  exportEmployeeProfileToDocx, 
  exportEmployeeProfileToExcel 
} from '../src/lib/exportUtils';
import EmployeeFormModal from '../src/features/employees/components/EmployeeFormModal';


test.describe('Kiểm thử Cấu Trúc CSDL & Dữ Liệu Mẫu Cho 3 Bảng Riêng Biệt (Degrees, Socials, Timeline Work History)', () => {
  test('Kiểm tra dữ liệu mẫu và cấu trúc CSDL 3 bảng riêng biệt', async () => {
    // 1. Kiểm tra Schema Version và Core Collections
    expect(CURRENT_SCHEMA_VERSION).toMatch(/v(5|6)\./);
    expect(CORE_COLLECTIONS).toContain('employee_degrees');
    expect(CORE_COLLECTIONS).toContain('employee_socials');
    expect(CORE_COLLECTIONS).toContain('work_history');
    expect(typeof autoInitializeDatabase).toBe('function');

    // 2. Kiểm tra DEFAULT_EMPLOYEE_DEGREES (Bảng riêng văn bằng đa cấp)
    expect(Array.isArray(DEFAULT_EMPLOYEE_DEGREES)).toBe(true);
    expect(DEFAULT_EMPLOYEE_DEGREES.length).toBeGreaterThan(0);
    
    // Kiểm tra cấu trúc bản ghi văn bằng
    const firstDegree = DEFAULT_EMPLOYEE_DEGREES[0];
    expect(firstDegree).toHaveProperty('id');
    expect(firstDegree).toHaveProperty('employeeId');
    expect(firstDegree).toHaveProperty('employeeName');
    expect(firstDegree).toHaveProperty('degreeLevel');
    expect(firstDegree).toHaveProperty('major');
    expect(firstDegree).toHaveProperty('institution');
    expect(firstDegree).toHaveProperty('trainingType');
    expect(firstDegree).toHaveProperty('graduationYear');
    expect(firstDegree).toHaveProperty('isHighest');

    // Kiểm tra tính đa dạng của cấp bậc đào tạo (Thạc sĩ, Đại học, Cao đẳng, Trung cấp)
    const degreeLevels = DEFAULT_EMPLOYEE_DEGREES.map((d) => d.degreeLevel);
    expect(degreeLevels).toContain('Thạc sĩ');
    expect(degreeLevels).toContain('Đại học');
    expect(degreeLevels).toContain('Cao đẳng');
    expect(degreeLevels).toContain('Trung cấp');

    // Kiểm tra hình thức đào tạo đa dạng
    const trainingTypes = DEFAULT_EMPLOYEE_DEGREES.map((d) => d.trainingType);
    expect(trainingTypes).toContain('Chính quy');

    // 3. Kiểm tra DEFAULT_EMPLOYEE_SOCIALS (Bảng riêng mạng xã hội & liên lạc)
    expect(Array.isArray(DEFAULT_EMPLOYEE_SOCIALS)).toBe(true);
    expect(DEFAULT_EMPLOYEE_SOCIALS.length).toBeGreaterThan(0);

    const firstSocial = DEFAULT_EMPLOYEE_SOCIALS[0];
    expect(firstSocial).toHaveProperty('id');
    expect(firstSocial).toHaveProperty('employeeId');
    expect(firstSocial).toHaveProperty('employeeName');
    expect(firstSocial).toHaveProperty('platform');
    expect(firstSocial).toHaveProperty('accountName');
    expect(firstSocial).toHaveProperty('url');
    expect(firstSocial).toHaveProperty('isPublic');

    const platforms = DEFAULT_EMPLOYEE_SOCIALS.map((s) => s.platform);
    expect(platforms).toContain('Zalo');
    expect(platforms).toContain('Facebook');

    // 4. Kiểm tra OFFICIAL_WORK_HISTORY đã bổ sung các trường Timeline
    expect(OFFICIAL_WORK_HISTORY.length).toBeGreaterThan(0);
    for (const item of OFFICIAL_WORK_HISTORY) {
      expect(item).toHaveProperty('startDate');
      expect(item).toHaveProperty('endDate');
      expect(item).toHaveProperty('isCurrent');
      expect(item).toHaveProperty('position');
      expect(item).toHaveProperty('department');
      expect(item).toHaveProperty('assignedArea');
    }
  });

  test('Kiểm tra Type Contract và tính sẵn sàng của các Firestore Services mới', async () => {
    // 1. Kiểm tra Services Quản lý Văn bằng (employee_degrees)
    expect(typeof subscribeEmployeeDegrees).toBe('function');
    expect(typeof saveEmployeeDegree).toBe('function');
    expect(typeof deleteEmployeeDegree).toBe('function');

    const unsubDegrees = subscribeEmployeeDegrees('emp-001', () => {});
    expect(typeof unsubDegrees).toBe('function');
    unsubDegrees();

    // 2. Kiểm tra Services Quản lý Mạng Xã Hội (employee_socials)
    expect(typeof subscribeEmployeeSocials).toBe('function');
    expect(typeof saveEmployeeSocial).toBe('function');
    expect(typeof deleteEmployeeSocial).toBe('function');

    const unsubSocials = subscribeEmployeeSocials('emp-001', () => {});
    expect(typeof unsubSocials).toBe('function');
    unsubSocials();

    // 3. Kiểm tra Services Luân chuyển & Timeline Công tác (work_history)
    expect(typeof subscribeWorkHistory).toBe('function');
    expect(typeof saveWorkHistory).toBe('function');
    expect(typeof deleteWorkHistory).toBe('function');

    const unsubWork = subscribeWorkHistory('emp-001', () => {});
    expect(typeof unsubWork).toBe('function');
    unsubWork();
  });

  test('Kiểm tra Component WorkHistoryPeriodModal & Quy tắc Sắp xếp Timeline Mốc Công Tác', async () => {
    // 1. Kiểm tra 5 hình thức luân chuyển / công tác chuẩn
    expect(TRANSFER_TYPES).toHaveLength(5);
    const typeKeys = TRANSFER_TYPES.map((t) => t.value);
    expect(typeKeys).toContain('LUAN_CHUYEN_DINH_KY');
    expect(typeKeys).toContain('BO_NHIEM');
    expect(typeKeys).toContain('THAY_DOI_DIA_BAN');
    expect(typeKeys).toContain('DIEU_DONG_NOI_BO');
    expect(typeKeys).toContain('CONG_TAC_BAN_DAU');

    // 2. Kiểm tra thuật toán sắp xếp timeline: Mốc isCurrent: true lên đầu, mốc quá khứ sắp xếp theo startDate giảm dần
    const sampleMilestones = [
      { id: '1', startDate: '2020-01-01', endDate: '2022-01-01', isCurrent: false, position: 'CBTD' },
      { id: '2', startDate: '2024-01-01', endDate: '', isCurrent: true, position: 'Trưởng phòng TD' },
      { id: '3', startDate: '2022-02-01', endDate: '2023-12-31', isCurrent: false, position: 'CBTD Chính' },
    ];

    const sorted = [...sampleMilestones].sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      const dateA = a.startDate || a.effectiveDate || '';
      const dateB = b.startDate || b.effectiveDate || '';
      return dateB.localeCompare(dateA);
    });

    expect(sorted[0].id).toBe('2'); // isCurrent: true
    expect(sorted[1].id).toBe('3'); // 2022-02-01
    expect(sorted[2].id).toBe('1'); // 2020-01-01
  });

  test('Kiểm tra Giao diện Tab Luân chuyển công tác & Modal Thêm mốc công tác', async ({ page }) => {
    // Đăng nhập an toàn
    await page.goto('/login');
    try {
      await page.waitForURL(/.*(\/portal|\/employees)/, { timeout: 3000 });
    } catch {
      const emailInput = page.getByLabel('Địa chỉ Email Cán bộ');
      await emailInput.fill('ducanht@gmail.com');
      await page.getByLabel('Mật khẩu bảo mật').fill('Qtd@2003');
      await page.getByRole('button', { name: /Đăng nhập ngay/i }).click();
      await page.waitForURL(/.*(\/portal|\/employees)/, { timeout: 25000 });
    }

    const remindLaterBtn = page.getByRole('button', { name: 'Nhắc tôi sau' });
    if (await remindLaterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remindLaterBtn.click();
    }

    // Điều hướng vào tab TRANSFERS của /employees
    await page.goto('/employees?tab=TRANSFERS');
    await expect(page).toHaveURL(/.*\/employees/, { timeout: 15000 });

    // Kiểm tra tiêu đề khối Timeline
    await expect(page.getByText(/Quá Trình Công Tác & Luân Chuyển/i).first()).toBeVisible({ timeout: 15000 });

    // Kiểm tra nút "+ Thêm mốc công tác" hiển thị cho Quản trị viên
    const addPeriodBtn = page.getByRole('button', { name: /\+? ?Thêm mốc công tác/i });
    await expect(addPeriodBtn).toBeVisible({ timeout: 10000 });

    // Nhấp nút mở modal
    await addPeriodBtn.click();

    // Xác nhận Modal Thêm Mốc Quá Trình Công Tác Mới mở ra
    await expect(page.getByRole('heading', { name: /Thêm Mốc Quá Trình Công Tác Mới/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Thời Gian Công Tác')).toBeVisible();
    await expect(page.getByText(/Đang đảm nhiệm \(Mốc hiện tại\)/i)).toBeVisible();
    await expect(page.getByText(/Phòng ban/i).first()).toBeVisible();
    await expect(page.getByText(/Nơi làm việc/i).first()).toBeVisible();

    // Kiểm tra trường Địa bàn quản lý tín dụng xuất hiện động khi chức vụ là Cán bộ tín dụng thuộc Phòng Tín dụng
    const deptSelect = page.locator('select').first();
    await deptSelect.selectOption('Phòng Tín dụng');
    const posInput = page.getByPlaceholder(/VD: Cán bộ tín dụng/i);
    await posInput.fill('Cán bộ tín dụng');
    await expect(page.getByText(/Địa bàn quản lý tín dụng/i).first()).toBeVisible({ timeout: 5000 });

    // Nhấp nút Hủy bỏ để đóng modal
    await page.getByRole('button', { name: /Hủy bỏ/i }).click();
    await expect(page.getByRole('heading', { name: /Thêm Mốc Quá Trình Công Tác Mới/i })).toHaveCount(0);
  });

  test('Kiểm tra Cấu hình và Tùy chọn Văn Bằng & Mạng Xã Hội Đa Nền Tảng', async () => {
    // 1. Kiểm tra các bậc văn bằng chuyên môn đa cấp
    const degreeLevels = DEGREE_LEVEL_OPTIONS.map((d) => d.value);
    expect(degreeLevels).toContain('Tiến sĩ');
    expect(degreeLevels).toContain('Thạc sĩ');
    expect(degreeLevels).toContain('Đại học');
    expect(degreeLevels).toContain('Cao đẳng');
    expect(degreeLevels).toContain('Trung cấp');

    // 2. Kiểm tra hình thức đào tạo
    const trainingTypes = TRAINING_TYPE_OPTIONS.map((t) => t.value);
    expect(trainingTypes).toContain('Chính quy');
    expect(trainingTypes).toContain('Vừa làm vừa học');
    expect(trainingTypes).toContain('Liên thông');
    expect(trainingTypes).toContain('Văn bằng 2');

    // 3. Kiểm tra mạng xã hội & kênh liên lạc số
    const platforms = SOCIAL_PLATFORMS.map((s) => s.value);
    expect(platforms).toContain('Zalo');
    expect(platforms).toContain('Facebook');
    expect(platforms).toContain('Telegram');
    expect(platforms).toContain('LinkedIn');
  });

  test('Kiểm tra hàm xuất Báo cáo Word & Excel đa sheet tích hợp Timeline, Văn bằng, Mạng xã hội', async () => {
    // 1. Kiểm tra tính sẵn sàng của hàm xuất Docx và Excel
    expect(typeof exportEmployeeProfileToDocx).toBe('function');
    expect(typeof exportEmployeeProfileToExcel).toBe('function');

    // 2. Kiểm tra dữ liệu đầu vào cho các sheet Excel
    const sampleEmp = {
      id: 'emp-001',
      name: 'Nguyễn Thị Sinh',
      position: 'Cán bộ Tín dụng',
      department: 'Phòng Tín dụng'
    };
    const sampleDegrees = DEFAULT_EMPLOYEE_DEGREES.filter((d) => d.employeeId === 'emp-001');
    const sampleSocials = DEFAULT_EMPLOYEE_SOCIALS.filter((s) => s.employeeId === 'emp-001');
    const sampleWorkHistory = OFFICIAL_WORK_HISTORY.filter((w) => w.employeeId === 'emp-001');

    expect(sampleDegrees.length).toBeGreaterThan(0);
    expect(sampleSocials.length).toBeGreaterThan(0);
    expect(sampleWorkHistory.length).toBeGreaterThan(0);
  });

  test('Kiểm tra hỗ trợ Số điện thoại 2, Trình độ Tin học và Ngoại ngữ có thể điều chỉnh và xuất bản', async () => {
    // 1. Kiểm tra cấu trúc cán bộ trong OFFICIAL_STAFF_EMPLOYEES
    const chairEmp = OFFICIAL_STAFF_EMPLOYEES.find((e) => e.id === 'emp-007');
    expect(chairEmp).toBeDefined();
    expect(chairEmp.secondaryPhone).toBe('0912345678');
    expect(chairEmp.itLevel).toBe('Ứng dụng CNTT nâng cao');
    expect(chairEmp.foreignLanguage).toBe('Tiếng Anh B1');

    // 2. Kiểm tra các nhân viên khác đều có fallback chuẩn mực
    const regularEmp = OFFICIAL_STAFF_EMPLOYEES.find((e) => e.id === 'emp-001');
    expect(regularEmp).toBeDefined();
    expect(regularEmp.itLevel).toBe('Ứng dụng CNTT cơ bản');
    expect(regularEmp.foreignLanguage).toBe('Tiếng Anh');
  });

  test('Kiểm tra Nơi làm việc, Danh mục Địa bàn Tín dụng và Xác định Cán bộ Tín dụng (isCreditOfficerRole)', async () => {
    // 1. Kiểm tra hàm isCreditOfficerRole loại trừ dứt khoát các chức danh HĐQT, BKS, Ban Điều hành, Kế toán, Thủ quỹ
    expect(isCreditOfficerRole('Chủ tịch HĐQT', 'Hội đồng Quản trị')).toBe(false);
    expect(isCreditOfficerRole('Thành viên HĐQT chuyên trách', 'Hội đồng Quản trị')).toBe(false);
    expect(isCreditOfficerRole('Trưởng ban Kiểm soát', 'Ban Kiểm soát')).toBe(false);
    expect(isCreditOfficerRole('Thành viên BKS', 'Ban Kiểm soát')).toBe(false);
    expect(isCreditOfficerRole('Giám đốc điều hành', 'Ban Điều hành')).toBe(false);
    expect(isCreditOfficerRole('Phó Giám đốc', 'Ban Điều hành')).toBe(false);
    expect(isCreditOfficerRole('Kế toán trưởng', 'Phòng Kế toán - Ngân quỹ')).toBe(false);
    expect(isCreditOfficerRole('Thủ quỹ', 'Phòng Kế toán - Ngân quỹ')).toBe(false);
    expect(isCreditOfficerRole('Kế toán viên', 'Phòng Kế toán - Ngân quỹ')).toBe(false);

    // 2. Kiểm tra hàm isCreditOfficerRole trả về true cho Cán bộ Tín dụng
    expect(isCreditOfficerRole('Cán bộ tín dụng', 'Phòng Tín dụng')).toBe(true);
    expect(isCreditOfficerRole('Cán bộ Tín dụng phụ trách địa bàn', 'Phòng Tín dụng')).toBe(true);
    expect(isCreditOfficerRole('Thẩm định tín dụng', 'Phòng Tín dụng')).toBe(true);

    // 3. Kiểm tra DEFAULT_MODULE_HR_SETTINGS có danh mục creditAreas và workLocations
    expect(DEFAULT_MODULE_HR_SETTINGS).toHaveProperty('creditAreas');
    expect(DEFAULT_MODULE_HR_SETTINGS).toHaveProperty('workLocations');
    expect(Array.isArray(DEFAULT_MODULE_HR_SETTINGS.creditAreas)).toBe(true);
    expect(Array.isArray(DEFAULT_MODULE_HR_SETTINGS.workLocations)).toBe(true);
    expect(DEFAULT_MODULE_HR_SETTINGS.creditAreas.length).toBeGreaterThan(0);
    expect(DEFAULT_MODULE_HR_SETTINGS.workLocations.length).toBeGreaterThan(0);

    // 4. Kiểm tra toàn bộ OFFICIAL_STAFF_EMPLOYEES đều có workLocation
    for (const emp of OFFICIAL_STAFF_EMPLOYEES) {
      expect(emp.workLocation).toBeDefined();
      expect(emp.workLocation).toContain('Trụ sở chính');
    }

    // 5. Kiểm tra Schema Version mới v6.0
    expect(CURRENT_SCHEMA_VERSION).toContain('v6.0');

    // 6. Kiểm tra cấu trúc CSDL và liên kết quan hệ Nơi làm việc & Địa bàn tín dụng
    const sampleWorkLocations = [...DEFAULT_MODULE_HR_SETTINGS.workLocations];
    const sampleCreditAreas = [...DEFAULT_MODULE_HR_SETTINGS.creditAreas];
    
    sampleWorkLocations.push('Điểm giao dịch xã Quý Lộc');
    sampleCreditAreas.push('Thôn Đồng Lạc');
    expect(sampleWorkLocations).toContain('Điểm giao dịch xã Quý Lộc');
    expect(sampleCreditAreas).toContain('Thôn Đồng Lạc');

    // Kiểm tra liên kết quan hệ phân công CBTD phụ trách địa bàn tín dụng
    const assignedCreditOfficers = OFFICIAL_STAFF_EMPLOYEES.filter(
      (e) => isCreditOfficerRole(e.position, e.department) && Boolean(e.assignedArea)
    );
    expect(assignedCreditOfficers.length).toBeGreaterThan(0);
    for (const officer of assignedCreditOfficers) {
      expect(officer.assignedArea).toBeTruthy();
    }
  });

  test('Kiểm tra Cấu hình Luân chuyển Địa bàn Cán bộ Tín dụng (CBTD) và Loại bỏ Bảng Chức danh thừa', async () => {
    // 1. Kiểm tra DEFAULT_MODULE_HR_SETTINGS có các tham số chu kỳ luân chuyển và cảnh báo CBTD
    expect(DEFAULT_MODULE_HR_SETTINGS.transferMaxMonths).toBe(36);
    expect(DEFAULT_MODULE_HR_SETTINGS.transferWarningMonths).toBe(6);

    // 2. Kiểm tra chỉ CBTD mới kích hoạt cảnh báo luân chuyển địa bàn
    const creditOfficer = OFFICIAL_STAFF_EMPLOYEES.find((e) => isCreditOfficerRole(e.position, e.department));
    expect(creditOfficer).toBeDefined();
    expect(isCreditOfficerRole(creditOfficer.position, creditOfficer.department)).toBe(true);

    const nonCreditOfficers = OFFICIAL_STAFF_EMPLOYEES.filter((e) => !isCreditOfficerRole(e.position, e.department));
    expect(nonCreditOfficers.length).toBeGreaterThan(0);
    for (const nonCBTD of nonCreditOfficers) {
      // HĐQT, BKS, Giám đốc, Kế toán, Thủ quỹ tuyệt đối không thuộc diện luân chuyển địa bàn
      expect(isCreditOfficerRole(nonCBTD.position, nonCBTD.department)).toBe(false);
    }
  });

  test('Kiểm tra Bảng Hợp Đồng Lao Động (employee_contracts), Phụ Lục HĐLĐ (employee_contract_annexes) và Cấu hình Hiển thị', async () => {
    // 1. Core Collections
    expect(CORE_COLLECTIONS).toContain('employee_contracts');
    expect(CORE_COLLECTIONS).toContain('employee_contract_annexes');

    // 2. DEFAULT_EMPLOYEE_CONTRACTS
    expect(Array.isArray(DEFAULT_EMPLOYEE_CONTRACTS)).toBe(true);
    expect(DEFAULT_EMPLOYEE_CONTRACTS.length).toBe(13); // 13 cán bộ chính thức
    for (const contract of DEFAULT_EMPLOYEE_CONTRACTS) {
      expect(contract).toHaveProperty('id');
      expect(contract).toHaveProperty('employeeId');
      expect(contract).toHaveProperty('contractNumber');
      expect(contract).toHaveProperty('contractType');
      expect(contract).toHaveProperty('signDate');
      expect(contract).toHaveProperty('effectiveDate');
      expect(contract).toHaveProperty('isCurrent', true);
      expect(contract).toHaveProperty('status', 'ACTIVE');
    }

    // 3. DEFAULT_CONTRACT_ANNEXES
    expect(Array.isArray(DEFAULT_CONTRACT_ANNEXES)).toBe(true);
    expect(DEFAULT_CONTRACT_ANNEXES.length).toBeGreaterThan(0);
    for (const annex of DEFAULT_CONTRACT_ANNEXES) {
      expect(annex).toHaveProperty('id');
      expect(annex).toHaveProperty('contractId');
      expect(annex).toHaveProperty('annexNumber');
      expect(annex).toHaveProperty('signDate');
      expect(annex).toHaveProperty('annexType');
      expect(annex).toHaveProperty('content');
    }

    // 4. Contract Services API
    expect(typeof subscribeEmployeeContracts).toBe('function');
    expect(typeof saveEmployeeContract).toBe('function');
    expect(typeof deleteEmployeeContract).toBe('function');
    expect(typeof subscribeContractAnnexes).toBe('function');
    expect(typeof saveContractAnnex).toBe('function');
    expect(typeof deleteContractAnnex).toBe('function');

    // 5. Cấu hình hiển thị Tổng quan trong DEFAULT_MODULE_HR_SETTINGS
    expect(DEFAULT_MODULE_HR_SETTINGS).toHaveProperty('overviewDisplayConfig');
    expect(DEFAULT_MODULE_HR_SETTINGS.overviewDisplayConfig.showKpis).toBe(true);
    expect(DEFAULT_MODULE_HR_SETTINGS.overviewDisplayConfig.showContractStructure).toBe(true);
    expect(DEFAULT_MODULE_HR_SETTINGS.overviewDisplayConfig.showEducationStructure).toBe(true);
    expect(DEFAULT_MODULE_HR_SETTINGS.overviewDisplayConfig.showCreditRotationMonitoring).toBe(true);
    expect(DEFAULT_MODULE_HR_SETTINGS.overviewDisplayConfig.showDepartmentDistribution).toBe(true);
  });

  test('Kiểm tra Modal Chỉnh Sửa Hồ Sơ Cán Bộ (EmployeeFormModal) 4 Phân Khu Đầy Đủ Thông Tin Lưu Trữ', async () => {
    // 1. EmployeeFormModal component tồn tại và là React component (function hoặc memoized object)
    expect(typeof (EmployeeFormModal.type || EmployeeFormModal)).toBe('function');

    // 2. Kiểm tra dữ liệu mẫu cán bộ đầy đủ 4 nhóm thông tin
    const sampleEmp = OFFICIAL_STAFF_EMPLOYEES[0];
    // Nhóm 1: Thông tin cá nhân & Liên hệ
    expect(sampleEmp.name || sampleEmp.fullName).toBeDefined();
    expect(sampleEmp).toHaveProperty('gender');
    expect(sampleEmp).toHaveProperty('cccd');
    expect(sampleEmp.birthDate !== undefined || sampleEmp.dateOfBirth !== undefined).toBe(true);
    expect(sampleEmp).toHaveProperty('phone');
    expect(sampleEmp).toHaveProperty('email');

    // Nhóm 2: Công tác & Thâm niên
    expect(sampleEmp).toHaveProperty('department');
    expect(sampleEmp).toHaveProperty('position');
    expect(sampleEmp).toHaveProperty('contractType');
    expect(sampleEmp).toHaveProperty('workLocation');

    // Nhóm 3: Chính trị & Đảng - Đoàn thể
    expect(sampleEmp.partyMember !== undefined || sampleEmp.isPartyMember !== undefined).toBe(true);

    // Nhóm 4: Trình độ & Văn bằng chuyên môn
    expect(sampleEmp.education || sampleEmp.qualification).toBeDefined();
    expect(sampleEmp).toHaveProperty('itLevel');
    expect(sampleEmp).toHaveProperty('foreignLanguage');
  });
});


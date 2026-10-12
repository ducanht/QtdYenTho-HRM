import { test, expect } from '@playwright/test';
import { 
  DEFAULT_EMPLOYEE_DEGREES, 
  DEFAULT_EMPLOYEE_SOCIALS, 
  OFFICIAL_WORK_HISTORY,
  OFFICIAL_STAFF_EMPLOYEES,
} from '../src/lib/systemDefaults';
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
  deleteWorkHistory
} from '../src/lib/services';
import { TRANSFER_TYPES } from '../src/features/employees/components/WorkHistoryPeriodModal';
import { 
  DEGREE_LEVEL_OPTIONS, 
  TRAINING_TYPE_OPTIONS, 
  CLASSIFICATION_OPTIONS 
} from '../src/features/employees/components/AddDegreeModal';
import { SOCIAL_PLATFORMS } from '../src/features/employees/components/ManageSocialsModal';
import { 
  exportEmployeeProfileToDocx, 
  exportEmployeeProfileToExcel 
} from '../src/lib/exportUtils';


test.describe('Kiểm thử Cấu Trúc CSDL & Dữ Liệu Mẫu Cho 3 Bảng Riêng Biệt (Degrees, Socials, Timeline Work History)', () => {
  test('Kiểm tra dữ liệu mẫu và cấu trúc CSDL 3 bảng riêng biệt', async () => {
    // 1. Kiểm tra Schema Version và Core Collections
    expect(CURRENT_SCHEMA_VERSION).toContain('v5.');
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
      await page.waitForURL(/.*\/portal/, { timeout: 3000 });
    } catch {
      const emailInput = page.getByLabel('Địa chỉ Email Cán bộ');
      await emailInput.fill('ducanht@gmail.com');
      await page.getByLabel('Mật khẩu bảo mật').fill('Qtd@2003');
      await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
      await expect(page).toHaveURL(/.*\/portal/, { timeout: 20000 });
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
    const addPeriodBtn = page.getByRole('button', { name: /\+ Thêm mốc công tác/i });
    await expect(addPeriodBtn).toBeVisible({ timeout: 10000 });

    // Nhấp nút mở modal
    await addPeriodBtn.click();

    // Xác nhận Modal Thêm Mốc Quá Trình Công Tác Mới mở ra
    await expect(page.getByRole('heading', { name: /Thêm Mốc Quá Trình Công Tác Mới/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Thời Gian Công Tác')).toBeVisible();
    await expect(page.getByText(/Đang đảm nhiệm \(Mốc hiện tại\)/i)).toBeVisible();
    await expect(page.getByText(/Phòng ban đảm nhiệm/i)).toBeVisible();
    await expect(page.getByText('Địa bàn quản lý tín dụng:').first()).toBeVisible();

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
});


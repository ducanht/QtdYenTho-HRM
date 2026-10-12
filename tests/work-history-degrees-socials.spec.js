import { test, expect } from '@playwright/test';
import { 
  DEFAULT_EMPLOYEE_DEGREES, 
  DEFAULT_EMPLOYEE_SOCIALS, 
  OFFICIAL_WORK_HISTORY 
} from '../src/lib/systemDefaults';
import { 
  CURRENT_SCHEMA_VERSION, 
  CORE_COLLECTIONS, 
  autoInitializeDatabase 
} from '../src/lib/autoInitDb';

test.describe('Kiểm thử Cấu Trúc CSDL & Dữ Liệu Mẫu Cho 3 Bảng Riêng Biệt (Degrees, Socials, Timeline Work History)', () => {
  test('Kiểm tra dữ liệu mẫu và cấu trúc CSDL 3 bảng riêng biệt', async () => {
    // 1. Kiểm tra Schema Version và Core Collections
    expect(CURRENT_SCHEMA_VERSION).toContain('v5.6');
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
});

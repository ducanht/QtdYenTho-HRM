import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('test-results/ui-inspection');

async function dismissReminders(page) {
  try {
    const remindBtn = page.getByRole('button', { name: /Nhắc tôi sau|Để sau/i }).first();
    if (await remindBtn.isVisible({ timeout: 1200 }).catch(() => false)) {
      await remindBtn.click();
      await page.waitForTimeout(300);
    }
  } catch {
    // ignore
  }
}

async function loginAsAdmin(page) {
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
  await dismissReminders(page);
}

// Helper quét kiểm tra các từ cấm kỹ thuật hoặc lỗi runtime
async function scanForbiddenWords(page, contextName) {
  const pageText = await page.evaluate(() => document.body.innerText);
  const forbiddenRegex = /\b(undefined|NaN|\[object Object\]|uuid|payload|endpoint|subagent)\b/i;
  const match = pageText.match(forbiddenRegex);
  if (match) {
    console.warn(`[CẢNH BÁO TỪ NGỮ] ${contextName}: Phát hiện từ kỹ thuật/lỗi: "${match[0]}"`);
  }
}

test.describe('Kiểm tra Chi Tiết Giao Diện Phân Hệ Quản Trị Nhân Sự (QtdYenTho-HRM)', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 850 });
  });

  test('01. Kiểm tra Màn hình Tổng quan & Modal Cấu hình hiển thị', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/employees?tab=OVERVIEW');
    await page.waitForLoadState('domcontentloaded');
    await dismissReminders(page);

    // Xác nhận tiêu đề và các khối widget
    await expect(page.getByRole('heading', { name: /TỔNG QUAN NHÂN LỰC QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/TỔNG NHÂN SỰ/i)).toBeVisible();
    await expect(page.getByText(/CƠ CẤU GIỚI TÍNH/i)).toBeVisible();
    await expect(page.getByText(/CƠ CẤU HỢP ĐỒNG LAO ĐỘNG/i)).toBeVisible();
    await expect(page.getByText(/BẢNG GIÁM SÁT LUÂN CHUYỂN ĐỊA BÀN CÁN BỘ TÍN DỤNG/i)).toBeVisible();

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_desktop_tab_overview.png'), fullPage: true });
    await scanForbiddenWords(page, 'Màn hình Tổng quan');

    // Kiểm tra Menu Tác vụ xuất báo cáo quản trị tổng quan
    const reportTaskBtn = page.getByRole('button', { name: /Tác vụ/i }).first();
    await expect(reportTaskBtn).toBeVisible();
    await reportTaskBtn.click();
    await expect(page.getByText(/Xuất danh bạ toàn Quỹ/i)).toBeVisible();
    await expect(page.getByText(/Báo cáo giám sát địa bàn CBTD/i)).toBeVisible();
    await expect(page.getByText(/Báo cáo cơ cấu HĐLĐ/i)).toBeVisible();
    await expect(page.getByText(/Báo cáo trình độ & văn bằng/i)).toBeVisible();
    await page.keyboard.press('Escape');

    // Mở Modal Cấu hình hiển thị
    const configBtn = page.getByRole('button', { name: /Cấu hình hiển thị/i });
    await expect(configBtn).toBeVisible();
    await configBtn.click();
    await expect(page.getByRole('heading', { name: /Cấu Hình Hiển Thị Tổng Quan/i })).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(400);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01b_modal_overview_display_config.png') });
    await scanForbiddenWords(page, 'Modal Cấu hình hiển thị');

    // Đóng Modal bằng nút Hủy bỏ
    await page.getByRole('button', { name: /Hủy bỏ/i }).click();
    await expect(page.getByRole('heading', { name: /Cấu Hình Hiển Thị Tổng Quan/i })).toHaveCount(0);
  });

  test('02. Kiểm tra Màn hình Thông tin Nhân sự & Modal Văn bằng, Mạng xã hội', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/employees?tab=PROFILE');
    await page.waitForLoadState('domcontentloaded');
    await dismissReminders(page);

    // Chờ hoàn tất tải dữ liệu từ Firestore
    await expect(page.getByText(/Đang tải phân hệ/i)).toHaveCount(0, { timeout: 30000 }).catch(() => {});

    // Kiểm tra danh bạ sidebar
    await expect(page.getByRole('heading', { name: /Danh Bạ Cán Bộ/i })).toBeVisible({ timeout: 25000 });

    // Chọn cán bộ
    const empBtn = page.getByText(/Trịnh Đức Anh|Nguyễn Thị Sinh|Vũ Thị Hiền/i).first();
    await empBtn.click();
    await page.waitForTimeout(500);

    // Xác nhận các khối thông tin lý lịch 2C, văn bằng, mạng xã hội
    await expect(page.getByText(/1\. THÔNG TIN CÁ NHÂN & LIÊN HỆ/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/2\. CÔNG TÁC & THÂM NIÊN/i)).toBeVisible();
    await expect(page.getByText(/KÊNH LIÊN LẠC & MẠNG XÃ HỘI/i)).toBeVisible();

    // Kiểm tra các nút chức năng trên thanh công cụ hồ sơ
    await expect(page.getByRole('button', { name: /Xuất Word/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Xuất Excel/i }).last()).toBeVisible();
    await expect(page.getByRole('button', { name: /In trích ngang A4|In Hồ Sơ/i })).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_desktop_tab_profile.png'), fullPage: true });
    await scanForbiddenWords(page, 'Màn hình Hồ sơ cán bộ');

    // Mở Modal Thêm/Cập nhật Kênh Mạng Xã Hội
    const socialBtn = page.getByRole('button', { name: /Cập nhật \(\d+\)|Thêm kênh/i }).first();
    if (await socialBtn.isVisible().catch(() => false)) {
      await socialBtn.click();
      await page.waitForTimeout(400);
      await expect(page.getByRole('heading', { name: /Quản Lý Mạng Xã Hội/i })).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02b_modal_employee_social.png') });
      await scanForbiddenWords(page, 'Modal Mạng xã hội');
      await page.getByRole('button', { name: /Đóng|Hủy/i }).first().click();
      await page.waitForTimeout(300);
    }
  });

  test('03. Kiểm tra Màn hình Hợp đồng & Luân chuyển & Modal HĐLĐ, Phụ lục, Timeline', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/employees?tab=CONTRACTS');
    await page.waitForLoadState('domcontentloaded');
    await dismissReminders(page);

    // Xác nhận các phân khu HĐLĐ
    await expect(page.getByText(/HỢP ĐỒNG LAO ĐỘNG HIỆN HÀNH/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/CÁC PHỤ LỤC SỬA ĐỔI, BỔ SUNG/i)).toBeVisible();
    await expect(page.getByText(/QUÁ TRÌNH CÔNG TÁC & LUÂN CHUYỂN/i)).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_desktop_tab_contracts.png'), fullPage: true });
    await scanForbiddenWords(page, 'Màn hình Hợp đồng & Luân chuyển');

    // Mở Modal Điều chỉnh / Tạo HĐLĐ
    const editContractBtn = page.getByRole('button', { name: /Sửa HĐ|Điều chỉnh HĐ|\+ Tạo HĐLĐ mới/i }).first();
    if (await editContractBtn.isVisible().catch(() => false)) {
      await editContractBtn.click();
      await page.waitForTimeout(400);
      await expect(page.getByRole('heading', { name: /Chỉnh Sửa Hợp Đồng Lao Động|Thiết Lập Hợp Đồng/i })).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03b_modal_contract_form.png') });
      await scanForbiddenWords(page, 'Modal HĐLĐ');
      await page.getByRole('button', { name: /Hủy/i }).first().click();
      await page.waitForTimeout(300);
    }

    // Mở Modal Thêm Phụ Lục HĐLĐ
    const addAnnexBtn = page.getByRole('button', { name: /\+? ?Thêm phụ lục HĐ/i });
    if (await addAnnexBtn.isVisible().catch(() => false)) {
      await addAnnexBtn.click();
      await page.waitForTimeout(400);
      await expect(page.getByRole('heading', { name: /Phụ Lục.*HĐLĐ|Phụ Lục Hợp Đồng/i })).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03c_modal_contract_annex.png') });
      await scanForbiddenWords(page, 'Modal Phụ lục HĐLĐ');
      await page.getByRole('button', { name: /Hủy/i }).first().click();
      await page.waitForTimeout(300);
    }

    // Mở Modal Thêm Mốc Quá Trình Công Tác
    const addPeriodBtn = page.getByRole('button', { name: /\+? ?Thêm mốc công tác/i });
    if (await addPeriodBtn.isVisible().catch(() => false)) {
      await addPeriodBtn.click();
      await page.waitForTimeout(400);
      await expect(page.getByRole('heading', { name: /Thêm Mốc Quá Trình Công Tác Mới/i })).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03d_modal_work_history_period.png') });
      await scanForbiddenWords(page, 'Modal Timeline Quá trình công tác');
      await page.getByRole('button', { name: /Hủy bỏ/i }).first().click();
      await page.waitForTimeout(300);
    }
  });

  test('04. Kiểm tra Màn hình Đào tạo & Bồi dưỡng', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/employees?tab=TRAINING');
    await page.waitForLoadState('domcontentloaded');
    await dismissReminders(page);

    await expect(page.getByRole('heading', { name: /Hồ Sơ Đào Tạo & Chứng Chỉ Chuyên Môn/i })).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_desktop_tab_training.png'), fullPage: true });
    await scanForbiddenWords(page, 'Màn hình Đào tạo & Bồi dưỡng');
  });

  test('05. Kiểm tra Màn hình Cấu hình phân hệ', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/employees?tab=SETTINGS');
    await page.waitForLoadState('domcontentloaded');
    await dismissReminders(page);

    await expect(page.getByRole('heading', { name: /Cấu Hình & Phân Quyền Truy Cập Phân Hệ/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Phạm Vi Xem Danh Bạ Cán Bộ/i)).toBeVisible();
    await expect(page.getByText(/Chu Kỳ Luân Chuyển Địa Bàn/i)).toBeVisible();
    await expect(page.getByText(/CẤU HÌNH HIỂN THỊ DASHBOARD TỔNG QUAN/i)).toBeVisible();
    await expect(page.getByText(/Nơi Làm Việc & Địa Bàn Tín Dụng Hoạt Động/i)).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_desktop_tab_settings.png'), fullPage: true });
    await scanForbiddenWords(page, 'Màn hình Cấu hình phân hệ');
  });

  test('06. Kiểm tra Giao diện trên Thiết bị Di động (Mobile Responsive)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsAdmin(page);

    // 1. Mobile Overview
    await page.goto('/employees?tab=OVERVIEW');
    await page.waitForLoadState('domcontentloaded');
    await dismissReminders(page);
    await expect(page.getByRole('heading', { name: /Phân hệ Quản trị Nhân sự/i })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_mobile_tab_overview.png'), fullPage: true });

    // 2. Mobile Profile
    await page.goto('/employees?tab=PROFILE');
    await page.waitForLoadState('domcontentloaded');
    await dismissReminders(page);
    await expect(page.getByText(/THÔNG TIN CÁ NHÂN & LIÊN HỆ/i)).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_mobile_tab_profile.png'), fullPage: true });

    // 3. Mobile Contracts
    await page.goto('/employees?tab=CONTRACTS');
    await page.waitForLoadState('domcontentloaded');
    await dismissReminders(page);
    await expect(page.getByText(/HỢP ĐỒNG LAO ĐỘNG HIỆN HÀNH/i)).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_mobile_tab_contracts.png'), fullPage: true });

    // 4. Mobile Settings
    await page.goto('/employees?tab=SETTINGS');
    await page.waitForLoadState('domcontentloaded');
    await dismissReminders(page);
    await expect(page.getByRole('heading', { name: /Cấu Hình & Phân Quyền Truy Cập Phân Hệ/i })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_mobile_tab_settings.png'), fullPage: true });

    await scanForbiddenWords(page, 'Giao diện Mobile');
  });

  test('07. Kiểm tra Màn hình Danh Bạ Cán Bộ & Điều Hướng Master-Detail Trực Quan', async ({ page }) => {
    await loginAsAdmin(page);

    // 1. Kiểm tra màn hình Danh bạ Cán bộ trên Desktop
    await page.goto('/employees?tab=DIRECTORY');
    await page.waitForLoadState('domcontentloaded');
    await dismissReminders(page);

    await expect(page.getByRole('heading', { name: /Danh Bạ Cán Bộ Nhân Viên/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder(/Tìm theo họ tên, chức danh, phòng ban/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Tất cả \(\d+\)/i })).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_desktop_tab_directory.png'), fullPage: true });

    // 2. Chạm chọn một thẻ cán bộ bất kỳ để chuyển thẳng sang Hồ sơ chi tiết
    const firstEmpCard = page.locator('div[class*="cursor-pointer"]').filter({ hasText: /Xem hồ sơ chi tiết/i }).first();
    await expect(firstEmpCard).toBeVisible();
    await firstEmpCard.click();
    await page.waitForTimeout(500);

    // Xác nhận đã chuyển sang màn hình Hồ sơ cá nhân với 4 sub-tabs
    await expect(page.getByText(/1\. THÔNG TIN CÁ NHÂN & LIÊN HỆ/i)).toBeVisible({ timeout: 10000 });

    // 3. Kiểm tra trên Mobile: Đảm bảo Danh sách 30 người không che khuất Hồ sơ chi tiết
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/employees?tab=PROFILE');
    await page.waitForLoadState('domcontentloaded');
    await dismissReminders(page);

    // Nút "Danh bạ cán bộ" và "Đổi cán bộ" trên Mobile phải hiển thị rõ ràng
    const backBtn = page.getByRole('button', { name: /Danh bạ cán bộ/i });
    await expect(backBtn).toBeVisible({ timeout: 10000 });
    const quickSelectBtn = page.getByRole('button', { name: /Đổi cán bộ/i });
    await expect(quickSelectBtn).toBeVisible();

    // Mở Modal Đổi nhanh cán bộ trên mobile
    await quickSelectBtn.click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: /Chọn Cán Bộ Nhân Viên/i })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_mobile_modal_quick_select.png') });

    // Đóng Modal đổi cán bộ
    await page.getByRole('button', { name: /Đóng cửa sổ/i }).first().click();
    await page.waitForTimeout(300);

    // Bấm nút "Danh bạ cán bộ" để quay lại danh bạ toàn Quỹ
    await backBtn.click();
    await page.waitForTimeout(400);
    await expect(page.getByRole('heading', { name: /Danh Bạ Cán Bộ Nhân Viên/i })).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_mobile_tab_directory.png'), fullPage: true });

    await scanForbiddenWords(page, 'Màn hình Danh bạ cán bộ');
  });
});

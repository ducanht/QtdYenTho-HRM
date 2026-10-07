import { test, expect } from '@playwright/test';

test.describe('Cổng Quản Trị Nhân Sự (HRM) - Quỹ Tín Dụng Nhân Dân Yên Thọ', () => {

  test('TC01: Màn hình Đăng nhập hiển thị đúng định danh Quỹ TDND Yên Thọ', async ({ page }) => {
    await page.goto('/login');

    // 1. Kiểm tra tiêu đề và thương hiệu cơ quan
    await expect(page.getByRole('heading', { name: /QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ/i })).toBeVisible();
    await expect(page.getByText('Hội Đồng Quản Trị & Ban Điều Hành')).toBeVisible();

    // 2. Kiểm tra các trường nhập liệu
    await expect(page.getByLabel('Địa chỉ Email Cán bộ')).toBeVisible();
    await expect(page.getByLabel('Mật khẩu bảo mật')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập ngay' })).toBeVisible();

    // 3. Kiểm tra các nút truy cập nhanh cán bộ chính thức
    await expect(page.getByText('Nguyễn Thị Sinh • Thẩm định tài sản')).toBeVisible();
    await expect(page.getByText('Nguyễn Văn Sơn • Giám đốc điều hành')).toBeVisible();
    await expect(page.getByText('Trịnh Đức Anh • Chủ tịch HĐQT')).toBeVisible();
  });

  test('TC02: Đăng nhập thành công và truy cập Cổng Phân Hệ Ô Lưới (/portal)', async ({ page }) => {
    await page.goto('/login');

    // Thực hiện đăng nhập bằng tài khoản Chủ tịch HĐQT Trịnh Đức Anh
    await page.getByLabel('Địa chỉ Email Cán bộ').fill('ducanht@gmail.com');
    await page.getByLabel('Mật khẩu bảo mật').fill('123456');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

    // Kỳ vọng chuyển hướng sang Cổng Phân Hệ (/portal)
    await expect(page).toHaveURL(/.*\/portal/, { timeout: 20000 });

    // Kiểm tra lời chào cán bộ và các phân hệ trên ô lưới
    await expect(page.getByRole('heading', { name: /Xin chào/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Hệ Thống Quản Trị Nhân Sự & Đánh Giá Tín Nhiệm/i)).toBeVisible();
    await expect(page.getByText(/Đánh giá Tín nhiệm Cán bộ/i).first()).toBeVisible();
    await expect(page.getByText(/Hồ sơ Cán bộ & Luân chuyển/i).first()).toBeVisible();
    await expect(page.getByText(/Chấm điểm KPI 3 Cấp/i).first()).toBeVisible();
  });

  test('TC03: Kiểm tra Danh sách 12 Cán bộ & Modal Luân chuyển công tác (/employees)', async ({ page }) => {
    // Đăng nhập
    await page.goto('/login');
    await page.getByLabel('Địa chỉ Email Cán bộ').fill('ducanht@gmail.com');
    await page.getByLabel('Mật khẩu bảo mật').fill('123456');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await expect(page).toHaveURL(/.*\/portal/, { timeout: 20000 });

    // Điều hướng sang phân hệ Hồ Sơ Cán Bộ bằng cách click vào ô thẻ trên Cổng
    await page.getByText(/Hồ sơ Cán bộ & Luân chuyển/i).first().click();
    await expect(page).toHaveURL(/.*\/employees/, { timeout: 15000 });
    await expect(page.getByText(/Danh Bạ Cán Bộ QTDND Yên Thọ/i)).toBeVisible();

    // Kiểm tra sự xuất hiện của các cán bộ chính thức trong cơ sở dữ liệu
    await expect(page.getByRole('heading', { name: 'Nguyễn Thị Sinh' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/CB01 • Thẩm định tài sản/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trịnh Đức Anh' })).toBeVisible();
    await expect(page.getByText(/CB07 • Chủ tịch HĐQT/i)).toBeVisible();

    // Mở modal Lịch sử luân chuyển công tác của cán bộ đầu tiên
    const historyButton = page.getByRole('button', { name: /Lịch sử luân chuyển công tác/i }).first();
    await historyButton.click();

    // Kiểm tra modal lịch sử luân chuyển xuất hiện
    await expect(page.getByText(/Lịch Sử Luân Chuyển & Điều Động Công Tác/i)).toBeVisible();
    await expect(page.getByText(/Số CCCD:/i)).toBeVisible();

    // Đóng modal
    await page.getByRole('button', { name: /Đóng cửa sổ/i }).click();
    await expect(page.getByText(/Lịch Sử Luân Chuyển & Điều Động Công Tác/i)).toBeHidden();
  });

  test('TC04: Kiểm tra Form Đánh giá Tín nhiệm 10 Tiêu chí (/trust-evaluation)', async ({ page }) => {
    // Đăng nhập
    await page.goto('/login');
    await page.getByLabel('Địa chỉ Email Cán bộ').fill('ducanht@gmail.com');
    await page.getByLabel('Mật khẩu bảo mật').fill('123456');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await expect(page).toHaveURL(/.*\/portal/, { timeout: 20000 });

    // Điều hướng sang phân hệ Đánh Giá Tín Nhiệm bằng cách click vào ô thẻ trên Cổng
    await page.getByText(/Đánh giá Tín nhiệm Cán bộ/i).first().click();
    await expect(page).toHaveURL(/.*\/trust-evaluation/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Đánh Giá Tín Nhiệm Cán Bộ/i })).toBeVisible();

    // Kiểm tra hiển thị tiêu chuẩn 10 tiêu chí và quy chế của Ban Quản trị
    await expect(page.getByText(/10 Tiêu chí đánh giá tín nhiệm/i)).toBeVisible();
    await expect(page.getByText(/1\. Tinh thần trách nhiệm & Đạo đức nghề nghiệp/i)).toBeVisible();
    await expect(page.getByText(/10\. Hiệu quả hoàn thành chỉ tiêu công việc/i)).toBeVisible();

    // Kiểm tra bảng tổng kết điểm số đánh giá
    await expect(page.getByText(/Tổng điểm đánh giá tín nhiệm/i)).toBeVisible();
  });

  test('TC05: Kiểm tra giao diện trên Thiết bị Di động (Mobile Viewport)', async ({ page }) => {
    // Đặt viewport chuẩn di động 375x667 (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Kiểm tra giao diện co giãn hợp lý
    await expect(page.getByRole('heading', { name: /QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ/i })).toBeVisible();
    await expect(page.getByLabel('Địa chỉ Email Cán bộ')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập ngay' })).toBeVisible();
  });

});

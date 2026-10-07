import { test, expect } from '@playwright/test';

// Helper đăng nhập chuẩn tài khoản Quản trị viên (Chủ tịch HĐQT) với mật khẩu mặc định Qtd@2003
async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.getByLabel('Địa chỉ Email Cán bộ').fill('ducanht@gmail.com');
  await page.getByLabel('Mật khẩu bảo mật').fill('Qtd@2003');
  await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
  await expect(page).toHaveURL(/.*\/portal/, { timeout: 20000 });

  // Nếu hiển thị Modal yêu cầu đổi mật khẩu lần đầu, kiểm tra và nhấn "Nhắc tôi sau" để tiếp tục
  const remindLaterBtn = page.getByRole('button', { name: 'Nhắc tôi sau' });
  if (await remindLaterBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await remindLaterBtn.click();
  }
}

test.describe('Cổng Quản Trị Nhân Sự (HRM) - Quỹ Tín Dụng Nhân Dân Yên Thọ', () => {

  test('TC01: Màn hình Đăng nhập hiển thị đúng định danh Quỹ TDND Yên Thọ & ĐÃ BỎ ĐĂNG NHẬP NHANH', async ({ page }) => {
    await page.goto('/login');

    // 1. Kiểm tra tiêu đề và thương hiệu cơ quan
    await expect(page.getByRole('heading', { name: /QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ/i })).toBeVisible();
    await expect(page.getByText('Hội Đồng Quản Trị & Ban Điều Hành')).toBeVisible();

    // 2. Kiểm tra các trường nhập liệu đăng nhập bảo mật
    await expect(page.getByLabel('Địa chỉ Email Cán bộ')).toBeVisible();
    await expect(page.getByLabel('Mật khẩu bảo mật')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập ngay' })).toBeVisible();

    // 3. Kiểm tra tiêu đề form đăng nhập và nút đăng nhập Google
    await expect(page.getByRole('heading', { name: /Đăng nhập hệ thống/i })).toBeVisible();
    await expect(page.getByText(/Đăng nhập với tài khoản Google/i)).toBeVisible();

    // 4. KIỂM TRA BẮT BUỘC: Phần đăng nhập nhanh đã bị loại bỏ hoàn toàn
    await expect(page.getByText(/Truy cập nhanh/i)).toHaveCount(0);
    await expect(page.getByText(/Tài khoản demo/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Chủ tịch HĐQT/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Ban Điều Hành/i })).toHaveCount(0);
  });

  test('TC02: Đăng nhập với mật khẩu mặc định Qtd@2003 & Kiểm tra Modal Yêu cầu đổi mật khẩu lần đầu', async ({ page }) => {
    await page.goto('/login');

    // Thực hiện đăng nhập bằng tài khoản Chủ tịch HĐQT Trịnh Đức Anh với mật khẩu mặc định Qtd@2003
    await page.getByLabel('Địa chỉ Email Cán bộ').fill('ducanht@gmail.com');
    await page.getByLabel('Mật khẩu bảo mật').fill('Qtd@2003');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

    // Kỳ vọng chuyển hướng sang Cổng Phân Hệ (/portal)
    await expect(page).toHaveURL(/.*\/portal/, { timeout: 20000 });

    // Kiểm tra Modal bắt buộc đổi mật khẩu lần đầu xuất hiện
    const forceChangeModal = page.getByText(/Yêu Cầu Đổi Mật Khẩu Lần Đầu/i);
    await expect(forceChangeModal).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Qtd@2003')).toBeVisible();
    await expect(page.getByText(/Quy Chuẩn Bảo Mật An Toàn/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Xác nhận đổi mật khẩu/i })).toBeVisible();

    // Tạm hoãn qua nút "Nhắc tôi sau" để kiểm tra Cổng Phân Hệ
    await page.getByRole('button', { name: 'Nhắc tôi sau' }).click();
    await expect(forceChangeModal).toBeHidden();

    // Kiểm tra lời chào cán bộ và các phân hệ trên ô lưới
    await expect(page.getByRole('heading', { name: /Xin chào/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Hệ Thống Quản Trị Nhân Sự & Đánh Giá Tín Nhiệm/i)).toBeVisible();
    await expect(page.getByText(/Đánh giá Tín nhiệm Cán bộ/i).first()).toBeVisible();
    await expect(page.getByText(/Hồ sơ Cán bộ & Luân chuyển/i).first()).toBeVisible();
    await expect(page.getByText(/Chấm điểm KPI 3 Cấp/i).first()).toBeVisible();
  });

  test('TC03: Kiểm tra Danh sách 12 Cán bộ & Modal Luân chuyển công tác (/employees)', async ({ page }) => {
    // Đăng nhập an toàn qua helper
    await loginAsAdmin(page);

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
    // Đăng nhập an toàn qua helper
    await loginAsAdmin(page);

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
    // Đảm bảo không có đăng nhập nhanh trên mobile
    await expect(page.getByText(/Truy cập nhanh/i)).toHaveCount(0);
  });

});

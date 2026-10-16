import { test, expect } from '@playwright/test';

// Helper đăng nhập chuẩn tài khoản Quản trị viên (Chủ tịch HĐQT) với mật khẩu mặc định Qtd@2003
async function loginAsAdmin(page) {
  if (page.url().includes('/portal')) return;
  await page.goto('/login');
  try {
    await page.waitForURL(/.*\/portal/, { timeout: 3000 });
    const remindBtn = page.getByRole('button', { name: 'Nhắc tôi sau' });
    if (await remindBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await remindBtn.click();
    }
    return;
  } catch {
    // Chưa đăng nhập, tiếp tục điền form
  }

  const emailInput = page.getByLabel('Địa chỉ Email Cán bộ');
  await emailInput.fill('ducanht@gmail.com');
  await page.getByLabel('Mật khẩu bảo mật').fill('Qtd@2003');
  await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
  await expect(page).toHaveURL(/.*\/portal/, { timeout: 20000 });

  const remindLaterBtn = page.getByRole('button', { name: 'Nhắc tôi sau' });
  if (await remindLaterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await remindLaterBtn.click();
  }
}

test.describe('Cổng Quản Trị Nhân Sự (HRM) - Quỹ Tín Dụng Nhân Dân Yên Thọ', () => {

  test('TC01: Màn hình Đăng nhập hiển thị đúng định danh Quỹ TDND Yên Thọ & ĐÃ BỎ ĐĂNG NHẬP NHANH', async ({ page, context }) => {
    // Xóa session cookie để kiểm tra màn hình đăng nhập sạch sẽ
    await context.clearCookies();
    await page.goto('/login');
    // Nếu vẫn ở portal, click đăng xuất
    const logoutBtn = page.getByRole('button', { name: /Đăng xuất/i });
    if (await logoutBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL(/.*\/login/, { timeout: 5000 });
    }

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

  test('TC02: Đăng nhập với tài khoản Quản trị & Kiểm tra Cổng Phân Hệ (/portal)', async ({ page }) => {
    await loginAsAdmin(page);

    // Kỳ vọng ở Cổng Phân Hệ (/portal)
    await expect(page).toHaveURL(/.*\/portal/, { timeout: 20000 });

    // Kiểm tra lời chào cán bộ và các phân hệ trên ô lưới
    await expect(page.getByRole('heading', { name: /Xin chào/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Hệ Thống Quản Trị Nhân Sự & Đánh Giá Tín Nhiệm/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Đánh giá & Lấy phiếu Tín nhiệm/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Quản trị Nhân sự|Hồ sơ Cán bộ/i }).first()).toBeVisible();
  });

  test('TC03: Kiểm tra Danh sách Cán bộ, Thâm niên, Modal Luân chuyển & Đào tạo (/employees)', async ({ page }) => {
    // Đăng nhập an toàn qua helper
    await loginAsAdmin(page);

    // Điều hướng sang phân hệ Nhân sự
    await page.goto('/employees');
    await expect(page).toHaveURL(/.*\/employees/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Phân hệ Quản trị Nhân sự|Phân hệ Hồ sơ Cán bộ/i })).toBeVisible({ timeout: 15000 });

    // Kiểm tra sự xuất hiện của các cán bộ chính thức trong cơ sở dữ liệu
    await expect(page.getByText('Nguyễn Thị Sinh').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Chủ tịch Hội đồng Quản trị|Chủ tịch HĐQT/i).first()).toBeVisible();
    await expect(page.getByText('Trịnh Đức Anh').first()).toBeVisible();
    await expect(page.getByText(/Kế toán trưởng/i).first()).toBeVisible();

    // Xác nhận đã ẩn hoàn toàn mã kỹ thuật (CB01, CB07, UUID) khỏi giao diện người dùng
    await expect(page.getByText(/^CB01$/i)).toHaveCount(0);
    await expect(page.getByText(/^CB07$/i)).toHaveCount(0);

    // Kiểm tra hiển thị Thâm niên trên giao diện
    await expect(page.getByText(/Thâm niên/i).first()).toBeVisible();

    // Kiểm tra nút xuất toàn bộ danh bạ cán bộ ở Master Sidebar
    await expect(page.getByTitle(/Xuất toàn bộ danh bạ cán bộ sang Excel/i)).toBeVisible();

    // Chuyển sang Tab Thông tin nhân sự hoặc click cán bộ để kiểm tra các nút in A4, xuất Word của hồ sơ
    const profileTab = page.getByRole('button', { name: /Thông tin nhân sự|Hồ sơ trích ngang|Hồ sơ/i }).first();
    if (await profileTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileTab.click();
    } else {
      await page.getByText('Nguyễn Thị Sinh').first().click();
    }

    await expect(page.getByRole('button', { name: /In trích ngang A4/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Xuất Word/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Xuất Excel/i }).first()).toBeVisible();

    // Chuyển tab Hợp đồng & Luân chuyển công tác
    const transferTab = page.getByRole('button', { name: /Hợp đồng & Luân chuyển|Luân chuyển công tác|Luân chuyển/i }).first();
    if (await transferTab.isVisible({ timeout: 4000 }).catch(() => false)) {
      await transferTab.click();
      await expect(page.getByText(/Quá Trình Công Tác & Luân Chuyển Vị Trí|Theo dõi chu kỳ địa bàn tín dụng/i).first()).toBeVisible({ timeout: 10000 });
    }

    // Chuyển tab Đào tạo & Chứng chỉ
    const trainingTab = page.getByRole('button', { name: /Đào tạo & Chứng chỉ|Đào tạo/i }).first();
    if (await trainingTab.isVisible({ timeout: 4000 }).catch(() => false)) {
      await trainingTab.click();
      await expect(page.getByText(/Hồ Sơ Đào Tạo & Chứng Chỉ Chuyên Môn|Danh Mục Văn Bằng/i).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('TC04: Kiểm tra Phân hệ Đánh giá Tín nhiệm 10 Tiêu chí (/trust)', async ({ page }) => {
    // Đăng nhập an toàn qua helper
    await loginAsAdmin(page);

    // Điều hướng trực tiếp sang phân hệ Đánh Giá Tín Nhiệm
    await page.goto('/trust');
    await expect(page).toHaveURL(/.*\/trust/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Phân hệ Đánh giá Tín nhiệm Cán bộ/i })).toBeVisible({ timeout: 15000 });

    // Kiểm tra hiển thị tiêu chuẩn 10 tiêu chí và danh sách đợt
    await expect(page.getByText(/10 TIÊU CHÍ CHUẨN NHNN/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Đợt Đánh Giá' })).toBeVisible();
  });

  test('TC05: Kiểm tra giao diện trên Thiết bị Di động (Mobile Viewport)', async ({ page, context }) => {
    // Xóa session cookie để kiểm tra giao diện màn hình login trên mobile
    await context.clearCookies();
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    const logoutBtn = page.getByRole('button', { name: /Đăng xuất/i });
    if (await logoutBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL(/.*\/login/, { timeout: 5000 });
    }

    // Kiểm tra giao diện co giãn hợp lý
    await expect(page.getByRole('heading', { name: /QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel('Địa chỉ Email Cán bộ')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập ngay' })).toBeVisible();
    // Đảm bảo không có đăng nhập nhanh trên mobile
    await expect(page.getByText(/Truy cập nhanh/i)).toHaveCount(0);
  });

});

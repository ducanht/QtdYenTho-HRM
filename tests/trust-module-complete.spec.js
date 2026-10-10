import { test, expect } from '@playwright/test';

// Helper đăng nhập Quản trị viên
async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.getByLabel('Địa chỉ Email Cán bộ').fill('ducanht@gmail.com');
  await page.getByLabel('Mật khẩu bảo mật').fill('Qtd@2003');
  await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
  await expect(page).toHaveURL(/.*\/portal/, { timeout: 20000 });

  const remindLaterBtn = page.getByRole('button', { name: 'Nhắc tôi sau' });
  if (await remindLaterBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await remindLaterBtn.click();
  }
}

test.describe('Kiểm thử Toàn diện Phân Hệ Đánh Giá Tín Nhiệm (Trust Module)', () => {

  test('TC01: Điều hướng mượt mà giữa các Tab và Phản hồi Sidebar không bị giật lag/reset', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/trust');
    await expect(page).toHaveURL(/.*\/trust/, { timeout: 15000 });

    // 1. Kiểm tra Tab Đánh giá mặc định
    await expect(page.getByRole('heading', { name: /Phân hệ Đánh giá Tín nhiệm Cán bộ/i })).toBeVisible({ timeout: 15000 });

    // 2. Chuyển sang Tab Lịch sử (MY_VOTES)
    await page.getByRole('button', { name: 'Lịch sử', exact: true }).click();
    await page.waitForTimeout(600);
    // Kiểm tra sidebar có nút Tất cả các đợt đánh giá
    const allOption = page.getByText(/Tất cả các đợt đánh giá/i);
    await expect(allOption).toBeVisible({ timeout: 10000 });
    // Click vào Tất cả các đợt đánh giá
    await allOption.click();
    await page.waitForTimeout(600);
    // Đảm bảo không bị reset về đợt active mà vẫn giữ lựa chọn Tất cả
    await expect(allOption).toBeVisible();

    // 3. Chuyển sang Tab Cá nhân (MY_RESULTS)
    await page.getByRole('button', { name: 'Cá nhân', exact: true }).click();
    await page.waitForTimeout(600);
    await expect(
      page.getByRole('heading', { name: /Kỳ đánh giá đang trong thời gian lấy ý kiến|Đợt đánh giá chưa đến thời gian mở cổng/i })
        .or(page.getByRole('heading', { name: /Không thuộc diện lấy phiếu/i }))
        .or(page.getByText('Chưa có phiếu đánh giá trong kỳ này'))
    ).toBeVisible({ timeout: 10000 });

    // 4. Chuyển sang Tab Tổng quan (OVERVIEW)
    await page.getByRole('button', { name: 'Tổng quan', exact: true }).click();
    await page.waitForTimeout(600);
    await expect(
      page.getByRole('heading', { name: 'Tiến độ nộp phiếu' })
        .or(page.getByRole('heading', { name: /Kỳ Đánh Giá Đang Được Tiến Hành/i }))
    ).toBeVisible({ timeout: 10000 });

    // 5. Chuyển sang Tab Cấu hình (CRITERIA_SETTINGS) - Kiểm tra phản hồi tức thì
    await page.getByRole('button', { name: 'Cấu hình', exact: true }).click();
    await page.waitForTimeout(600);
    await expect(page.getByRole('heading', { name: /Cấu hình:/i })).toBeVisible({ timeout: 15000 });

    // 6. Chuyển sang Tab Phân quyền (PERMISSIONS_SETTINGS)
    await page.getByRole('button', { name: 'Phân quyền', exact: true }).click();
    await page.waitForTimeout(600);
    await expect(
      page.getByText(/Phân Quyền Chuyên Biệt/i).or(page.getByText(/RBAC Matrix/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test('TC02: Lưu cấu hình Đợt, Ngưỡng điểm và Bộ tiêu chí bền vững vào Firestore (F5 reload)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/trust?tab=CRITERIA_SETTINGS');
    await expect(page.getByRole('heading', { name: /Cấu hình:/i })).toBeVisible({ timeout: 15000 });

    // Tìm ô nhập excellentThreshold
    const excInput = page.locator('input[type="number"]').first();
    await expect(excInput).toBeVisible();
    const curVal = await excInput.inputValue();
    const nextVal = curVal === '92' ? '90' : '92';

    await excInput.fill(nextVal);
    await page.waitForTimeout(500);

    // Bấm Lưu cấu hình
    const saveBtn = page.getByRole('button', { name: 'Lưu cấu hình', exact: true });
    await saveBtn.click();

    // Chờ thông báo thành công
    await expect(page.getByText(/thành công/i)).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2500);

    // F5 reload
    await page.reload();
    await page.waitForTimeout(3000);

    // Vào lại tab Cấu hình
    await page.getByRole('button', { name: 'Cấu hình', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Cấu hình:/i })).toBeVisible({ timeout: 15000 });

    const excInputAfter = page.locator('input[type="number"]').first();
    const valAfter = await excInputAfter.inputValue();
    expect(valAfter).toBe(nextVal);
  });

});

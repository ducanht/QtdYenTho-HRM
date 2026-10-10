import { test, expect } from '@playwright/test';
import { generateUUID, generatePeriodId } from '../src/lib/evaluationUtils';

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

test.describe('Kiểm thử Đồng Bộ Master-Detail và Chuẩn Hóa UUID', () => {

  test('Unit Test: Kiểm tra hàm generateUUID và generatePeriodId tuân thủ chuẩn RFC 4122 v4', async () => {
    // 1. Kiểm tra định dạng UUID v4: 8-4-4-4-12 hex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();

    expect(uuid1).toMatch(uuidRegex);
    expect(uuid2).toMatch(uuidRegex);
    expect(uuid1).not.toBe(uuid2); // Không bao giờ trùng lặp

    // 2. Kiểm tra generatePeriodId
    const periodId = generatePeriodId(2026, 4);
    expect(periodId).toMatch(/^PERIOD-2026-Q4-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  test('E2E Test: Cột Phải thay đổi tức thì khi chọn đợt ở Cột Trái trong Tab Đánh Giá', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/trust?tab=SCORING');
    await expect(page).toHaveURL(/.*\/trust/, { timeout: 15000 });

    // Đợi danh sách đợt xuất hiện ở Cột Trái
    const periodCards = page.locator('div[role="button"]:has(h4)');
    await expect(periodCards.first()).toBeVisible({ timeout: 15000 });
    const count = await periodCards.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Lấy tên đợt của thẻ 0 và thẻ 1 ở Cột Trái
    const name0 = (await periodCards.nth(0).locator('h4').innerText()).trim();
    const name1 = (await periodCards.nth(1).locator('h4').innerText()).trim();

    // 1. Click vào thẻ 0 (Đợt Quý 4 - Sắp diễn ra)
    await periodCards.nth(0).click();
    await page.waitForTimeout(500);

    // Xác minh Cột Phải hiển thị ngay lập tức tên đợt thẻ 0
    const rightHeader = page.locator('h2:has-text("' + name0 + '")');
    await expect(rightHeader).toBeVisible({ timeout: 5000 });

    // Xác minh Cột Phải hiển thị badge trạng thái hoặc cảnh báo sắp diễn ra
    const upcomingBadgeOrNotice = page.getByText(/SẮP DIỄN RA|Chờ mở cổng/i);
    await expect(upcomingBadgeOrNotice.first()).toBeVisible({ timeout: 5000 });

    // 2. Click sang thẻ 1 (Đợt Quý 3 - Đang mở)
    await periodCards.nth(1).click();
    await page.waitForTimeout(500);

    // Xác minh Cột Phải đổi ngay lập tức sang tên đợt thẻ 1
    const rightHeader1 = page.locator('h2:has-text("' + name1 + '")');
    await expect(rightHeader1).toBeVisible({ timeout: 5000 });
  });

  test('E2E Test: Cột Phải đồng bộ tên đợt đang xem ở Tab Lịch Sử và Tab Tổng Quan', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/trust?tab=MY_VOTES');
    await page.waitForTimeout(1000);

    // 1. Kiểm tra Tab Lịch sử: Click vào đợt cụ thể và xem Header cột phải
    const periodCards = page.locator('div[role="button"]:has(h4)');
    await expect(periodCards.first()).toBeVisible({ timeout: 15000 });

    // Chọn thẻ thứ 2 (bỏ qua 'Tất cả các đợt')
    const targetCard = periodCards.nth(1);
    const cardTitle = (await targetCard.locator('h4').innerText()).trim();
    await targetCard.click();
    await page.waitForTimeout(500);

    // Xác minh Header Cột phải Tab Lịch sử hiển thị tên đợt đó
    await expect(page.getByText(cardTitle).nth(1)).toBeVisible({ timeout: 5000 });

    // 2. Chuyển sang Tab Tổng quan
    await page.getByRole('button', { name: 'Tổng quan', exact: true }).click();
    await page.waitForTimeout(600);

    // Xác minh Header Cột phải Tab Tổng quan hiển thị tên đợt
    const overviewTitle = page.locator('h2:has-text("' + cardTitle + '")');
    await expect(overviewTitle).toBeVisible({ timeout: 10000 });
  });

});

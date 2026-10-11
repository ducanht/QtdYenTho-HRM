import { test, expect } from '@playwright/test';

async function loginAsAdmin(page) {
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

test.describe('Quy trình Kiểm thử Đánh giá Tín nhiệm Tự động A-Z (Live Firestore & Clean Cleanup)', () => {
  const TEST_PERIOD_ID = `PERIOD-TEST-LIFECYCLE-${Date.now()}`;
  const TEST_PERIOD_NAME = `ĐỢT KIỂM THỬ TỰ ĐỘNG PLAYWRIGHT ${Date.now()}`;

  test('Quy trình Đánh giá Tín nhiệm: Tạo đợt -> Chấm điểm -> Nộp phiếu -> Xác minh -> Xóa sạch CSDL', async ({ page }) => {
    // 1. Đăng nhập với quyền Quản trị
    await loginAsAdmin(page);

    // 2. Chuyển vào phân hệ Đánh giá Tín nhiệm
    await page.goto('/trust');
    await expect(page).toHaveURL(/.*\/trust/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Phân hệ Đánh giá Tín nhiệm Cán bộ/i })).toBeVisible({ timeout: 15000 });

    // 3. Khởi tạo Đợt kiểm thử trực tiếp trên Live Cloud Firestore qua page context
    const createSuccess = await page.evaluate(async ({ periodId, periodName }) => {
      try {
        const { saveEvaluationPeriod, savePeriodConfig } = await import('/src/lib/services.js');
        const stored = JSON.parse(localStorage.getItem('qtd_hrm_current_user') || '{}');
        const userUid = stored.uid || 'emp-007';
        const userId = stored.id || 'emp-007';

        const periodPayload = {
          id: periodId,
          name: periodName,
          year: 2026,
          quarter: 4,
          status: 'ACTIVE',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
          votingMode: 'ANONYMOUS',
          allowSelfEvaluation: false,
          voterEmployeeIds: Array.from(new Set(['emp-007', userUid, userId])),
          targetEmployeeIds: ['emp-001', 'emp-002'], // Nguyễn Thị Sinh, Nguyễn Thị Mến
        };

        await saveEvaluationPeriod(periodPayload);
        await savePeriodConfig(periodId, {
          ...periodPayload,
          excellentThreshold: 90,
          goodThreshold: 70,
          passThreshold: 50,
        });

        return true;
      } catch (err) {
        console.error('Lỗi khởi tạo đợt test trên Firestore:', err);
        return false;
      }
    }, { periodId: TEST_PERIOD_ID, periodName: TEST_PERIOD_NAME });

    expect(createSuccess).toBe(true);

    try {
      // 4. Mở đợt kiểm thử trên giao diện chấm điểm
      await page.goto(`/trust?periodId=${TEST_PERIOD_ID}&tab=SCORING`);
      await page.waitForTimeout(1500);

      // Xác nhận đợt kiểm thử hiển thị trên giao diện
      await expect(page.getByText(TEST_PERIOD_NAME).first()).toBeVisible({ timeout: 15000 });

      // 5. Tiến hành chấm điểm cho cán bộ đối tượng qua dịch vụ Firestore
      const submitVoteSuccess = await page.evaluate(async ({ periodId }) => {
        try {
          const { saveTrustEvaluation } = await import('/src/lib/services.js');
          const stored = JSON.parse(localStorage.getItem('qtd_hrm_current_user') || '{}');
          
          // Tạo phiếu chấm điểm 10/10 cho cả 10 tiêu chí (100đ)
          const scores = {};
          for (let i = 1; i <= 10; i++) {
            scores[i] = 10;
          }

          const res = await saveTrustEvaluation({
            periodId,
            evaluatorId: stored.uid || stored.id || 'emp-007',
            evaluatorName: stored.name || 'Trịnh Đức Anh',
            evaluatorEmail: stored.email || 'ducanht@gmail.com',
            evaluatorPosition: stored.position || 'Chủ tịch HĐQT',
            targetEmployeeId: 'emp-001',
            targetEmployeeName: 'Nguyễn Thị Sinh',
            targetEmployeePosition: 'Phó Giám đốc',
            scores,
            notes: 'Phiếu kiểm thử tự động Playwright',
            isAnonymous: false,
            isDraft: false,
          });

          return res?.success === true;
        } catch (err) {
          console.error('Lỗi lưu phiếu test trên Firestore:', err);
          return false;
        }
      }, { periodId: TEST_PERIOD_ID });

      expect(submitVoteSuccess).toBe(true);

      // 6. Kiểm tra Tab Lịch sử (MY_VOTES)
      await page.getByRole('button', { name: 'Lịch sử', exact: true }).click();
      await page.waitForTimeout(1500);

      // Chọn đợt kiểm thử nếu chưa được chọn
      const periodButton = page.getByRole('button', { name: new RegExp(TEST_PERIOD_NAME, 'i') }).first();
      if (await periodButton.isVisible().catch(() => false)) {
        await periodButton.click();
        await page.waitForTimeout(800);
      }

      // Xác nhận xuất hiện cán bộ Nguyễn Thị Sinh trong danh sách phiếu đã gửi
      await expect(page.getByText('Nguyễn Thị Sinh').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Phiếu kiểm thử tự động Playwright').first()).toBeVisible({ timeout: 15000 });

      // 7. Kiểm tra Tab Tổng quan (OVERVIEW)
      await page.getByRole('button', { name: 'Tổng quan', exact: true }).click();
      await page.waitForTimeout(1000);

      // Xác nhận có thông tin tiến độ
      await expect(
        page.getByRole('heading', { name: 'Tiến độ nộp phiếu' })
          .or(page.getByText(/Tỷ Lệ Bầu Cử/i))
          .or(page.getByText(/Kỳ Đánh Giá Đang Được Tiến Hành/i))
      ).toBeVisible({ timeout: 10000 });

    } finally {
      // 8. DỌN DẸP SẠCH SẼ 100% CSDL FIRESTORE (TEARDOWN)
      const cleanupResult = await page.evaluate(async ({ periodId }) => {
        try {
          const { deleteTrustEvaluationsByPeriod, deleteEvaluationPeriod } = await import('/src/lib/services.js');
          
          // Xóa các phiếu đánh giá của đợt test
          const evalRes = await deleteTrustEvaluationsByPeriod(periodId);
          
          // Xóa đợt đánh giá và cấu hình của đợt test
          const periodRes = await deleteEvaluationPeriod(periodId);

          return { success: true, deletedEvaluations: evalRes?.count || 0 };
        } catch (err) {
          console.error('Lỗi khi dọn dẹp dữ liệu kiểm thử:', err);
          return { success: false, error: err.message };
        }
      }, { periodId: TEST_PERIOD_ID });

      expect(cleanupResult.success).toBe(true);
    }
  });
});

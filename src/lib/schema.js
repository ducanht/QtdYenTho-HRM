// Bộ quy tắc xác thực & Kiểm tra ràng buộc cơ sở dữ liệu (Schema Validation)
// Quỹ Tín Dụng Nhân Dân Yên Thọ - HRM

import { TRUST_CRITERIA_DEFAULT as TRUST_CRITERIA } from './constants';

/**
 * Phân loại kết quả đánh giá tín nhiệm dựa trên tổng điểm (0 - 100)
 * >= 90: Xuất sắc
 * >= 70: Tốt
 * >= 50: Hoàn thành
 * < 50: Không hoàn thành
 */
export const classifyTrustScore = (totalScore) => {
  const score = Number(totalScore) || 0;
  if (score >= 90) return { label: 'Xuất sắc', code: 'XUAT_SAC', variant: 'xuat-sac' };
  if (score >= 70) return { label: 'Tốt', code: 'TOT', variant: 'tot' };
  if (score >= 50) return { label: 'Hoàn thành', code: 'HOAN_THANH', variant: 'hoan-thanh' };
  return { label: 'Không hoàn thành', code: 'KHONG_HOAN_THANH', variant: 'khong-hoan-thanh' };
};

/**
 * Kiểm tra tính hợp lệ của phiếu đánh giá tín nhiệm (Module A)
 */
export const validateTrustEvaluation = (data) => {
  const errors = [];

  if (!data.evaluatorId) errors.push('Thiếu mã người thực hiện đánh giá (evaluatorId).');
  if (!data.targetEmployeeId) errors.push('Vui lòng chọn cán bộ được đánh giá (targetEmployeeId).');
  if (data.evaluatorId && data.targetEmployeeId && data.evaluatorId === data.targetEmployeeId) {
    errors.push('Quy định nội bộ: Không được tự chấm điểm tín nhiệm cho chính mình.');
  }

  // Kiểm tra 10 tiêu chí
  if (!data.scores || typeof data.scores !== 'object') {
    errors.push('Thiếu bảng điểm 10 tiêu chí.');
  } else {
    TRUST_CRITERIA.forEach((crit) => {
      const val = data.scores[crit.id];
      if (val === undefined || val === null) {
        errors.push(`Chưa chấm điểm tiêu chí: ${crit.title}`);
      } else {
        const num = Number(val);
        if (isNaN(num) || num < 0 || num > 10) {
          errors.push(`Điểm tiêu chí ${crit.title} phải nằm trong khoảng từ 0 đến 10.`);
        }
      }
    });
  }

  // Tính lại và kiểm tra totalScore
  const calculatedTotal = Object.values(data.scores || {}).reduce(
    (sum, score) => sum + (Number(score) || 0),
    0
  );

  if (calculatedTotal < 0 || calculatedTotal > 100) {
    errors.push('Tổng điểm đánh giá phải từ 0 đến 100 điểm.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    calculatedTotal,
    classification: classifyTrustScore(calculatedTotal),
  };
};

/**
 * Kiểm tra tính hợp lệ của thông tin CBNV (Users/Employees)
 */
export const validateEmployeeProfile = (emp) => {
  const errors = [];
  if (!emp.name?.trim()) errors.push('Họ tên cán bộ không được để trống.');
  if (!emp.code?.trim()) errors.push('Mã cán bộ (code) không được để trống.');
  if (!emp.email?.trim() || !emp.email.includes('@')) errors.push('Email không hợp lệ.');
  if (!emp.department?.trim()) errors.push('Phòng ban không được để trống.');
  if (!emp.position?.trim()) errors.push('Chức danh công tác không được để trống.');

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Bộ quy tắc xác thực & Kiểm tra ràng buộc cơ sở dữ liệu (Schema Validation)
// Quỹ Tín Dụng Nhân Dân Yên Thọ - HRM

import { TRUST_CRITERIA_DEFAULT as TRUST_CRITERIA } from './constants';

/**
 * Phân loại kết quả đánh giá tín nhiệm theo quy chế mới Quỹ:
 * 1. Hoàn thành xuất sắc nhiệm vụ: Điểm trung bình 90 - 100đ. Điều kiện bắt buộc: Không có tiêu chí nào dưới 7đ.
 * 2. Hoàn thành tốt nhiệm vụ: Điểm trung bình 70 - <90đ (hoặc >=90đ nhưng bị khống chế). Điều kiện bắt buộc: Không có tiêu chí nào dưới 5đ.
 * 3. Hoàn thành nhiệm vụ: Điểm trung bình 50 - <70đ (hoặc >=70đ nhưng bị khống chế).
 * 4. Không hoàn thành nhiệm vụ: Điểm trung bình < 50đ HOẶC có trên 50% số phiếu đánh giá xếp ở mức Yếu (0-5đ / <= 50đ).
 *
 * @param {number} totalScore Điểm trung bình tổng (thang 100)
 * @param {object} options Các tùy chọn nâng cao (critAverages, votes, thresholds)
 */
export const classifyTrustScore = (totalScore, options = {}) => {
  const score = Number(totalScore) || 0;

  // Hỗ trợ cả trường hợp truyền thresholds trực tiếp hoặc qua options.thresholds
  const thresholds = options.thresholds || options || {};
  const excThreshold = Number(thresholds.excellentThreshold ?? thresholds.excellent) || 90;
  const excMinCrit = Number(thresholds.excellentMinCrit ?? thresholds.excellentMinCritScore) || 7.0;

  const goodThreshold = Number(thresholds.goodThreshold ?? thresholds.good) || 70;
  const goodMinCrit = Number(thresholds.goodMinCrit ?? thresholds.goodMinCritScore) || 5.0;

  const passThreshold = Number(thresholds.passThreshold ?? thresholds.pass) || 50;
  const maxWeakPercent = Number(thresholds.weakVotesThresholdPercent ?? thresholds.maxWeakVotesPercent) || 50;
  const weakVoteMaxScore = Number(thresholds.weakVoteMaxScore ?? thresholds.weakScoreThreshold) || 50;

  // 0. Trường hợp chưa có phiếu đánh giá trong kỳ (Chưa bỏ phiếu xong) -> Trả về "Chưa hoàn thành"
  const votesList = Array.isArray(options.votes) ? options.votes : [];
  if (
    options.evaluationsCount === 0 ||
    options.votesCount === 0 ||
    options.hasNoVotes === true ||
    (options.votes !== undefined && Array.isArray(options.votes) && options.votes.length === 0)
  ) {
    return {
      label: 'Chưa hoàn thành',
      shortLabel: 'Chưa hoàn thành',
      code: 'CHUA_HOAN_THANH',
      variant: 'chua-hoan-thanh',
      color: 'slate',
      reason: 'Chưa có phiếu đánh giá trong kỳ',
    };
  }

  // 1. Kiểm tra điều kiện: Có trên 50% số phiếu đánh giá xếp ở mức Yếu (0-5 điểm / <= 50 điểm)
  let isOver50PercentWeak = false;
  let weakVotesCount = 0;
  if (votesList.length > 0) {
    weakVotesCount = votesList.filter((v) => {
      const vScore = Number(v.totalScore ?? v.score ?? 0);
      return vScore <= weakVoteMaxScore;
    }).length;
    const weakPercent = (weakVotesCount / votesList.length) * 100;
    if (weakPercent > maxWeakPercent) {
      isOver50PercentWeak = true;
    }
  }

  // 2. Mức 4: Không hoàn thành nhiệm vụ (Điểm < 50 hoặc > 50% số phiếu Yếu)
  if (score < passThreshold || isOver50PercentWeak) {
    return {
      label: 'Không hoàn thành nhiệm vụ',
      shortLabel: 'Không hoàn thành',
      code: 'KHONG_HOAN_THANH',
      variant: 'khong-hoan-thanh',
      isOverWeakThreshold: isOver50PercentWeak,
      reason: isOver50PercentWeak
        ? `Có trên ${maxWeakPercent}% số phiếu đánh giá xếp ở mức Yếu (${weakVotesCount}/${votesList.length} phiếu)`
        : 'Điểm trung bình dưới 50 điểm',
    };
  }

  // Lấy danh sách điểm trung bình từng tiêu chí (thang 10 điểm) để kiểm tra điều kiện khống chế
  let critValues = [];
  if (Array.isArray(options.critAverages)) {
    critValues = options.critAverages.map((v) => Number(v) || 0);
  } else if (options.critAverages && typeof options.critAverages === 'object') {
    critValues = Object.values(options.critAverages).map((v) => Number(v) || 0);
  }

  const hasCritUnder7 = critValues.length > 0 && critValues.some((v) => v < excMinCrit);
  const hasCritUnder5 = critValues.length > 0 && critValues.some((v) => v < goodMinCrit);

  // 3. Mức 1: Hoàn thành xuất sắc nhiệm vụ (90 - 100đ, không có tiêu chí nào dưới 7đ)
  if (score >= excThreshold && !hasCritUnder7) {
    return {
      label: 'Hoàn thành xuất sắc nhiệm vụ',
      shortLabel: 'Xuất sắc',
      code: 'XUAT_SAC',
      variant: 'xuat-sac',
    };
  }

  // 4. Mức 2: Hoàn thành tốt nhiệm vụ (70 - <90đ, hoặc >=90đ bị khống chế tiêu chí < 7đ; không tiêu chí nào dưới 5đ)
  if (score >= goodThreshold && !hasCritUnder5) {
    const isDowngraded = score >= excThreshold && hasCritUnder7;
    return {
      label: 'Hoàn thành tốt nhiệm vụ',
      shortLabel: 'Tốt',
      code: 'TOT',
      variant: 'tot',
      isDowngraded,
      downgradedFrom: isDowngraded ? 'Hoàn thành xuất sắc nhiệm vụ' : null,
      downgradeReason: isDowngraded ? `Có tiêu chí bị chấm dưới ${excMinCrit} điểm` : null,
    };
  }

  // 5. Mức 3: Hoàn thành nhiệm vụ (50 - <70đ, hoặc >=70đ nhưng bị khống chế tiêu chí < 5đ)
  const isDowngradedToPass = score >= goodThreshold && hasCritUnder5;
  return {
    label: 'Hoàn thành nhiệm vụ',
    shortLabel: 'Hoàn thành',
    code: 'HOAN_THANH',
    variant: 'hoan-thanh',
    isDowngraded: isDowngradedToPass,
    downgradedFrom: isDowngradedToPass ? 'Hoàn thành tốt nhiệm vụ' : null,
    downgradeReason: isDowngradedToPass ? `Có tiêu chí bị chấm dưới ${goodMinCrit} điểm` : null,
  };
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

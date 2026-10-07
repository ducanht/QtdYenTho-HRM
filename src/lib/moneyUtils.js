/**
 * Tiện ích Quản lý và Định dạng Tiền tệ / Số liệu Dùng Chung (moneyUtils)
 * Dành cho toàn bộ WebApp Quản trị Nhân sự & Tiền lương QTDND Yên Thọ
 * Áp dụng cho Module Tiền Lương, KPI Thưởng, Phụ cấp, Quỹ Công đoàn...
 */

/**
 * Định dạng số tiền sang chuẩn Việt Nam Đồng (VNĐ)
 * Ví dụ: 15000000 -> "15.000.000 ₫" hoặc "15.000.000 VNĐ"
 * @param {number|string} amount Số tiền cần định dạng
 * @param {string} suffix Hậu tố ('₫' hoặc 'VNĐ' hoặc rỗng)
 * @returns {string}
 */
export const formatMoneyVN = (amount, suffix = '₫') => {
  if (amount === undefined || amount === null || amount === '') return '0 ' + suffix;
  const num = Number(amount);
  if (isNaN(num)) return '0 ' + suffix;

  const formatted = num.toLocaleString('vi-VN');
  return suffix ? `${formatted} ${suffix}` : formatted;
};

/**
 * Định dạng phần trăm (Ví dụ: 95.5 -> "95,5%")
 * @param {number|string} percent
 * @param {number} decimals Số chữ số thập phân
 * @returns {string}
 */
export const formatPercentVN = (percent, decimals = 1) => {
  if (percent === undefined || percent === null || percent === '') return '0%';
  const num = Number(percent);
  if (isNaN(num)) return '0%';

  return `${num.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })}%`;
};

/**
 * Chuyển đổi số tiền thành chữ tiếng Việt chuẩn ngân quỹ / kế toán
 * Ví dụ: 15.000.000 -> "Mười lăm triệu đồng chẵn"
 * @param {number|string} amount
 * @returns {string}
 */
export const readMoneyToWordsVN = (amount) => {
  const num = Math.round(Number(amount));
  if (isNaN(num) || num === 0) return 'Không đồng';
  if (num < 0) return 'Âm ' + readMoneyToWordsVN(Math.abs(num));

  const words = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  const readThreeDigits = (n, hasHigherUnit) => {
    let res = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (h > 0 || hasHigherUnit) {
      res += words[h] + ' trăm ';
    }

    if (t > 1) {
      res += words[t] + ' mươi ';
      if (u === 1) res += 'mốt ';
      else if (u === 5) res += 'lăm ';
      else if (u > 0) res += words[u] + ' ';
    } else if (t === 1) {
      res += 'mười ';
      if (u === 5) res += 'lăm ';
      else if (u > 0) res += words[u] + ' ';
    } else {
      // t === 0
      if (u > 0) {
        if (h > 0 || hasHigherUnit) res += 'lẻ ';
        res += words[u] + ' ';
      }
    }
    return res.trim();
  };

  let strNum = num.toString();
  const groups = [];
  while (strNum.length > 0) {
    groups.unshift(strNum.slice(Math.max(0, strNum.length - 3)));
    strNum = strNum.slice(0, Math.max(0, strNum.length - 3));
  }

  let result = '';
  for (let i = 0; i < groups.length; i++) {
    const groupVal = parseInt(groups[i], 10);
    if (groupVal > 0) {
      const unitIndex = groups.length - 1 - i;
      const groupText = readThreeDigits(groupVal, i > 0);
      result += groupText + ' ' + units[unitIndex] + ' ';
    }
  }

  result = result.trim() + ' đồng';
  // Viết hoa chữ cái đầu tiên
  return result.charAt(0).toUpperCase() + result.slice(1);
};

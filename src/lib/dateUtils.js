// Tiện ích Định dạng Thời gian & Ngày tháng Chuẩn Việt Nam GMT+7 (Asia/Ho_Chi_Minh)
// Áp dụng chuẩn hành chính ngân hàng: dd/mm/yyyy và HH:mm dd/mm/yyyy

/**
 * Chuyển đổi mọi định dạng đầu vào (Firestore Timestamp, ISO String, YYYY-MM-DD, epoch, Date)
 * thành Date Object theo đúng mốc thời gian.
 */
export const parseToDate = (input) => {
  if (!input) return null;

  // Nếu là Firestore Timestamp có method toDate()
  if (typeof input === 'object' && typeof input.toDate === 'function') {
    return input.toDate();
  }

  // Nếu là Firestore Timestamp dạng raw { seconds, nanoseconds }
  if (typeof input === 'object' && typeof input.seconds === 'number') {
    return new Date(input.seconds * 1000);
  }

  // Nếu là Date Object
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  // Nếu là string dạng YYYY-MM-DD
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  // Nếu là number timestamp
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

/**
 * Định dạng ngày theo chuẩn Việt Nam: dd/mm/yyyy (GMT+7)
 * Ví dụ: 15/09/2026
 * @param {any} input 
 * @param {string} fallback 
 * @returns {string}
 */
export const formatDateVN = (input, fallback = '—') => {
  const d = parseToDate(input);
  if (!d) return fallback;

  // Định dạng theo múi giờ Việt Nam (GMT+7)
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return formatter.format(d);
};

/**
 * Định dạng ngày giờ theo chuẩn Việt Nam: HH:mm dd/mm/yyyy (GMT+7)
 * Ví dụ: 14:30 15/09/2026
 * @param {any} input 
 * @param {string} fallback 
 * @returns {string}
 */
export const formatDateTimeVN = (input, fallback = '—') => {
  const d = parseToDate(input);
  if (!d) return fallback;

  const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `${timeFormatter.format(d)} ${dateFormatter.format(d)}`;
};

/**
 * Định dạng khoảng thời gian từ ngày đến ngày: dd/mm/yyyy - dd/mm/yyyy
 * Ví dụ: 15/09/2026 - 15/10/2026
 */
export const formatDateRangeVN = (startDate, endDate, fallback = '—') => {
  const startStr = formatDateVN(startDate, '');
  const endStr = formatDateVN(endDate, '');

  if (startStr && endStr) return `${startStr} - ${endStr}`;
  if (startStr) return `Từ ${startStr}`;
  if (endStr) return `Đến ${endStr}`;
  return fallback;
};

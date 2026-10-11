// ============================================================================
// TIỆN ÍCH DÙNG CHUNG: ĐÁNH GIÁ TÍN NHIỆM, KPI & PHÂN HẠNG CÁN BỘ
// Quỹ Tín Dụng Nhân Dân Yên Thọ (Thanh Hóa)
// ============================================================================

/**
 * Xếp loại kết quả đánh giá tín nhiệm theo quy chế 4 mức mới:
 * 1. Hoàn thành xuất sắc nhiệm vụ (>= 90đ)
 * 2. Hoàn thành tốt nhiệm vụ (70 - <90đ)
 * 3. Hoàn thành nhiệm vụ (50 - <70đ)
 * 4. Không hoàn thành nhiệm vụ (< 50đ)
 */
export const getTrustClassification = (totalScore) => {
  const score = Number(totalScore) || 0;
  if (score >= 90) return 'Hoàn thành xuất sắc nhiệm vụ';
  if (score >= 70) return 'Hoàn thành tốt nhiệm vụ';
  if (score >= 50) return 'Hoàn thành nhiệm vụ';
  return 'Không hoàn thành nhiệm vụ';
};

/**
 * Trả về cấu hình hiển thị Badge (màu sắc, biến thể) theo kết quả xếp loại
 * Hỗ trợ linh hoạt cả tên đầy đủ mới và tên rút gọn cũ
 */
export const getClassificationBadgeVariant = (classification) => {
  const c = String(classification || '').toLowerCase();
  if (c.includes('chưa hoàn thành') || c.includes('chưa có phiếu')) {
    return 'bg-slate-100 text-slate-700 border-slate-300';
  }
  if (c.includes('xuất sắc')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-300';
  }
  if (c.includes('tốt')) {
    return 'bg-teal-50 text-teal-800 border-teal-300';
  }
  if (c.includes('không hoàn thành') || c.includes('cần cải thiện') || c.includes('yếu')) {
    return 'bg-rose-50 text-rose-800 border-rose-300';
  }
  if (c.includes('hoàn thành')) {
    return 'bg-amber-50 text-amber-800 border-amber-300';
  }
  return 'bg-slate-50 text-slate-700 border-slate-300';
};


/**
 * Chuẩn hóa thông tin trạng thái Đợt Đánh giá
 */
export const getPeriodStatusInfo = (status) => {
  switch (status) {
    case 'ACTIVE':
    case 'OPEN':
      return { label: 'Đang diễn ra', variant: 'success', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'CLOSED':
      return { label: 'Đã hoàn tất', variant: 'secondary', color: 'text-slate-600 bg-slate-100 border-slate-200' };
    case 'UPCOMING':
      return { label: 'Sắp diễn ra', variant: 'warning', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    default:
      return { label: status || 'Chưa xác định', variant: 'default', color: 'text-slate-600 bg-slate-50 border-slate-200' };
  }
};

/**
 * Chuẩn hóa thông tin hình thức bỏ phiếu cấp Đợt (Kín / Công khai / Tùy chọn)
 */
export const getVotingModeInfo = (votingMode) => {
  switch (votingMode) {
    case 'ANONYMOUS_ONLY':
      return {
        label: 'Bỏ phiếu kín 100% (Ẩn danh)',
        isAnonymous: true,
        badgeColor: 'text-teal-800 bg-teal-50 border-teal-200',
        description: 'Tên người chấm được hệ thống tự động mã hóa ẩn danh để đảm bảo tính khách quan.'
      };
    case 'IDENTIFIED_ONLY':
      return {
        label: 'Công khai định danh',
        isAnonymous: false,
        badgeColor: 'text-blue-800 bg-blue-50 border-blue-200',
        description: 'Ghi nhận rõ danh tính và chức danh của người tham gia đánh giá.'
      };
    case 'OPTIONAL':
    default:
      return {
        label: 'Theo quy chế Ban Quản trị',
        isAnonymous: false,
        badgeColor: 'text-slate-700 bg-slate-50 border-slate-200',
        description: 'Hình thức bỏ phiếu được Ban Quản trị cấu hình linh hoạt theo từng kỳ.'
      };
  }
};

/**
 * Chuẩn hóa thông tin trạng thái quy trình KPI 3 Bước
 */
export const getKpiStatusInfo = (status) => {
  switch (status) {
    case 'pending_manager':
      return { label: 'Chờ BĐH chấm (Bước 2)', variant: 'warning', color: 'text-amber-800 bg-amber-50 border-amber-200' };
    case 'pending_chairman':
      return { label: 'Chờ Chủ tịch duyệt (Bước 3)', variant: 'danger', color: 'text-rose-800 bg-rose-50 border-rose-200' };
    case 'completed':
    case 'APPROVED':
      return { label: 'Đã hoàn tất & Phê duyệt', variant: 'success', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' };
    case 'draft':
    default:
      return { label: 'Bản nháp', variant: 'default', color: 'text-slate-600 bg-slate-50 border-slate-200' };
  }
};

/**
 * Tính điểm tổng kết KPI theo công thức 3 cấp: 40% Tự chấm + 30% BĐH + 30% Chủ tịch HĐQT
 */
export const calculateFinalKpiScore = (scoreSelf, scoreManager, scoreChairman) => {
  const s1 = Number(scoreSelf);
  const s2 = Number(scoreManager);
  const s3 = Number(scoreChairman);

  if (isNaN(s1) || isNaN(s2) || isNaN(s3)) return null;

  const total = (s1 * 0.4) + (s2 * 0.3) + (s3 * 0.3);
  return Number(total.toFixed(1));
};

/**
 * Nhận diện tài khoản quản trị hệ thống / kỹ thuật Webapp
 * Các tài khoản này chỉ phục vụ cấu hình & quản trị hệ thống,
 * tuyệt đối không tham gia diện lấy phiếu tín nhiệm chuyên môn tại Quỹ.
 */
export const isSystemAdminAccount = (emp) => {
  if (!emp) return false;
  const id = String(emp.id || '').toLowerCase();
  const code = String(emp.code || '').toUpperCase();
  const name = String(emp.name || '').toLowerCase();
  const dept = String(emp.department || '').toLowerCase();
  const email = String(emp.email || '').toLowerCase();

  // CHỈ loại trừ tài khoản kỹ thuật ảo của Webapp (ROOT / Quản trị viên cấp cao Webapp / admin)
  // Tuyệt đối KHÔNG loại trừ cán bộ thực tế của Quỹ (như Trịnh Đức Anh ducanht@gmail.com, Nguyễn Văn Sơn...)
  return (
    id === 'emp-root' ||
    id === 'admin' ||
    id.startsWith('00000000-') ||
    code === 'ROOT' ||
    code === 'ADMIN' ||
    email === 'qtdyentho@gmail.com' ||
    email === 'admin@qtdyentho.vn' ||
    (name.includes('quản trị viên cấp cao') && dept.includes('cổng quản trị'))
  );
};

/**
 * Lấy danh sách CBNV chính thức của Quỹ (loại bỏ hoàn toàn tài khoản kỹ thuật root/system và khử trùng lặp)
 */
export const getOfficialStaff = (employees = []) => {
  if (!Array.isArray(employees)) return [];
  const staff = employees.filter((e) => !isSystemAdminAccount(e));

  // Khử trùng lặp triệt để theo mã cán bộ (code) hoặc email
  const uniqueMap = new Map();
  staff.forEach((emp) => {
    const key = (emp.code && emp.code.trim().toUpperCase()) || (emp.email && emp.email.trim().toLowerCase()) || emp.id;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, emp);
    } else {
      const existing = uniqueMap.get(key);
      if (emp.id.startsWith('emp-') && !existing.id.startsWith('emp-')) {
        uniqueMap.set(key, emp);
      }
    }
  });

  return Array.from(uniqueMap.values());
};

/**
 * Lấy danh sách cán bộ thuộc diện lấy phiếu tín nhiệm theo đúng cấu hình đợt (Zero Mock, Zero Leakage, Zero Duplicate)
 */
export const getEligibleTargetEmployees = (employees = [], targetEmployeeIds = null) => {
  const officialStaff = getOfficialStaff(employees);

  let pool = officialStaff;
  if (Array.isArray(targetEmployeeIds) && targetEmployeeIds.length > 0) {
    const targetSet = new Set(targetEmployeeIds);
    pool = officialStaff.filter((e) => targetSet.has(e.id));
  }

  // Khử trùng lặp triệt để
  const uniqueMap = new Map();
  pool.forEach((emp) => {
    const key = (emp.code && emp.code.trim().toUpperCase()) || (emp.email && emp.email.trim().toLowerCase()) || emp.id;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, emp);
    } else {
      const existing = uniqueMap.get(key);
      if (emp.id.startsWith('emp-') && !existing.id.startsWith('emp-')) {
        uniqueMap.set(key, emp);
      }
    }
  });

  return Array.from(uniqueMap.values());
};

/**
 * Lấy danh sách cử tri hợp lệ tham gia bỏ phiếu theo cấu hình đợt (Zero Duplicate)
 */
export const getEligibleVoterEmployees = (employees = [], voterEmployeeIds = null) => {
  const officialStaff = getOfficialStaff(employees);

  let pool = officialStaff;
  if (Array.isArray(voterEmployeeIds) && voterEmployeeIds.length > 0) {
    const voterSet = new Set(voterEmployeeIds);
    pool = officialStaff.filter((e) => voterSet.has(e.id));
  }

  // Khử trùng lặp triệt để
  const uniqueMap = new Map();
  pool.forEach((emp) => {
    const key = (emp.code && emp.code.trim().toUpperCase()) || (emp.email && emp.email.trim().toLowerCase()) || emp.id;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, emp);
    } else {
      const existing = uniqueMap.get(key);
      if (emp.id.startsWith('emp-') && !existing.id.startsWith('emp-')) {
        uniqueMap.set(key, emp);
      }
    }
  });

  return Array.from(uniqueMap.values());
};

/**
 * Định dạng ngày giờ GMT+7 chuẩn mực hiển thị
 */
export const formatDateTimeVN = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

/**
 * Tạo mã UUID v4 an toàn, chuẩn RFC 4122 để định danh Đợt, Phiếu và Thực thể,
 * triệt tiêu hoàn toàn nguy cơ trùng lặp ID (Zero ID Collisions).
 */
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Sinh mã đợt đánh giá chuẩn UUID
 * Ví dụ: PERIOD-2026-Q4-b89e7c54-9423-455b-80ee-e2ba96dca4e1
 */
export const generatePeriodId = (year = 2026, quarter = 4) => {
  return `PERIOD-${year}-Q${quarter}-${generateUUID()}`;
};

/**
 * Tính thời gian đảm nhiệm chức vụ (Thâm niên chức danh)
 * Trả về chuỗi thân thiện: ví dụ "3 năm 4 tháng" hoặc "8 tháng"
 */
export const calculatePositionTenure = (startDate) => {
  if (!startDate) return '—';
  try {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return '—';
    const now = new Date();
    
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    
    if (years <= 0 && months <= 0) return 'Dưới 1 tháng';
    if (years <= 0) return `${months} tháng`;
    if (months === 0) return `${years} năm`;
    return `${years} năm ${months} tháng`;
  } catch {
    return '—';
  }
};



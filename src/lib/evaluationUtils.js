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
  const role = (emp.role || '').toLowerCase();
  const id = (emp.id || '').toLowerCase();
  const code = (emp.code || '').toUpperCase();
  const name = (emp.name || '').toLowerCase();
  const dept = (emp.department || '').toLowerCase();
  const pos = (emp.position || '').toLowerCase();
  const email = (emp.email || '').toLowerCase();

  return (
    role === 'superadmin' ||
    role === 'admin' ||
    id === 'emp-root' ||
    id === 'admin' ||
    id === 'superadmin' ||
    code === 'ROOT' ||
    code === 'ADMIN' ||
    email === 'qtdyentho@gmail.com' ||
    name.includes('quản trị viên') ||
    dept.includes('quản trị viên') ||
    dept.includes('webapp') ||
    dept.includes('cổng quản trị') ||
    pos.includes('quản trị viên')
  );
};

/**
 * Lấy danh sách cán bộ thuộc diện lấy phiếu tín nhiệm theo đúng cấu hình đợt (Zero Mock, Zero Leakage)
 */
export const getEligibleTargetEmployees = (employees = [], targetEmployeeIds = null) => {
  if (!Array.isArray(employees) || employees.length === 0) return [];

  // Lọc danh sách ứng viên chuyên môn (luôn loại trừ tài khoản quản trị hệ thống webapp)
  const officialStaff = employees.filter((e) => !isSystemAdminAccount(e));

  if (Array.isArray(targetEmployeeIds) && targetEmployeeIds.length > 0) {
    const targetSet = new Set(targetEmployeeIds);
    return officialStaff.filter((e) => targetSet.has(e.id));
  }

  // Mặc định: Toàn bộ cán bộ nhân viên công tác chính thức của đơn vị
  return officialStaff;
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


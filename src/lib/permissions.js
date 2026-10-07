// Hệ thống Phân quyền Chi tiết (Granular Permission & Modular System)
// Quỹ Tín Dụng Nhân Dân Yên Thọ - HRM Portal

// 1. DANH MỤC PHÂN HỆ HỆ THỐNG (SYSTEM MODULES)
export const SYSTEM_MODULES = {
  HR: {
    code: 'MODULE_HR',
    name: 'Quản trị Hồ sơ Cán bộ & Luân chuyển',
    description: 'Hồ sơ trích ngang, thông tin cán bộ, quyết định bổ nhiệm và điều động luân chuyển địa bàn.',
    status: 'ACTIVE',
    icon: 'Users',
  },
  TRUST: {
    code: 'MODULE_TRUST',
    name: 'Đánh giá Tín nhiệm Cán bộ',
    description: 'Bỏ phiếu đánh giá tín nhiệm định kỳ 10 tiêu chí theo chuẩn Ngân hàng Nhà nước.',
    status: 'ACTIVE',
    icon: 'ShieldCheck',
  },
  KPI: {
    code: 'MODULE_KPI',
    name: 'Chấm điểm KPI 3 Cấp (40-30-30)',
    description: 'Quy trình thẩm định và phê duyệt chỉ tiêu công tác 3 cấp độc lập.',
    status: 'ACTIVE',
    icon: 'TrendingUp',
  },
  PLANNING: {
    code: 'MODULE_PLANNING',
    name: 'Quy hoạch Cán bộ Nguồn',
    description: 'Lấy phiếu tín nhiệm giới thiệu quy hoạch bổ nhiệm chức danh lãnh đạo, quản lý.',
    status: 'ACTIVE',
    icon: 'Vote',
  },
  DASHBOARD: {
    code: 'MODULE_DASHBOARD',
    name: 'Báo cáo & Giám sát Điều hành',
    description: 'Tổng hợp phân tích số liệu thời gian thực phục vụ Ban điều hành và HĐQT.',
    status: 'ACTIVE',
    icon: 'LayoutDashboard',
  },
  // CÁC PHÂN HỆ SẴN SÀNG MỞ RỘNG TRONG TƯƠNG LAI
  TIMEKEEPING: {
    code: 'MODULE_TIMEKEEPING',
    name: 'Chấm công & Quản lý Ngày phép',
    description: 'Theo dõi thời gian làm việc, trực kho quỹ, nghỉ phép và làm ngoài giờ.',
    status: 'PLANNED', // Sẵn sàng tích hợp giai đoạn 2
    icon: 'Clock',
  },
  PAYROLL: {
    code: 'MODULE_PAYROLL',
    name: 'Tiền lương & Thù lao HĐQT/BKS',
    description: 'Bảng thanh toán lương ngạch bậc, lương kinh doanh, thù lao chức vụ và trích nộp bảo hiểm.',
    status: 'PLANNED', // Sẵn sàng tích hợp giai đoạn 2
    icon: 'Coins',
  },
  AWARDS: {
    code: 'MODULE_AWARDS',
    name: 'Thi đua, Khen thưởng & Kỷ luật',
    description: 'Hồ sơ bình xét danh hiệu thi đua và ghi nhận đóng góp xuất sắc.',
    status: 'PLANNED',
    icon: 'Award',
  },
};

// 2. DANH MỤC QUYỀN HẠN CHI TIẾT (GRANULAR PERMISSIONS)
export const PERMISSIONS = {
  // Quyền phân hệ Đánh giá tín nhiệm
  TRUST_VIEW: 'trust:view',                     // Xem danh sách đánh giá
  TRUST_EVALUATE: 'trust:evaluate',             // Thực hiện chấm điểm tín nhiệm
  TRUST_MANAGE_PERIODS: 'trust:manage_periods', // Quản trị tạo/đóng đợt, quyết định Ẩn danh/Công khai
  TRUST_VIEW_REPORTS: 'trust:view_reports',     // Xem tổng hợp báo cáo tín nhiệm toàn đơn vị
  TRUST_AUDIT: 'trust:audit',                   // Kiểm toán phiếu kín khi có thanh tra (HĐQT/BKS)

  // Quyền phân hệ KPI
  KPI_VIEW: 'kpi:view',                         // Xem bảng theo dõi KPI
  KPI_SELF_EVAL: 'kpi:self_eval',               // Cán bộ tự chấm điểm Bước 1 (40%)
  KPI_MANAGER_REVIEW: 'kpi:manager_review',     // Ban điều hành duyệt Bước 2 (30%)
  KPI_CHAIRMAN_APPROVE: 'kpi:chairman_approve', // Chủ tịch HĐQT phê chuẩn Bước 3 (30%)

  // Quyền phân hệ Quy hoạch
  PLANNING_VIEW: 'planning:view',               // Xem danh sách quy hoạch
  PLANNING_VOTE: 'planning:vote',               // Tham gia bỏ phiếu tín nhiệm quy hoạch
  PLANNING_MANAGE: 'planning:manage',           // Lập danh sách ứng viên & xem kết quả chi tiết

  // Quyền phân hệ Hồ sơ nhân sự & Luân chuyển
  HR_VIEW: 'hr:view',                           // Xem danh bạ cán bộ
  HR_VIEW_HISTORY: 'hr:view_history',           // Xem quá trình luân chuyển điều động
  HR_MANAGE_TRANSFERS: 'hr:manage_transfers',   // Thêm mới/cập nhật quyết định luân chuyển
  HR_EDIT_PROFILE: 'hr:edit_profile',           // Cập nhật hồ sơ trích ngang cán bộ

  // Quyền phân hệ Báo cáo & Điều hành
  DASHBOARD_VIEW: 'dashboard:view',             // Truy cập Dashboard
  DASHBOARD_EXPORT: 'dashboard:export',         // Xuất báo cáo tổng hợp

  // Quyền Quản trị hệ thống
  SYSTEM_CONFIG: 'system:config',               // Cấu hình tham số, kết nối dữ liệu
  SYSTEM_INIT_DB: 'system:init_db',             // Khởi tạo và tự động cập nhật CSDL
};

// 3. MA TRẬN PHÂN QUYỀN THEO VAI TRÒ CHUẨN (ROLE-BASED PERMISSION MATRIX)
export const ROLE_PERMISSIONS = {
  // 1. Cán bộ nghiệp vụ (Staff)
  staff: [
    PERMISSIONS.TRUST_VIEW,
    PERMISSIONS.TRUST_EVALUATE,
    PERMISSIONS.KPI_VIEW,
    PERMISSIONS.KPI_SELF_EVAL,
    PERMISSIONS.PLANNING_VIEW,
    PERMISSIONS.PLANNING_VOTE,
    PERMISSIONS.HR_VIEW,
    PERMISSIONS.HR_VIEW_HISTORY,
  ],

  // 2. Ban điều hành (Manager - Giám đốc, Phó Giám đốc)
  manager: [
    PERMISSIONS.TRUST_VIEW,
    PERMISSIONS.TRUST_EVALUATE,
    PERMISSIONS.TRUST_MANAGE_PERIODS,
    PERMISSIONS.TRUST_VIEW_REPORTS,
    PERMISSIONS.KPI_VIEW,
    PERMISSIONS.KPI_SELF_EVAL,
    PERMISSIONS.KPI_MANAGER_REVIEW,
    PERMISSIONS.PLANNING_VIEW,
    PERMISSIONS.PLANNING_VOTE,
    PERMISSIONS.PLANNING_MANAGE,
    PERMISSIONS.HR_VIEW,
    PERMISSIONS.HR_VIEW_HISTORY,
    PERMISSIONS.HR_MANAGE_TRANSFERS,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_EXPORT,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.SYSTEM_INIT_DB,
  ],

  // 3. Chủ tịch HĐQT (Chairman - Đại diện cơ quan quản trị cao nhất)
  chairman: [
    PERMISSIONS.TRUST_VIEW,
    PERMISSIONS.TRUST_EVALUATE,
    PERMISSIONS.TRUST_MANAGE_PERIODS,
    PERMISSIONS.TRUST_VIEW_REPORTS,
    PERMISSIONS.TRUST_AUDIT,
    PERMISSIONS.KPI_VIEW,
    PERMISSIONS.KPI_SELF_EVAL,
    PERMISSIONS.KPI_MANAGER_REVIEW,
    PERMISSIONS.KPI_CHAIRMAN_APPROVE,
    PERMISSIONS.PLANNING_VIEW,
    PERMISSIONS.PLANNING_VOTE,
    PERMISSIONS.PLANNING_MANAGE,
    PERMISSIONS.HR_VIEW,
    PERMISSIONS.HR_VIEW_HISTORY,
    PERMISSIONS.HR_MANAGE_TRANSFERS,
    PERMISSIONS.HR_EDIT_PROFILE,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_EXPORT,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.SYSTEM_INIT_DB,
  ],
};

/**
 * Kiểm tra xem người dùng hiện tại có quyền thực hiện hành động cụ thể hay không
 * @param {Object} user Người dùng đang đăng nhập
 * @param {string} permission Mã quyền cần kiểm tra (từ PERMISSIONS)
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  
  // Nếu người dùng có danh sách quyền tùy biến riêng (custom permissions override)
  if (Array.isArray(user.customPermissions)) {
    return user.customPermissions.includes(permission);
  }

  // Mặc định kiểm tra theo vai trò
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
};

/**
 * Kiểm tra quyền truy cập vào một phân hệ cụ thể
 * @param {Object} user 
 * @param {string} moduleCode 
 * @returns {boolean}
 */
export const canAccessModule = (user, moduleCode) => {
  if (!user) return false;
  switch (moduleCode) {
    case SYSTEM_MODULES.DASHBOARD.code:
      return hasPermission(user, PERMISSIONS.DASHBOARD_VIEW);
    case SYSTEM_MODULES.TRUST.code:
      return hasPermission(user, PERMISSIONS.TRUST_VIEW);
    case SYSTEM_MODULES.KPI.code:
      return hasPermission(user, PERMISSIONS.KPI_VIEW);
    case SYSTEM_MODULES.PLANNING.code:
      return hasPermission(user, PERMISSIONS.PLANNING_VIEW);
    case SYSTEM_MODULES.HR.code:
      return hasPermission(user, PERMISSIONS.HR_VIEW);
    default:
      return false;
  }
};

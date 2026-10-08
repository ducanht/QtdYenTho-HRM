// Hệ thống Phân quyền Chi tiết (Granular Permission & Modular System)
// Quỹ Tín Dụng Nhân Dân Yên Thọ - HRM Portal

// 1. DANH MỤC PHÂN HỆ HỆ THỐNG (SYSTEM MODULES)
// Cấu trúc Data-Driven Dynamic Launcher: Khi thêm module vào đây, Ô Lưới sẽ tự động sinh ra trên giao diện
export const SYSTEM_MODULES = {
  TRUST: {
    code: 'MODULE_TRUST',
    name: 'Đánh giá Tín nhiệm Cán bộ',
    shortName: 'Tín nhiệm',
    category: 'Đánh giá & Tín nhiệm',
    description: 'Bỏ phiếu đánh giá tín nhiệm định kỳ 10 tiêu chí theo chuẩn Ngân hàng Nhà nước. Ban Quản trị quyết định Bỏ phiếu kín (Ẩn danh) hoặc Công khai.',
    status: 'ACTIVE',
    icon: 'ShieldCheck',
    route: '/trust-evaluation',
    color: 'emerald',
    badge: 'Trọng tâm',
    features: ['10 tiêu chí chuẩn', 'Bỏ phiếu kín cấp đợt', 'Bảo mật danh tính 100%', 'Lịch sử đánh giá'],
  },
  HR: {
    code: 'MODULE_HR',
    name: 'Hồ sơ Cán bộ & Luân chuyển',
    shortName: 'Nhân sự',
    category: 'Quản trị Tổ chức',
    description: 'Quản lý danh bạ trích ngang cán bộ, quá trình điều động, luân chuyển địa bàn công tác định kỳ 3 năm theo quy định của NHNN.',
    status: 'ACTIVE',
    icon: 'Users',
    route: '/employees',
    color: 'teal',
    badge: 'Đang vận hành',
    features: ['Danh bạ 12 cán bộ', 'CCCD & Chức vụ Đảng', 'Timeline luân chuyển', 'Bàn giao hồ sơ nợ'],
  },
  KPI: {
    code: 'MODULE_KPI',
    name: 'Chấm điểm KPI 3 Cấp (40-30-30)',
    shortName: 'Chấm điểm KPI',
    category: 'Hiệu quả Công tác',
    description: 'Quy trình chấm điểm và phê duyệt chỉ tiêu công tác 3 cấp độc lập: 40% Cán bộ tự chấm, 30% Giám đốc điều hành, 30% Chủ tịch HĐQT.',
    status: 'ACTIVE',
    icon: 'TrendingUp',
    route: '/kpi-evaluation',
    color: 'blue',
    badge: 'Đang vận hành',
    features: ['Tự chấm Bước 1', 'Giám đốc thẩm tra', 'Chủ tịch HĐQT phê chuẩn', 'Công thức 40-30-30'],
  },
  PLANNING: {
    code: 'MODULE_PLANNING',
    name: 'Quy hoạch Cán bộ Nguồn',
    shortName: 'Quy hoạch',
    category: 'Tổ chức Cán bộ',
    description: 'Lấy phiếu tín nhiệm giới thiệu quy hoạch bổ nhiệm các chức danh lãnh đạo, quản lý Quỹ Tín Dụng Nhân Dân Yên Thọ.',
    status: 'ACTIVE',
    icon: 'Vote',
    route: '/planning-vote',
    color: 'purple',
    badge: 'Đang vận hành',
    features: ['Lấy phiếu tín nhiệm', 'Chức danh chủ chốt', '3 mức tín nhiệm', 'Tỷ lệ % tín nhiệm'],
  },
  DASHBOARD: {
    code: 'MODULE_DASHBOARD',
    name: 'Báo cáo & Giám sát Điều hành',
    shortName: 'Dashboard',
    category: 'Giám sát Lãnh đạo',
    description: 'Tổng hợp phân tích số liệu thời gian thực phục vụ công tác chỉ đạo của Ban Giám đốc và Hội đồng Quản trị Quỹ.',
    status: 'ACTIVE',
    icon: 'LayoutDashboard',
    route: '/dashboard',
    color: 'amber',
    badge: 'Lãnh đạo',
    features: ['Biểu đồ Recharts', 'Xếp loại tín nhiệm', 'So sánh KPI phòng ban', 'Thời gian thực Firestore'],
  },
  // CÁC PHÂN HỆ SẴN SÀNG MỞ RỘNG TRONG TƯƠNG LAI (PLANNED)
  TIMEKEEPING: {
    code: 'MODULE_TIMEKEEPING',
    name: 'Chấm công & Quản lý Ngày phép',
    shortName: 'Chấm công',
    category: 'Lao động & Tiền lương',
    description: 'Theo dõi thời gian làm việc giao dịch tài chính, lịch trực kho quỹ, giải quyết đơn xin nghỉ phép năm và làm việc ngoài giờ.',
    status: 'PLANNED', // Sẵn sàng cấu trúc CSDL
    icon: 'Clock',
    route: '/timekeeping',
    color: 'slate',
    badge: 'Sắp ra mắt',
    features: ['Thời giờ làm việc', 'Trực kho quỹ', 'Đơn xin nghỉ phép', 'Duyệt phép trực tuyến'],
  },
  PAYROLL: {
    code: 'MODULE_PAYROLL',
    name: 'Tiền lương & Thù lao HĐQT/BKS',
    shortName: 'Tiền lương',
    category: 'Lao động & Tiền lương',
    description: 'Bảng thanh toán lương ngạch bậc, lương năng suất theo KPI, thù lao chức vụ kiêm nhiệm và trích nộp bảo hiểm xã hội bắt buộc.',
    status: 'PLANNED', // Sẵn sàng cấu trúc CSDL
    icon: 'Coins',
    route: '/payroll',
    color: 'slate',
    badge: 'Sắp ra mắt',
    features: ['Lương ngạch bậc', 'Thưởng theo KPI', 'Trích nộp BHXH', 'Phiếu lương cá nhân'],
  },
  AWARDS: {
    code: 'MODULE_AWARDS',
    name: 'Thi đua, Khen thưởng & Kỷ luật',
    shortName: 'Thi đua',
    category: 'Thi đua Khen thưởng',
    description: 'Hồ sơ bình xét danh hiệu thi đua hàng năm, khen thưởng thành tích xuất sắc và xử lý kỷ luật lao động theo quy chế Quỹ.',
    status: 'PLANNED', // Sẵn sàng cấu trúc CSDL
    icon: 'Award',
    route: '/awards',
    color: 'slate',
    badge: 'Sắp ra mắt',
    features: ['Chiến sĩ thi đua', 'Khen thưởng đột xuất', 'Kỷ luật lao động', 'Hồ sơ thi đua'],
  },
  SETTINGS: {
    code: 'MODULE_SETTINGS',
    name: 'Cấu hình & Quản trị Hệ thống',
    shortName: 'Cấu hình Quản trị',
    category: 'Hệ thống Cốt lõi',
    description: 'Thiết lập danh mục Phòng ban, Chức danh, Tiêu chí tín nhiệm, Tỷ trọng KPI, Tiêu chuẩn quy hoạch và Tham số các phân hệ.',
    status: 'ACTIVE',
    icon: 'Settings',
    route: '/admin-settings',
    color: 'slate',
    badge: 'Hệ thống Cốt lõi (Bắt buộc)',
    isCore: true,             // Module Hệ Thống Đặc Biệt
    isSystemCore: true,       // Không phải module webapp để có thể bật/tắt
    canToggle: false,         // Không thể bật/tắt (Luôn luôn vận hành)
    features: ['Hệ thống Cốt lõi', 'Phòng ban & Chức danh', 'Tiêu chí tín nhiệm', 'Tham số Nghiệp vụ'],
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

  // Quyền Quản trị nghiệp vụ nội bộ Quỹ (Admin: CT HĐQT, Giám đốc, TV HĐQT)
  SYSTEM_CONFIG: 'system:config',               // Cấu hình danh mục nghiệp vụ (Phòng ban, Chức danh, Tiêu chí...)
  SYSTEM_INIT_DB: 'system:init_db',             // Khởi tạo và đồng bộ CSDL

  // ĐẶC QUYỀN DUY NHẤT CỦA SUPERADMIN (qtdyentho@gmail.com):
  SYSTEM_FEATURE_FLAGS: 'system:feature_flags', // Bật/tắt phân hệ Webapp (Feature Flags)
  SYSTEM_WEBAPP_CONFIG: 'system:webapp_config', // Cấu hình tham số webapp & Thông tin pháp nhân Quỹ
};

// 3. MA TRẬN PHÂN QUYỀN THEO VAI TRÒ CHUẨN (ROLE-BASED PERMISSION MATRIX)
// Quyền dành cho Admin nghiệp vụ (CT HĐQT, Giám đốc điều hành, Thành viên HĐQT):
const ADMIN_PERMISSIONS = [
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
];

// Quyền SuperAdmin Tối Cao (Duy nhất qtdyentho@gmail.com): Có toàn quyền của Admin + Bật/tắt Webapp & Cấu hình Webapp
const SUPERADMIN_PERMISSIONS = [
  ...ADMIN_PERMISSIONS,
  PERMISSIONS.SYSTEM_FEATURE_FLAGS,
  PERMISSIONS.SYSTEM_WEBAPP_CONFIG,
];

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

  // 2. Ban Quản trị & Điều hành (Admin - Chủ tịch HĐQT, Giám đốc điều hành, Thành viên HĐQT)
  admin: ADMIN_PERMISSIONS,

  // 3. Quản trị viên Cấp cao duy nhất (SuperAdmin - qtdyentho@gmail.com)
  superadmin: SUPERADMIN_PERMISSIONS,

  // Alias tương thích ngược:
  manager: ADMIN_PERMISSIONS,
  chairman: ADMIN_PERMISSIONS,
};

/**
 * Kiểm tra xem người dùng hiện tại có quyền thực hiện hành động cụ thể hay không
 * @param {Object} user Người dùng đang đăng nhập
 * @param {string} permission Mã quyền cần kiểm tra (từ PERMISSIONS)
 * @returns {boolean}
 */
export const hasPermission = (userOrRole, permission) => {
  const user = typeof userOrRole === 'string' ? { role: userOrRole } : userOrRole;
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
 * @param {Object|string} userOrRole 
 * @param {string} moduleCode 
 * @returns {boolean}
 */
export const canAccessModule = (userOrRole, moduleCode) => {
  const user = typeof userOrRole === 'string' ? { role: userOrRole } : userOrRole;
  if (!user || !user.role) return false;
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
    case SYSTEM_MODULES.SETTINGS.code:
      return hasPermission(user, PERMISSIONS.SYSTEM_CONFIG);
    default:
      return false;
  }
};

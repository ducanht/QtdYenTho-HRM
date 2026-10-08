// Hệ Thống Quản Trị Phân Quyền Vai Trò & Phân Hệ (Role-Based Access Control - RBAC)
// Quỹ Tín Dụng Nhân Dân Yên Thọ - Thanh Hóa
// Áp dụng Chính sách 100% Realtime Cloud Firestore & Zero Mock Data Policy

// ============================================================================
// 1. DANH MỤC 8 PHÂN HỆ HỆ THỐNG CHUẨN CỦA QUỸ (SYSTEM MODULES REGISTRY)
// ============================================================================
export const SYSTEM_MODULES = {
  TRUST: {
    code: 'MODULE_TRUST',
    name: 'Đánh giá & Lấy phiếu Tín nhiệm',
    shortName: 'Tín nhiệm',
    category: 'Quản trị Nhân sự & Tín nhiệm',
    description: 'Bỏ phiếu đánh giá tín nhiệm định kỳ và đột xuất cho cán bộ nhân viên theo 10 tiêu chí chuẩn Ngân hàng Nhà nước.',
    status: 'ACTIVE',
    icon: 'ShieldCheck',
    route: '/trust',
    color: 'emerald',
    badge: 'Đang vận hành',
    features: ['10 tiêu chí chuẩn', 'Bỏ phiếu kín 100%', 'Xếp loại tự động', 'Biên bản in A4'],
  },
  HR: {
    code: 'MODULE_HR',
    name: 'Hồ sơ Cán bộ & Luân chuyển Công tác',
    shortName: 'Hồ sơ & Luân chuyển',
    category: 'Quản trị Nhân sự',
    description: 'Quản lý thông tin trích ngang, chức danh, quá trình công tác, lịch sử luân chuyển điều động cán bộ tín dụng theo chu kỳ 36 tháng.',
    status: 'ACTIVE',
    icon: 'Users',
    route: '/employees',
    color: 'teal',
    badge: 'Đang vận hành',
    features: ['Hồ sơ cán bộ', 'Luân chuyển 36 tháng', 'Lịch sử điều động', 'Biên bản bàn giao nợ'],
  },
  KPI: {
    code: 'MODULE_KPI',
    name: 'Đánh giá Hiệu quả Công việc (KPI)',
    shortName: 'Đánh giá KPI',
    category: 'Đánh giá Hiệu quả',
    description: 'Quy trình chấm điểm KPI 3 cấp: Cán bộ tự chấm (40%) -> Ban Điều hành kiểm tra (30%) -> Chủ tịch HĐQT phê chuẩn (30%).',
    status: 'ACTIVE',
    icon: 'TrendingUp',
    route: '/kpi',
    color: 'blue',
    badge: 'Đang vận hành',
    features: ['3 cấp chấm điểm', 'Tự chấm 40%', 'Điều hành 30%', 'HĐQT duyệt 30%'],
  },
  PLANNING: {
    code: 'MODULE_PLANNING',
    name: 'Quy hoạch & Bổ nhiệm Cán bộ Nguồn',
    shortName: 'Quy hoạch nguồn',
    category: 'Quy hoạch Cán bộ',
    description: 'Lấy phiếu biểu quyết giới thiệu nhân sự quy hoạch chức danh Chủ tịch HĐQT, Giám đốc, Ban kiểm soát và Kế toán trưởng.',
    status: 'ACTIVE',
    icon: 'Vote',
    route: '/planning',
    color: 'purple',
    badge: 'Đang vận hành',
    features: ['Quy hoạch HĐQT/BĐH', 'Bỏ phiếu tín nhiệm', 'Kiểm phiếu tự động', 'Ngưỡng >= 50%'],
  },
  DASHBOARD: {
    code: 'MODULE_DASHBOARD',
    name: 'Bảng Điều Khiển Tổng Quan',
    shortName: 'Tổng quan',
    category: 'Giám sát Điều hành',
    description: 'Báo cáo tổng hợp số liệu tín nhiệm, tiến độ đánh giá KPI và kết quả quy hoạch nguồn thời gian thực phục vụ Lãnh đạo Quỹ.',
    status: 'ACTIVE',
    icon: 'BarChart2',
    route: '/dashboard',
    color: 'indigo',
    badge: 'Đang vận hành',
    features: ['Số liệu Real-time', 'Biểu đồ xếp loại', 'KPI phòng ban', 'Giám sát tiến độ'],
  },
  ATTENDANCE: {
    code: 'MODULE_ATTENDANCE',
    name: 'Chấm công & Phân ca Trực kho quỹ',
    shortName: 'Chấm công & Ca trực',
    category: 'Vận hành Nội bộ',
    description: 'Theo dõi ngày công làm việc, phân lịch trực an toàn kho quỹ ban đêm và ngày nghỉ cuối tuần theo quy chuẩn an toàn kho tiền.',
    status: 'PLANNED',
    icon: 'Clock',
    route: '/attendance',
    color: 'slate',
    badge: 'Sắp ra mắt',
    features: ['Bảng chấm công tháng', 'Lịch trực kho đêm', 'Trực thứ 7/CN', 'Nghỉ phép năm'],
  },
  PAYROLL: {
    code: 'MODULE_PAYROLL',
    name: 'Tiền lương & Đãi ngộ Cán bộ',
    shortName: 'Lương & Đãi ngộ',
    category: 'Lao động & Tiền lương',
    description: 'Bảng thanh toán lương ngạch bậc, lương năng suất theo KPI, thù lao chức vụ kiêm nhiệm và trích nộp bảo hiểm xã hội bắt buộc.',
    status: 'PLANNED',
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
    status: 'PLANNED',
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
    isCore: true,
    isSystemCore: true,
    canToggle: false,
    features: ['Hệ thống Cốt lõi', 'Phòng ban & Chức danh', 'Tiêu chí tín nhiệm', 'Tham số Nghiệp vụ'],
  },
};

// ============================================================================
// 2. DANH MỤC QUYỀN HẠN CHI TIẾT (LEGACY GRANULAR PERMISSIONS ALIASES)
// ============================================================================
export const PERMISSIONS = {
  TRUST_VIEW: 'trust:view',
  TRUST_EVALUATE: 'trust:evaluate',
  TRUST_MANAGE_PERIODS: 'trust:manage_periods',
  TRUST_VIEW_REPORTS: 'trust:view_reports',
  TRUST_AUDIT: 'trust:audit',

  KPI_VIEW: 'kpi:view',
  KPI_SELF_EVAL: 'kpi:self_eval',
  KPI_MANAGER_REVIEW: 'kpi:manager_review',
  KPI_CHAIRMAN_APPROVE: 'kpi:chairman_approve',

  PLANNING_VIEW: 'planning:view',
  PLANNING_VOTE: 'planning:vote',
  PLANNING_MANAGE: 'planning:manage',

  HR_VIEW: 'hr:view',
  HR_VIEW_HISTORY: 'hr:view_history',
  HR_MANAGE_TRANSFERS: 'hr:manage_transfers',
  HR_EDIT_PROFILE: 'hr:edit_profile',

  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_EXPORT: 'dashboard:export',

  SYSTEM_CONFIG: 'system:config',
  SYSTEM_INIT_DB: 'system:init_db',
  SYSTEM_FEATURE_FLAGS: 'system:feature_flags',
  SYSTEM_WEBAPP_CONFIG: 'system:webapp_config',
};

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

const SUPERADMIN_PERMISSIONS = [
  ...ADMIN_PERMISSIONS,
  PERMISSIONS.SYSTEM_FEATURE_FLAGS,
  PERMISSIONS.SYSTEM_WEBAPP_CONFIG,
];

export const ROLE_PERMISSIONS = {
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
  admin: ADMIN_PERMISSIONS,
  superadmin: SUPERADMIN_PERMISSIONS,
  manager: ADMIN_PERMISSIONS,
  chairman: ADMIN_PERMISSIONS,
};

export const hasPermission = (userOrRole, permission) => {
  const user = typeof userOrRole === 'string' ? { role: userOrRole } : userOrRole;
  if (!user || !user.role) return false;
  if (Array.isArray(user.customPermissions)) {
    return user.customPermissions.includes(permission);
  }
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
};

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

// ============================================================================
// 3. DANH MỤC CÁC QUYỀN HẠN CHUNG TOÀN HỆ THỐNG (GLOBAL PERMISSIONS)
// ============================================================================
export const GLOBAL_PERMISSIONS = {
  ACCESS_PORTAL: 'global.access_portal',
  VIEW_EMPLOYEES: 'global.view_employees',
  MANAGE_EMPLOYEES: 'global.manage_employees',
  ACCESS_ADMIN_SETTINGS: 'global.access_admin_settings',
  CONFIGURE_SYSTEM: 'global.configure_system',
  TOGGLE_MODULES: 'global.toggle_modules',
};

export const GLOBAL_PERMISSIONS_CONFIG = [
  {
    key: GLOBAL_PERMISSIONS.ACCESS_PORTAL,
    label: 'Truy cập Cổng phân hệ',
    description: 'Quyền xem danh mục phân hệ và điều hướng các ứng dụng nghiệp vụ.',
    category: 'Hệ thống chung',
  },
  {
    key: GLOBAL_PERMISSIONS.VIEW_EMPLOYEES,
    label: 'Xem Danh bạ cán bộ',
    description: 'Xem thông tin hồ sơ cán bộ nhân viên, chức vụ và phòng ban.',
    category: 'Nhân sự',
  },
  {
    key: GLOBAL_PERMISSIONS.MANAGE_EMPLOYEES,
    label: 'Quản trị hồ sơ cán bộ',
    description: 'Thêm, sửa, cập nhật hồ sơ và ban hành quyết định luân chuyển điều động.',
    category: 'Nhân sự',
  },
  {
    key: GLOBAL_PERMISSIONS.ACCESS_ADMIN_SETTINGS,
    label: 'Truy cập Quản trị & Cấu hình',
    description: 'Quyền vào phân hệ Quản trị hệ thống.',
    category: 'Quản trị',
  },
  {
    key: GLOBAL_PERMISSIONS.CONFIGURE_SYSTEM,
    label: 'Cấu hình tham số tổ chức',
    description: 'Thiết lập thông tin pháp nhân, danh mục phòng ban và chức danh dùng chung.',
    category: 'Quản trị',
  },
  {
    key: GLOBAL_PERMISSIONS.TOGGLE_MODULES,
    label: 'Bật / Tắt phân hệ Webapp',
    description: 'Đặc quyền kiểm soát Registry và trạng thái kích hoạt của từng phân hệ.',
    category: 'Quản trị Cấp cao',
  },
];

// ============================================================================
// 4. DANH MỤC PHÂN QUYỀN CHUYÊN BIỆT PHÂN HỆ TÍN NHIỆM (MODULE TRUST PERMISSIONS)
// ============================================================================
export const TRUST_PERMISSIONS = {
  MANAGE_PERIODS: 'trust.manage_periods',
  MANAGE_CRITERIA: 'trust.manage_criteria',
  VOTE: 'trust.vote',
  VIEW_OWN_RESULTS: 'trust.view_own_results',
  VIEW_OWN_SUBMITTED: 'trust.view_own_submitted',
  VIEW_AGGREGATE_REPORT: 'trust.view_aggregate_report',
  PRINT_OFFICIAL_REPORT: 'trust.print_official_report',
};

export const TRUST_PERMISSIONS_CONFIG = [
  {
    key: TRUST_PERMISSIONS.MANAGE_PERIODS,
    label: 'Quản trị Đợt lấy phiếu',
    description: 'Tạo đợt mới, thiết lập thời gian bắt đầu - kết thúc, chỉ định cán bộ và đóng đợt.',
  },
  {
    key: TRUST_PERMISSIONS.MANAGE_CRITERIA,
    label: 'Quản lý Bộ tiêu chí tín nhiệm',
    description: 'Thêm, chỉnh sửa hoặc điều chỉnh thang điểm và trọng số 10 tiêu chí chuẩn NHNN.',
  },
  {
    key: TRUST_PERMISSIONS.VOTE,
    label: 'Tham gia Bỏ phiếu tín nhiệm',
    description: 'Quyền chấm điểm từ 1 đến 10 cho các cán bộ trong đợt lấy phiếu tín nhiệm.',
  },
  {
    key: TRUST_PERMISSIONS.VIEW_OWN_RESULTS,
    label: 'Xem Điểm tín nhiệm cá nhân',
    description: 'Xem điểm số và xếp loại của chính mình sau khi đợt lấy phiếu hoàn tất.',
  },
  {
    key: TRUST_PERMISSIONS.VIEW_OWN_SUBMITTED,
    label: 'Xem Phiếu bản thân đã nộp',
    description: 'Xem lại các phiếu và mức điểm mình đã chấm cho các đồng nghiệp khác.',
  },
  {
    key: TRUST_PERMISSIONS.VIEW_AGGREGATE_REPORT,
    label: 'Xem Báo cáo Tổng quan Toàn Quỹ',
    description: 'Xem bảng tổng hợp xếp loại Xuất sắc/Tốt/Hoàn thành và tỷ lệ tín nhiệm toàn Quỹ.',
  },
  {
    key: TRUST_PERMISSIONS.PRINT_OFFICIAL_REPORT,
    label: 'In Biên bản kiểm phiếu A4',
    description: 'Quyền xuất và in biên bản kiểm phiếu tín nhiệm trình Ban Lãnh đạo Quỹ.',
  },
];

// ============================================================================
// 5. MA TRẬN PHÂN QUYỀN MẶC ĐỊNH THEO VAI TRÒ CHUẨN MỰC (RBAC MATRIX)
// ============================================================================
export const SYSTEM_ROLES_LIST = [
  { code: 'superadmin', label: 'Quản trị viên Cấp cao (SuperAdmin)', order: 1 },
  { code: 'chairman', label: 'Chủ tịch HĐQT', order: 2 },
  { code: 'manager', label: 'Giám đốc Điều hành', order: 3 },
  { code: 'board_member', label: 'Thành viên HĐQT chuyên trách', order: 4 },
  { code: 'supervisor', label: 'Ban Kiểm soát', order: 5 },
  { code: 'staff', label: 'Cán bộ nhân viên', order: 6 },
];

export const DEFAULT_ROLE_PERMISSIONS = {
  global: {
    superadmin: [
      GLOBAL_PERMISSIONS.ACCESS_PORTAL,
      GLOBAL_PERMISSIONS.VIEW_EMPLOYEES,
      GLOBAL_PERMISSIONS.MANAGE_EMPLOYEES,
      GLOBAL_PERMISSIONS.ACCESS_ADMIN_SETTINGS,
      GLOBAL_PERMISSIONS.CONFIGURE_SYSTEM,
      GLOBAL_PERMISSIONS.TOGGLE_MODULES,
    ],
    chairman: [
      GLOBAL_PERMISSIONS.ACCESS_PORTAL,
      GLOBAL_PERMISSIONS.VIEW_EMPLOYEES,
      GLOBAL_PERMISSIONS.MANAGE_EMPLOYEES,
      GLOBAL_PERMISSIONS.ACCESS_ADMIN_SETTINGS,
      GLOBAL_PERMISSIONS.CONFIGURE_SYSTEM,
    ],
    manager: [
      GLOBAL_PERMISSIONS.ACCESS_PORTAL,
      GLOBAL_PERMISSIONS.VIEW_EMPLOYEES,
      GLOBAL_PERMISSIONS.MANAGE_EMPLOYEES,
      GLOBAL_PERMISSIONS.ACCESS_ADMIN_SETTINGS,
    ],
    board_member: [
      GLOBAL_PERMISSIONS.ACCESS_PORTAL,
      GLOBAL_PERMISSIONS.VIEW_EMPLOYEES,
    ],
    supervisor: [
      GLOBAL_PERMISSIONS.ACCESS_PORTAL,
      GLOBAL_PERMISSIONS.VIEW_EMPLOYEES,
    ],
    staff: [
      GLOBAL_PERMISSIONS.ACCESS_PORTAL,
      GLOBAL_PERMISSIONS.VIEW_EMPLOYEES,
    ],
  },
  trust: {
    superadmin: [
      TRUST_PERMISSIONS.MANAGE_PERIODS,
      TRUST_PERMISSIONS.MANAGE_CRITERIA,
      TRUST_PERMISSIONS.VOTE,
      TRUST_PERMISSIONS.VIEW_OWN_RESULTS,
      TRUST_PERMISSIONS.VIEW_OWN_SUBMITTED,
      TRUST_PERMISSIONS.VIEW_AGGREGATE_REPORT,
      TRUST_PERMISSIONS.PRINT_OFFICIAL_REPORT,
    ],
    chairman: [
      TRUST_PERMISSIONS.MANAGE_PERIODS,
      TRUST_PERMISSIONS.MANAGE_CRITERIA,
      TRUST_PERMISSIONS.VOTE,
      TRUST_PERMISSIONS.VIEW_OWN_RESULTS,
      TRUST_PERMISSIONS.VIEW_OWN_SUBMITTED,
      TRUST_PERMISSIONS.VIEW_AGGREGATE_REPORT,
      TRUST_PERMISSIONS.PRINT_OFFICIAL_REPORT,
    ],
    manager: [
      TRUST_PERMISSIONS.MANAGE_PERIODS,
      TRUST_PERMISSIONS.VOTE,
      TRUST_PERMISSIONS.VIEW_OWN_RESULTS,
      TRUST_PERMISSIONS.VIEW_OWN_SUBMITTED,
      TRUST_PERMISSIONS.VIEW_AGGREGATE_REPORT,
      TRUST_PERMISSIONS.PRINT_OFFICIAL_REPORT,
    ],
    board_member: [
      TRUST_PERMISSIONS.VOTE,
      TRUST_PERMISSIONS.VIEW_OWN_RESULTS,
      TRUST_PERMISSIONS.VIEW_OWN_SUBMITTED,
      TRUST_PERMISSIONS.VIEW_AGGREGATE_REPORT,
    ],
    supervisor: [
      TRUST_PERMISSIONS.VOTE,
      TRUST_PERMISSIONS.VIEW_OWN_RESULTS,
      TRUST_PERMISSIONS.VIEW_OWN_SUBMITTED,
      TRUST_PERMISSIONS.VIEW_AGGREGATE_REPORT,
      TRUST_PERMISSIONS.PRINT_OFFICIAL_REPORT,
    ],
    staff: [
      TRUST_PERMISSIONS.VOTE,
      TRUST_PERMISSIONS.VIEW_OWN_RESULTS,
      TRUST_PERMISSIONS.VIEW_OWN_SUBMITTED,
    ],
  },
};

export const normalizeUserRole = (user, explicitRole = null) => {
  if (!user) return 'staff';
  const emailLower = user.email ? user.email.trim().toLowerCase() : '';

  if (emailLower === 'qtdyentho@gmail.com' || user.role === 'superadmin' || explicitRole === 'superadmin') {
    return 'superadmin';
  }
  if (
    emailLower.includes('ducanh') ||
    emailLower.includes('nguyenducthao') ||
    user.position?.includes('Chủ tịch') ||
    user.role === 'chairman' ||
    explicitRole === 'chairman'
  ) {
    return 'chairman';
  }
  if (
    emailLower.includes('son') ||
    emailLower.includes('giamdoc') ||
    user.position?.includes('Giám đốc') ||
    user.role === 'manager' ||
    explicitRole === 'manager'
  ) {
    return 'manager';
  }
  if (
    user.department?.includes('Hội đồng Quản trị') ||
    user.position?.includes('HĐQT') ||
    emailLower.includes('hdqt') ||
    user.role === 'board_member'
  ) {
    return 'board_member';
  }
  if (
    user.department?.includes('Ban Kiểm soát') ||
    user.position?.includes('Kiểm soát') ||
    user.role === 'supervisor'
  ) {
    return 'supervisor';
  }
  if (user.role === 'admin' || explicitRole === 'admin') {
    return 'chairman';
  }
  return 'staff';
};

export const checkUserPermission = (user, permissionKey, customPermissions = null) => {
  if (!user || !permissionKey) return false;
  const roleCode = normalizeUserRole(user);
  if (roleCode === 'superadmin') return true;

  const [domain] = permissionKey.split('.');
  const permissionsSource = customPermissions || DEFAULT_ROLE_PERMISSIONS;
  const domainPerms = permissionsSource[domain];
  if (!domainPerms) return false;

  const rolePermList = domainPerms[roleCode] || [];
  if (rolePermList.includes('*')) return true;

  return rolePermList.includes(permissionKey);
};

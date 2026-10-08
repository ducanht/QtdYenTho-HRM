// Danh mục Dữ liệu Mặc định & Chuẩn hóa Hệ thống (System Defaults)
// Quỹ Tín Dụng Nhân Dân Yên Thọ - Thanh Hóa
// Áp dụng Chính sách Triệt tiêu 100% Mock Data (Zero Mock Data Policy)
// Toàn bộ dữ liệu nghiệp vụ sau khởi tạo đều được quản lý thời gian thực qua Cloud Firestore

import { ROLES } from './constants';

// ============================================================================
// 1. DANH MỤC PHÒNG BAN CHUẨN CỦA QUỸ
// ============================================================================
export const DEFAULT_DEPARTMENTS = [
  { id: 'dept-01', code: 'HDQT', name: 'Hội đồng Quản trị', order: 1 },
  { id: 'dept-02', code: 'BKS', name: 'Ban Kiểm soát', order: 2 },
  { id: 'dept-03', code: 'BDH', name: 'Ban Điều hành', order: 3 },
  { id: 'dept-04', code: 'TD', name: 'Phòng Tín dụng', order: 4 },
  { id: 'dept-05', code: 'KTNQ', name: 'Phòng Kế toán - Ngân quỹ', order: 5 },
];

// ============================================================================
// 2. DANH MỤC CHỨC VỤ / VỊ TRÍ CÔNG TÁC CHUẨN
// ============================================================================
export const DEFAULT_POSITIONS = [
  { id: 'pos-01', code: 'CT_HDQT', name: 'Chủ tịch HĐQT', department: 'Hội đồng Quản trị', order: 1 },
  { id: 'pos-02', code: 'TV_HDQT', name: 'Thành viên HĐQT chuyên trách', department: 'Hội đồng Quản trị', order: 2 },
  { id: 'pos-03', code: 'TR_BKS', name: 'Trưởng Ban kiểm soát', department: 'Ban Kiểm soát', order: 3 },
  { id: 'pos-04', code: 'GD', name: 'Giám đốc điều hành', department: 'Ban Điều hành', order: 4 },
  { id: 'pos-05', code: 'PGD_TD', name: 'Phó Giám đốc', department: 'Ban Điều hành', order: 5 },
  { id: 'pos-06', code: 'KTT', name: 'Kế toán trưởng', department: 'Phòng Kế toán - Ngân quỹ', order: 6 },
  { id: 'pos-07', code: 'KTV', name: 'Kế toán viên', department: 'Phòng Kế toán - Ngân quỹ', order: 7 },
  { id: 'pos-08', code: 'TQ', name: 'Thủ quỹ', department: 'Phòng Kế toán - Ngân quỹ', order: 8 },
  { id: 'pos-09', code: 'CBTD', name: 'Cán bộ tín dụng', department: 'Phòng Tín dụng', order: 9 },
  { id: 'pos-10', code: 'TDTS', name: 'Thẩm định tài sản', department: 'Phòng Tín dụng', order: 10 },
];

// ============================================================================
// 3. DANH MỤC CHỨC DANH QUY HOẠCH CÁN BỘ NGUỒN
// ============================================================================
export const DEFAULT_PLANNING_POSITIONS = [
  'Chủ tịch Hội đồng Quản trị',
  'Thành viên chuyên trách HĐQT',
  'Giám đốc điều hành',
  'Phó Giám đốc phụ trách Tín dụng',
  'Phó Giám đốc phụ trách Kế toán - Kho quỹ',
  'Trưởng Ban Kiểm soát',
  'Thành viên Ban Kiểm soát',
  'Kế toán trưởng',
  'Trưởng phòng Tín dụng',
];

// ============================================================================
// 4. DANH MỤC 10 TIÊU CHÍ ĐÁNH GIÁ TÍN NHIỆM CHUẨN MỰC
// ============================================================================
export const DEFAULT_TRUST_CRITERIA = [
  {
    id: 1,
    code: 'TC01',
    group: 'Phẩm chất đạo đức',
    title: '1. Tinh thần trách nhiệm & Đạo đức nghề nghiệp',
    description: 'Tận tụy với công việc, trung thực, có tinh thần trách nhiệm cao, giữ gìn và phát huy uy tín thương hiệu của Quỹ.',
    maxScore: 10,
    minScore: 0,
    weight: 10,
  },
  {
    id: 2,
    code: 'TC02',
    group: 'Tuân thủ pháp luật & Quy chế',
    title: '2. Chấp hành Quy chế, Nội quy & Pháp luật NHNN',
    description: 'Nghiêm túc tuân thủ quy trình tín dụng, kế toán, an toàn kho quỹ và các văn bản chỉ đạo của Ngân hàng Nhà nước.',
    maxScore: 10,
    minScore: 0,
    weight: 10,
  },
  {
    id: 3,
    code: 'TC03',
    group: 'Năng lực chuyên môn',
    title: '3. Năng lực chuyên môn & Nghiệp vụ chuyên sâu',
    description: 'Nắm vững quy trình nghiệp vụ, xử lý hồ sơ nhanh chóng, chuẩn xác, hạn chế tối đa sai sót rủi ro vận hành.',
    maxScore: 10,
    minScore: 0,
    weight: 10,
  },
  {
    id: 4,
    code: 'TC04',
    group: 'Văn hóa giao dịch',
    title: '4. Tác phong giao dịch & Văn hóa phục vụ thành viên',
    description: 'Ân cần, niềm nở, lịch thiệp khi tiếp xúc thành viên và khách hàng vay/gửi vốn, không quan liêu, hách dịch.',
    maxScore: 10,
    minScore: 0,
    weight: 10,
  },
  {
    id: 5,
    code: 'TC05',
    group: 'Xây dựng tập thể',
    title: '5. Tinh thần đoàn kết & Phối hợp phòng ban',
    description: 'Tương trợ đồng nghiệp, phối hợp nhịp nhàng giữa Tín dụng, Kế toán, Kiểm soát và Ban điều hành.',
    maxScore: 10,
    minScore: 0,
    weight: 10,
  },
  {
    id: 6,
    code: 'TC06',
    group: 'Kỷ luật & Bảo mật',
    title: '6. Kỷ luật giờ giấc & Bảo mật thông tin tài chính',
    description: 'Chấp hành thời giờ làm việc, bảo quản tài liệu lưu trữ, giữ bí mật tuyệt đối số dư tiền gửi và hồ sơ khách hàng.',
    maxScore: 10,
    minScore: 0,
    weight: 10,
  },
  {
    id: 7,
    code: 'TC07',
    group: 'Đổi mới & Cải tiến',
    title: '7. Đổi mới sáng tạo & Chuyển đổi số',
    description: 'Chủ động làm chủ phần mềm quản lý, ứng dụng công nghệ trong tác nghiệp, có giải pháp cải tiến hiệu quả.',
    maxScore: 10,
    minScore: 0,
    weight: 10,
  },
  {
    id: 8,
    code: 'TC08',
    group: 'Liêm chính tài chính',
    title: '8. Liêm chính tài chính & Phòng ngừa rủi ro đạo đức',
    description: 'Minh bạch tiền tệ, tuyệt đối không vòi vĩnh chi phí ngoài quy định, không thông đồng trục lợi tín dụng.',
    maxScore: 10,
    minScore: 0,
    weight: 10,
  },
  {
    id: 9,
    code: 'TC09',
    group: 'Phong trào đơn vị',
    title: '9. Đóng góp phong trào & Văn hóa tổ chức',
    description: 'Nhiệt tình tham gia các hoạt động an sinh xã hội, phong trào công đoàn, xây dựng đơn vị vững mạnh.',
    maxScore: 10,
    minScore: 0,
    weight: 10,
  },
  {
    id: 10,
    code: 'TC10',
    group: 'Kết quả công tác',
    title: '10. Hiệu quả hoàn thành chỉ tiêu công việc',
    description: 'Hoàn thành và hoàn thành vượt mức các chỉ tiêu được giao về dư nợ, huy động vốn, kiểm soát nợ quá hạn.',
    maxScore: 10,
    minScore: 0,
    weight: 10,
  },
];

// ============================================================================
// 5. CẤU HÌNH THÔNG TIN PHÁP NHÂN & HỆ THỐNG MẶC ĐỊNH
// ============================================================================
export const DEFAULT_SYSTEM_SETTINGS = {
  unitName: 'Quỹ Tín Dụng Nhân Dân Yên Thọ',
  shortName: 'QTDND Yên Thọ',
  address: 'Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa',
  licenseNo: 'Giấy phép hoạt động NHNN Chi nhánh tỉnh Thanh Hóa',
  phone: '0237.3871.xxx',
  email: 'qtdyentho@gmail.com',
  website: 'https://qtdyentho-hrm.web.app',
  chairmanName: 'Trịnh Đức Anh',
  directorName: 'Nguyễn Văn Sơn',
  transferCycleMonths: 36, // Chu kỳ luân chuyển cán bộ tín dụng (36 tháng)
  planningThresholdPercent: 50, // Ngưỡng trúng quy hoạch (>= 50%)
  kpiWeightSelf: 40,
  kpiWeightManager: 30,
  kpiWeightChairman: 30,
  trustGradeExcellent: 90,
  trustGradeGood: 70,
  trustGradePass: 50,
};

// ============================================================================
// 5.1 CẤU HÌNH CHUYÊN BIỆT TỪNG PHÂN HỆ (SUBSYSTEM DOMAIN SETTINGS)
// ============================================================================

// Phân hệ Tín Nhiệm (MODULE_TRUST)
export const DEFAULT_MODULE_TRUST_SETTINGS = {
  excellentThreshold: 90,
  goodThreshold: 70,
  passThreshold: 50,
  defaultVotingMode: 'ANONYMOUS', // 'ANONYMOUS' | 'IDENTIFIED'
  allowSelfEvaluation: false,     // Tuyệt đối không cho phép tự đánh giá
  autoSaveDraftIntervalSec: 10,  // Tự động lưu nháp mỗi 10 giây
  criteriaCount: 10,
  printReportTitle: 'BIÊN BẢN TỔNG HỢP KẾT QUẢ LẤY PHIẾU TÍN NHIỆM',
  signers: [
    { role: 'TRƯỞNG BAN KIỂM SOÁT', title: 'Trưởng Ban Kiểm soát' },
    { role: 'GIÁM ĐỐC ĐIỀU HÀNH', title: 'Giám đốc' },
    { role: 'CHỦ TỊCH HỘI ĐỒNG QUẢN TRỊ', title: 'Chủ tịch HĐQT' },
  ],
};

// Phân hệ Nhân Sự & Luân Chuyển (MODULE_HR)
export const DEFAULT_MODULE_HR_SETTINGS = {
  transferCycleMonths: 36,        // Chu kỳ tối đa luân chuyển cán bộ tín dụng
  warningDaysBefore: 90,          // Cảnh báo trước 90 ngày
  requireDebtHandover: true,      // Yêu cầu biên bản bàn giao nợ trước khi chuyển địa bàn
  codePrefix: 'CB',               // Tiền tố mã nhân viên
  autoGenerateCode: true,
  transferTypes: [
    { code: 'LUAN_CHUYEN_DINH_KY', label: 'Luân chuyển định kỳ địa bàn tín dụng' },
    { code: 'BO_NHIEM', label: 'Bổ nhiệm chức danh quản lý' },
    { code: 'BO_NHIEM_LAI', label: 'Bổ nhiệm lại' },
    { code: 'PHAN_CONG_CHUYEN_TRACH', label: 'Phân công chuyên trách nghiệp vụ' },
    { code: 'DIEU_DONG_NOI_BO', label: 'Điều động nội bộ phòng ban' },
  ],
};

// Phân hệ Đánh Giá KPI 3 Cấp (MODULE_KPI)
export const DEFAULT_MODULE_KPI_SETTINGS = {
  weightSelf: 40,                 // Cấp 1: Cán bộ tự chấm
  weightManager: 30,              // Cấp 2: Ban Điều hành thẩm tra
  weightChairman: 30,             // Cấp 3: Chủ tịch HĐQT phê chuẩn
  evaluationPeriod: 'MONTHLY',    // 'MONTHLY' | 'QUARTERLY'
  dueDayOfMonth: 25,              // Hạn nộp bảng tự chấm hàng tháng
  excellentThreshold: 90,
  goodThreshold: 75,
  passThreshold: 60,
  targetCategories: ['Tín dụng & Dư nợ', 'Huy động vốn', 'An toàn kho quỹ & Kế toán', 'Kiểm soát tuân thủ'],
};

// Phân hệ Quy Hoạch Nguồn (MODULE_PLANNING)
export const DEFAULT_MODULE_PLANNING_SETTINGS = {
  thresholdPercent: 50,           // Ngưỡng trúng quy hoạch (>= 50% số phiếu)
  termYears: 5,                   // Nhiệm kỳ quy hoạch (5 năm)
  maxCandidatesPerPosition: 3,    // Số ứng viên tối đa cho 1 chức danh
  minimumTenureMonths: 24,        // Thời gian công tác tối thiểu tại Quỹ
};

// Phân hệ Chấm Công & Ca Trực (MODULE_ATTENDANCE - Đang triển khai)
export const DEFAULT_MODULE_ATTENDANCE_SETTINGS = {
  morningShiftStart: '07:30',
  morningShiftEnd: '11:30',
  afternoonShiftStart: '13:30',
  afternoonShiftEnd: '17:00',
  vaultGuardStart: '17:00',
  vaultGuardEnd: '07:30',
  annualLeaveDays: 12,
  allowLateMinutes: 15,
  gracePeriodMinutes: 30,
};

// Phân hệ Tiền Lương & Đãi Ngộ (MODULE_PAYROLL - Đang triển khai)
export const DEFAULT_MODULE_PAYROLL_SETTINGS = {
  baseSalaryCoeff: 1.0,
  kpiSalaryWeight: 30,            // Tỷ trọng lương kinh doanh theo KPI (%)
  socialInsuranceRate: 10.5,      // Tỷ lệ trích nộp BHXH cá nhân (%)
  meetingAllowance: 500000,       // Thù lao họp HĐQT/BKS (VNĐ/buổi)
  payDayOfMonth: 10,              // Ngày chi trả lương hàng tháng
};

// Phân hệ Thi Đua Khen Thưởng (MODULE_AWARDS - Đang triển khai)
export const DEFAULT_MODULE_AWARDS_SETTINGS = {
  titles: [
    { id: 'T1', name: 'Chiến sĩ thi đua cấp cơ sở', bonus: 2000000, condition: 'KPI Xuất sắc 12 tháng + Tín nhiệm >= 90' },
    { id: 'T2', name: 'Lao động tiên tiến', bonus: 1000000, condition: 'KPI Tốt trở lên + Tín nhiệm >= 70' },
    { id: 'T3', name: 'Tập thể lao động xuất sắc', bonus: 5000000, condition: '100% cá nhân hoàn thành nhiệm vụ' },
  ],
  reviewMonth: 12,                // Tháng bình xét cuối năm
};


// ============================================================================
// 6. DANH MỤC KỲ ĐÁNH GIÁ MẶC ĐỊNH
// ============================================================================
export const DEFAULT_EVALUATION_PERIODS = [
  {
    id: 'PERIOD-2026-Q3',
    name: 'Đánh giá tín nhiệm Quý III / 2026',
    year: 2026,
    quarter: 3,
    votingMode: 'OPTIONAL', // 'ANONYMOUS_ONLY' | 'IDENTIFIED_ONLY' | 'OPTIONAL'
    status: 'ACTIVE',
    startDate: '2026-09-15',
    endDate: '2026-10-31',
  },
  {
    id: 'PERIOD-2026-Q4',
    name: 'Đánh giá tín nhiệm & Thi đua Cuối Năm 2026',
    year: 2026,
    quarter: 4,
    votingMode: 'ANONYMOUS_ONLY', // Bỏ phiếu kín 100%
    status: 'UPCOMING',
    startDate: '2026-12-01',
    endDate: '2026-12-31',
  },
];

// ============================================================================
// 7. DANH BẠ 12 CÁN BỘ CHÍNH THỨC CỦA QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ
// ============================================================================
export const OFFICIAL_EMPLOYEES = [
  {
    id: 'emp-root',
    order: 0,
    code: 'ROOT',
    name: 'Quản trị viên Cấp cao (SuperAdmin)',
    gender: 'Nam',
    birthDate: '',
    cccd: '038000000001',
    email: 'qtdyentho@gmail.com',
    role: ROLES.SUPERADMIN,
    department: 'Cổng Quản trị Webapp',
    position: 'Quản trị viên Cấp cao',
    assignedArea: 'Quản trị toàn diện Webapp, Feature Flags & Cấu hình tham số',
    partyMember: true,
    politicalRole: 'Quản trị hệ thống',
    partyDate: '2003-01-01',
    partyOfficialDate: '2004-01-01',
    education: 'Kỹ sư Hệ thống',
    joinDate: '2003-01-01',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: false,
    phone: '0965122111',
  },
  {
    id: 'emp-001',
    order: 1,
    code: 'CB01',
    name: 'Nguyễn Thị Sinh',
    gender: 'Nữ',
    birthDate: '',
    cccd: '038162004401',
    email: 'Sinhtdyt@gmail.com',
    role: ROLES.STAFF,
    department: 'Phòng Tín dụng',
    position: 'Thẩm định tài sản',
    assignedArea: 'Bộ phận Thẩm định tài sản & Hồ sơ vay vốn',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2005-03-09',
    partyOfficialDate: '2006-03-09',
    education: 'Chờ bổ sung',
    joinDate: '2005-03-09',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0388232844',
  },
  {
    id: 'emp-002',
    order: 2,
    code: 'CB02',
    name: 'Nguyễn Thị Mến',
    gender: 'Nữ',
    birthDate: '',
    cccd: '038183011409',
    email: 'Mennguyen0201@gmail.com',
    role: ROLES.STAFF,
    department: 'Phòng Kế toán - Ngân quỹ',
    position: 'Kế toán trưởng',
    assignedArea: 'Phụ trách toàn diện Kế toán & Ngân quỹ',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2007-06-12',
    partyOfficialDate: '2008-06-12',
    education: 'Chờ bổ sung',
    joinDate: '2007-06-12',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0979603058',
  },
  {
    id: 'emp-003',
    order: 3,
    code: 'CB03',
    name: 'Nguyễn Văn Sơn',
    gender: 'Nam',
    birthDate: '',
    cccd: '038080004554',
    email: 'Sonqtdyt@gmail.com',
    role: ROLES.ADMIN,
    department: 'Ban Điều hành',
    position: 'Giám đốc',
    assignedArea: 'Điều hành toàn diện hoạt động kinh doanh Quỹ',
    partyMember: true,
    politicalRole: 'Phó Bí thư Chi bộ',
    partyDate: '2008-07-28',
    partyOfficialDate: '2009-07-28',
    education: 'Chờ bổ sung',
    joinDate: '2008-07-28',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0983804868',
  },
  {
    id: 'emp-004',
    order: 4,
    code: 'CB04',
    name: 'Bùi Thị Thảo',
    gender: 'Nữ',
    birthDate: '',
    cccd: '038183002598',
    email: 'Thaoqtdyt@gmail.com',
    role: ROLES.STAFF,
    department: 'Ban Kiểm soát',
    position: 'Trưởng ban kiểm soát',
    assignedArea: 'Kiểm soát nội bộ & Giám sát tuân thủ',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2010-04-15',
    partyOfficialDate: '2011-04-15',
    education: 'Chờ bổ sung',
    joinDate: '2010-04-15',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0978939226',
  },
  {
    id: 'emp-005',
    order: 5,
    code: 'CB05',
    name: 'Nguyễn Hữu Nhân',
    gender: 'Nam',
    birthDate: '',
    cccd: '038088018314',
    email: 'Nhanqtdyt@gmail.com',
    role: ROLES.STAFF,
    department: 'Phòng Tín dụng',
    position: 'CB tín dụng',
    assignedArea: 'Quản lý khách hàng vay vốn & thẩm định thực địa',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2012-05-18',
    partyOfficialDate: '2013-05-18',
    education: 'Chờ bổ sung',
    joinDate: '2012-05-18',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0975618698',
  },
  {
    id: 'emp-006',
    order: 6,
    code: 'CB06',
    name: 'Nguyễn Hữu Hiếu',
    gender: 'Nam',
    birthDate: '',
    cccd: '038089006961',
    email: 'hieuqtdyt@gmail.com',
    role: ROLES.STAFF,
    department: 'Phòng Tín dụng',
    position: 'CB tín dụng',
    assignedArea: 'Quản lý phát triển khách hàng vay & thẩm định tài sản',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2014-06-20',
    partyOfficialDate: '2015-06-20',
    education: 'Chờ bổ sung',
    joinDate: '2014-06-20',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0989394555',
  },
  {
    id: 'emp-007',
    order: 7,
    code: 'CB07',
    name: 'Trịnh Đức Anh',
    gender: 'Nam',
    birthDate: '',
    cccd: '038090008888',
    email: 'ducanht@gmail.com',
    role: ROLES.ADMIN,
    department: 'Hội đồng Quản trị',
    position: 'Chủ tịch HĐQT',
    assignedArea: 'Lãnh đạo toàn diện Hội đồng Quản trị Quỹ',
    partyMember: true,
    politicalRole: 'Bí thư Chi bộ',
    partyDate: '2015-08-15',
    partyOfficialDate: '2016-08-15',
    education: 'Đại học chuyên ngành Tài chính - Ngân hàng',
    joinDate: '2015-08-15',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: false,
    phone: '0988668866',
  },
  {
    id: 'emp-008',
    order: 8,
    code: 'CB08',
    name: 'Lê Ngọc Huynh',
    gender: 'Nam',
    birthDate: '',
    cccd: '038092004556',
    email: 'huynhqtdyt@gmail.com',
    role: ROLES.STAFF,
    department: 'Phòng Tín dụng',
    position: 'CB tín dụng',
    assignedArea: 'Quản lý thành viên vay vốn & thẩm định tài sản',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2018-09-10',
    partyOfficialDate: '2019-09-10',
    education: 'Chờ bổ sung',
    joinDate: '2018-09-10',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0988234567',
  },
  {
    id: 'emp-009',
    order: 9,
    code: 'CB09',
    name: 'Trần Như Huyền',
    gender: 'Nữ',
    birthDate: '',
    cccd: '038189039532',
    email: 'Huyennhutran@gmail.com',
    role: ROLES.STAFF,
    department: 'Phòng Tín dụng',
    position: 'CB tín dụng',
    assignedArea: 'Quản lý khách hàng vay & thẩm định tín dụng',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2020-12-11',
    partyOfficialDate: '2021-12-11',
    education: 'Chờ bổ sung',
    joinDate: '2020-12-11',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0985709609',
  },
  {
    id: 'emp-010',
    order: 10,
    code: 'CB10',
    name: 'Hoàng Thị Lan',
    gender: 'Nữ',
    birthDate: '',
    cccd: '038189040044',
    email: 'hoanglan1289@gmail.com',
    role: ROLES.STAFF,
    department: 'Phòng Kế toán - Ngân quỹ',
    position: 'Kế toán viên',
    assignedArea: 'Hạch toán kế toán, thanh toán & đối soát',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2021-10-08',
    partyOfficialDate: '2022-10-08',
    education: 'Chờ bổ sung',
    joinDate: '2021-10-08',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0965178666',
  },
  {
    id: 'emp-011',
    order: 11,
    code: 'CB11',
    name: 'Phạm Thị Thảo',
    gender: 'Nữ',
    birthDate: '',
    cccd: '038190051894',
    email: 'qtdyentho.phamthao@gmail.com',
    role: ROLES.STAFF,
    department: 'Phòng Kế toán - Ngân quỹ',
    position: 'Thủ quỹ',
    assignedArea: 'Quản lý kho quỹ, tiền mặt & thu chi tại quầy',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2023-09-06',
    partyOfficialDate: '2024-09-06',
    education: 'Chờ bổ sung',
    joinDate: '2023-09-06',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0965567596',
  },
  {
    id: 'emp-012',
    order: 12,
    code: 'CB12',
    name: 'Lưu Thị Định',
    gender: 'Nữ',
    birthDate: '',
    cccd: '038189028302',
    email: 'qtdyentho.luudinh@gmail.com',
    role: ROLES.STAFF,
    department: 'Phòng Tín dụng',
    position: 'CB tín dụng',
    assignedArea: 'Quản lý khách hàng vay & thẩm định địa bàn',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2024-09-06',
    partyOfficialDate: '2025-09-06',
    education: 'Chờ bổ sung',
    joinDate: '2024-09-06',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0961007855',
  },
  {
    id: 'emp-013',
    order: 13,
    code: 'CB13',
    name: 'Vũ Thị Hiền',
    gender: 'Nữ',
    birthDate: '',
    cccd: '038185002222',
    email: 'qtdyentho.vuhien@gmail.com',
    role: ROLES.ADMIN,
    department: 'Hội đồng Quản trị',
    position: 'Thành viên HĐQT chuyên trách',
    assignedArea: 'Thành viên Hội đồng Quản trị chuyên trách',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2016-05-19',
    partyOfficialDate: '2017-05-19',
    education: 'Đại học Kinh tế',
    joinDate: '2016-05-19',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0988123456',
  },
];

// ============================================================================
// 8. LỊCH SỬ LUÂN CHUYỂN CÔNG TÁC CÁN BỘ (QUYẾT ĐỊNH CỦA HĐQT)
// ============================================================================
export const OFFICIAL_WORK_HISTORY = [
  {
    id: 'trans-001',
    employeeId: 'emp-005',
    employeeCode: 'CB05',
    employeeName: 'Nguyễn Hữu Nhân',
    decisionNumber: '24/QĐ-HĐQT-2022',
    decisionDate: '2022-08-10',
    effectiveDate: '2022-08-15',
    transferType: 'LUAN_CHUYEN_DINH_KY',
    transferTypeLabel: 'Luân chuyển định kỳ địa bàn tín dụng',
    fromDepartment: 'Phòng Tín dụng',
    toDepartment: 'Phòng Tín dụng',
    fromPosition: 'Cán bộ Tín dụng phụ trách cụm thôn',
    toPosition: 'Cán bộ Tín dụng chính phụ trách địa bàn Yên Thọ',
    fromAssignedArea: 'Cụm thôn xã Quý Lộc',
    toAssignedArea: 'Toàn địa bàn xã Yên Thọ',
    signer: 'Trịnh Đức Anh (Chủ tịch HĐQT)',
    reason: 'Thực hiện quy định NHNN về luân chuyển định kỳ cán bộ tín dụng sau 3 năm.',
    handoverStatus: 'DA_BAN_GIAO',
    notes: 'Đã hoàn tất bàn giao hồ sơ tín dụng và tài sản bảo đảm.',
  },
  {
    id: 'trans-002',
    employeeId: 'emp-002',
    employeeCode: 'CB02',
    employeeName: 'Nguyễn Thị Mến',
    decisionNumber: '08/QĐ-HĐQT-2020',
    decisionDate: '2020-03-12',
    effectiveDate: '2020-04-01',
    transferType: 'BO_NHIEM',
    transferTypeLabel: 'Bổ nhiệm Kế toán trưởng',
    fromDepartment: 'Phòng Kế toán - Ngân quỹ',
    toDepartment: 'Phòng Kế toán - Ngân quỹ',
    fromPosition: 'Kế toán viên chính',
    toPosition: 'Kế toán trưởng Quỹ TDND',
    fromAssignedArea: 'Hạch toán kế toán',
    toAssignedArea: 'Phụ trách toàn diện Kế toán & Ngân quỹ',
    signer: 'Trịnh Đức Anh (Chủ tịch HĐQT)',
    reason: 'Đạt chuẩn chức danh Kế toán trưởng theo phê chuẩn của NHNN Chi nhánh tỉnh Thanh Hóa.',
    handoverStatus: 'DA_BAN_GIAO',
    notes: 'Tiếp nhận bàn giao chứng từ và chữ ký số kế toán trưởng.',
  },
  {
    id: 'trans-003',
    employeeId: 'emp-011',
    employeeCode: 'CB11',
    employeeName: 'Phạm Thị Thảo',
    decisionNumber: '15/QĐ-HĐQT-2023',
    decisionDate: '2023-08-25',
    effectiveDate: '2023-09-06',
    transferType: 'BO_NHIEM',
    transferTypeLabel: 'Bổ nhiệm Thủ quỹ',
    fromDepartment: 'Phòng Kế toán - Ngân quỹ',
    toDepartment: 'Phòng Kế toán - Ngân quỹ',
    fromPosition: 'Nhân viên ngân quỹ tập sự',
    toPosition: 'Thủ quỹ Quỹ TDND',
    fromAssignedArea: 'Tập sự kho quỹ',
    toAssignedArea: 'Quản lý két sắt, tiền mặt và thu chi tại quầy',
    signer: 'Nguyễn Văn Sơn (Giám đốc)',
    reason: 'Hoàn thành thời gian tập sự nghiệp vụ kho quỹ an toàn.',
    handoverStatus: 'DA_BAN_GIAO',
    notes: 'Kiểm kê bàn giao két sắt và sổ quỹ tiền mặt.',
  },
  {
    id: 'trans-004',
    employeeId: 'emp-001',
    employeeCode: 'CB01',
    employeeName: 'Nguyễn Thị Sinh',
    decisionNumber: '19/QĐ-HĐQT-2021',
    decisionDate: '2021-05-10',
    effectiveDate: '2021-06-01',
    transferType: 'PHAN_CONG_CHUYEN_TRACH',
    transferTypeLabel: 'Phân công chuyên trách Thẩm định tài sản',
    fromDepartment: 'Phòng Tín dụng',
    toDepartment: 'Phòng Tín dụng',
    fromPosition: 'Cán bộ Tín dụng',
    toPosition: 'Cán bộ chuyên trách Thẩm định tài sản',
    fromAssignedArea: 'Địa bàn tín dụng',
    toAssignedArea: 'Thẩm định giá trị đất đai, nhà ở & tài sản thế chấp',
    signer: 'Trịnh Đức Anh (Chủ tịch HĐQT)',
    reason: 'Kiện toàn tổ thẩm định độc lập theo định hướng quản trị rủi ro của Quỹ.',
    handoverStatus: 'DA_BAN_GIAO',
    notes: 'Bàn giao các hồ sơ tín dụng quản lý trước đó.',
  },
];

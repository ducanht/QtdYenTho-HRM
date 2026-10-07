// Script nạp 12 hồ sơ Cán bộ Nhân viên chính thức của Quỹ TDND Yên Thọ vào Cloud Firestore
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  getDocs,
  writeBatch
} from 'firebase/firestore';

import { firebaseConfig } from '../src/lib/firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 12 Cán bộ nhân viên chính thức từ hồ sơ Quỹ TDND Yên Thọ
export const OFFICIAL_EMPLOYEES = [
  {
    id: 'emp-001',
    order: 1,
    code: 'CB01',
    name: 'Nguyễn Thị Sinh',
    gender: 'Nữ',
    birthDate: '',
    cccd: '038162004401',
    email: 'Sinhtdyt@gmail.com',
    role: 'staff',
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
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-002',
    order: 2,
    code: 'CB02',
    name: 'Nguyễn Thị Mến',
    gender: 'Nữ',
    birthDate: '',
    cccd: '038183010925',
    email: 'nguyenmen.yt.83@gmail.com',
    role: 'staff',
    department: 'Phòng Kế toán - Ngân quỹ',
    position: 'Kế toán trưởng',
    assignedArea: 'Phụ trách toàn diện Kế toán, Tài chính & Ngân quỹ',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2007-03-09',
    partyOfficialDate: '2008-03-08',
    education: 'Chờ bổ sung',
    joinDate: '2007-03-09',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0349547779',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-003',
    order: 3,
    code: 'CB03',
    name: 'Nguyễn Văn Sơn',
    gender: 'Nam',
    birthDate: '',
    cccd: '038080021750',
    email: 'nguyenvansontdyt@gmail.com',
    role: 'admin', // Giám đốc điều hành là Admin
    department: 'Ban Điều hành',
    position: 'UV HĐQT - Giám đốc',
    assignedArea: 'Điều hành toàn diện hoạt động kinh doanh Quỹ',
    partyMember: true,
    politicalRole: 'Phó Bí thư Chi bộ',
    partyDate: '2012-10-09',
    partyOfficialDate: '2013-10-09',
    education: 'Chờ bổ sung',
    joinDate: '2012-10-09',
    contractType: 'Theo nhiệm kỳ bổ nhiệm',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0941562789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-004',
    order: 4,
    code: 'CB04',
    name: 'Bùi Thị Thảo',
    gender: 'Nữ',
    birthDate: '',
    cccd: '038182047645',
    email: 'thao.bui0282@gmail.com',
    role: 'staff',
    department: 'Ban Kiểm soát',
    position: 'Trưởng ban kiểm soát',
    assignedArea: 'Kiểm soát nội bộ toàn diện hoạt động Quỹ',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2012-11-19',
    partyOfficialDate: '2013-11-19',
    education: 'Chờ bổ sung',
    joinDate: '2012-11-19',
    contractType: 'Theo nhiệm kỳ Đại hội',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0839062825',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-005',
    order: 5,
    code: 'CB05',
    name: 'Nguyễn Hữu Nhân',
    gender: 'Nam',
    birthDate: '',
    cccd: '038085009285',
    email: 'qtdyentho.huunhan@gmail.com',
    role: 'staff',
    department: 'Phòng Tín dụng',
    position: 'CB tín dụng',
    assignedArea: 'Quản lý khách hàng & phát triển tín dụng',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2013-01-30',
    partyOfficialDate: '2014-01-30',
    education: 'Chờ bổ sung',
    joinDate: '2013-01-30',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0949116817',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-006',
    order: 6,
    code: 'CB06',
    name: 'Trịnh Thị Hiền',
    gender: 'Nữ',
    birthDate: '',
    cccd: '038183049074',
    email: 'qtdyentho.hienha@gmail.com',
    role: 'staff',
    department: 'Ban Kiểm soát',
    position: 'KST - Kiểm toán nội bộ',
    assignedArea: 'Kiểm soát tài chính & kiểm toán nội bộ',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2014-05-21',
    partyOfficialDate: '2015-05-21',
    education: 'Chờ bổ sung',
    joinDate: '2014-05-21',
    contractType: 'Không xác định thời hạn',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0948784333',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-007',
    order: 7,
    code: 'CB07',
    name: 'Trịnh Đức Anh',
    gender: 'Nam',
    birthDate: '',
    cccd: '038086010115',
    email: 'ducanht@gmail.com',
    role: 'admin', // Chủ tịch HĐQT là Admin
    department: 'Ban Quản trị (HĐQT)',
    position: 'Chủ tịch HĐQT',
    assignedArea: 'Lãnh đạo toàn diện HĐQT & Định hướng chiến lược Quỹ',
    partyMember: true,
    politicalRole: 'Bí thư Chi bộ',
    partyDate: '2016-06-03',
    partyOfficialDate: '2017-06-03',
    education: 'Chờ bổ sung',
    joinDate: '2016-06-03',
    contractType: 'Theo nhiệm kỳ Đại hội',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0965122111',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-008',
    order: 8,
    code: 'CB08',
    name: 'Vũ Thị Hiền',
    gender: 'Nữ',
    birthDate: '',
    cccd: '038186037786',
    email: 'qtdyentho.vuhien@gmail.com',
    role: 'staff',
    department: 'Ban Quản trị (HĐQT)',
    position: 'UV HĐQT',
    assignedArea: 'Ủy viên Hội đồng Quản trị',
    partyMember: true,
    politicalRole: 'Đảng viên',
    partyDate: '2018-06-04',
    partyOfficialDate: '2019-06-04',
    education: 'Chờ bổ sung',
    joinDate: '2018-06-04',
    contractType: 'Theo nhiệm kỳ Đại hội',
    status: 'ACTIVE',
    mustChangePassword: true,
    phone: '0983502181',
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80',
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
    role: 'staff',
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
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
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
    role: 'staff',
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
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
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
    role: 'staff',
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
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
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
    role: 'staff',
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
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80',
  },
];

// Lịch sử luân chuyển công tác mẫu gắn với các cán bộ thực tế
const OFFICIAL_WORK_HISTORY = [
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

async function ensureAuthenticated() {
  console.log('🔑 Đang đăng nhập xác thực tài khoản quản trị để ghi Firestore...');
  try {
    await signInWithEmailAndPassword(auth, 'canbo@qtdyentho.vn', '123456');
    console.log(`✅ Đã đăng nhập: ${auth.currentUser.email}`);
  } catch (err) {
    try {
      await signInWithEmailAndPassword(auth, 'admin@qtdyentho.vn', 'Admin@123456');
      console.log(`✅ Đã đăng nhập: ${auth.currentUser.email}`);
    } catch (adminErr) {
      console.warn('⚠️ Lỗi đăng nhập:', adminErr.message);
    }
  }
}

async function createAuthAccounts() {
  console.log('\n🔐 Khởi tạo tài khoản Firebase Authentication cho các Cán bộ chính thức (Mật khẩu mặc định Qtd@2003)...');
  for (const emp of OFFICIAL_EMPLOYEES) {
    if (!emp.email) continue;
    try {
      await createUserWithEmailAndPassword(auth, emp.email.toLowerCase(), 'Qtd@2003');
      console.log(`  ✓ Đã tạo tài khoản Auth: ${emp.email} (pass: Qtd@2003)`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`  ℹ Tài khoản đã tồn tại: ${emp.email}`);
      } else {
        console.warn(`  ⚠️ Không thể tạo Auth cho ${emp.email}:`, err.message);
      }
    }
  }
}

async function seedOfficialData() {
  console.log('\n🚀 BẮT ĐẦU CẬP NHẬT CSDL FIRESTORE VỚI 12 CÁN BỘ CHÍNH THỨC...');

  // 1. users collection
  console.log('1. Đang nạp danh sách 12 cán bộ vào collection [users]...');
  for (const emp of OFFICIAL_EMPLOYEES) {
    await setDoc(doc(db, 'users', emp.id), {
      ...emp,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`  ✓ [users] ${emp.code} - ${emp.name} (${emp.position})`);
  }

  // 2. work_history collection
  console.log('\n2. Đang nạp quá trình luân chuyển điều động vào collection [work_history]...');
  for (const trans of OFFICIAL_WORK_HISTORY) {
    await setDoc(doc(db, 'work_history', trans.id), {
      ...trans,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`  ✓ [work_history] QĐ ${trans.decisionNumber} - ${trans.employeeName}`);
  }

  // 3. Cập nhật phiếu đánh giá tín nhiệm mẫu tương ứng
  console.log('\n3. Đang cập nhật phiếu đánh giá tín nhiệm tương ứng vào [evaluations_trust]...');
  const trustSamples = [
    {
      id: 'trust-001',
      periodId: 'PERIOD-2026-Q3',
      periodName: 'Đánh giá tín nhiệm Quý III / 2026',
      isAnonymous: false,
      evaluatorId: 'emp-007',
      evaluatorName: 'Trịnh Đức Anh',
      evaluatorRole: 'chairman',
      targetEmployeeId: 'emp-005',
      targetEmployeeCode: 'CB05',
      targetEmployeeName: 'Nguyễn Hữu Nhân',
      targetDepartment: 'Phòng Tín dụng',
      scores: { 1: 9, 2: 9, 3: 9, 4: 10, 5: 9, 6: 9, 7: 8, 8: 10, 9: 9, 10: 9 },
      totalScore: 91,
      classification: 'Xuất sắc',
      notes: 'Cán bộ mẫu mực, hoàn thành tốt chỉ tiêu tín dụng, tuân thủ nghiêm ngặt quy trình quản trị rủi ro.',
      createdAt: '2026-09-15T09:30:00Z',
    },
    {
      id: 'trust-002',
      periodId: 'PERIOD-2026-Q3',
      periodName: 'Đánh giá tín nhiệm Quý III / 2026',
      isAnonymous: true,
      evaluatorId: 'emp-003',
      evaluatorName: 'Cán bộ Quỹ (Ẩn danh)',
      evaluatorRole: 'Ẩn danh',
      targetEmployeeId: 'emp-002',
      targetEmployeeCode: 'CB02',
      targetEmployeeName: 'Nguyễn Thị Mến',
      targetDepartment: 'Phòng Kế toán - Ngân quỹ',
      scores: { 1: 9, 2: 9, 3: 10, 4: 9, 5: 9, 6: 10, 7: 8, 8: 10, 9: 9, 10: 9 },
      totalScore: 92,
      classification: 'Xuất sắc',
      notes: 'Kế toán trưởng vững vàng chuyên môn, sổ sách kế toán chuẩn mực, thanh khoản vững vàng.',
      createdAt: '2026-09-18T14:15:00Z',
    },
    {
      id: 'trust-003',
      periodId: 'PERIOD-2026-Q3',
      periodName: 'Đánh giá tín nhiệm Quý III / 2026',
      isAnonymous: false,
      evaluatorId: 'emp-003',
      evaluatorName: 'Nguyễn Văn Sơn',
      evaluatorRole: 'manager',
      targetEmployeeId: 'emp-001',
      targetEmployeeCode: 'CB01',
      targetEmployeeName: 'Nguyễn Thị Sinh',
      targetDepartment: 'Phòng Tín dụng',
      scores: { 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9, 10: 9 },
      totalScore: 90,
      classification: 'Xuất sắc',
      notes: 'Thẩm định hồ sơ chặt chẽ, chính xác, không để phát sinh rủi ro tài sản bảo đảm.',
      createdAt: '2026-09-20T10:00:00Z',
    },
  ];

  for (const t of trustSamples) {
    await setDoc(doc(db, 'evaluations_trust', t.id), {
      ...t,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`  ✓ [evaluations_trust] ${t.id} - ${t.targetEmployeeName}`);
  }

  // 4. Cập nhật phiếu đánh giá KPI tương ứng
  console.log('\n4. Đang cập nhật phiếu KPI tương ứng vào [evaluations_kpi]...');
  const kpiSamples = [
    {
      id: 'kpi-2026-Q3-emp-005',
      employeeId: 'emp-005',
      employeeCode: 'CB05',
      employeeName: 'Nguyễn Hữu Nhân',
      position: 'CB tín dụng',
      department: 'Phòng Tín dụng',
      period: 'Quý III / 2026',
      status: 'completed',
      scoreSelf: 88,
      selfNotes: 'Hoàn thành 102% kế hoạch tăng trưởng dư nợ và kiểm soát nợ quá hạn 0%.',
      scoreManager: 90,
      managerNotes: 'Tác phong nghiệp vụ tốt, chịu khó bám sát thành viên vay vốn.',
      scoreChairman: 92,
      chairmanNotes: 'Biểu dương tinh thần trách nhiệm và kết quả dư nợ an toàn.',
      finalScore: 90,
      classification: 'Xuất sắc',
      updatedAt: '2026-09-28T16:00:00Z',
    },
    {
      id: 'kpi-2026-Q3-emp-001',
      employeeId: 'emp-001',
      employeeCode: 'CB01',
      employeeName: 'Nguyễn Thị Sinh',
      position: 'Thẩm định tài sản',
      department: 'Phòng Tín dụng',
      period: 'Quý III / 2026',
      status: 'completed',
      scoreSelf: 86,
      selfNotes: 'Thẩm định 100% hồ sơ đúng hạn, kiểm tra hiện trạng tài sản nghiêm túc.',
      scoreManager: 88,
      managerNotes: 'Hồ sơ thẩm định đầy đủ căn cứ pháp lý.',
      scoreChairman: 88,
      chairmanNotes: 'Thống nhất kết quả xếp loại Tốt.',
      finalScore: 87.2,
      classification: 'Tốt',
      updatedAt: '2026-09-29T10:30:00Z',
    },
    {
      id: 'kpi-2026-Q3-emp-010',
      employeeId: 'emp-010',
      employeeCode: 'CB10',
      employeeName: 'Hoàng Thị Lan',
      position: 'Kế toán viên',
      department: 'Phòng Kế toán - Ngân quỹ',
      period: 'Quý III / 2026',
      status: 'pending_manager',
      scoreSelf: 85,
      selfNotes: 'Đã hoàn thành các bút toán hạch toán ngày và đối chiếu sổ phụ.',
      scoreManager: null,
      scoreChairman: null,
      finalScore: null,
      classification: null,
      updatedAt: '2026-10-01T08:30:00Z',
    },
  ];

  for (const k of kpiSamples) {
    await setDoc(doc(db, 'evaluations_kpi', k.id), {
      ...k,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`  ✓ [evaluations_kpi] ${k.id} - ${k.employeeName}`);
  }

  console.log('\n🎉 HOÀN TẤT NẠP TOÀN BỘ 12 HỒ SƠ CÁN BỘ QUỸ TDND YÊN THỌ VÀO CLOUD FIRESTORE!');
}

async function main() {
  try {
    await ensureAuthenticated();
    await createAuthAccounts();
    console.log('\n🔑 Đang chuyển phiên sang Quản trị viên admin@qtdyentho.vn...');
    await signInWithEmailAndPassword(auth, 'admin@qtdyentho.vn', 'Admin@123456');
    console.log(`✅ Đã xác thực quyền Quản trị cao nhất: ${auth.currentUser.email}`);
    await seedOfficialData();
    console.log('\n✅ XONG! Dữ liệu đã sẵn sàng trên Firestore và Auth.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khi nạp dữ liệu:', err);
    process.exit(1);
  }
}

main();

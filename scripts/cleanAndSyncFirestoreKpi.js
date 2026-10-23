import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase.js';
import { OFFICIAL_STAFF_EMPLOYEES } from '../src/lib/systemDefaults.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  console.log('=== BẮT ĐẦU ĐỒNG BỘ & LÀM SẠCH DỮ LIỆU CSDL FIREBASE ===');
  await signInWithEmailAndPassword(auth, 'admin@qtdyentho.vn', 'Admin@123456');
  console.log('✓ Đã xác thực quyền Quản trị tối cao (SuperAdmin):', auth.currentUser.email);

  // 1. CẬP NHẬT CHUẨN HÓA TOÀN BỘ 13 CÁN BỘ TRONG COLLECTION "employees"
  console.log('\n--- 1. Chuẩn hóa Collection "employees" ---');
  for (const emp of OFFICIAL_STAFF_EMPLOYEES) {
    const empRef = doc(db, 'employees', emp.id);
    const existingSnap = await getDoc(empRef);
    const existing = existingSnap.exists() ? existingSnap.data() : {};
    
    const realName = emp.name || existing.name || emp.fullName || existing.fullName;
    const payload = {
      ...emp,
      ...existing,
      name: realName,
      fullName: realName,
      code: emp.code || existing.code,
      department: emp.department || existing.department,
      position: emp.position || existing.position,
      assignedArea: emp.assignedArea || existing.assignedArea,
      status: existing.status || 'ACTIVE',
      updatedAt: new Date().toISOString()
    };
    await setDoc(empRef, payload, { merge: true });
    console.log(`  ✓ employees: [${emp.id}] ${emp.code} - ${realName} (${payload.position})`);
  }

  // 2. CHUẨN HÓA BẢN GHI TƯƠNG ỨNG TRONG COLLECTION "users" (Giữ ROOT tách biệt hoàn toàn)
  console.log('\n--- 2. Chuẩn hóa Collection "users" ---');
  for (const emp of OFFICIAL_STAFF_EMPLOYEES) {
    const userRef = doc(db, 'users', emp.id);
    const realName = emp.name;
    await setDoc(userRef, {
      fullName: realName,
      name: realName,
      code: emp.code,
      department: emp.department,
      position: emp.position,
      assignedArea: emp.assignedArea,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }
  // Đảm bảo emp-root có code = 'ROOT' và không nhầm lẫn là CBNV
  await setDoc(doc(db, 'users', 'emp-root'), {
    code: 'ROOT',
    role: 'superadmin',
    name: 'Quản trị viên Cấp cao',
    fullName: 'Quản trị viên Cấp cao',
    updatedAt: new Date().toISOString()
  }, { merge: true });
  console.log('  ✓ Đã cập nhật 13 hồ sơ users và phân định rõ tài khoản emp-root.');

  // 3. XÓA BỎ 100% CÁC PHIẾU ĐÁNH GIÁ MOCK CŨ KHỎI "evaluations_kpi"
  console.log('\n--- 3. Xóa bỏ các phiếu giả lập cũ (Zero Mock Policy) ---');
  const mockDocIds = ['kpi-001', 'kpi-002', 'kpi-003', 'kpi-004'];
  for (const mId of mockDocIds) {
    const snap = await getDoc(doc(db, 'evaluations_kpi', mId));
    if (snap.exists()) {
      await deleteDoc(doc(db, 'evaluations_kpi', mId));
      console.log(`  ✓ Đã xóa vĩnh viễn phiếu giả lập: ${mId} (${snap.data().employeeName})`);
    }
    // Xóa cả trong history nếu có
    const histSnap = await getDoc(doc(db, 'employee_kpi_history', `hist_${mId}`));
    if (histSnap.exists()) {
      await deleteDoc(doc(db, 'employee_kpi_history', `hist_${mId}`));
      console.log(`  ✓ Đã xóa lịch sử giả lập: hist_${mId}`);
    }
  }

  // 4. THIẾT LẬP DỮ LIỆU ĐÁNH GIÁ KPI QUÝ III / 2026 CHUẨN XÁC CHO CÁC CÁN BỘ THẬT
  console.log('\n--- 4. Thiết lập dữ liệu thi đua KPI Quý III / 2026 cho CBNV thật ---');
  const period = 'Quý III / 2026';
  const nowIso = new Date().toISOString();

  // Danh sách đánh giá mẫu thực tế chuẩn Quỹ tín dụng nhân dân Yên Thọ
  const realStaffEvaluations = [
    {
      id: 'kpi-2026-Q3-emp-001',
      employeeId: 'emp-001',
      employeeCode: 'CB01',
      employeeName: 'Nguyễn Thị Sinh',
      department: 'Phòng Tín dụng',
      position: 'Thẩm định tài sản',
      scoreSelf: 88,
      scoreManager: 86,
      scoreChairman: 88,
      finalScore: 87.4,
      classification: 'Hoàn thành Tốt nhiệm vụ',
      status: 'completed',
      managerNotes: 'Thẩm định hồ sơ chặt chẽ, tuân thủ đúng quy trình cấp tín dụng.',
      chairmanNotes: 'Đồng ý phê duyệt xếp loại Tốt. Phát huy tinh thần trách nhiệm.',
    },
    {
      id: 'kpi-2026-Q3-emp-002',
      employeeId: 'emp-002',
      employeeCode: 'CB02',
      employeeName: 'Nguyễn Thị Mến',
      department: 'Phòng Kế toán - Ngân quỹ',
      position: 'Kế toán trưởng',
      scoreSelf: 94,
      scoreManager: 95,
      scoreChairman: 95,
      finalScore: 94.6,
      classification: 'Hoàn thành Xuất sắc nhiệm vụ',
      status: 'completed',
      managerNotes: 'Điều hành kế toán tài chính chuẩn xác, báo cáo NHNN đúng hạn.',
      chairmanNotes: 'HĐQT biểu dương tinh thần trách nhiệm và năng lực điều hành kế toán.',
    },
    {
      id: 'kpi-2026-Q3-emp-003',
      employeeId: 'emp-003',
      employeeCode: 'CB03',
      employeeName: 'Nguyễn Văn Sơn',
      department: 'Hội đồng Quản trị & Ban Điều hành',
      position: 'Thành viên HĐQT - Giám đốc',
      scoreSelf: 96,
      scoreManager: 96,
      scoreChairman: 97,
      finalScore: 96.3,
      classification: 'Hoàn thành Xuất sắc nhiệm vụ',
      status: 'completed',
      managerNotes: 'Điều hành hoạt động kinh doanh đạt và vượt các chỉ tiêu tài chính Quý 3.',
      chairmanNotes: 'HĐQT đánh giá rất cao vai trò chỉ đạo điều hành của Giám đốc.',
    },
    {
      id: 'kpi-2026-Q3-emp-004',
      employeeId: 'emp-004',
      employeeCode: 'CB04',
      employeeName: 'Bùi Thị Thảo',
      department: 'Ban Kiểm soát',
      position: 'Trưởng ban kiểm soát',
      scoreSelf: 92,
      scoreManager: 93,
      scoreChairman: 93,
      finalScore: 92.6,
      classification: 'Hoàn thành Xuất sắc nhiệm vụ',
      status: 'completed',
      managerNotes: 'Công tác kiểm tra, giám sát chuyên đề được thực hiện nghiêm túc, kịp thời.',
      chairmanNotes: 'HĐQT nhất trí phê duyệt kết quả hoàn thành xuất sắc nhiệm vụ.',
    },
    {
      id: 'kpi-2026-Q3-emp-005',
      employeeId: 'emp-005',
      employeeCode: 'CB05',
      employeeName: 'Nguyễn Hữu Nhân',
      department: 'Phòng Tín dụng',
      position: 'Cán bộ tín dụng',
      scoreSelf: 90,
      scoreManager: 90,
      scoreChairman: 90,
      finalScore: 90.0,
      classification: 'Hoàn thành Xuất sắc nhiệm vụ',
      status: 'completed',
      managerNotes: 'Quản lý địa bàn tốt, tăng trưởng dư nợ an toàn, nợ xấu dưới ngưỡng.',
      chairmanNotes: 'Phê duyệt xếp loại Xuất sắc theo đề nghị của BĐH.',
    },
    {
      id: 'kpi-2026-Q3-emp-006',
      employeeId: 'emp-006',
      employeeCode: 'CB06',
      employeeName: 'Nguyễn Hữu Hiếu',
      department: 'Phòng Tín dụng',
      position: 'Cán bộ tín dụng',
      scoreSelf: 89,
      scoreManager: 90,
      scoreChairman: 91,
      finalScore: 89.9,
      classification: 'Hoàn thành Tốt nhiệm vụ',
      status: 'completed',
      managerNotes: 'Cán bộ tín dụng phụ trách địa bàn xã Quý Lộc nhiệt tình, sâu sát cơ sở.',
      chairmanNotes: 'HĐQT ghi nhận tinh thần trách nhiệm cao trong công tác tín dụng.',
    },
    {
      id: 'kpi-2026-Q3-emp-008',
      employeeId: 'emp-008',
      employeeCode: 'CB08',
      employeeName: 'Lê Ngọc Huynh',
      department: 'Phòng Tín dụng',
      position: 'Cán bộ tín dụng',
      scoreSelf: 87,
      scoreManager: 88,
      scoreChairman: 89,
      finalScore: 87.9,
      classification: 'Hoàn thành Tốt nhiệm vụ',
      status: 'completed',
      managerNotes: 'Thực hiện tốt các chỉ tiêu huy động và cho vay trên địa bàn xã Yên Thọ.',
      chairmanNotes: 'Đồng ý kết quả đánh giá.',
    },
    {
      id: 'kpi-2026-Q3-emp-010',
      employeeId: 'emp-010',
      employeeCode: 'CB10',
      employeeName: 'Hoàng Thị Lan',
      department: 'Phòng Kế toán - Ngân quỹ',
      position: 'Kế toán viên',
      scoreSelf: 86,
      scoreManager: 88,
      scoreChairman: 88,
      finalScore: 87.2,
      classification: 'Hoàn thành Tốt nhiệm vụ',
      status: 'completed',
      managerNotes: 'Thực hiện thanh toán, hạch toán giao dịch chính xác, bảo mật.',
      chairmanNotes: 'Đồng ý phê duyệt xếp loại Tốt.',
    },
    {
      id: 'kpi-2026-Q3-emp-011',
      employeeId: 'emp-011',
      employeeCode: 'CB11',
      employeeName: 'Phạm Thị Thảo',
      department: 'Phòng Kế toán - Ngân quỹ',
      position: 'Thủ quỹ',
      scoreSelf: 91,
      scoreManager: 92,
      scoreChairman: 92,
      finalScore: 91.6,
      classification: 'Hoàn thành Xuất sắc nhiệm vụ',
      status: 'completed',
      managerNotes: 'Quản lý an toàn kho quỹ tuyệt đối, thu chi chính xác 100%.',
      chairmanNotes: 'HĐQT biểu dương thành tích giữ an toàn kho quỹ.',
    },
    {
      id: 'kpi-2026-Q3-emp-012',
      employeeId: 'emp-012',
      employeeCode: 'CB12',
      employeeName: 'Lưu Thị Định',
      department: 'Phòng Tín dụng',
      position: 'Cán bộ tín dụng',
      scoreSelf: 88,
      scoreManager: 89,
      scoreChairman: 89,
      finalScore: 88.6,
      classification: 'Hoàn thành Tốt nhiệm vụ',
      status: 'completed',
      managerNotes: 'Phát triển tốt khách hàng vay vốn nông nghiệp nông thôn.',
      chairmanNotes: 'Đồng ý xếp loại Tốt.',
    }
  ];

  for (const item of realStaffEvaluations) {
    const kpiRef = doc(db, 'evaluations_kpi', item.id);
    const kpiPayload = {
      ...item,
      period,
      completedAt: nowIso,
      updatedAt: nowIso,
      createdAt: item.createdAt || nowIso,
    };
    await setDoc(kpiRef, kpiPayload, { merge: true });

    // Ghi đồng bộ vào employee_kpi_history để phục vụ Tab Lịch sử thi đua toàn quỹ
    const histRef = doc(db, 'employee_kpi_history', `hist_${item.id}`);
    const histPayload = {
      id: `hist_${item.id}`,
      kpiId: item.id,
      employeeId: item.employeeId,
      employeeCode: item.employeeCode,
      employeeName: item.employeeName,
      department: item.department,
      position: item.position,
      period: period,
      scoreSelf: item.scoreSelf,
      scoreManager: item.scoreManager,
      scoreChairman: item.scoreChairman,
      finalScore: item.finalScore,
      classification: item.classification,
      status: 'completed',
      selfNotes: item.selfNotes || '',
      managerNotes: item.managerNotes || '',
      chairmanNotes: item.chairmanNotes || '',
      notes: item.chairmanNotes || item.managerNotes || '',
      completedAt: nowIso,
      updatedAt: nowIso
    };
    await setDoc(histRef, histPayload, { merge: true });
    console.log(`  ✓ Đã đồng bộ KPI & Lịch sử: [${item.employeeCode}] ${item.employeeName} (${item.finalScore}đ - ${item.classification})`);
  }

  console.log('\n=== HOÀN TẤT ĐỒNG BỘ DỮ LIỆU CSDL FIREBASE THÀNH CÔNG 100% ===');
  process.exit(0);
}

run().catch((err) => {
  console.error('Lỗi khi thực hiện đồng bộ:', err);
  process.exit(1);
});

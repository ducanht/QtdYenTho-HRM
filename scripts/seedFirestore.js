// Script tự động nạp dữ liệu chuẩn Quỹ Tín Dụng Nhân Dân Yên Thọ vào Cloud Firestore
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
  getDocs 
} from 'firebase/firestore';

import { firebaseConfig } from '../src/lib/firebase.js';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_WORK_HISTORY, 
  INITIAL_TRUST_EVALUATIONS, 
  INITIAL_KPI_EVALUATIONS, 
  INITIAL_PLANNING_VOTES, 
  TRUST_CRITERIA, 
  EVALUATION_PERIODS 
} from '../src/lib/mockData.js';
import { SYSTEM_MODULES, ROLE_PERMISSIONS } from '../src/lib/permissions.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function ensureAuthenticated() {
  const seedAccounts = [
    { email: 'chutich@qtdyentho.vn', pass: '123456' },
    { email: 'quanly@qtdyentho.vn', pass: '123456' },
    { email: 'canbo@qtdyentho.vn', pass: '123456' },
    { email: 'admin@qtdyentho.vn', pass: 'Admin@123456' },
  ];

  console.log('🔑 Đang chuẩn bị phiên xác thực và tạo các tài khoản phân quyền mẫu...');

  for (const acc of seedAccounts) {
    try {
      await createUserWithEmailAndPassword(auth, acc.email, acc.pass);
      console.log(`  ✓ Đã khởi tạo tài khoản mới: ${acc.email}`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        try {
          await signInWithEmailAndPassword(auth, acc.email, acc.pass);
          console.log(`  ✓ Đã đăng nhập tài khoản hiện có: ${acc.email}`);
        } catch (loginErr) {
          console.warn(`  ⚠️ Không thể đăng nhập ${acc.email}:`, loginErr.message);
        }
      } else {
        console.warn(`  ⚠️ Lỗi tạo tài khoản ${acc.email}:`, err.message);
      }
    }
  }

  // Đảm bảo auth hiện tại có user để vượt qua kiểm tra isAuthenticated() trong Firestore rules
  if (!auth.currentUser) {
    console.log('🔄 Đang đăng nhập tài khoản admin để cấp quyền ghi CSDL...');
    await signInWithEmailAndPassword(auth, 'canbo@qtdyentho.vn', '123456');
  }
  console.log(`✅ Đã xác thực thành công dưới danh tính: ${auth.currentUser.email} (${auth.currentUser.uid})`);
}

async function seedAllCollections() {
  console.log('\n🚀 BẮT ĐẦU TỰ ĐỘNG NẠP DỮ LIỆU VÀO CLOUD FIRESTORE (qtdyentho-hrm)...');

  // 1. system_modules
  console.log('\n1. Đang nạp danh mục 8 phân hệ mở rộng (system_modules)...');
  let modCount = 0;
  for (const key of Object.keys(SYSTEM_MODULES)) {
    const mod = SYSTEM_MODULES[key];
    await setDoc(doc(db, 'system_modules', mod.code), {
      ...mod,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    modCount++;
  }
  console.log(`  ✓ Hoàn tất ${modCount} phân hệ hệ thống.`);

  // 2. roles_permissions
  console.log('\n2. Đang nạp ma trận phân quyền chi tiết (roles_permissions)...');
  let roleCount = 0;
  for (const roleKey of Object.keys(ROLE_PERMISSIONS)) {
    await setDoc(doc(db, 'roles_permissions', roleKey), {
      role: roleKey,
      permissions: ROLE_PERMISSIONS[roleKey],
      updatedAt: new Date().toISOString()
    }, { merge: true });
    roleCount++;
  }
  console.log(`  ✓ Hoàn tất ${roleCount} ma trận quyền.`);

  // 3. trust_criteria
  console.log('\n3. Đang nạp 10 tiêu chí đánh giá tín nhiệm (trust_criteria)...');
  let critCount = 0;
  for (const crit of TRUST_CRITERIA) {
    await setDoc(doc(db, 'trust_criteria', crit.code), {
      ...crit,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    critCount++;
  }
  console.log(`  ✓ Hoàn tất ${critCount} tiêu chí.`);

  // 4. evaluation_periods
  console.log('\n4. Đang nạp các đợt đánh giá tín nhiệm (evaluation_periods)...');
  let periodCount = 0;
  for (const period of EVALUATION_PERIODS) {
    await setDoc(doc(db, 'evaluation_periods', period.id), {
      ...period,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    periodCount++;
  }
  console.log(`  ✓ Hoàn tất ${periodCount} đợt đánh giá.`);

  // 5. users (CBNV kèm mã code CB01 -> CB07)
  console.log('\n5. Đang nạp danh sách hồ sơ cán bộ Quỹ (users)...');
  let userCount = 0;
  for (const emp of INITIAL_EMPLOYEES) {
    await setDoc(doc(db, 'users', emp.id), {
      ...emp,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    userCount++;
  }
  console.log(`  ✓ Hoàn tất ${userCount} cán bộ nhân viên.`);

  // 6. work_history (Quá trình luân chuyển điều động liên kết theo employeeCode)
  console.log('\n6. Đang nạp lịch sử luân chuyển công tác (work_history)...');
  let historyCount = 0;
  for (const trans of INITIAL_WORK_HISTORY) {
    await setDoc(doc(db, 'work_history', trans.id), {
      ...trans,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    historyCount++;
  }
  console.log(`  ✓ Hoàn tất ${historyCount} quyết định luân chuyển.`);

  // 7. evaluations_trust (Phiếu đánh giá tín nhiệm mẫu)
  console.log('\n7. Đang nạp phiếu đánh giá tín nhiệm (evaluations_trust)...');
  let trustCount = 0;
  for (const trust of INITIAL_TRUST_EVALUATIONS) {
    await setDoc(doc(db, 'evaluations_trust', trust.id), {
      ...trust,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    trustCount++;
  }
  console.log(`  ✓ Hoàn tất ${trustCount} phiếu đánh giá tín nhiệm.`);

  // 8. evaluations_kpi (Chấm điểm KPI 3 cấp)
  console.log('\n8. Đang nạp dữ liệu chấm điểm KPI (evaluations_kpi)...');
  let kpiCount = 0;
  for (const kpi of INITIAL_KPI_EVALUATIONS) {
    await setDoc(doc(db, 'evaluations_kpi', kpi.id), {
      ...kpi,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    kpiCount++;
  }
  console.log(`  ✓ Hoàn tất ${kpiCount} bản ghi KPI.`);

  // 9. evaluations_planning (Bỏ phiếu quy hoạch cán bộ)
  console.log('\n9. Đang nạp dữ liệu bỏ phiếu quy hoạch cán bộ (evaluations_planning)...');
  let planCount = 0;
  for (const vote of INITIAL_PLANNING_VOTES) {
    await setDoc(doc(db, 'evaluations_planning', vote.id), {
      ...vote,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    planCount++;
  }
  console.log(`  ✓ Hoàn tất ${planCount} phiếu quy hoạch cán bộ.`);

  console.log('\n🔎 Đang kiểm tra lại số lượng dữ liệu thực tế trên Cloud Firestore...');
  const userSnapshot = await getDocs(collection(db, 'users'));
  const historySnapshot = await getDocs(collection(db, 'work_history'));
  const periodSnapshot = await getDocs(collection(db, 'evaluation_periods'));
  const trustSnapshot = await getDocs(collection(db, 'evaluations_trust'));

  console.log(`📊 KẾT QUẢ KIỂM TOÁN CSDL CLOUD FIRESTORE:`);
  console.log(`   - users: ${userSnapshot.size} tài liệu`);
  console.log(`   - work_history: ${historySnapshot.size} tài liệu`);
  console.log(`   - evaluation_periods: ${periodSnapshot.size} tài liệu`);
  console.log(`   - evaluations_trust: ${trustSnapshot.size} tài liệu`);
  console.log('\n🎉 NẠP DỮ LIỆU CLOUD FIRESTORE THÀNH CÔNG 100%!');
}

async function main() {
  try {
    await ensureAuthenticated();
    await seedAllCollections();
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi nạp dữ liệu:', err);
    process.exit(1);
  }
}

main();

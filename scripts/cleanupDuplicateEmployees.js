import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase.js';
import { 
  OFFICIAL_EMPLOYEES, 
  OFFICIAL_STAFF_EMPLOYEES, 
  OFFICIAL_WORK_HISTORY, 
  DEFAULT_ACCOUNTS 
} from '../src/lib/systemDefaults.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TARGET_SCHEMA_VERSION = '2026.10.11_v5.1_deduplicate_employees_and_periods_cleanup';

async function cleanupDuplicates() {
  console.log('[1/7] Đăng nhập quản trị viên để thực hiện dọn dẹp...');
  await signInWithEmailAndPassword(auth, 'ducanht@gmail.com', 'Qtd@2003');
  console.log('✓ Đăng nhập thành công.');

  // 1. DỌN DẸP BẢNG USERS
  console.log('\n[2/7] Dọn dẹp collection "users"...');
  const usersSnap = await getDocs(collection(db, 'users'));
  const legacyUserIdsToDelete = [];
  const authUidMap = {};

  usersSnap.forEach((d) => {
    const data = d.data();
    if (data.authUid) {
      const code = data.code || '';
      if (code) authUidMap[code] = data.authUid;
      if (data.email) authUidMap[data.email.toLowerCase()] = data.authUid;
    }
    if (d.id.startsWith('e0a80101-')) {
      legacyUserIdsToDelete.push(d.id);
    }
  });

  console.log(`- Tìm thấy ${legacyUserIdsToDelete.length} documents UUID legacy trong "users" cần xóa.`);
  for (const id of legacyUserIdsToDelete) {
    await deleteDoc(doc(db, 'users', id));
    console.log(`  ✓ Đã xóa users/${id}`);
  }

  // Đồng bộ lại 13 cán bộ chính thức vào "users"
  console.log('- Đồng bộ 13 cán bộ chuẩn vào "users"...');
  for (const emp of OFFICIAL_EMPLOYEES) {
    const extra = {};
    if (authUidMap[emp.code]) extra.authUid = authUidMap[emp.code];
    if (emp.email && authUidMap[emp.email.toLowerCase()]) extra.authUid = authUidMap[emp.email.toLowerCase()];

    await setDoc(doc(db, 'users', emp.id), {
      ...emp,
      ...extra,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log(`  ✓ Đã cập nhật users/${emp.id} (${emp.code} - ${emp.name})`);
  }

  // 2. DỌN DẸP BẢNG EMPLOYEES
  console.log('\n[3/7] Dọn dẹp collection "employees"...');
  const empSnap = await getDocs(collection(db, 'employees'));
  const legacyEmpIdsToDelete = [];

  empSnap.forEach((d) => {
    if (d.id.startsWith('e0a80101-')) {
      legacyEmpIdsToDelete.push(d.id);
    }
  });

  console.log(`- Tìm thấy ${legacyEmpIdsToDelete.length} documents UUID legacy trong "employees" cần xóa.`);
  for (const id of legacyEmpIdsToDelete) {
    await deleteDoc(doc(db, 'employees', id));
    console.log(`  ✓ Đã xóa employees/${id}`);
  }

  // Đồng bộ lại 13 cán bộ nghiệp vụ vào "employees"
  console.log('- Đồng bộ 13 cán bộ nghiệp vụ vào "employees"...');
  for (const emp of OFFICIAL_STAFF_EMPLOYEES) {
    await setDoc(doc(db, 'employees', emp.id), {
      ...emp,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log(`  ✓ Đã cập nhật employees/${emp.id} (${emp.code} - ${emp.name})`);
  }

  // 3. DỌN DẸP BẢNG WORK_HISTORY
  console.log('\n[4/7] Dọn dẹp collection "work_history"...');
  const workSnap = await getDocs(collection(db, 'work_history'));
  const legacyWorkIdsToDelete = [];

  workSnap.forEach((d) => {
    if (d.id.startsWith('d0a80101-')) {
      legacyWorkIdsToDelete.push(d.id);
    }
  });

  console.log(`- Tìm thấy ${legacyWorkIdsToDelete.length} documents legacy trong "work_history" cần xóa.`);
  for (const id of legacyWorkIdsToDelete) {
    await deleteDoc(doc(db, 'work_history', id));
    console.log(`  ✓ Đã xóa work_history/${id}`);
  }

  for (const trans of OFFICIAL_WORK_HISTORY) {
    await setDoc(doc(db, 'work_history', trans.id), {
      ...trans,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log(`  ✓ Đã cập nhật work_history/${trans.id} (${trans.employeeCode} - ${trans.employeeName})`);
  }

  // 4. DỌN DẸP BẢNG ACCOUNTS
  console.log('\n[5/7] Dọn dẹp collection "accounts"...');
  const accSnap = await getDocs(collection(db, 'accounts'));
  const legacyAccIdsToDelete = [];

  accSnap.forEach((d) => {
    if (d.id.startsWith('a0a80101-') || d.id === 'a0000000-0000-4000-8000-000000000001') {
      legacyAccIdsToDelete.push(d.id);
    }
  });

  console.log(`- Tìm thấy ${legacyAccIdsToDelete.length} documents legacy trong "accounts" cần xóa.`);
  for (const id of legacyAccIdsToDelete) {
    await deleteDoc(doc(db, 'accounts', id));
    console.log(`  ✓ Đã xóa accounts/${id}`);
  }

  for (const acc of DEFAULT_ACCOUNTS) {
    await setDoc(doc(db, 'accounts', acc.id), {
      ...acc,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log(`  ✓ Đã cập nhật accounts/${acc.id} (${acc.employeeCode || 'ROOT'} - ${acc.email})`);
  }

  // 5. CHUẨN HÓA CỬ TRI VÀ ĐỐI TƯỢNG TRONG EVALUATION_PERIODS & PERIOD_CONFIGS
  console.log('\n[6/7] Chuẩn hóa danh sách cử tri và đối tượng trong "evaluation_periods" & "period_configs"...');
  const validStaffIds = OFFICIAL_STAFF_EMPLOYEES.map((e) => e.id); // 13 cán bộ: emp-001 .. emp-013

  const periodsSnap = await getDocs(collection(db, 'evaluation_periods'));
  for (const pDoc of periodsSnap.docs) {
    await setDoc(doc(db, 'evaluation_periods', pDoc.id), {
      voterEmployeeIds: validStaffIds,
      targetEmployeeIds: validStaffIds,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log(`  ✓ Đã chuẩn hóa evaluation_periods/${pDoc.id} -> ${validStaffIds.length} cử tri / đối tượng`);
  }

  const configsSnap = await getDocs(collection(db, 'period_configs'));
  for (const cDoc of configsSnap.docs) {
    await setDoc(doc(db, 'period_configs', cDoc.id), {
      voterEmployeeIds: validStaffIds,
      targetEmployeeIds: validStaffIds,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log(`  ✓ Đã chuẩn hóa period_configs/${cDoc.id} -> ${validStaffIds.length} cử tri / đối tượng`);
  }

  // 6. CẬP NHẬT METADATA SCHEMA VERSION
  console.log('\n[7/7] Cập nhật metadata schema version...');
  await setDoc(doc(db, 'system_metadata', 'schema_status'), {
    version: TARGET_SCHEMA_VERSION,
    status: 'HEALTHY',
    lastCleanup: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  console.log(`✓ Đã cập nhật schema version: ${TARGET_SCHEMA_VERSION}`);

  console.log('\n=== HOÀN TẤT DỌN DẸP 100% CSDL FIRESTORE THÀNH CÔNG ===');
}

cleanupDuplicates()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Lỗi khi thực hiện dọn dẹp:', err);
    process.exit(1);
  });

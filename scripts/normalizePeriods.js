import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase.js';
import { OFFICIAL_STAFF_EMPLOYEES } from '../src/lib/systemDefaults.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TARGET_SCHEMA_VERSION = '2026.10.11_v5.1_deduplicate_employees_and_periods_cleanup';

async function normalize() {
  console.log('[1/3] Đăng nhập quản trị viên...');
  await signInWithEmailAndPassword(auth, 'ducanht@gmail.com', 'Qtd@2003');

  const validStaffIds = OFFICIAL_STAFF_EMPLOYEES.map((e) => e.id); // 13 cán bộ: emp-001 .. emp-013
  console.log(`Danh sách 13 cán bộ chuẩn (${validStaffIds.length}):`, validStaffIds);

  console.log('\n[2/3] Cập nhật evaluation_periods...');
  const periodsSnap = await getDocs(collection(db, 'evaluation_periods'));
  for (const pDoc of periodsSnap.docs) {
    await setDoc(doc(db, 'evaluation_periods', pDoc.id), {
      voterEmployeeIds: validStaffIds,
      targetEmployeeIds: validStaffIds,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log(`  ✓ Đã chuẩn hóa evaluation_periods/${pDoc.id}`);
  }

  console.log('\n[3/3] Cập nhật period_configs...');
  const configsSnap = await getDocs(collection(db, 'period_configs'));
  for (const cDoc of configsSnap.docs) {
    await setDoc(doc(db, 'period_configs', cDoc.id), {
      voterEmployeeIds: validStaffIds,
      targetEmployeeIds: validStaffIds,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log(`  ✓ Đã chuẩn hóa period_configs/${cDoc.id}`);
  }

  await setDoc(doc(db, 'system_metadata', 'schema_status'), {
    version: TARGET_SCHEMA_VERSION,
    status: 'HEALTHY',
    lastCleanup: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  console.log(`\n✓ Đã cập nhật metadata schema_status: ${TARGET_SCHEMA_VERSION}`);
}

normalize()
  .then(() => {
    console.log('=== CHUẨN HÓA THÀNH CÔNG ===');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Lỗi chuẩn hóa:', err);
    process.exit(1);
  });

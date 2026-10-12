import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase.js';
import { DEFAULT_MODULE_HR_SETTINGS } from '../src/lib/systemDefaults.js';
import { isCreditOfficerRole } from '../src/lib/evaluationUtils.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function syncWorkLocationAndCreditAreas() {
  console.log('Đang đăng nhập admin...');
  await signInWithEmailAndPassword(auth, 'ducanht@gmail.com', 'Qtd@2003');
  console.log('Đăng nhập thành công! Bắt đầu đồng bộ Nơi làm việc, Địa bàn tín dụng và Cấu hình Phân hệ...');

  // 1. Cập nhật system_settings/module_hr
  console.log('1. Cập nhật cấu hình system_settings/module_hr...');
  await setDoc(
    doc(db, 'system_settings', 'module_hr'),
    {
      ...DEFAULT_MODULE_HR_SETTINGS,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  console.log('✅ Đã cập nhật thành công module_hr (creditAreas & workLocations)');

  // 2. Cập nhật system_metadata/schema
  await setDoc(
    doc(db, 'system_metadata', 'schema'),
    {
      version: '2026.10.12_v5.9_work_locations_and_credit_areas_subsystem',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  console.log('✅ Đã cập nhật system_metadata/schema lên v5.9');

  // 3. Cập nhật users
  const defaultWorkLocation = 'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)';
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log(`Tìm thấy ${usersSnap.size} documents trong bảng users`);
  for (const docSnap of usersSnap.docs) {
    const data = docSnap.data();
    const isCBTD = isCreditOfficerRole(data.position, data.department);

    const updatePayload = {
      workLocation: data.workLocation || defaultWorkLocation,
      assignedArea: isCBTD ? (data.assignedArea || '') : '',
      areaStartDate: isCBTD ? (data.areaStartDate || '') : '',
      updatedAt: new Date().toISOString(),
      serverTime: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', docSnap.id), updatePayload, { merge: true });
    console.log(`- Đã cập nhật users/${docSnap.id} (${data.name || ''}): Loc=${updatePayload.workLocation}, CBTD=${isCBTD ? 'Có' : 'Không'}, Area=${updatePayload.assignedArea}`);
  }

  // 4. Cập nhật employees
  const empSnap = await getDocs(collection(db, 'employees'));
  console.log(`Tìm thấy ${empSnap.size} documents trong bảng employees`);
  for (const docSnap of empSnap.docs) {
    const data = docSnap.data();
    const isCBTD = isCreditOfficerRole(data.position, data.department);

    const updatePayload = {
      workLocation: data.workLocation || defaultWorkLocation,
      assignedArea: isCBTD ? (data.assignedArea || '') : '',
      areaStartDate: isCBTD ? (data.areaStartDate || '') : '',
      updatedAt: new Date().toISOString(),
      serverTime: serverTimestamp(),
    };

    await setDoc(doc(db, 'employees', docSnap.id), updatePayload, { merge: true });
    console.log(`- Đã cập nhật employees/${docSnap.id} (${data.name || ''}): Loc=${updatePayload.workLocation}, CBTD=${isCBTD ? 'Có' : 'Không'}, Area=${updatePayload.assignedArea}`);
  }

  console.log('🎉 Hoàn thành 100% cập nhật CSDL Firestore cho Nơi làm việc và Phân vùng CBTD!');
}

syncWorkLocationAndCreditAreas().catch((err) => {
  console.error('❌ Lỗi khi thực hiện đồng bộ:', err);
  process.exit(1);
});

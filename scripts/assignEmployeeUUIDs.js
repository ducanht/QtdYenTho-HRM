import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase.js';
import crypto from 'crypto';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Danh sách UUID v4 cố định chuẩn hóa cho 13 CBNV & SuperAdmin để bảo đảm tính bất biến
const PRESET_UUIDS = {
  'emp-root': 'a0000000-0000-4000-8000-000000000001',
  'emp-001': 'a1000001-0001-4000-8000-000000000001',
  'emp-002': 'a1000002-0002-4000-8000-000000000002',
  'emp-003': 'a1000003-0003-4000-8000-000000000003',
  'emp-004': 'a1000004-0004-4000-8000-000000000004',
  'emp-005': 'a1000005-0005-4000-8000-000000000005',
  'emp-006': 'a1000006-0006-4000-8000-000000000006',
  'emp-007': 'a1000007-0007-4000-8000-000000000007',
  'emp-008': 'a1000008-0008-4000-8000-000000000008',
  'emp-009': 'a1000009-0009-4000-8000-000000000009',
  'emp-010': 'a1000010-0010-4000-8000-000000000010',
  'emp-011': 'a1000011-0011-4000-8000-000000000011',
  'emp-012': 'a1000012-0012-4000-8000-000000000012',
  'emp-013': 'a1000013-0013-4000-8000-000000000013',
};

async function run() {
  console.log('Đang đăng nhập Firebase Auth...');
  await signInWithEmailAndPassword(auth, 'ducanht@gmail.com', 'Qtd@2003');

  console.log('Đang rà soát và gán UUID cho bảng users...');
  const userSnap = await getDocs(collection(db, 'users'));
  for (const d of userSnap.docs) {
    const data = d.data();
    let empUuid = data.uuid || PRESET_UUIDS[d.id] || crypto.randomUUID();
    await setDoc(doc(db, 'users', d.id), { uuid: empUuid }, { merge: true });
    console.log(`[users] ${d.id} (${data.code} - ${data.name}) -> uuid: ${empUuid}`);
  }

  console.log('\nĐang rà soát và gán UUID cho bảng employees...');
  const empSnap = await getDocs(collection(db, 'employees'));
  for (const d of empSnap.docs) {
    const data = d.data();
    let empUuid = data.uuid || PRESET_UUIDS[d.id] || crypto.randomUUID();
    await setDoc(doc(db, 'employees', d.id), { uuid: empUuid }, { merge: true });
    console.log(`[employees] ${d.id} (${data.code} - ${data.name}) -> uuid: ${empUuid}`);
  }

  console.log('\nHoàn tất gán UUID chuẩn RFC 4122 v4 không trùng lặp cho toàn bộ CBNV!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Lỗi thực hiện:', err);
  process.exit(1);
});

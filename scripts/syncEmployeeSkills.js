import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_SKILLS = {
  'emp-001': { itLevel: 'Ứng dụng CNTT cơ bản', foreignLanguage: 'Tiếng Anh', secondaryPhone: '' },
  'emp-002': { itLevel: 'Ứng dụng CNTT cơ bản', foreignLanguage: 'Tiếng Anh', secondaryPhone: '' },
  'emp-003': { itLevel: 'Ứng dụng CNTT cơ bản', foreignLanguage: 'Tiếng Anh', secondaryPhone: '' },
  'emp-004': { itLevel: 'Ứng dụng CNTT cơ bản', foreignLanguage: 'Tiếng Anh', secondaryPhone: '' },
  'emp-005': { itLevel: 'Ứng dụng CNTT cơ bản', foreignLanguage: 'Tiếng Anh', secondaryPhone: '' },
  'emp-006': { itLevel: 'Ứng dụng CNTT cơ bản', foreignLanguage: 'Tiếng Anh', secondaryPhone: '' },
  'emp-007': { itLevel: 'Ứng dụng CNTT nâng cao', foreignLanguage: 'Tiếng Anh B1', secondaryPhone: '0912345678' },
  'emp-008': { itLevel: 'Ứng dụng CNTT cơ bản', foreignLanguage: 'Tiếng Anh', secondaryPhone: '' },
  'emp-009': { itLevel: 'Ứng dụng CNTT cơ bản', foreignLanguage: 'Tiếng Anh', secondaryPhone: '' },
  'emp-010': { itLevel: 'Ứng dụng CNTT cơ bản', foreignLanguage: 'Tiếng Anh', secondaryPhone: '' },
  'emp-011': { itLevel: 'Ứng dụng CNTT cơ bản', foreignLanguage: 'Tiếng Anh', secondaryPhone: '' },
  'emp-012': { itLevel: 'Ứng dụng CNTT cơ bản', foreignLanguage: 'Tiếng Anh', secondaryPhone: '' },
  'emp-013': { itLevel: 'Ứng dụng CNTT cơ bản', foreignLanguage: 'Tiếng Anh', secondaryPhone: '' },
};

async function syncSkills() {
  console.log('Đang đăng nhập admin...');
  await signInWithEmailAndPassword(auth, 'ducanht@gmail.com', 'Qtd@2003');
  console.log('Đăng nhập thành công! Bắt đầu đồng bộ trường Tin học, Ngoại ngữ và SĐT phụ...');

  // 1. Cập nhật bảng users
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log(`Tìm thấy ${usersSnap.size} documents trong bảng users`);
  for (const docSnap of usersSnap.docs) {
    const data = docSnap.data();
    const skills = DEFAULT_SKILLS[docSnap.id] || {
      itLevel: 'Ứng dụng CNTT cơ bản',
      foreignLanguage: 'Tiếng Anh',
      secondaryPhone: '',
    };

    const updatePayload = {
      itLevel: data.itLevel || skills.itLevel,
      foreignLanguage: data.foreignLanguage || skills.foreignLanguage,
      secondaryPhone: data.secondaryPhone || skills.secondaryPhone || '',
      updatedAt: new Date().toISOString(),
      serverTime: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', docSnap.id), updatePayload, { merge: true });
    console.log(`- Đã cập nhật users/${docSnap.id} (${data.name || ''}): IT=${updatePayload.itLevel}, Lang=${updatePayload.foreignLanguage}`);
  }

  // 2. Cập nhật bảng employees
  const empSnap = await getDocs(collection(db, 'employees'));
  console.log(`Tìm thấy ${empSnap.size} documents trong bảng employees`);
  for (const docSnap of empSnap.docs) {
    const data = docSnap.data();
    const skills = DEFAULT_SKILLS[docSnap.id] || {
      itLevel: 'Ứng dụng CNTT cơ bản',
      foreignLanguage: 'Tiếng Anh',
      secondaryPhone: '',
    };

    const updatePayload = {
      itLevel: data.itLevel || skills.itLevel,
      foreignLanguage: data.foreignLanguage || skills.foreignLanguage,
      secondaryPhone: data.secondaryPhone || skills.secondaryPhone || '',
      updatedAt: new Date().toISOString(),
      serverTime: serverTimestamp(),
    };

    await setDoc(doc(db, 'employees', docSnap.id), updatePayload, { merge: true });
    console.log(`- Đã cập nhật employees/${docSnap.id} (${data.name || ''})`);
  }

  console.log('✅ Hoàn thành 100% cập nhật CSDL Firestore!');
}

syncSkills().catch((err) => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});

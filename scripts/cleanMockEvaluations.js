import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function cleanMockEvaluations() {
  await signInWithEmailAndPassword(auth, 'admin@qtdyentho.vn', 'Admin@123456');
  console.log(`Đã đăng nhập: ${auth.currentUser.email}`);

  const mockIds = ['trust-001', 'trust-002', 'trust-003', 'trust-004', 'trust-005'];
  for (const id of mockIds) {
    try {
      await deleteDoc(doc(db, 'evaluations_trust', id));
      console.log(`✓ Đã xóa tài liệu mock: ${id}`);
    } catch (e) {
      console.error(`Lỗi khi xóa ${id}:`, e.message);
    }
  }
  console.log('Hoàn tất xóa sạch dữ liệu mock trong evaluations_trust!');
  process.exit(0);
}

cleanMockEvaluations().catch(err => {
  console.error(err);
  process.exit(1);
});

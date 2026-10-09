import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, 'admin@qtdyentho.vn', 'Admin@123456');
    console.log(`Đã đăng nhập: ${auth.currentUser.email}`);
  } catch (e) {
    await signInWithEmailAndPassword(auth, 'canbo@qtdyentho.vn', '123456');
    console.log(`Đã đăng nhập: ${auth.currentUser.email}`);
  }

  const snap = await getDocs(collection(db, 'evaluations_trust'));
  console.log(`\n=== TỔNG CỘNG ${snap.size} TÀI LIỆU TRONG evaluations_trust ===`);
  const mockDocs = [];
  snap.forEach((d) => {
    const data = d.data();
    const isMock = d.id.startsWith('trust-') || data.evaluatorId === 'anonymous' || data.evaluatorName?.includes('Ẩn danh') || data.isMock;
    console.log(`- ID: ${d.id} | Period: ${data.periodId} | Evaluator: "${data.evaluatorName}" (${data.evaluatorId}) | Target: "${data.targetEmployeeName}" | Total: ${data.totalScore} | isMock: ${isMock}`);
    if (isMock) {
      mockDocs.push(d.id);
    }
  });

  console.log(`\nPhát hiện ${mockDocs.length} tài liệu mock:`, mockDocs);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  await signInWithEmailAndPassword(auth, 'ducanht@gmail.com', 'Qtd@2003');

  const userSnap = await getDocs(collection(db, 'users'));
  console.log(`\n=== USERS (Tổng cộng ${userSnap.size} docs) ===`);
  userSnap.forEach((d) => {
    const data = d.data();
    console.log(`id: "${d.id}", code: "${data.code}", name: "${data.name}", email: "${data.email}"`);
  });

  const empSnap = await getDocs(collection(db, 'employees'));
  console.log(`\n=== EMPLOYEES (Tổng cộng ${empSnap.size} docs) ===`);
  empSnap.forEach((d) => {
    const data = d.data();
    console.log(`id: "${d.id}", code: "${data.code}", name: "${data.name}", email: "${data.email}"`);
  });

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

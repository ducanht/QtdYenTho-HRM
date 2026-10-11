import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  await signInWithEmailAndPassword(auth, 'ducanht@gmail.com', 'Qtd@2003');

  console.log('\n--- 1. EVALUATIONS_TRUST ---');
  const trustSnap = await getDocs(collection(db, 'evaluations_trust'));
  console.log(`Số lượng: ${trustSnap.size}`);
  trustSnap.forEach((d) => {
    const data = d.data();
    console.log(`- Evaluator: ${data.evaluatorId} | Target: ${data.targetEmployeeId} (${data.targetEmployeeName})`);
  });

  console.log('\n--- 2. WORK_HISTORY ---');
  const workSnap = await getDocs(collection(db, 'work_history'));
  console.log(`Số lượng: ${workSnap.size}`);
  workSnap.forEach((d) => {
    const data = d.data();
    console.log(`- ID: ${d.id} | employeeId: ${data.employeeId} | code: ${data.employeeCode} | name: ${data.employeeName}`);
  });

  console.log('\n--- 3. EMPLOYEE_TRAINING ---');
  const trainSnap = await getDocs(collection(db, 'employee_training'));
  console.log(`Số lượng: ${trainSnap.size}`);
  trainSnap.forEach((d) => {
    const data = d.data();
    console.log(`- ID: ${d.id} | employeeId: ${data.employeeId} | course: ${data.courseName}`);
  });

  console.log('\n--- 4. EVALUATIONS_KPI ---');
  const kpiSnap = await getDocs(collection(db, 'evaluations_kpi'));
  console.log(`Số lượng: ${kpiSnap.size}`);
  kpiSnap.forEach((d) => {
    const data = d.data();
    console.log(`- ID: ${d.id} | employeeId: ${data.employeeId} | name: ${data.employeeName}`);
  });

  console.log('\n--- 5. ACCOUNTS ---');
  const accSnap = await getDocs(collection(db, 'accounts'));
  console.log(`Số lượng: ${accSnap.size}`);
  accSnap.forEach((d) => {
    const data = d.data();
    console.log(`- ID: ${d.id} | employeeId: ${data.employeeId} | email: ${data.email}`);
  });

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

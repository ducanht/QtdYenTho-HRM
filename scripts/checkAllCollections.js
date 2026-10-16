import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const collections = [
  'accounts',
  'employees',
  'users',
  'work_history',
  'employee_degrees',
  'employee_socials',
  'employee_contracts',
  'employee_contract_annexes',
  'evaluation_periods',
  'period_configs',
  'trust_criteria',
  'evaluations_trust',
  'evaluations_kpi',
  'evaluations_planning',
  'employee_training',
  'employee_kpi_history',
  'departments',
  'positions',
  'system_metadata',
  'system_modules',
  'system_settings',
  'roles_permissions',
];

async function check() {
  await signInWithEmailAndPassword(auth, 'ducanht@gmail.com', 'Qtd@2003');
  console.log('=== TỔNG HỢP DOCUMENT CỦA TOÀN BỘ 18 BẢNG TRONG CSDL FIRESTORE ===');
  for (const c of collections) {
    try {
      const snap = await getDocs(collection(db, c));
      console.log(`- ${c.padEnd(25)}: ${snap.size} docs`);
    } catch (err) {
      console.error(`- ${c.padEnd(25)}: LỖI (${err.message})`);
    }
  }
}

check().catch(console.error);

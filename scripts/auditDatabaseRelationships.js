import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function checkRelationships() {
  await signInWithEmailAndPassword(auth, 'admin@qtdyentho.vn', 'Admin@123456');
  console.log('=== BÁO CÁO RÀ SOÁT MỐI QUAN HỆ CSDL TOÀN BỘ CÁC MODULE ===\n');

  // 1. Module Nhân sự gốc (employees)
  const empSnap = await getDocs(collection(db, 'employees'));
  const empMap = new Map();
  empSnap.forEach(d => empMap.set(d.id, d.data()));
  console.log(`[1. NHÂN SỰ] Tổng số cán bộ chính thức: ${empSnap.size} cán bộ`);
  empMap.forEach((v, k) => {
    console.log(`   - ${k}: ${v.code} | ${v.name} | ${v.department} | ${v.position} | ${v.assignedArea || 'Chung'}`);
  });

  // 2. Module Tài khoản & Phân quyền (accounts)
  const accSnap = await getDocs(collection(db, 'accounts'));
  let accLinked = 0, accUnlinked = 0;
  accSnap.forEach(d => {
    const data = d.data();
    if (data.employeeId && empMap.has(data.employeeId)) accLinked++;
    else accUnlinked++;
  });
  console.log(`\n[2. TÀI KHOẢN] Tổng: ${accSnap.size} | Liên kết đúng CBNV: ${accLinked} | Tài khoản quản trị hệ thống: ${accUnlinked}`);

  // 3. Module Đánh giá KPI (evaluations_kpi & employee_kpi_history)
  const kpiSnap = await getDocs(collection(db, 'evaluations_kpi'));
  let kpiValid = 0, kpiOrphan = 0;
  kpiSnap.forEach(d => {
    const data = d.data();
    if (empMap.has(data.employeeId)) kpiValid++;
    else kpiOrphan++;
  });
  console.log(`\n[3. ĐÁNH GIÁ KPI] Tổng: ${kpiSnap.size} phiếu | Khớp đúng CBNV: ${kpiValid} | Mồ côi (Orphan): ${kpiOrphan}`);

  const histSnap = await getDocs(collection(db, 'employee_kpi_history'));
  let histValid = 0, histOrphan = 0;
  histSnap.forEach(d => {
    const data = d.data();
    if (empMap.has(data.employeeId)) histValid++;
    else histOrphan++;
  });
  console.log(`[3b. LỊCH SỬ KPI] Tổng: ${histSnap.size} bản ghi | Khớp đúng CBNV: ${histValid} | Mồ côi: ${histOrphan}`);

  // 4. Module Hồ sơ chuyên sâu (Work History, Degrees, Socials, Contracts, Training)
  const subModules = [
    { name: 'work_history', label: 'Quá trình công tác / Luân chuyển' },
    { name: 'employee_degrees', label: 'Văn bằng chứng chỉ' },
    { name: 'employee_socials', label: 'Mạng xã hội & Kênh liên lạc' },
    { name: 'employee_contracts', label: 'Hợp đồng lao động' },
    { name: 'employee_contract_annexes', label: 'Phụ lục HĐLĐ' },
    { name: 'employee_training', label: 'Đào tạo & Bồi dưỡng' }
  ];

  console.log('\n[4. PHÂN HỆ HỒ SƠ CHI TIẾT CBNV]');
  for (const m of subModules) {
    const snap = await getDocs(collection(db, m.name));
    let valid = 0, invalid = 0;
    snap.forEach(d => {
      const data = d.data();
      const eid = data.employeeId || data.employeeUuid;
      if (eid && empMap.has(eid)) valid++;
      else if (eid) invalid++;
    });
    console.log(`   - ${m.label} (${m.name}): ${snap.size} bản ghi | Hợp lệ: ${valid} | Mồ côi: ${invalid}`);
  }

  // 5. Module Tiêu chí KPI & Nhóm tiêu chí (kpi_criteria & kpi_criteria_groups)
  const groupSnap = await getDocs(collection(db, 'kpi_criteria_groups'));
  const groupIds = new Set(groupSnap.docs.map(d => d.id));
  const criteriaSnap = await getDocs(collection(db, 'kpi_criteria'));
  let critValidGroup = 0, critInvalidGroup = 0;
  criteriaSnap.forEach(d => {
    const data = d.data();
    if (data.groupId && groupIds.has(data.groupId)) critValidGroup++;
    else critInvalidGroup++;
  });
  console.log(`\n[5. TIÊU CHÍ KPI ĐỘNG]`);
  console.log(`   - Nhóm tiêu chí (${groupSnap.size} nhóm):`, groupSnap.docs.map(d => `${d.id} (${d.data().name})`).join(', '));
  console.log(`   - Tiêu chí chi tiết (${criteriaSnap.size} tiêu chí) | Thuộc nhóm hợp lệ: ${critValidGroup} | Không nhóm: ${critInvalidGroup}`);

  // 6. Module Kỳ chấm điểm (kpi_periods & evaluation_periods)
  const kpiPeriodSnap = await getDocs(collection(db, 'kpi_periods'));
  console.log(`\n[6. KỲ ĐÁNH GIÁ]`);
  console.log(`   - Kỳ chấm điểm KPI (kpi_periods): ${kpiPeriodSnap.size} kỳ`);
  kpiPeriodSnap.forEach(d => {
    const p = d.data();
    console.log(`     * [${p.id}] ${p.name} (${p.type}) | Trạng thái: ${p.status} | Phạm vi: ${p.participantScope}`);
  });

  const trustPeriodSnap = await getDocs(collection(db, 'evaluation_periods'));
  console.log(`   - Kỳ tín nhiệm (evaluation_periods): ${trustPeriodSnap.size} kỳ`);

  // 7. Module Phòng ban & Chức danh dùng chung
  const deptSnap = await getDocs(collection(db, 'departments'));
  const posSnap = await getDocs(collection(db, 'positions'));
  console.log(`\n[7. DANH MỤC DÙNG CHUNG]`);
  console.log(`   - Phòng ban (departments): ${deptSnap.size} phòng ban`);
  deptSnap.forEach(d => console.log(`     * ${d.id}: ${d.data().name}`));
  console.log(`   - Chức vụ (positions): ${posSnap.size} chức vụ`);

  // 8. Địa bàn tín dụng & Trụ sở
  const areaSnap = await getDocs(collection(db, 'credit_areas'));
  const locSnap = await getDocs(collection(db, 'work_locations'));
  console.log(`\n[8. ĐỊA BÀN & ĐIỂM LÀM VIỆC]`);
  console.log(`   - Địa bàn tín dụng (credit_areas): ${areaSnap.size} địa bàn`);
  areaSnap.forEach(d => console.log(`     * ${d.id}: ${d.data().name} | Xã: ${d.data().commune || '—'} | Cán bộ phụ trách: ${d.data().officerName || '—'}`));
  console.log(`   - Điểm làm việc (work_locations): ${locSnap.size} điểm`);

  console.log('\n=== HOÀN TẤT RÀ SOÁT CƠ SỞ DỮ LIỆU ===');
  process.exit(0);
}

checkRelationships().catch(e => { console.error(e); process.exit(1); });

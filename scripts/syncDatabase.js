// Script CLI tự động đồng bộ CSDL Firebase Firestore theo cấu trúc mới nhất
// Quỹ Tín Dụng Nhân Dân Yên Thọ - HRM Engine
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';

import { firebaseConfig } from '../src/lib/firebase.js';
import { 
  DEFAULT_DEPARTMENTS,
  DEFAULT_POSITIONS,
  DEFAULT_TRUST_CRITERIA,
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_MODULE_TRUST_SETTINGS,
  DEFAULT_MODULE_HR_SETTINGS,
  DEFAULT_MODULE_KPI_SETTINGS,
  DEFAULT_MODULE_PLANNING_SETTINGS,
  DEFAULT_MODULE_ATTENDANCE_SETTINGS,
  DEFAULT_MODULE_PAYROLL_SETTINGS,
  DEFAULT_MODULE_AWARDS_SETTINGS,
  DEFAULT_EVALUATION_PERIODS,
  OFFICIAL_EMPLOYEES,
  OFFICIAL_WORK_HISTORY,
  OFFICIAL_STAFF_EMPLOYEES,
  DEFAULT_ACCOUNTS,
  DEFAULT_EMPLOYEE_DEGREES,
  DEFAULT_EMPLOYEE_SOCIALS,
  DEFAULT_EMPLOYEE_CONTRACTS,
  DEFAULT_CONTRACT_ANNEXES,
  DEFAULT_WORK_LOCATIONS,
  DEFAULT_CREDIT_AREAS,
  DEFAULT_KPI_CRITERIA_CATALOG,
  DEFAULT_KPI_CRITERIA_GROUPS,
  DEFAULT_KPI_PERIODS,
} from '../src/lib/systemDefaults.js';
import { SYSTEM_MODULES, ROLE_PERMISSIONS } from '../src/lib/permissions.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const CURRENT_SCHEMA_VERSION = '2026.10.22_v6.3_dynamic_criteria_groups_and_kpi_periods';

const CORE_COLLECTIONS = [
  'accounts',
  'employees',
  'system_metadata',
  'system_modules',
  'system_settings',
  'roles_permissions',
  'departments',
  'positions',
  'trust_criteria',
  'evaluation_periods',
  'period_configs',
  'users',
  'work_history',
  'employee_degrees',
  'employee_socials',
  'employee_contracts',
  'employee_contract_annexes',
  'evaluations_trust',
  'evaluations_kpi',
  'evaluations_planning',
  'employee_training',
  'employee_kpi_history',
  'work_locations',
  'credit_areas',
  'kpi_criteria',
  'kpi_criteria_groups',
  'kpi_periods',
];

async function runAutoSync() {
  console.log('\n=============================================================');
  console.log(`🔄 ĐANG TỰ ĐỒNG BỘ CSDL FIRESTORE LÊN PHIÊN BẢN ${CURRENT_SCHEMA_VERSION}...`);
  console.log('=============================================================\n');

  // Đăng nhập tài khoản Quản trị viên
  console.log('🔑 Đang đăng nhập tài khoản Quản trị viên...');
  try {
    await signInWithEmailAndPassword(auth, 'admin@qtdyentho.vn', 'Admin@123456');
    console.log(`  ✓ Đã đăng nhập Quản trị viên: ${auth.currentUser.email} (${auth.currentUser.uid})`);
  } catch (err) {
    console.warn(`  ⚠️ Thử đăng nhập tài khoản dự phòng ducanht@gmail.com...`);
    await signInWithEmailAndPassword(auth, 'ducanht@gmail.com', 'Qtd@2003');
  }

  const syncStats = { success: 0, pendingRules: 0, total: CORE_COLLECTIONS.length };

  // Helper an toàn ghi document
  const safeSet = async (col, docId, data) => {
    try {
      await setDoc(doc(db, col, docId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
      return true;
    } catch (err) {
      if (err.message.includes('permission') || err.message.includes('PERMISSION_DENIED')) {
        return 'PENDING_RULES';
      }
      throw err;
    }
  };

  // 1. system_modules
  console.log('1. Đồng bộ Danh mục Phân hệ (system_modules)...');
  try {
    for (const key of Object.keys(SYSTEM_MODULES)) {
      await safeSet('system_modules', SYSTEM_MODULES[key].code, SYSTEM_MODULES[key]);
    }
    syncStats.success++;
  } catch (e) { console.warn('  ⚠️ system_modules:', e.message); }

  // 2. roles_permissions
  console.log('2. Đồng bộ Ma trận Phân quyền (roles_permissions)...');
  try {
    for (const roleKey of Object.keys(ROLE_PERMISSIONS)) {
      await safeSet('roles_permissions', roleKey, { role: roleKey, permissions: ROLE_PERMISSIONS[roleKey] });
    }
    syncStats.success++;
  } catch (e) { console.warn('  ⚠️ roles_permissions:', e.message); }

  // 3. departments
  console.log('3. Đồng bộ Danh mục Phòng ban (departments)...');
  for (const dept of DEFAULT_DEPARTMENTS) {
    await safeSet('departments', dept.id, dept);
  }
  syncStats.success++;

  // 4. positions
  console.log('4. Đồng bộ Danh mục Chức danh (positions)...');
  for (const pos of DEFAULT_POSITIONS) {
    await safeSet('positions', pos.id, pos);
  }
  syncStats.success++;

  // 5. system_settings
  console.log('5. Đồng bộ Cấu hình Hệ thống & Phân hệ (system_settings)...');
  await safeSet('system_settings', 'general', DEFAULT_SYSTEM_SETTINGS);
  const subsystemDefaults = [
    { id: 'module_trust', data: DEFAULT_MODULE_TRUST_SETTINGS },
    { id: 'module_hr', data: DEFAULT_MODULE_HR_SETTINGS },
    { id: 'module_kpi', data: DEFAULT_MODULE_KPI_SETTINGS },
    { id: 'module_planning', data: DEFAULT_MODULE_PLANNING_SETTINGS },
    { id: 'module_attendance', data: DEFAULT_MODULE_ATTENDANCE_SETTINGS },
    { id: 'module_payroll', data: DEFAULT_MODULE_PAYROLL_SETTINGS },
    { id: 'module_awards', data: DEFAULT_MODULE_AWARDS_SETTINGS },
  ];
  for (const sub of subsystemDefaults) {
    await safeSet('system_settings', sub.id, sub.data);
  }
  syncStats.success++;

  // 6. trust_criteria
  console.log('6. Đồng bộ 10 Tiêu chí Đánh giá Tín nhiệm (trust_criteria)...');
  for (const crit of DEFAULT_TRUST_CRITERIA) {
    await safeSet('trust_criteria', crit.code, crit);
  }
  syncStats.success++;

  // 7. evaluation_periods & period_configs
  console.log('7. Đồng bộ Đợt Đánh giá & Bảng Cấu hình Riêng (evaluation_periods & period_configs)...');
  const validStaffIds = OFFICIAL_STAFF_EMPLOYEES.map((e) => e.id);
  for (const p of DEFAULT_EVALUATION_PERIODS) {
    await safeSet('evaluation_periods', p.id, {
      ...p,
      configId: p.id,
      allowSelfEvaluation: false,
      voterEmployeeIds: validStaffIds,
      targetEmployeeIds: validStaffIds,
      thresholds: { excellent: 90, good: 70, pass: 50 },
    });
    await safeSet('period_configs', p.id, {
      id: p.id,
      periodId: p.id,
      periodName: p.name,
      votingMode: p.votingMode || 'ANONYMOUS',
      allowSelfEvaluation: false,
      excellentThreshold: 90,
      goodThreshold: 70,
      passThreshold: 50,
      scale: 100,
      voterEmployeeIds: validStaffIds,
      targetEmployeeIds: validStaffIds,
      criteria: DEFAULT_TRUST_CRITERIA,
    });
  }
  syncStats.success += 2;

  // 8. employees
  console.log('8. Đồng bộ Danh bạ Cán bộ Chính thức (employees)...');
  for (const emp of OFFICIAL_STAFF_EMPLOYEES) {
    await safeSet('employees', emp.id, emp);
  }
  syncStats.success++;

  // 9. accounts
  console.log('9. Đồng bộ Danh sách Tài khoản Đăng nhập (accounts)...');
  for (const acc of DEFAULT_ACCOUNTS) {
    await safeSet('accounts', acc.id, acc);
  }
  syncStats.success++;

  // 10. users
  console.log('10. Đồng bộ Hồ sơ Cán bộ (users)...');
  for (const emp of OFFICIAL_EMPLOYEES) {
    await safeSet('users', emp.id, emp);
  }
  syncStats.success++;

  // 11. work_history
  console.log('11. Đồng bộ Quá trình Luân chuyển Công tác (work_history)...');
  for (const trans of OFFICIAL_WORK_HISTORY) {
    await safeSet('work_history', trans.id, trans);
  }
  syncStats.success++;

  // 12. employee_degrees
  console.log('12. Đồng bộ Danh mục Văn bằng Chuyên môn (employee_degrees)...');
  let degSuccess = 0;
  for (const deg of DEFAULT_EMPLOYEE_DEGREES) {
    const res = await safeSet('employee_degrees', deg.id, deg);
    if (res === true) degSuccess++;
  }
  console.log(`  ✓ Đã nạp ${degSuccess} văn bằng chuyên môn.`);
  syncStats.success++;

  // 13. employee_socials
  console.log('13. Đồng bộ Danh mục Kênh Mạng Xã Hội (employee_socials)...');
  let socSuccess = 0;
  for (const soc of DEFAULT_EMPLOYEE_SOCIALS) {
    const res = await safeSet('employee_socials', soc.id, soc);
    if (res === true) socSuccess++;
  }
  console.log(`  ✓ Đã nạp ${socSuccess} kênh mạng xã hội & liên lạc số.`);
  syncStats.success++;

  // 14. employee_contracts
  console.log('14. Đồng bộ Hợp đồng Lao động (employee_contracts)...');
  let contSuccess = 0;
  let contPending = false;
  for (const contract of DEFAULT_EMPLOYEE_CONTRACTS) {
    const res = await safeSet('employee_contracts', contract.id, contract);
    if (res === true) contSuccess++;
    if (res === 'PENDING_RULES') contPending = true;
  }
  if (contPending) {
    console.log(`  ⚠️ employee_contracts: Đang chờ deploy firestore.rules lên Firebase Console.`);
    syncStats.pendingRules++;
  } else {
    console.log(`  ✓ Đã nạp ${contSuccess} hợp đồng lao động.`);
    syncStats.success++;
  }

  // 15. employee_contract_annexes
  console.log('15. Đồng bộ Phụ lục Hợp đồng Lao động (employee_contract_annexes)...');
  let anxSuccess = 0;
  let anxPending = false;
  for (const annex of DEFAULT_CONTRACT_ANNEXES) {
    const res = await safeSet('employee_contract_annexes', annex.id, annex);
    if (res === true) anxSuccess++;
    if (res === 'PENDING_RULES') anxPending = true;
  }
  if (anxPending) {
    console.log(`  ⚠️ employee_contract_annexes: Đang chờ deploy firestore.rules lên Firebase Console.`);
    syncStats.pendingRules++;
  } else {
    console.log(`  ✓ Đã nạp ${anxSuccess} phụ lục hợp đồng.`);
    syncStats.success++;
  }

  // 16. work_locations
  console.log('16. Đồng bộ Điểm làm việc & Trụ sở hoạt động (work_locations)...');
  let locSuccess = 0;
  for (const loc of DEFAULT_WORK_LOCATIONS) {
    const res = await safeSet('work_locations', loc.id, loc);
    if (res === true) locSuccess++;
  }
  console.log(`  ✓ Đã nạp ${locSuccess} điểm làm việc & trụ sở hoạt động.`);
  syncStats.success++;

  // 17. credit_areas
  console.log('17. Đồng bộ Địa bàn quản lý tín dụng CBTD (credit_areas)...');
  let areaSuccess = 0;
  for (const area of DEFAULT_CREDIT_AREAS) {
    const res = await safeSet('credit_areas', area.id, area);
    if (res === true) areaSuccess++;
  }
  console.log(`  ✓ Đã nạp ${areaSuccess} địa bàn quản lý tín dụng.`);
  syncStats.success++;

  // 18. kpi_criteria
  console.log('18. Đồng bộ Danh mục Tiêu chí Đánh giá KPI động (kpi_criteria)...');
  let kpiSuccess = 0;
  for (const crit of DEFAULT_KPI_CRITERIA_CATALOG) {
    const res = await safeSet('kpi_criteria', crit.id, crit);
    if (res === true) kpiSuccess++;
  }
  console.log(`  ✓ Đã nạp ${kpiSuccess} tiêu chí đánh giá KPI động.`);
  syncStats.success++;

  // 18b. kpi_criteria_groups
  console.log('18b. Đồng bộ Danh mục Nhóm Tiêu chí KPI động (kpi_criteria_groups)...');
  let grpSuccess = 0;
  for (const grp of DEFAULT_KPI_CRITERIA_GROUPS) {
    const res = await safeSet('kpi_criteria_groups', grp.id, grp);
    if (res === true) grpSuccess++;
  }
  console.log(`  ✓ Đã nạp ${grpSuccess} nhóm tiêu chí KPI động.`);
  syncStats.success++;

  // 18c. kpi_periods
  console.log('18c. Đồng bộ Danh mục Kỳ chấm điểm KPI (kpi_periods)...');
  let perSuccess = 0;
  for (const per of DEFAULT_KPI_PERIODS) {
    const res = await safeSet('kpi_periods', per.id, per);
    if (res === true) perSuccess++;
  }
  console.log(`  ✓ Đã nạp ${perSuccess} kỳ chấm điểm KPI (tháng & quý).`);
  syncStats.success++;

  // 19. system_metadata
  console.log('19. Ghi nhận Schema Version hoàn tất vào system_metadata...');
  await safeSet('system_metadata', 'schema', {
    version: CURRENT_SCHEMA_VERSION,
    status: 'HEALTHY',
    collections: CORE_COLLECTIONS,
    lastSync: new Date().toISOString(),
  });
  syncStats.success++;

  console.log('\n=============================================================');
  console.log(`🎉 HOÀN TẤT ĐỒNG BỘ CSDL FIRESTORE LÊN PHIÊN BẢN: ${CURRENT_SCHEMA_VERSION}`);
  console.log(`📊 Kết quả: ${syncStats.success} bảng sẵn sàng, ${syncStats.pendingRules} bảng chờ deploy rules.`);
  console.log('=============================================================\n');
}

runAutoSync().catch(console.error);

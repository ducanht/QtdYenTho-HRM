// Tự động Khởi tạo, Cấu hình & Cập nhật Cơ sở Dữ liệu Firebase (Automated Database Provisioning)
// Quỹ Tín Dụng Nhân Dân Yên Thọ - HRM Engine
// Đảm bảo CSDL Firebase luôn tự động đồng bộ cấu trúc bảng và dữ liệu danh mục

import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_WORK_HISTORY,
  INITIAL_TRUST_EVALUATIONS, 
  INITIAL_KPI_EVALUATIONS, 
  INITIAL_PLANNING_VOTES,
  TRUST_CRITERIA,
  EVALUATION_PERIODS 
} from './mockData';
import { SYSTEM_MODULES, ROLE_PERMISSIONS } from './permissions';

/**
 * Phiên bản cấu trúc CSDL hiện tại của dự án
 * Mỗi khi có cập nhật bảng/tiêu chí/module mới, version sẽ được kích hoạt để tự động đồng bộ
 */
export const CURRENT_SCHEMA_VERSION = '2026.10.08_v2.1';

/**
 * Danh sách 10 Collections nòng cốt của CSDL QTDND Yên Thọ
 */
export const CORE_COLLECTIONS = [
  'system_metadata',
  'system_modules',
  'roles_permissions',
  'trust_criteria',
  'evaluation_periods',
  'users',
  'work_history',
  'evaluations_trust',
  'evaluations_kpi',
  'evaluations_planning',
];

/**
 * Tự động đồng bộ CSDL Firebase Firestore theo cấu trúc mới nhất (Auto-Sync & Self-Healing Schema)
 * Được gọi tự động khi ứng dụng khởi chạy (Non-blocking) để đảm bảo không bao giờ thiếu bảng.
 * 
 * @param {boolean} force - Ép buộc đồng bộ lại toàn bộ dù đã khớp version
 * @returns {Promise<{ success: boolean, synced: boolean, version: string, message: string }>}
 */
export const autoSyncDatabaseSchema = async (force = false) => {
  const result = {
    success: false,
    synced: false,
    version: CURRENT_SCHEMA_VERSION,
    message: '',
  };

  // 1. Nếu không có kết nối Firebase, đồng bộ LocalStorage an toàn
  if (!isFirebaseConfigured || !db) {
    if (typeof window !== 'undefined') {
      const localSynced = localStorage.getItem('qtd_hrm_local_synced_version');
      if (localSynced !== CURRENT_SCHEMA_VERSION || force) {
        localStorage.setItem('qtd_hrm_users', JSON.stringify(INITIAL_EMPLOYEES));
        localStorage.setItem('qtd_hrm_work_history', JSON.stringify(INITIAL_WORK_HISTORY));
        localStorage.setItem('qtd_hrm_evaluations_trust', JSON.stringify(INITIAL_TRUST_EVALUATIONS));
        localStorage.setItem('qtd_hrm_evaluations_kpi', JSON.stringify(INITIAL_KPI_EVALUATIONS));
        localStorage.setItem('qtd_hrm_evaluations_planning', JSON.stringify(INITIAL_PLANNING_VOTES));
        localStorage.setItem('qtd_hrm_evaluation_periods', JSON.stringify(EVALUATION_PERIODS));
        localStorage.setItem('qtd_hrm_trust_criteria', JSON.stringify(TRUST_CRITERIA));
        localStorage.setItem('qtd_hrm_system_modules', JSON.stringify(SYSTEM_MODULES));
        localStorage.setItem('qtd_hrm_roles_permissions', JSON.stringify(ROLE_PERMISSIONS));
        localStorage.setItem('qtd_hrm_local_synced_version', CURRENT_SCHEMA_VERSION);
      }
    }
    result.success = true;
    result.synced = true;
    result.message = 'Đã tự động đồng bộ CSDL cục bộ (Chế độ Local Engine).';
    return result;
  }

  // 2. Kiểm tra bộ nhớ cache phiên (Session Cache) để tránh spam Firestore reads mỗi lần đổi trang
  if (typeof window !== 'undefined' && !force) {
    const sessionSynced = sessionStorage.getItem('qtd_hrm_schema_synced_ver');
    if (sessionSynced === CURRENT_SCHEMA_VERSION) {
      result.success = true;
      result.synced = false;
      result.message = 'CSDL đã ở trạng thái đồng bộ mới nhất (Đã kiểm tra trong phiên).';
      return result;
    }
  }

  try {
    // 3. Kiểm tra Document version trên Firestore
    const metaDocRef = doc(db, 'system_metadata', 'schema');
    const metaSnap = await getDoc(metaDocRef).catch(() => null);

    const remoteVersion = metaSnap?.exists() ? metaSnap.data()?.version : null;

    if (remoteVersion === CURRENT_SCHEMA_VERSION && !force) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('qtd_hrm_schema_synced_ver', CURRENT_SCHEMA_VERSION);
      }
      result.success = true;
      result.synced = false;
      result.message = `CSDL Firestore đã đồng bộ hoàn hảo ở phiên bản ${CURRENT_SCHEMA_VERSION}.`;
      return result;
    }

    console.info(`🔄 [Auto-Sync CSDL] Đang tự động cập nhật bảng & dữ liệu Firestore lên phiên bản: ${CURRENT_SCHEMA_VERSION}...`);

    // 4. Tự động đồng bộ các bảng cấu hình nòng cốt với cơ chế Merge an toàn (Zero Data Loss)
    
    // a. Bảng system_modules (Danh mục phân hệ)
    for (const key of Object.keys(SYSTEM_MODULES)) {
      const mod = SYSTEM_MODULES[key];
      await setDoc(doc(db, 'system_modules', mod.code), {
        ...mod,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    // b. Bảng roles_permissions (Ma trận phân quyền)
    for (const roleKey of Object.keys(ROLE_PERMISSIONS)) {
      await setDoc(doc(db, 'roles_permissions', roleKey), {
        role: roleKey,
        permissions: ROLE_PERMISSIONS[roleKey],
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    // c. Bảng trust_criteria (10 tiêu chí đánh giá tín nhiệm)
    for (const crit of TRUST_CRITERIA) {
      await setDoc(doc(db, 'trust_criteria', crit.code), {
        ...crit,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    // d. Kiểm tra & Tự động tạo Đợt đánh giá nếu chưa có
    const periodsSnap = await getDocs(collection(db, 'evaluation_periods')).catch(() => null);
    if (!periodsSnap || periodsSnap.empty) {
      for (const p of EVALUATION_PERIODS) {
        await setDoc(doc(db, 'evaluation_periods', p.id), {
          ...p,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    }

    // e. Kiểm tra & Tự động nạp danh sách 12 cán bộ chính thức nếu collection users rỗng
    const usersSnap = await getDocs(collection(db, 'users')).catch(() => null);
    if (!usersSnap || usersSnap.size < 5) {
      for (const emp of INITIAL_EMPLOYEES) {
        await setDoc(doc(db, 'users', emp.id), {
          ...emp,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    }

    // f. Ghi nhận metadata schema version hoàn tất
    await setDoc(metaDocRef, {
      version: CURRENT_SCHEMA_VERSION,
      status: 'HEALTHY',
      collections: CORE_COLLECTIONS,
      lastSync: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('qtd_hrm_schema_synced_ver', CURRENT_SCHEMA_VERSION);
      window.dispatchEvent(new CustomEvent('qtd-schema-sync-complete', { detail: { version: CURRENT_SCHEMA_VERSION } }));
    }

    result.success = true;
    result.synced = true;
    result.message = `Đã tự động cập nhật toàn bộ bảng CSDL Firebase lên phiên bản ${CURRENT_SCHEMA_VERSION} thành công!`;
    console.info('✅ [Auto-Sync CSDL] Đồng bộ hoàn tất 100% CSDL Firestore.');
    return result;
  } catch (err) {
    console.warn('⚠️ [Auto-Sync CSDL] Tiến trình tự động đồng bộ gặp thông báo:', err.message);
    result.success = false;
    result.message = `Lỗi tự động đồng bộ CSDL: ${err.message}`;
    return result;
  }
};

/**
 * Kiểm tra sức khỏe toàn diện của các bảng trong CSDL Firebase Firestore
 */
export const checkDatabaseHealth = async () => {
  const health = {
    isConfigured: isFirebaseConfigured,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    status: 'UNKNOWN',
    collections: {},
    checkedAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured || !db) {
    health.status = 'LOCAL_FALLBACK';
    return health;
  }

  try {
    const metaDoc = await getDoc(doc(db, 'system_metadata', 'schema')).catch(() => null);
    health.status = metaDoc?.exists() ? 'HEALTHY' : 'NEEDS_INIT';
    health.remoteVersion = metaDoc?.data()?.version || null;

    // Lấy số lượng records ở các bảng chính
    for (const colName of ['users', 'evaluation_periods', 'trust_criteria', 'evaluations_trust']) {
      try {
        const snap = await getDocs(collection(db, colName));
        health.collections[colName] = snap.size;
      } catch {
        health.collections[colName] = 0;
      }
    }
    return health;
  } catch (error) {
    health.status = 'ERROR';
    health.error = error.message;
    return health;
  }
};

/**
 * Tự động khởi tạo và cập nhật toàn bộ các bộ sưu tập (Collections) thủ công có thanh tiến trình
 * (Dành cho Admin nhấn nút trong Modal Khởi Tạo)
 */
export const autoInitializeFirebaseDatabase = async (onProgress = () => {}) => {
  const result = {
    success: false,
    message: '',
    details: {
      system_metadata: 0,
      system_modules: 0,
      roles_permissions: 0,
      trust_criteria: 0,
      evaluation_periods: 0,
      users: 0,
      work_history: 0,
      evaluations_trust: 0,
      evaluations_kpi: 0,
      evaluations_planning: 0,
    },
  };

  if (!isFirebaseConfigured || !db) {
    onProgress('Hệ thống đang hoạt động ở chế độ lưu trữ cục bộ. Đang đồng bộ cấu trúc dữ liệu...');
    localStorage.setItem('qtd_hrm_users', JSON.stringify(INITIAL_EMPLOYEES));
    localStorage.setItem('qtd_hrm_work_history', JSON.stringify(INITIAL_WORK_HISTORY));
    localStorage.setItem('qtd_hrm_evaluations_trust', JSON.stringify(INITIAL_TRUST_EVALUATIONS));
    localStorage.setItem('qtd_hrm_evaluations_kpi', JSON.stringify(INITIAL_KPI_EVALUATIONS));
    localStorage.setItem('qtd_hrm_evaluations_planning', JSON.stringify(INITIAL_PLANNING_VOTES));
    localStorage.setItem('qtd_hrm_evaluation_periods', JSON.stringify(EVALUATION_PERIODS));
    localStorage.setItem('qtd_hrm_trust_criteria', JSON.stringify(TRUST_CRITERIA));
    localStorage.setItem('qtd_hrm_system_modules', JSON.stringify(SYSTEM_MODULES));
    localStorage.setItem('qtd_hrm_roles_permissions', JSON.stringify(ROLE_PERMISSIONS));

    result.success = true;
    result.message = 'Đã tự động khởi tạo và đồng bộ toàn bộ bảng dữ liệu cục bộ thành công!';
    return result;
  }

  try {
    // 1. system_metadata
    onProgress('Bước 1/10: Thiết lập Siêu dữ liệu phiên bản CSDL (system_metadata)...');
    await setDoc(doc(db, 'system_metadata', 'schema'), {
      version: CURRENT_SCHEMA_VERSION,
      status: 'HEALTHY',
      collections: CORE_COLLECTIONS,
      lastSync: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    result.details.system_metadata += 1;

    // 2. system_modules
    onProgress('Bước 2/10: Khởi tạo Danh mục phân hệ mở rộng (system_modules)...');
    for (const key of Object.keys(SYSTEM_MODULES)) {
      const mod = SYSTEM_MODULES[key];
      await setDoc(doc(db, 'system_modules', mod.code), {
        ...mod,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.system_modules += 1;
    }

    // 3. roles_permissions
    onProgress('Bước 3/10: Thiết lập Ma trận phân quyền chi tiết (roles_permissions)...');
    for (const roleKey of Object.keys(ROLE_PERMISSIONS)) {
      await setDoc(doc(db, 'roles_permissions', roleKey), {
        role: roleKey,
        permissions: ROLE_PERMISSIONS[roleKey],
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.roles_permissions += 1;
    }

    // 4. trust_criteria
    onProgress('Bước 4/10: Chuẩn hóa 10 Tiêu chí đánh giá tín nhiệm (trust_criteria)...');
    for (const crit of TRUST_CRITERIA) {
      await setDoc(doc(db, 'trust_criteria', crit.code), {
        ...crit,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.trust_criteria += 1;
    }

    // 5. evaluation_periods
    onProgress('Bước 5/10: Cấu hình Đợt đánh giá tín nhiệm (evaluation_periods)...');
    for (const period of EVALUATION_PERIODS) {
      await setDoc(doc(db, 'evaluation_periods', period.id), {
        ...period,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.evaluation_periods += 1;
    }

    // 6. users
    onProgress('Bước 6/10: Cập nhật Hồ sơ 12 Cán bộ Nhân viên chính thức (users)...');
    for (const emp of INITIAL_EMPLOYEES) {
      await setDoc(doc(db, 'users', emp.id), {
        ...emp,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.users += 1;
    }

    // 7. work_history
    onProgress('Bước 7/10: Ghi nhận Lịch sử luân chuyển công tác (work_history)...');
    for (const trans of INITIAL_WORK_HISTORY) {
      await setDoc(doc(db, 'work_history', trans.id), {
        ...trans,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.work_history += 1;
    }

    // 8. evaluations_trust
    onProgress('Bước 8/10: Đồng bộ Phiếu đánh giá tín nhiệm mẫu (evaluations_trust)...');
    for (const trust of INITIAL_TRUST_EVALUATIONS) {
      await setDoc(doc(db, 'evaluations_trust', trust.id), {
        ...trust,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.evaluations_trust += 1;
    }

    // 9. evaluations_kpi
    onProgress('Bước 9/10: Cập nhật Dữ liệu chấm điểm KPI (evaluations_kpi)...');
    for (const kpi of INITIAL_KPI_EVALUATIONS) {
      await setDoc(doc(db, 'evaluations_kpi', kpi.id), {
        ...kpi,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.evaluations_kpi += 1;
    }

    // 10. evaluations_planning
    onProgress('Bước 10/10: Thiết lập Dữ liệu bỏ phiếu quy hoạch (evaluations_planning)...');
    for (const vote of INITIAL_PLANNING_VOTES) {
      await setDoc(doc(db, 'evaluations_planning', vote.id), {
        ...vote,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.evaluations_planning += 1;
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('qtd_hrm_schema_synced_ver', CURRENT_SCHEMA_VERSION);
    }

    onProgress('Hoàn tất 100%! Toàn bộ 10 bảng dữ liệu Firestore đã được khởi tạo và cấu trúc chuẩn.');
    result.success = true;
    result.message = 'Khởi tạo và đồng bộ toàn bộ bảng dữ liệu Firestore hoàn toàn tự động thành công!';
    return result;
  } catch (error) {
    console.error('Lỗi tự động khởi tạo CSDL Firebase:', error);
    result.success = false;
    result.message = `Lỗi khởi tạo CSDL: ${error.message}`;
    return result;
  }
};

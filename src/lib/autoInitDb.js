// Tự động Khởi tạo, Cấu hình & Cập nhật Cơ sở Dữ liệu Firebase (Automated Database Provisioning)
// Quỹ Tín Dụng Nhân Dân Yên Thọ - HRM Engine
// Áp dụng Chính sách Không sử dụng Dữ liệu Giả lập (Zero Mock Data Policy)
// Đảm bảo CSDL Firebase luôn tự động đồng bộ cấu trúc bảng và danh mục chuẩn mực

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { 
  DEFAULT_DEPARTMENTS,
  DEFAULT_POSITIONS,
  DEFAULT_TRUST_CRITERIA,
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_EVALUATION_PERIODS,
  OFFICIAL_EMPLOYEES,
  OFFICIAL_WORK_HISTORY
} from './systemDefaults';
import { SYSTEM_MODULES, ROLE_PERMISSIONS } from './permissions';

/**
 * Phiên bản cấu trúc CSDL hiện tại của dự án
 * Mỗi khi có cập nhật bảng/tiêu chí/module mới, version sẽ được kích hoạt để tự động đồng bộ
 */
export const CURRENT_SCHEMA_VERSION = '2026.10.08_v3.0_zero_mock';

/**
 * Danh sách các Collections nòng cốt của CSDL QTDND Yên Thọ
 */
export const CORE_COLLECTIONS = [
  'system_metadata',
  'system_modules',
  'system_settings',
  'roles_permissions',
  'departments',
  'positions',
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

  if (!isFirebaseConfigured || !db) {
    if (typeof window !== 'undefined') {
      const localSynced = localStorage.getItem('qtd_hrm_local_synced_version');
      if (localSynced !== CURRENT_SCHEMA_VERSION || force) {
        localStorage.setItem('qtd_hrm_users', JSON.stringify(OFFICIAL_EMPLOYEES));
        localStorage.setItem('qtd_hrm_work_history', JSON.stringify(OFFICIAL_WORK_HISTORY));
        localStorage.setItem('qtd_hrm_evaluation_periods', JSON.stringify(DEFAULT_EVALUATION_PERIODS));
        localStorage.setItem('qtd_hrm_trust_criteria', JSON.stringify(DEFAULT_TRUST_CRITERIA));
        localStorage.setItem('qtd_hrm_departments', JSON.stringify(DEFAULT_DEPARTMENTS));
        localStorage.setItem('qtd_hrm_positions', JSON.stringify(DEFAULT_POSITIONS));
        localStorage.setItem('qtd_hrm_system_settings', JSON.stringify(DEFAULT_SYSTEM_SETTINGS));
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

  // Kiểm tra bộ nhớ cache phiên (Session Cache) để tránh lặp lại reads mỗi lần đổi trang
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

    // 1. Bảng system_modules (Danh mục phân hệ)
    for (const key of Object.keys(SYSTEM_MODULES)) {
      const mod = SYSTEM_MODULES[key];
      await setDoc(doc(db, 'system_modules', mod.code), {
        ...mod,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    // 2. Bảng roles_permissions (Ma trận phân quyền)
    for (const roleKey of Object.keys(ROLE_PERMISSIONS)) {
      await setDoc(doc(db, 'roles_permissions', roleKey), {
        role: roleKey,
        permissions: ROLE_PERMISSIONS[roleKey],
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    // 3. Bảng departments (Danh mục phòng ban)
    for (const dept of DEFAULT_DEPARTMENTS) {
      await setDoc(doc(db, 'departments', dept.id), {
        ...dept,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    // 4. Bảng positions (Danh mục chức danh)
    for (const pos of DEFAULT_POSITIONS) {
      await setDoc(doc(db, 'positions', pos.id), {
        ...pos,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    // 5. Bảng system_settings (Cấu hình hệ thống chung)
    await setDoc(doc(db, 'system_settings', 'general'), {
      ...DEFAULT_SYSTEM_SETTINGS,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // 6. Bảng trust_criteria (10 tiêu chí đánh giá tín nhiệm chuẩn)
    for (const crit of DEFAULT_TRUST_CRITERIA) {
      await setDoc(doc(db, 'trust_criteria', crit.code), {
        ...crit,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    // 7. Kiểm tra & Tự động tạo Đợt đánh giá nếu chưa có
    const periodsSnap = await getDocs(collection(db, 'evaluation_periods')).catch(() => null);
    if (!periodsSnap || periodsSnap.empty) {
      for (const p of DEFAULT_EVALUATION_PERIODS) {
        await setDoc(doc(db, 'evaluation_periods', p.id), {
          ...p,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    }

    // 8. Tự động đồng bộ danh bạ cán bộ chính thức (nếu chưa có hoặc thiếu)
    const usersSnap = await getDocs(collection(db, 'users')).catch(() => null);
    if (!usersSnap || usersSnap.size < 5) {
      for (const emp of OFFICIAL_EMPLOYEES) {
        await setDoc(doc(db, 'users', emp.id), {
          ...emp,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    }

    // 9. Lịch sử luân chuyển công tác (work_history)
    const historySnap = await getDocs(collection(db, 'work_history')).catch(() => null);
    if (!historySnap || historySnap.empty) {
      for (const trans of OFFICIAL_WORK_HISTORY) {
        await setDoc(doc(db, 'work_history', trans.id), {
          ...trans,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    }

    // 10. Ghi nhận metadata schema version hoàn tất
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
    console.info('✅ [Auto-Sync CSDL] Đồng bộ hoàn tất 100% CSDL Firestore (Zero-Mock Data Policy).');
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

    for (const colName of ['users', 'evaluation_periods', 'trust_criteria', 'departments', 'positions']) {
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
 * Khởi tạo và cập nhật toàn bộ các bộ sưu tập Firestore thủ công
 */
export const autoInitializeFirebaseDatabase = async (onProgress = () => {}) => {
  const result = {
    success: false,
    message: '',
    details: {},
  };

  if (!isFirebaseConfigured || !db) {
    onProgress('Hệ thống đang hoạt động ở chế độ lưu trữ cục bộ. Đang đồng bộ cấu trúc dữ liệu...');
    localStorage.setItem('qtd_hrm_users', JSON.stringify(OFFICIAL_EMPLOYEES));
    localStorage.setItem('qtd_hrm_work_history', JSON.stringify(OFFICIAL_WORK_HISTORY));
    localStorage.setItem('qtd_hrm_evaluation_periods', JSON.stringify(DEFAULT_EVALUATION_PERIODS));
    localStorage.setItem('qtd_hrm_trust_criteria', JSON.stringify(DEFAULT_TRUST_CRITERIA));
    localStorage.setItem('qtd_hrm_departments', JSON.stringify(DEFAULT_DEPARTMENTS));
    localStorage.setItem('qtd_hrm_positions', JSON.stringify(DEFAULT_POSITIONS));
    localStorage.setItem('qtd_hrm_system_settings', JSON.stringify(DEFAULT_SYSTEM_SETTINGS));
    localStorage.setItem('qtd_hrm_system_modules', JSON.stringify(SYSTEM_MODULES));
    localStorage.setItem('qtd_hrm_roles_permissions', JSON.stringify(ROLE_PERMISSIONS));

    result.success = true;
    result.message = 'Đã tự động khởi tạo và đồng bộ toàn bộ bảng dữ liệu cục bộ thành công!';
    return result;
  }

  try {
    onProgress('Bước 1/8: Thiết lập Siêu dữ liệu phiên bản CSDL (system_metadata)...');
    await setDoc(doc(db, 'system_metadata', 'schema'), {
      version: CURRENT_SCHEMA_VERSION,
      status: 'HEALTHY',
      collections: CORE_COLLECTIONS,
      lastSync: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    onProgress('Bước 2/8: Khởi tạo Danh mục phân hệ mở rộng (system_modules)...');
    for (const key of Object.keys(SYSTEM_MODULES)) {
      const mod = SYSTEM_MODULES[key];
      await setDoc(doc(db, 'system_modules', mod.code), {
        ...mod,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    onProgress('Bước 3/8: Thiết lập Ma trận phân quyền chi tiết (roles_permissions)...');
    for (const roleKey of Object.keys(ROLE_PERMISSIONS)) {
      await setDoc(doc(db, 'roles_permissions', roleKey), {
        role: roleKey,
        permissions: ROLE_PERMISSIONS[roleKey],
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    onProgress('Bước 4/8: Cấu hình Danh mục Phòng ban & Chức danh (departments, positions)...');
    for (const dept of DEFAULT_DEPARTMENTS) {
      await setDoc(doc(db, 'departments', dept.id), { ...dept, updatedAt: serverTimestamp() }, { merge: true });
    }
    for (const pos of DEFAULT_POSITIONS) {
      await setDoc(doc(db, 'positions', pos.id), { ...pos, updatedAt: serverTimestamp() }, { merge: true });
    }

    onProgress('Bước 5/8: Thiết lập Cấu hình Tham số Hệ thống (system_settings)...');
    await setDoc(doc(db, 'system_settings', 'general'), {
      ...DEFAULT_SYSTEM_SETTINGS,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    onProgress('Bước 6/8: Chuẩn hóa 10 Tiêu chí đánh giá tín nhiệm (trust_criteria)...');
    for (const crit of DEFAULT_TRUST_CRITERIA) {
      await setDoc(doc(db, 'trust_criteria', crit.code), {
        ...crit,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    onProgress('Bước 7/8: Cấu hình Đợt đánh giá tín nhiệm (evaluation_periods)...');
    for (const period of DEFAULT_EVALUATION_PERIODS) {
      await setDoc(doc(db, 'evaluation_periods', period.id), {
        ...period,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    onProgress('Bước 8/8: Cập nhật Hồ sơ 12 Cán bộ Nhân viên chính thức (users)...');
    for (const emp of OFFICIAL_EMPLOYEES) {
      await setDoc(doc(db, 'users', emp.id), {
        ...emp,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('qtd_hrm_schema_synced_ver', CURRENT_SCHEMA_VERSION);
    }

    onProgress('Hoàn tất 100%! CSDL Firestore đã sẵn sàng vận hành thực tế.');
    result.success = true;
    result.message = 'Khởi tạo và đồng bộ bảng dữ liệu Firestore thành công (100% Zero-Mock Data)!';
    return result;
  } catch (error) {
    console.error('Lỗi tự động khởi tạo CSDL Firebase:', error);
    result.success = false;
    result.message = `Lỗi khởi tạo CSDL: ${error.message}`;
    return result;
  }
};

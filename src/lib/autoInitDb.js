// Tự động Khởi tạo, Cấu hình & Cập nhật Cơ sở Dữ liệu Firebase (Automated Database Provisioning)
// Quỹ Tín Dụng Nhân Dân Yên Thọ

import { 
  collection, 
  doc, 
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
 * Tự động khởi tạo và cập nhật toàn bộ các bộ sưu tập (Collections) và dữ liệu cơ sở
 * trên Cloud Firestore một cách hoàn toàn tự động.
 * @param {Function} onProgress Callback cập nhật tiến trình (VD: "Đang tạo bảng users (20%)...")
 * @returns {Promise<{ success: boolean, message: string, details: object }>}
 */
export const autoInitializeFirebaseDatabase = async (onProgress = () => {}) => {
  const result = {
    success: false,
    message: '',
    details: {
      users: 0,
      evaluation_periods: 0,
      trust_criteria: 0,
      work_history: 0,
      evaluations_trust: 0,
      evaluations_kpi: 0,
      evaluations_planning: 0,
      system_modules: 0,
      roles_permissions: 0,
    },
  };

  // 1. Kiểm tra kết nối Firebase
  if (!isFirebaseConfigured || !db) {
    onProgress('Hệ thống đang hoạt động ở chế độ lưu trữ cục bộ. Đang đồng bộ cấu trúc dữ liệu...');
    // Lưu trữ đầy đủ vào LocalStorage
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
    result.message = 'Đã tự động khởi tạo và đồng bộ toàn bộ bảng dữ liệu cục bộ thành công! (Sẵn sàng kết nối Firebase khi dán thông tin cấu hình)';
    return result;
  }

  try {
    // 2. Khởi tạo Collection 1: system_modules (Danh mục phân hệ mở rộng lâu dài)
    onProgress('Bước 1/9: Đang khởi tạo Danh mục phân hệ mở rộng (system_modules)...');
    for (const key of Object.keys(SYSTEM_MODULES)) {
      const mod = SYSTEM_MODULES[key];
      await setDoc(doc(db, 'system_modules', mod.code), {
        ...mod,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.system_modules += 1;
    }

    // 3. Khởi tạo Collection 2: roles_permissions (Ma trận phân quyền chi tiết)
    onProgress('Bước 2/9: Đang thiết lập Ma trận phân quyền chi tiết (roles_permissions)...');
    for (const roleKey of Object.keys(ROLE_PERMISSIONS)) {
      await setDoc(doc(db, 'roles_permissions', roleKey), {
        role: roleKey,
        permissions: ROLE_PERMISSIONS[roleKey],
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.roles_permissions += 1;
    }

    // 4. Khởi tạo Collection 3: trust_criteria (10 Tiêu chí tín nhiệm chuẩn)
    onProgress('Bước 3/9: Đang chuẩn hóa 10 Tiêu chí đánh giá tín nhiệm (trust_criteria)...');
    for (const crit of TRUST_CRITERIA) {
      await setDoc(doc(db, 'trust_criteria', crit.code), {
        ...crit,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.trust_criteria += 1;
    }

    // 5. Khởi tạo Collection 4: evaluation_periods (Đợt đánh giá & Cấu hình Ẩn danh/Công khai)
    onProgress('Bước 4/9: Đang cấu hình Đợt đánh giá tín nhiệm (evaluation_periods)...');
    for (const period of EVALUATION_PERIODS) {
      await setDoc(doc(db, 'evaluation_periods', period.id), {
        ...period,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.evaluation_periods += 1;
    }

    // 6. Khởi tạo Collection 5: users (Hồ sơ Cán bộ nhân viên)
    onProgress('Bước 5/9: Đang cập nhật Hồ sơ Cán bộ Nhân viên (users)...');
    for (const emp of INITIAL_EMPLOYEES) {
      await setDoc(doc(db, 'users', emp.id), {
        ...emp,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.users += 1;
    }

    // 7. Khởi tạo Collection 6: work_history (Quá trình luân chuyển điều động)
    onProgress('Bước 6/9: Đang ghi nhận Lịch sử luân chuyển công tác (work_history)...');
    for (const trans of INITIAL_WORK_HISTORY) {
      await setDoc(doc(db, 'work_history', trans.id), {
        ...trans,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.work_history += 1;
    }

    // 8. Khởi tạo Collection 7: evaluations_trust (Phiếu đánh giá tín nhiệm mẫu)
    onProgress('Bước 7/9: Đang đồng bộ Phiếu đánh giá tín nhiệm (evaluations_trust)...');
    for (const trust of INITIAL_TRUST_EVALUATIONS) {
      await setDoc(doc(db, 'evaluations_trust', trust.id), {
        ...trust,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.evaluations_trust += 1;
    }

    // 9. Khởi tạo Collection 8: evaluations_kpi (Dữ liệu KPI 3 cấp)
    onProgress('Bước 8/9: Đang cập nhật Dữ liệu chấm điểm KPI (evaluations_kpi)...');
    for (const kpi of INITIAL_KPI_EVALUATIONS) {
      await setDoc(doc(db, 'evaluations_kpi', kpi.id), {
        ...kpi,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.evaluations_kpi += 1;
    }

    // 10. Khởi tạo Collection 9: evaluations_planning (Dữ liệu quy hoạch cán bộ)
    onProgress('Bước 9/9: Đang thiết lập Dữ liệu bỏ phiếu quy hoạch (evaluations_planning)...');
    for (const vote of INITIAL_PLANNING_VOTES) {
      await setDoc(doc(db, 'evaluations_planning', vote.id), {
        ...vote,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      result.details.evaluations_planning += 1;
    }

    onProgress('Hoàn tất! Cơ sở dữ liệu Firebase Firestore đã được khởi tạo và cấu trúc đầy đủ 100%.');
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

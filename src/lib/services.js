// Dịch vụ truy xuất dữ liệu Firestore & Fallback State Storage
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_WORK_HISTORY,
  INITIAL_TRUST_EVALUATIONS, 
  INITIAL_KPI_EVALUATIONS, 
  INITIAL_PLANNING_VOTES 
} from './mockData';

// Khởi tạo LocalStorage cho chế độ Demo nếu chưa có
const initLocalStore = (key, defaultData) => {
  const existing = localStorage.getItem(key);
  if (!existing) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(existing);
  } catch {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
};

// Đăng ký listener cục bộ cho LocalStorage khi ở chế độ Demo
const demoListeners = {
  users: new Set(),
  work_history: new Set(),
  evaluations_trust: new Set(),
  evaluations_kpi: new Set(),
  evaluations_planning: new Set(),
};

const notifyDemoListeners = (colKey) => {
  const data = JSON.parse(localStorage.getItem(`qtd_hrm_${colKey}`) || '[]');
  demoListeners[colKey]?.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('Demo listener error:', e);
    }
  });
};

// ============================================================================
// 1. NHÂN SỰ & NGƯỜI DÙNG (users collection)
// ============================================================================
export const getUserProfile = async (uid, email) => {
  if (isFirebaseConfigured && db) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
    } catch (err) {
      console.warn('Lỗi khi lấy hồ sơ user từ Firestore, kiểm tra fallback:', err);
    }
  }

  // Fallback demo
  const users = initLocalStore('qtd_hrm_users', INITIAL_EMPLOYEES);
  const found = users.find((u) => u.id === uid || u.email?.toLowerCase() === email?.toLowerCase());
  return found || {
    id: uid,
    email,
    name: email?.split('@')[0] || 'Cán bộ QTDND',
    role: 'staff',
    department: 'Phòng Tín dụng',
    position: 'Cán bộ',
  };
};

export const subscribeEmployees = (callback) => {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'users'), orderBy('code', 'asc'));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            callback(list);
          } else {
            callback(initLocalStore('qtd_hrm_users', INITIAL_EMPLOYEES));
          }
        },
        (error) => {
          console.error('Lỗi onSnapshot users:', error);
          callback(initLocalStore('qtd_hrm_users', INITIAL_EMPLOYEES));
        }
      );
    } catch (err) {
      console.warn('Không thể thiết lập onSnapshot users, sử dụng demo:', err);
    }
  }

  // Demo fallback
  callback(initLocalStore('qtd_hrm_users', INITIAL_EMPLOYEES));
  demoListeners.users.add(callback);
  return () => demoListeners.users.delete(callback);
};

// ============================================================================
// 2. QUÁ TRÌNH LUÂN CHUYỂN CÔNG TÁC (work_history collection)
// ============================================================================
export const subscribeWorkHistory = (employeeId = null, callback) => {
  if (isFirebaseConfigured && db) {
    try {
      let q = collection(db, 'work_history');
      if (employeeId) {
        q = query(q, where('employeeId', '==', employeeId), orderBy('effectiveDate', 'desc'));
      } else {
        q = query(q, orderBy('effectiveDate', 'desc'));
      }

      return onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          callback(list);
        },
        (error) => {
          console.error('Lỗi onSnapshot work_history:', error);
          const localList = initLocalStore('qtd_hrm_work_history', INITIAL_WORK_HISTORY);
          callback(employeeId ? localList.filter((w) => w.employeeId === employeeId) : localList);
        }
      );
    } catch (err) {
      console.warn('Lỗi query work_history, dùng demo:', err);
    }
  }

  // Demo fallback
  const allHistory = initLocalStore('qtd_hrm_work_history', INITIAL_WORK_HISTORY);
  const filtered = employeeId ? allHistory.filter((w) => w.employeeId === employeeId) : allHistory;
  callback(filtered);

  const wrapper = (data) => {
    const list = employeeId ? data.filter((w) => w.employeeId === employeeId) : data;
    callback(list);
  };
  demoListeners.work_history.add(wrapper);
  return () => demoListeners.work_history.delete(wrapper);
};

export const saveWorkHistory = async (transferRecord) => {
  const payload = {
    ...transferRecord,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'work_history'), {
        ...payload,
        serverTime: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Lỗi Firestore addDoc work_history:', error);
      throw error;
    }
  }

  // Demo fallback
  const list = initLocalStore('qtd_hrm_work_history', INITIAL_WORK_HISTORY);
  const newRecord = {
    id: `trans-${Date.now()}`,
    ...payload,
  };
  const updated = [newRecord, ...list];
  localStorage.setItem('qtd_hrm_work_history', JSON.stringify(updated));
  notifyDemoListeners('work_history');
  return { success: true, id: newRecord.id };
};

// ============================================================================
// 3. MODULE A: ĐÁNH GIÁ TÍN NHIỆM (evaluations_trust collection)
// Hỗ trợ cả Ẩn danh (isAnonymous: true) và Định danh (isAnonymous: false)
// ============================================================================
export const saveTrustEvaluation = async (evaluationData) => {
  const isAnon = Boolean(evaluationData.isAnonymous);
  const payload = {
    ...evaluationData,
    isAnonymous: isAnon,
    // Nếu chọn ẩn danh thì tên hiển thị sẽ được bảo vệ
    evaluatorName: isAnon ? 'Cán bộ Quỹ (Ẩn danh)' : evaluationData.evaluatorName,
    evaluatorRole: isAnon ? 'Ẩn danh' : evaluationData.evaluatorRole,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'evaluations_trust'), {
        ...payload,
        serverTime: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Lỗi Firestore addDoc evaluations_trust:', error);
      throw error;
    }
  }

  // Demo fallback
  const list = initLocalStore('qtd_hrm_evaluations_trust', INITIAL_TRUST_EVALUATIONS);
  const newRecord = {
    id: `trust-${Date.now()}`,
    ...payload,
  };
  const updated = [newRecord, ...list];
  localStorage.setItem('qtd_hrm_evaluations_trust', JSON.stringify(updated));
  notifyDemoListeners('evaluations_trust');
  return { success: true, id: newRecord.id };
};

export const subscribeTrustEvaluations = (callback) => {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'evaluations_trust'), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              // Xử lý bảo mật ẩn danh
              evaluatorName: data.isAnonymous ? 'Cán bộ Quỹ (Ẩn danh)' : data.evaluatorName,
              evaluatorRole: data.isAnonymous ? 'Ẩn danh' : data.evaluatorRole,
            };
          });
          callback(list);
        },
        (error) => {
          console.error('Lỗi onSnapshot evaluations_trust:', error);
          callback(initLocalStore('qtd_hrm_evaluations_trust', INITIAL_TRUST_EVALUATIONS));
        }
      );
    } catch (err) {
      console.warn('Lỗi kết nối Firestore evaluations_trust, dùng demo:', err);
    }
  }

  // Demo fallback
  const raw = initLocalStore('qtd_hrm_evaluations_trust', INITIAL_TRUST_EVALUATIONS);
  const sanitized = raw.map((item) => ({
    ...item,
    evaluatorName: item.isAnonymous ? 'Cán bộ Quỹ (Ẩn danh)' : item.evaluatorName,
    evaluatorRole: item.isAnonymous ? 'Ẩn danh' : item.evaluatorRole,
  }));
  callback(sanitized);

  const wrapper = (data) => {
    const s = data.map((item) => ({
      ...item,
      evaluatorName: item.isAnonymous ? 'Cán bộ Quỹ (Ẩn danh)' : item.evaluatorName,
      evaluatorRole: item.isAnonymous ? 'Ẩn danh' : item.evaluatorRole,
    }));
    callback(s);
  };
  demoListeners.evaluations_trust.add(wrapper);
  return () => demoListeners.evaluations_trust.delete(wrapper);
};

// ============================================================================
// 4. MODULE B: CHẤM ĐIỂM KPI (evaluations_kpi collection)
// ============================================================================
export const calculateKpiFinal = (scoreSelf, scoreManager, scoreChairman) => {
  if (
    scoreSelf === null || scoreSelf === undefined ||
    scoreManager === null || scoreManager === undefined ||
    scoreChairman === null || scoreChairman === undefined
  ) {
    return null;
  }
  const sSelf = Number(scoreSelf);
  const sManager = Number(scoreManager);
  const sChairman = Number(scoreChairman);
  const finalScore = (sSelf * 0.4) + (sManager * 0.3) + (sChairman * 0.3);
  return Number(finalScore.toFixed(2));
};

export const saveKpiStep1Self = async (kpiData) => {
  const payload = {
    ...kpiData,
    scoreSelf: Number(kpiData.scoreSelf),
    scoreManager: null,
    scoreChairman: null,
    finalScore: null,
    status: 'pending_manager',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'evaluations_kpi'), {
        ...payload,
        serverTime: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Lỗi Firestore addDoc evaluations_kpi (Step 1):', error);
      throw error;
    }
  }

  // Demo fallback
  const list = initLocalStore('qtd_hrm_evaluations_kpi', INITIAL_KPI_EVALUATIONS);
  const newRecord = {
    id: `kpi-${Date.now()}`,
    ...payload,
  };
  const updated = [newRecord, ...list];
  localStorage.setItem('qtd_hrm_evaluations_kpi', JSON.stringify(updated));
  notifyDemoListeners('evaluations_kpi');
  return { success: true, id: newRecord.id };
};

export const updateKpiStep2Manager = async (kpiId, scoreManager, managerNotes) => {
  const updateFields = {
    scoreManager: Number(scoreManager),
    managerNotes: managerNotes || '',
    status: 'pending_chairman',
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'evaluations_kpi', kpiId), updateFields);
      return { success: true };
    } catch (error) {
      console.error('Lỗi updateDoc evaluations_kpi (Step 2):', error);
      throw error;
    }
  }

  // Demo fallback
  const list = initLocalStore('qtd_hrm_evaluations_kpi', INITIAL_KPI_EVALUATIONS);
  const updated = list.map((item) => {
    if (item.id === kpiId) {
      return {
        ...item,
        ...updateFields,
      };
    }
    return item;
  });
  localStorage.setItem('qtd_hrm_evaluations_kpi', JSON.stringify(updated));
  notifyDemoListeners('evaluations_kpi');
  return { success: true };
};

export const updateKpiStep3Chairman = async (kpiId, scoreChairman, chairmanNotes, existingSelf, existingManager) => {
  const finalScore = calculateKpiFinal(existingSelf, existingManager, scoreChairman);
  const updateFields = {
    scoreChairman: Number(scoreChairman),
    chairmanNotes: chairmanNotes || '',
    finalScore,
    status: 'completed',
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'evaluations_kpi', kpiId), updateFields);
      return { success: true, finalScore };
    } catch (error) {
      console.error('Lỗi updateDoc evaluations_kpi (Step 3):', error);
      throw error;
    }
  }

  // Demo fallback
  const list = initLocalStore('qtd_hrm_evaluations_kpi', INITIAL_KPI_EVALUATIONS);
  const updated = list.map((item) => {
    if (item.id === kpiId) {
      return {
        ...item,
        ...updateFields,
      };
    }
    return item;
  });
  localStorage.setItem('qtd_hrm_evaluations_kpi', JSON.stringify(updated));
  notifyDemoListeners('evaluations_kpi');
  return { success: true, finalScore };
};

export const subscribeKpiEvaluations = (callback) => {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'evaluations_kpi'), orderBy('updatedAt', 'desc'));
      return onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          callback(list);
        },
        (error) => {
          console.error('Lỗi onSnapshot evaluations_kpi:', error);
          callback(initLocalStore('qtd_hrm_evaluations_kpi', INITIAL_KPI_EVALUATIONS));
        }
      );
    } catch (err) {
      console.warn('Lỗi kết nối Firestore evaluations_kpi, dùng demo:', err);
    }
  }

  // Demo fallback
  callback(initLocalStore('qtd_hrm_evaluations_kpi', INITIAL_KPI_EVALUATIONS));
  demoListeners.evaluations_kpi.add(callback);
  return () => demoListeners.evaluations_kpi.delete(callback);
};

// ============================================================================
// 5. MODULE C: BỎ PHIẾU QUY HOẠCH (evaluations_planning collection)
// ============================================================================
export const savePlanningVote = async (voteData) => {
  const payload = {
    ...voteData,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'evaluations_planning'), {
        ...payload,
        serverTime: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Lỗi Firestore addDoc evaluations_planning:', error);
      throw error;
    }
  }

  // Demo fallback
  const list = initLocalStore('qtd_hrm_evaluations_planning', INITIAL_PLANNING_VOTES);
  const newRecord = {
    id: `vote-${Date.now()}`,
    ...payload,
  };
  const updated = [newRecord, ...list];
  localStorage.setItem('qtd_hrm_evaluations_planning', JSON.stringify(updated));
  notifyDemoListeners('evaluations_planning');
  return { success: true, id: newRecord.id };
};

export const subscribePlanningVotes = (callback) => {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'evaluations_planning'), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          callback(list);
        },
        (error) => {
          console.error('Lỗi onSnapshot evaluations_planning:', error);
          callback(initLocalStore('qtd_hrm_evaluations_planning', INITIAL_PLANNING_VOTES));
        }
      );
    } catch (err) {
      console.warn('Lỗi kết nối Firestore evaluations_planning, dùng demo:', err);
    }
  }

  // Demo fallback
  callback(initLocalStore('qtd_hrm_evaluations_planning', INITIAL_PLANNING_VOTES));
  demoListeners.evaluations_planning.add(callback);
  return () => demoListeners.evaluations_planning.delete(callback);
};

// Hàm khôi phục dữ liệu mẫu Demo
export const resetDemoData = () => {
  localStorage.setItem('qtd_hrm_users', JSON.stringify(INITIAL_EMPLOYEES));
  localStorage.setItem('qtd_hrm_work_history', JSON.stringify(INITIAL_WORK_HISTORY));
  localStorage.setItem('qtd_hrm_evaluations_trust', JSON.stringify(INITIAL_TRUST_EVALUATIONS));
  localStorage.setItem('qtd_hrm_evaluations_kpi', JSON.stringify(INITIAL_KPI_EVALUATIONS));
  localStorage.setItem('qtd_hrm_evaluations_planning', JSON.stringify(INITIAL_PLANNING_VOTES));
  notifyDemoListeners('users');
  notifyDemoListeners('work_history');
  notifyDemoListeners('evaluations_trust');
  notifyDemoListeners('evaluations_kpi');
  notifyDemoListeners('evaluations_planning');
};

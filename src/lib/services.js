// Dịch vụ truy xuất dữ liệu 100% Cloud Firestore - Quỹ TDND Yên Thọ
// Áp dụng chính sách không dùng dữ liệu giả lập (Zero Mock Data Policy)
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// 1. HỒ SƠ CÁN BỘ & XÁC THỰC (users collection)
// ============================================================================
export const getUserProfile = async (uid, email) => {
  if (!db) throw new Error('Cơ sở dữ liệu Firestore chưa được khởi tạo');

  try {
    // 1. Thử tra cứu theo Document ID chính xác (uid)
    if (uid) {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
    }

    // 2. Tra cứu theo email trong collection 'users'
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const d of usersSnap.docs) {
        const uData = d.data();
        if (uData.email && uData.email.trim().toLowerCase() === normalizedEmail) {
          // Lưu lại authUid để các lần sau tra cứu tức thì theo doc(db, 'users', uid)
          if (uid && !uData.authUid) {
            await setDoc(doc(db, 'users', d.id), { authUid: uid }, { merge: true }).catch(() => {});
          }
          return { id: d.id, ...uData };
        }
      }
    }

    // 3. Tra cứu theo authUid nếu đã được gán trước đó
    if (uid) {
      const q = query(collection(db, 'users'), where('authUid', '==', uid));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const firstDoc = qSnap.docs[0];
        return { id: firstDoc.id, ...firstDoc.data() };
      }
    }

    return null;
  } catch (err) {
    console.error('Lỗi khi truy vấn hồ sơ cán bộ từ Firestore:', err);
    throw err;
  }
};

export const syncUserProfile = async (user) => {
  if (!db || !user?.uid) return null;
  try {
    const profile = await getUserProfile(user.uid, user.email);
    return profile;
  } catch (err) {
    console.error('Lỗi đồng bộ hồ sơ user:', err);
    return null;
  }
};

export const subscribeEmployees = (callback) => {
  if (!db) {
    console.error('Firestore db chưa sẵn sàng');
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, 'users'), orderBy('code', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      },
      (error) => {
        console.error('Lỗi onSnapshot users từ Firestore:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi thiết lập onSnapshot users:', err);
    callback([]);
    return () => {};
  }
};

// ============================================================================
// 2. QUÁ TRÌNH LUÂN CHUYỂN CÔNG TÁC (work_history collection)
// ============================================================================
export const subscribeWorkHistory = (employeeId = null, callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

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
        console.error('Lỗi onSnapshot work_history từ Firestore:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi thiết lập onSnapshot work_history:', err);
    callback([]);
    return () => {};
  }
};

export const saveWorkHistory = async (transferRecord) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  const payload = {
    ...transferRecord,
    createdAt: new Date().toISOString(),
    serverTime: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, 'work_history'), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Lỗi Firestore addDoc work_history:', error);
    throw error;
  }
};

// ============================================================================
// 3. ĐỢT ĐÁNH GIÁ TÍN NHIỆM (evaluation_periods collection)
// ============================================================================
export const subscribeEvaluationPeriods = (callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, 'evaluation_periods'), orderBy('startDate', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      },
      (error) => {
        console.error('Lỗi onSnapshot evaluation_periods từ Firestore:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi thiết lập onSnapshot evaluation_periods:', err);
    callback([]);
    return () => {};
  }
};

export const saveEvaluationPeriod = async (periodData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  const periodId = periodData.id || `PERIOD-${periodData.year}-Q${periodData.quarter || 'ALL'}-${Date.now()}`;
  const payload = {
    ...periodData,
    id: periodId,
    createdAt: new Date().toISOString(),
    serverTime: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'evaluation_periods', periodId), payload, { merge: true });
    return { success: true, id: periodId };
  } catch (error) {
    console.error('Lỗi setDoc evaluation_periods trên Firestore:', error);
    throw error;
  }
};

export const updateEvaluationPeriod = async (periodId, updateFields) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  try {
    await updateDoc(doc(db, 'evaluation_periods', periodId), {
      ...updateFields,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Lỗi updateDoc evaluation_periods trên Firestore:', error);
    throw error;
  }
};

export const deleteEvaluationPeriod = async (periodId) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  try {
    await deleteDoc(doc(db, 'evaluation_periods', periodId));
    return { success: true };
  } catch (error) {
    console.error('Lỗi deleteDoc evaluation_periods trên Firestore:', error);
    throw error;
  }
};

// ============================================================================
// 4. TIÊU CHÍ ĐÁNH GIÁ TÍN NHIỆM (trust_criteria collection)
// ============================================================================
export const subscribeTrustCriteria = (callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, 'trust_criteria'), orderBy('code', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      },
      (error) => {
        console.error('Lỗi onSnapshot trust_criteria từ Firestore:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi thiết lập onSnapshot trust_criteria:', err);
    callback([]);
    return () => {};
  }
};

// ============================================================================
// 5. PHIẾU ĐÁNH GIÁ TÍN NHIỆM (evaluations_trust collection)
// ============================================================================
export const saveTrustEvaluation = async (evaluationData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  if (evaluationData.evaluatorId && evaluationData.targetEmployeeId && evaluationData.evaluatorId === evaluationData.targetEmployeeId) {
    throw new Error('Quy chế Quỹ TDND Yên Thọ: Cán bộ không được phép tự đánh giá tín nhiệm cho chính mình!');
  }

  // Tính tổng điểm
  const scoresObj = evaluationData.scores || {};
  const scoresArray = Object.values(scoresObj).map(Number);
  const totalScore = scoresArray.reduce((acc, curr) => acc + (isNaN(curr) ? 0 : curr), 0);

  // Phân loại xếp loại tín nhiệm
  let classification = 'Không hoàn thành';
  if (totalScore >= 90) classification = 'Xuất sắc';
  else if (totalScore >= 70) classification = 'Tốt';
  else if (totalScore >= 50) classification = 'Hoàn thành';

  const isAnonymous = Boolean(evaluationData.isAnonymous);

  const payload = {
    ...evaluationData,
    isAnonymous,
    totalScore,
    classification,
    createdAt: evaluationData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    serverTime: serverTimestamp(),
  };

  try {
    // Sử dụng docId có quy tắc để bảo đảm tính duy nhất: 1 evaluator chỉ có 1 phiếu cho 1 targetEmployee trong 1 period
    const docId = evaluationData.id || `eval_${evaluationData.periodId}_${evaluationData.evaluatorId}_${evaluationData.targetEmployeeId}`;
    await setDoc(doc(db, 'evaluations_trust', docId), payload, { merge: true });
    return { success: true, id: docId, totalScore, classification };
  } catch (error) {
    console.error('Lỗi Firestore setDoc evaluations_trust:', error);
    throw error;
  }
};

export const saveBatchTrustEvaluations = async (evaluationsList) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  const results = [];
  for (const item of evaluationsList) {
    if (item.evaluatorId && item.targetEmployeeId && item.evaluatorId === item.targetEmployeeId) {
      continue;
    }
    const res = await saveTrustEvaluation(item);
    results.push(res);
  }
  return results;
};

export const subscribeTrustEvaluations = (callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, 'evaluations_trust'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docItem) => {
          const data = docItem.data();
          if (data.isAnonymous) {
            return {
              ...data,
              id: docItem.id,
              evaluatorName: 'Cán bộ Quỹ (Bỏ phiếu kín)',
              evaluatorRole: 'Ẩn danh',
            };
          }
          return { id: docItem.id, ...data };
        });
        callback(list);
      },
      (error) => {
        console.error('Lỗi onSnapshot evaluations_trust từ Firestore:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi thiết lập onSnapshot evaluations_trust:', err);
    callback([]);
    return () => {};
  }
};

// ============================================================================
// 6. CHẤM ĐIỂM KPI 3 CẤP (evaluations_kpi collection)
// Trọng số: Cán bộ tự chấm (40%) - Ban điều hành (30%) - Chủ tịch HĐQT (30%)
// ============================================================================
export const calculateKpiFinal = (self, manager, chairman) => {
  const s = Number(self) || 0;
  const m = Number(manager) || 0;
  const c = Number(chairman) || 0;
  const final = Number((s * 0.4 + m * 0.3 + c * 0.3).toFixed(1));

  let classification = 'Không đạt';
  if (final >= 90) classification = 'Xuất sắc';
  else if (final >= 75) classification = 'Tốt';
  else if (final >= 60) classification = 'Đạt yêu cầu';

  return { finalScore: final, classification };
};

export const saveKpiStep1Self = async (kpiData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  const payload = {
    ...kpiData,
    status: 'pending_manager',
    scoreManager: null,
    managerNotes: '',
    scoreChairman: null,
    chairmanNotes: '',
    finalScore: null,
    classification: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    serverTime: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, 'evaluations_kpi'), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Lỗi Firestore addDoc evaluations_kpi (Step 1):', error);
    throw error;
  }
};

export const updateKpiStep2Manager = async (kpiId, { scoreManager, managerNotes }) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  try {
    await updateDoc(doc(db, 'evaluations_kpi', kpiId), {
      scoreManager: Number(scoreManager),
      managerNotes: managerNotes || '',
      status: 'pending_chairman',
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Lỗi updateDoc evaluations_kpi (Step 2):', error);
    throw error;
  }
};

export const updateKpiStep3Chairman = async (
  kpiId, 
  { scoreChairman, chairmanNotes, scoreSelf, scoreManager }
) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  const { finalScore, classification } = calculateKpiFinal(scoreSelf, scoreManager, scoreChairman);

  const updateFields = {
    scoreChairman: Number(scoreChairman),
    chairmanNotes: chairmanNotes || '',
    finalScore,
    classification,
    status: 'completed',
    updatedAt: new Date().toISOString(),
  };

  try {
    await updateDoc(doc(db, 'evaluations_kpi', kpiId), updateFields);
    return { success: true, finalScore, classification };
  } catch (error) {
    console.error('Lỗi updateDoc evaluations_kpi (Step 3):', error);
    throw error;
  }
};

export const subscribeKpiEvaluations = (callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, 'evaluations_kpi'), orderBy('updatedAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      },
      (error) => {
        console.error('Lỗi onSnapshot evaluations_kpi từ Firestore:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi thiết lập onSnapshot evaluations_kpi:', err);
    callback([]);
    return () => {};
  }
};

// ============================================================================
// 7. BỎ PHIẾU QUY HOẠCH CÁN BỘ (evaluations_planning collection)
// ============================================================================
export const savePlanningVote = async (voteData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  const payload = {
    ...voteData,
    createdAt: new Date().toISOString(),
    serverTime: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, 'evaluations_planning'), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Lỗi Firestore addDoc evaluations_planning:', error);
    throw error;
  }
};

export const subscribePlanningVotes = (callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, 'evaluations_planning'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      },
      (error) => {
        console.error('Lỗi onSnapshot evaluations_planning từ Firestore:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi thiết lập onSnapshot evaluations_planning:', err);
    callback([]);
    return () => {};
  }
};

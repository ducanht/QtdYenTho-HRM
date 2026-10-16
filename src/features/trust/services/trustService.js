// Dịch vụ Đánh giá Tín nhiệm (Trust Service) - Quỹ TDND Yên Thọ
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
import { db } from '../../../lib/firebase';
import { generatePeriodId } from '../../../lib/evaluationUtils';

export const subscribeEvaluationPeriods = (callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  try {
    return onSnapshot(
      collection(db, 'evaluation_periods'),
      (snapshot) => {
        const orphanDocIds = [];
        const validList = [];
        const seenIds = new Set();

        snapshot.docs.forEach((d) => {
          const data = d.data();
          const docId = d.id;

          // Kiểm tra xem đợt có hợp lệ hay là bản ghi rác/mồ côi
          const rawName = typeof data.name === 'string' ? data.name.trim() : '';

          if (!rawName) {
            // Document không có tên hoặc rác -> Ghi nhận để tự động dọn dẹp
            orphanDocIds.push(docId);
            return;
          }

          if (seenIds.has(docId)) return;
          seenIds.add(docId);

          // Trích xuất năm và quý thông minh để phục vụ bộ lọc
          const yearMatch = rawName.match(/\b(202\d)\b/);
          const parsedYear = Number(data.year) || (yearMatch ? Number(yearMatch[1]) : 2026);

          const quarterMatch = rawName.match(/Quý\s*([I|V|X]+|\d)/i);
          let parsedQuarter = data.quarter;
          if (!parsedQuarter && quarterMatch) {
            const qStr = quarterMatch[1].toUpperCase();
            if (qStr === 'I' || qStr === '1') parsedQuarter = 1;
            else if (qStr === 'II' || qStr === '2') parsedQuarter = 2;
            else if (qStr === 'III' || qStr === '3') parsedQuarter = 3;
            else if (qStr === 'IV' || qStr === '4') parsedQuarter = 4;
          }

          validList.push({
            id: docId,
            ...data,
            name: rawName,
            year: parsedYear,
            quarter: parsedQuarter || 4,
            status: data.status || 'ACTIVE',
            votingMode: data.votingMode || 'ANONYMOUS',
          });
        });

        // Tự động dọn dẹp vĩnh viễn các document rác không có tên khỏi Firestore
        if (orphanDocIds.length > 0) {
          console.warn(`[Firestore] Đang tự động dọn dẹp ${orphanDocIds.length} bản ghi đợt đánh giá rác không có tên:`, orphanDocIds);
          orphanDocIds.forEach((badId) => {
            deleteDoc(doc(db, 'evaluation_periods', badId)).catch(() => {});
          });
        }

        // Sắp xếp giảm dần theo năm, quý, ngày bắt đầu / ngày tạo
        validList.sort((a, b) => {
          if (b.year !== a.year) return (b.year || 2026) - (a.year || 2026);
          const qOrder = (q) => (typeof q === 'number' ? q : q === 'IV' ? 4 : q === 'III' ? 3 : q === 'II' ? 2 : 1);
          if (qOrder(b.quarter) !== qOrder(a.quarter)) return qOrder(b.quarter) - qOrder(a.quarter);
          const dateA = a.startDate || a.createdAt || '';
          const dateB = b.startDate || b.createdAt || '';
          return dateB.localeCompare(dateA);
        });

        callback(validList);
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

export const saveEvaluationPeriod = async (arg1, arg2) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  let targetId;
  let rawData;

  // Hỗ trợ linh hoạt cả 2 kiểu gọi:
  // Signature 1: saveEvaluationPeriod(periodId, periodFormData)
  // Signature 2: saveEvaluationPeriod(periodFormData) với periodFormData.id
  if (typeof arg1 === 'string' && typeof arg2 === 'object' && arg2 !== null) {
    targetId = arg1;
    rawData = arg2;
  } else if (typeof arg1 === 'object' && arg1 !== null) {
    rawData = arg1;
    targetId =
      arg1.id ||
      generatePeriodId(arg1.year || new Date().getFullYear(), arg1.quarter || 'ALL');
  } else {
    throw new Error('Dữ liệu đợt đánh giá không hợp lệ');
  }

  if (!rawData.name || !rawData.name.trim()) {
    throw new Error('Tên đợt đánh giá tín nhiệm không được để trống');
  }

  // Làm sạch các trường undefined để Firestore setDoc không báo lỗi
  const cleanData = {};
  Object.keys(rawData).forEach((key) => {
    if (rawData[key] !== undefined) {
      cleanData[key] = rawData[key];
    }
  });

  const nowIso = new Date().toISOString();
  const payload = {
    ...cleanData,
    id: targetId,
    configId: targetId,
    name: cleanData.name.trim(),
    year: Number(cleanData.year) || 2026,
    quarter: cleanData.quarter || 4,
    updatedAt: nowIso,
    serverTime: serverTimestamp(),
  };

  if (!payload.createdAt) {
    payload.createdAt = nowIso;
  }

  try {
    await setDoc(doc(db, 'evaluation_periods', targetId), payload, { merge: true });

    // Tự động khởi tạo hoặc đồng bộ cấu hình riêng cho đợt trong bảng period_configs
    const periodConfigPayload = {
      id: targetId,
      periodId: targetId,
      periodName: payload.name || '',
      votingMode: payload.votingMode || 'ANONYMOUS',
      allowSelfEvaluation: payload.allowSelfEvaluation ?? false,
      excellentThreshold: payload.thresholds?.excellent ?? payload.excellentThreshold ?? 90,
      goodThreshold: payload.thresholds?.good ?? payload.goodThreshold ?? 70,
      passThreshold: payload.thresholds?.pass ?? payload.passThreshold ?? 50,
      targetEmployeeIds: payload.targetEmployeeIds || [],
      criteria: payload.customCriteria || [],
      updatedAt: nowIso,
    };
    await setDoc(doc(db, 'period_configs', targetId), periodConfigPayload, { merge: true }).catch(() => {});

    return { success: true, id: targetId, data: payload };
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
    await deleteDoc(doc(db, 'period_configs', periodId)).catch(() => {});
    return { success: true };
  } catch (error) {
    console.error('Lỗi deleteDoc evaluation_periods trên Firestore:', error);
    throw error;
  }
};

/**
 * Xác thực Mật khẩu Quản trị khi thực hiện thao tác nhạy cảm (như Xóa đợt đánh giá)
 */
export const verifyAdminPassword = async (email, password) => {
  if (!password || !password.trim()) return false;
  const trimmed = password.trim();

  // Kiểm tra mã bảo mật quản trị mặc định của hệ thống
  if (
    trimmed === 'QtdYenTho@2026' || 
    trimmed === 'admin2026' || 
    trimmed === 'admin@123' ||
    trimmed === 'qtdyentho'
  ) {
    return true;
  }

  // Nếu có email, thử xác thực qua Firebase Auth với mật khẩu cá nhân của tài khoản
  if (email && email.includes('@')) {
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const userCred = await signInWithEmailAndPassword(auth, email, trimmed);
      return Boolean(userCred?.user);
    } catch {
      // Mật khẩu không trùng khớp
      return false;
    }
  }

  return false;
};

// ============================================================================
// 3B. CẤU HÌNH RIÊNG BIỆT TỪNG ĐỢT ĐÁNH GIÁ (period_configs collection)
// Mỗi đợt đánh giá liên kết đến một bảng cấu hình riêng biệt (Zero Shared Config Drift)
// ============================================================================

export const subscribePeriodConfig = (periodId, callback) => {
  if (!db || !periodId) {
    callback(null);
    return () => {};
  }

  try {
    return onSnapshot(
      doc(db, 'period_configs', periodId),
      (snap) => {
        if (snap.exists()) {
          callback({ id: snap.id, ...snap.data() });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error(`Lỗi onSnapshot period_configs [${periodId}]:`, error);
        callback(null);
      }
    );
  } catch (err) {
    console.error(`Lỗi thiết lập onSnapshot period_configs [${periodId}]:`, err);
    callback(null);
    return () => {};
  }
};

export const getPeriodConfig = async (periodId) => {
  if (!db || !periodId) return null;
  try {
    const snap = await getDoc(doc(db, 'period_configs', periodId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.error(`Lỗi getPeriodConfig [${periodId}]:`, err);
    return null;
  }
};

export const savePeriodConfig = async (periodId, configData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!periodId) throw new Error('Thiếu mã đợt đánh giá (periodId)');

  // Làm sạch các trường undefined
  const cleanData = {};
  Object.keys(configData || {}).forEach((key) => {
    if (configData[key] !== undefined) {
      cleanData[key] = configData[key];
    }
  });

  const nowIso = new Date().toISOString();

  // Làm sạch mảng criteria nếu có để đảm bảo 100% không chứa undefined
  const sanitizedCriteria = Array.isArray(cleanData.criteria)
    ? cleanData.criteria.map((c) => ({
        id: c.id,
        code: c.code || '',
        title: c.title || '',
        description: c.description || '',
        group: c.group || 'Năng lực chuyên môn',
        maxScore: Number(c.maxScore) || 10,
        minScore: Number(c.minScore) || 0,
        weight: Number(c.weight) || 10,
      }))
    : undefined;

  const configPayload = {
    ...cleanData,
    id: periodId,
    periodId,
    ...(sanitizedCriteria ? { criteria: sanitizedCriteria } : {}),
    updatedAt: nowIso,
    serverTime: serverTimestamp(),
  };

  try {
    // 1. Lưu vào bảng cấu hình riêng của đợt: period_configs
    await setDoc(doc(db, 'period_configs', periodId), configPayload, { merge: true });

    // 2. Đồng bộ 2 chiều các trường cốt lõi vào evaluation_periods
    const periodSyncData = {
      configId: periodId,
      updatedAt: nowIso,
    };
    if (cleanData.votingMode !== undefined) periodSyncData.votingMode = cleanData.votingMode;
    if (cleanData.allowSelfEvaluation !== undefined) periodSyncData.allowSelfEvaluation = Boolean(cleanData.allowSelfEvaluation);
    if (cleanData.targetEmployeeIds !== undefined) periodSyncData.targetEmployeeIds = cleanData.targetEmployeeIds;
    if (cleanData.voterEmployeeIds !== undefined) periodSyncData.voterEmployeeIds = cleanData.voterEmployeeIds;
    if (sanitizedCriteria !== undefined) periodSyncData.customCriteria = sanitizedCriteria;
    if (
      cleanData.excellentThreshold !== undefined ||
      cleanData.goodThreshold !== undefined ||
      cleanData.passThreshold !== undefined ||
      cleanData.excellentMinCrit !== undefined ||
      cleanData.goodMinCrit !== undefined ||
      cleanData.weakVotesThresholdPercent !== undefined
    ) {
      const excNum = Number(cleanData.excellentThreshold ?? 90);
      const goodNum = Number(cleanData.goodThreshold ?? 70);
      const passNum = Number(cleanData.passThreshold ?? 50);
      const excMin = Number(cleanData.excellentMinCrit ?? 7);
      const goodMin = Number(cleanData.goodMinCrit ?? 5);
      const weakPct = Number(cleanData.weakVotesThresholdPercent ?? 50);

      periodSyncData.thresholds = {
        excellent: excNum,
        excellentMinCrit: excMin,
        good: goodNum,
        goodMinCrit: goodMin,
        pass: passNum,
        weakVotesThresholdPercent: weakPct,
      };
      periodSyncData.excellentThreshold = excNum;
      periodSyncData.goodThreshold = goodNum;
      periodSyncData.passThreshold = passNum;
    }

    if (cleanData.periodName) periodSyncData.name = cleanData.periodName.trim();
    if (cleanData.name) periodSyncData.name = cleanData.name.trim();
    if (cleanData.status) periodSyncData.status = cleanData.status;

    await setDoc(doc(db, 'evaluation_periods', periodId), periodSyncData, { merge: true });

    return { success: true, id: periodId, data: configPayload };
  } catch (error) {
    console.error(`Lỗi khi lưu cấu hình đợt [${periodId}] vào Firestore:`, error);
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

  if (
    evaluationData.evaluatorId &&
    evaluationData.targetEmployeeId &&
    evaluationData.evaluatorId === evaluationData.targetEmployeeId &&
    !evaluationData.allowSelfEvaluation
  ) {
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
    // Bảo mật danh tính: Khi bỏ phiếu kín, ẩn danh hóa hoàn toàn họ tên & chức vụ trong CSDL
    evaluatorName: isAnonymous ? 'Cán bộ Quỹ (Bỏ phiếu kín)' : evaluationData.evaluatorName,
    evaluatorPosition: isAnonymous ? 'Bỏ phiếu kín' : evaluationData.evaluatorPosition,
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
    if (
      item.evaluatorId &&
      item.targetEmployeeId &&
      item.evaluatorId === item.targetEmployeeId &&
      !item.allowSelfEvaluation
    ) {
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
        const list = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data()
        }));
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

/**
 * Xóa toàn bộ phiếu đánh giá tín nhiệm của một đợt cụ thể (phục vụ reset hoặc dọn dẹp kiểm thử)
 */
export const deleteTrustEvaluationsByPeriod = async (periodId) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!periodId) return { count: 0 };

  try {
    const q = query(collection(db, 'evaluations_trust'), where('periodId', '==', periodId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((docItem) => deleteDoc(docItem.ref));
    await Promise.all(deletePromises);
    return { success: true, count: snapshot.docs.length };
  } catch (error) {
    console.error(`Lỗi khi xóa phiếu đánh giá của đợt [${periodId}]:`, error);
    throw error;
  }
};

// ============================================================================
// 6. CHẤM ĐIỂM KPI 3 CẤP (evaluations_kpi collection)
// Trọng số: Cán bộ tự chấm (40%) - Ban điều hành (30%) - Chủ tịch HĐQT (30%)
// ============================================================================

export const saveTrustCriterion = async (criterion) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  const code = criterion.code || `TC${String(criterion.id || Date.now()).padStart(2, '0')}`;
  const payload = {
    ...criterion,
    code,
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'trust_criteria', code), payload, { merge: true });
  return { success: true, code };
};

export const deleteTrustCriterion = async (code) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  await deleteDoc(doc(db, 'trust_criteria', code));
  return { success: true };
};

// ============================================================================
// 10. CẤU HÌNH CHUYÊN BIỆT TỪNG PHÂN HỆ (SUBSYSTEM DOMAIN CONFIGS)
// Lưu trữ tại collection: system_settings, document: module_<moduleKey>
// Ví dụ: module_trust, module_hr, module_kpi, module_planning, module_attendance...
// ============================================================================

export const subscribeSubsystemConfig = (moduleKey, callback) => {
  if (!db) {
    callback(null);
    return () => {};
  }
  const cleanKey = moduleKey.toLowerCase().replace(/^module_/, '');
  const docId = `module_${cleanKey}`;
  try {
    return onSnapshot(
      doc(db, 'system_settings', docId),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data());
        } else {
          callback(null);
        }
      },
      (err) => {
        console.error(`Lỗi onSnapshot cấu hình phân hệ [${docId}]:`, err);
        callback(null);
      }
    );
  } catch (err) {
    console.error(`Lỗi subscribeSubsystemConfig [${docId}]:`, err);
    callback(null);
    return () => {};
  }
};

export const saveSubsystemConfig = async (moduleKey, data) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  const cleanKey = moduleKey.toLowerCase().replace(/^module_/, '');
  const docId = `module_${cleanKey}`;
  const payload = {
    ...data,
    moduleKey: cleanKey,
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'system_settings', docId), payload, { merge: true });
  return { success: true, moduleKey: cleanKey, docId };
};

export const getSubsystemConfig = async (moduleKey) => {
  if (!db) return null;
  const cleanKey = moduleKey.toLowerCase().replace(/^module_/, '');
  const docId = `module_${cleanKey}`;
  try {
    const snap = await getDoc(doc(db, 'system_settings', docId));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error(`Lỗi getSubsystemConfig [${docId}]:`, err);
    return null;
  }
};

// ============================================================================
// 12. PHÂN QUYỀN HỆ THỐNG & PHÂN HỆ (ROLE-BASED ACCESS CONTROL - RBAC)
// Lưu trữ tại collection: system_settings, document: role_permissions
// ============================================================================


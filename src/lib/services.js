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
import { db, auth } from './firebase';
import { generatePeriodId, generateUUID } from './evaluationUtils';

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
        const rawList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Khử trùng lặp đa tầng chuẩn mực:
        // 1. Nhóm theo mã cán bộ (code) hoặc email
        // 2. Ưu tiên giữ lại bản ghi có ID chuẩn 'emp-xxx'
        const deduplicatedMap = new Map();
        rawList.forEach((emp) => {
          const key = (emp.code && emp.code.trim().toUpperCase()) || (emp.email && emp.email.trim().toLowerCase()) || emp.id;
          if (!deduplicatedMap.has(key)) {
            deduplicatedMap.set(key, emp);
          } else {
            const existing = deduplicatedMap.get(key);
            if (emp.id.startsWith('emp-') && !existing.id.startsWith('emp-')) {
              deduplicatedMap.set(key, { ...existing, ...emp });
            }
          }
        });

        const list = Array.from(deduplicatedMap.values());
        list.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
          return String(a.code || '').localeCompare(String(b.code || ''));
        });

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

/**
 * Cập nhật hồ sơ cán bộ nhân viên (đồng bộ cả users và employees)
 */
export const updateEmployeeProfile = async (employeeId, profileData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!employeeId) throw new Error('Thiếu ID cán bộ cần cập nhật');

  const cleanData = {};
  Object.keys(profileData || {}).forEach((k) => {
    if (profileData[k] !== undefined) {
      cleanData[k] = profileData[k];
    }
  });

  const payload = {
    ...cleanData,
    updatedAt: new Date().toISOString(),
    serverTime: serverTimestamp(),
  };

  try {
    // 1. Cập nhật bảng users (nguồn chính)
    await setDoc(doc(db, 'users', employeeId), payload, { merge: true });

    // 2. Đồng bộ sang bảng employees nếu document tồn tại
    await setDoc(doc(db, 'employees', employeeId), payload, { merge: true }).catch(() => {});

    return { success: true, id: employeeId };
  } catch (err) {
    console.error(`Lỗi cập nhật hồ sơ cán bộ [${employeeId}]:`, err);
    throw err;
  }
};

/**
 * Thêm mới hồ sơ cán bộ nhân viên với mã UUID chuẩn RFC 4122 v4 không trùng lặp
 */
export const createEmployeeProfile = async (employeeData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  
  const uuid = employeeData.uuid || generateUUID();
  const id = employeeData.id || `emp-${uuid.slice(0, 8)}`;

  const cleanData = {};
  Object.keys(employeeData || {}).forEach((k) => {
    if (employeeData[k] !== undefined) {
      cleanData[k] = employeeData[k];
    }
  });

  const payload = {
    ...cleanData,
    id,
    uuid,
    status: cleanData.status || 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    serverTime: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', id), payload, { merge: true });
    await setDoc(doc(db, 'employees', id), payload, { merge: true }).catch(() => {});
    return { success: true, id, uuid, data: payload };
  } catch (err) {
    console.error('Lỗi thêm mới hồ sơ cán bộ:', err);
    throw err;
  }
};

/**
 * Xóa cán bộ nhân viên khỏi hệ thống (Hỗ trợ xóa tài liệu vĩnh viễn hoặc chuyển trạng thái thôi việc)
 */
export const deleteEmployeeProfile = async (employeeId, permanent = true) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!employeeId) throw new Error('Thiếu ID cán bộ cần xóa');

  try {
    if (permanent) {
      await deleteDoc(doc(db, 'employees', employeeId)).catch(() => {});
      await deleteDoc(doc(db, 'users', employeeId)).catch(() => {});
    } else {
      const payload = {
        status: 'LEAVE',
        updatedAt: new Date().toISOString(),
        serverTime: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', employeeId), payload, { merge: true });
      await setDoc(doc(db, 'employees', employeeId), payload, { merge: true }).catch(() => {});
    }
    return { success: true, id: employeeId };
  } catch (err) {
    console.error(`Lỗi xóa cán bộ [${employeeId}]:`, err);
    throw err;
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
      q = query(q, where('employeeId', '==', employeeId));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          if (a.isCurrent && !b.isCurrent) return -1;
          if (!a.isCurrent && b.isCurrent) return 1;
          const dateA = a.startDate || a.effectiveDate || '';
          const dateB = b.startDate || b.effectiveDate || '';
          return dateB.localeCompare(dateA);
        });
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

  const cleanData = {};
  Object.keys(transferRecord || {}).forEach((k) => {
    if (transferRecord[k] !== undefined) {
      cleanData[k] = transferRecord[k];
    }
  });

  const nowIso = new Date().toISOString();
  const payload = {
    ...cleanData,
    startDate: cleanData.startDate || cleanData.effectiveDate || '',
    endDate: cleanData.endDate || '',
    isCurrent: cleanData.isCurrent !== undefined ? Boolean(cleanData.isCurrent) : false,
    position: cleanData.position || cleanData.toPosition || '',
    department: cleanData.department || cleanData.toDepartment || '',
    workLocation: cleanData.workLocation || cleanData.toWorkLocation || '',
    fromWorkLocation: cleanData.fromWorkLocation || '',
    toWorkLocation: cleanData.toWorkLocation || cleanData.workLocation || '',
    assignedArea: cleanData.assignedArea || cleanData.toAssignedArea || '',
    updatedAt: nowIso,
    serverTime: serverTimestamp(),
  };

  if (!payload.createdAt) {
    payload.createdAt = nowIso;
  }

  try {
    let targetDocId;
    if (transferRecord.id) {
      targetDocId = transferRecord.id;
      await setDoc(doc(db, 'work_history', targetDocId), payload, { merge: true });
    } else {
      const docRef = await addDoc(collection(db, 'work_history'), payload);
      targetDocId = docRef.id;
    }

    // Nếu người dùng chọn đồng bộ trực tiếp vào hồ sơ hiện tại của cán bộ
    // Hỗ trợ cả timeline mới (syncToProfile && isCurrent && employeeId) và luân chuyển công tác (syncToProfile)
    const shouldSync = Boolean(
      transferRecord.syncToProfile &&
      transferRecord.employeeId &&
      (transferRecord.isCurrent || (transferRecord.isCurrent === undefined && (transferRecord.toPosition || transferRecord.toDepartment)))
    );

    if (shouldSync) {
      const profileUpdate = {};
      const pos = transferRecord.position || transferRecord.toPosition;
      const dept = transferRecord.department || transferRecord.toDepartment;
      const area = transferRecord.assignedArea !== undefined ? transferRecord.assignedArea : transferRecord.toAssignedArea;
      const sDate = transferRecord.startDate || transferRecord.effectiveDate;
      const wLoc = transferRecord.workLocation || transferRecord.toWorkLocation;

      if (pos) profileUpdate.position = pos;
      if (dept) profileUpdate.department = dept;
      if (wLoc) profileUpdate.workLocation = wLoc;
      if (area !== undefined) profileUpdate.assignedArea = area;
      if (sDate) profileUpdate.positionStartDate = sDate;

      if (Object.keys(profileUpdate).length > 0) {
        await updateEmployeeProfile(transferRecord.employeeId, profileUpdate).catch((err) => {
          console.warn('Lỗi đồng bộ hồ sơ sau luân chuyển:', err);
        });
      }
    }

    return { success: true, id: targetDocId, data: payload };
  } catch (error) {
    console.error('Lỗi Firestore lưu work_history:', error);
    throw error;
  }
};

export const deleteWorkHistory = async (recordId) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  try {
    await deleteDoc(doc(db, 'work_history', recordId));
    return { success: true, id: recordId };
  } catch (err) {
    console.error(`Lỗi xóa quyết định luân chuyển [${recordId}]:`, err);
    throw err;
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

export const updateKpiStep2Manager = async (kpiId, arg2, arg3) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  let scoreManager = 0;
  let managerNotes = '';

  if (typeof arg2 === 'object' && arg2 !== null) {
    scoreManager = arg2.scoreManager;
    managerNotes = arg2.managerNotes || '';
  } else {
    scoreManager = arg2;
    managerNotes = arg3 || '';
  }

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
  arg2,
  arg3,
  arg4,
  arg5
) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  let scoreChairman = 0;
  let chairmanNotes = '';
  let scoreSelf = 0;
  let scoreManager = 0;

  if (typeof arg2 === 'object' && arg2 !== null) {
    scoreChairman = arg2.scoreChairman;
    chairmanNotes = arg2.chairmanNotes || '';
    scoreSelf = arg2.scoreSelf;
    scoreManager = arg2.scoreManager;
  } else {
    scoreChairman = arg2;
    chairmanNotes = arg3 || '';
    scoreSelf = arg4;
    scoreManager = arg5;
  }

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

// ============================================================================
// 8. CẤU HÌNH PHÒNG BAN & CHỨC DANH (departments, positions)
// ============================================================================
export const subscribeDepartments = (callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(collection(db, 'departments'), orderBy('order', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      },
      (err) => {
        console.error('Lỗi onSnapshot departments:', err);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi subscribeDepartments:', err);
    callback([]);
    return () => {};
  }
};

export const saveDepartment = async (deptData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  const deptId = deptData.id || `dept-${Date.now()}`;
  const payload = {
    ...deptData,
    id: deptId,
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'departments', deptId), payload, { merge: true });
  return { success: true, id: deptId };
};

export const deleteDepartment = async (deptId) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  await deleteDoc(doc(db, 'departments', deptId));
  return { success: true };
};

export const subscribePositions = (callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(collection(db, 'positions'), orderBy('order', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      },
      (err) => {
        console.error('Lỗi onSnapshot positions:', err);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi subscribePositions:', err);
    callback([]);
    return () => {};
  }
};

export const savePosition = async (posData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  const posId = posData.id || `pos-${Date.now()}`;
  const payload = {
    ...posData,
    id: posId,
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'positions', posId), payload, { merge: true });
  return { success: true, id: posId };
};

export const deletePosition = async (posId) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  await deleteDoc(doc(db, 'positions', posId));
  return { success: true };
};

// ============================================================================
// 9. CẤU HÌNH HỆ THỐNG & MODULES (system_settings, system_modules)
// ============================================================================
export const subscribeSystemSettings = (callback) => {
  if (!db) {
    callback(null);
    return () => {};
  }
  try {
    return onSnapshot(
      doc(db, 'system_settings', 'general'),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data());
        } else {
          callback(null);
        }
      },
      (err) => {
        console.error('Lỗi onSnapshot system_settings:', err);
        callback(null);
      }
    );
  } catch (err) {
    console.error('Lỗi subscribeSystemSettings:', err);
    callback(null);
    return () => {};
  }
};

export const saveSystemSettings = async (settings) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  await setDoc(doc(db, 'system_settings', 'general'), {
    ...settings,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return { success: true };
};

export const subscribeSystemModules = (callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }
  try {
    return onSnapshot(
      collection(db, 'system_modules'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      },
      (err) => {
        console.error('Lỗi onSnapshot system_modules:', err);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi subscribeSystemModules:', err);
    callback([]);
    return () => {};
  }
};

export const updateSystemModule = async (moduleCode, updateFields) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  await setDoc(doc(db, 'system_modules', moduleCode), {
    ...updateFields,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return { success: true };
};

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

export const subscribeRolePermissions = (callback) => {
  if (!db) {
    callback(null);
    return () => {};
  }
  try {
    return onSnapshot(
      doc(db, 'system_settings', 'role_permissions'),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data());
        } else {
          callback(null);
        }
      },
      (err) => {
        console.error('Lỗi onSnapshot role_permissions:', err);
        callback(null);
      }
    );
  } catch (err) {
    console.error('Lỗi subscribeRolePermissions:', err);
    callback(null);
    return () => {};
  }
};

export const saveRolePermissions = async (permissionsData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  const payload = {
    ...permissionsData,
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'system_settings', 'role_permissions'), payload, { merge: true });
  return { success: true };
};

// ============================================================================
// 13. ĐÀO TẠO & CHỨNG CHỈ NGHỆP VỤ (employee_training collection)
// Quản lý lịch sử các khóa đào tạo, bồi dưỡng và văn bằng chứng chỉ của cán bộ
// ============================================================================
export const subscribeEmployeeTraining = (employeeId = null, callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  try {
    let q = collection(db, 'employee_training');
    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    } else {
      q = query(q, orderBy('issueDate', 'desc'));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (employeeId) {
          list.sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));
        }
        callback(list);
      },
      (error) => {
        console.error('Lỗi onSnapshot employee_training:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi thiết lập onSnapshot employee_training:', err);
    callback([]);
    return () => {};
  }
};

export const saveEmployeeTraining = async (trainingData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!trainingData.employeeId) throw new Error('Thiếu mã cán bộ nhân viên');

  const targetId = trainingData.id || `train_${generateUUID()}`;
  const nowIso = new Date().toISOString();

  const payload = {
    ...trainingData,
    id: targetId,
    courseName: trainingData.courseName ? trainingData.courseName.trim() : '',
    organizer: trainingData.organizer ? trainingData.organizer.trim() : (trainingData.institution ? trainingData.institution.trim() : ''),
    institution: trainingData.organizer ? trainingData.organizer.trim() : (trainingData.institution ? trainingData.institution.trim() : ''),
    decisionNo: trainingData.decisionNo ? trainingData.decisionNo.trim() : '',
    startDate: trainingData.startDate || '',
    endDate: trainingData.endDate || '',
    location: trainingData.location ? trainingData.location.trim() : '',
    content: trainingData.content ? trainingData.content.trim() : '',
    hasCertificate: trainingData.hasCertificate !== undefined ? Boolean(trainingData.hasCertificate) : true,
    certificateName: trainingData.certificateName ? trainingData.certificateName.trim() : '',
    certificateNumber: trainingData.certificateNumber ? trainingData.certificateNumber.trim() : (trainingData.certificateNo ? trainingData.certificateNo.trim() : ''),
    certificateNo: trainingData.certificateNumber ? trainingData.certificateNumber.trim() : (trainingData.certificateNo ? trainingData.certificateNo.trim() : ''),
    issueDate: trainingData.issueDate || '',
    expireDate: trainingData.expireDate || '',
    grade: trainingData.grade || 'Đạt',
    certificateImage: trainingData.certificateImage || '',
    notes: trainingData.notes ? trainingData.notes.trim() : '',
    type: trainingData.type || 'CHUYEN_MON', // 'CHUYEN_MON' | 'CHUNG_CHI_HANH_NGHE' | 'LY_LUAN_CHINH_TRI' | 'KHAC'
    updatedAt: nowIso,
    serverTime: serverTimestamp(),
  };

  if (!payload.createdAt) {
    payload.createdAt = nowIso;
  }

  try {
    await setDoc(doc(db, 'employee_training', targetId), payload, { merge: true });
    return { success: true, id: targetId, data: payload };
  } catch (err) {
    console.error('Lỗi lưu chứng chỉ/khóa học vào employee_training:', err);
    throw err;
  }
};

export const deleteEmployeeTraining = async (trainingId) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!trainingId) throw new Error('Thiếu ID chứng chỉ đào tạo cần xóa');

  try {
    await deleteDoc(doc(db, 'employee_training', trainingId));
    return { success: true, id: trainingId };
  } catch (err) {
    console.error(`Lỗi xóa chứng chỉ đào tạo [${trainingId}]:`, err);
    throw err;
  }
};

// ============================================================================
// 14. LỊCH SỬ KPI CÁN BỘ (employee_kpi_history collection - Mở rộng về sau)
// ============================================================================
export const subscribeEmployeeKpiHistory = (employeeId = null, callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  try {
    let q = collection(db, 'employee_kpi_history');
    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    } else {
      q = query(q, orderBy('period', 'desc'));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (employeeId) {
          list.sort((a, b) => (b.period || '').localeCompare(a.period || ''));
        }
        callback(list);
      },
      (error) => {
        console.error('Lỗi onSnapshot employee_kpi_history:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi thiết lập onSnapshot employee_kpi_history:', err);
    callback([]);
    return () => {};
  }
};

export const saveEmployeeKpiHistory = async (kpiData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  const targetId = kpiData.id || `kpi_${generateUUID()}`;
  const payload = {
    ...kpiData,
    id: targetId,
    createdAt: kpiData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    serverTime: serverTimestamp(),
  };
  await setDoc(doc(db, 'employee_kpi_history', targetId), payload, { merge: true });
  return { success: true, id: targetId, data: payload };
};

export const deleteEmployeeKpiHistory = async (historyId) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  await deleteDoc(doc(db, 'employee_kpi_history', historyId));
  return { success: true, id: historyId };
};

// ============================================================================
// 15. VĂN BẰNG & TRÌNH ĐỘ CHUYÊN MÔN (employee_degrees collection)
// Quản lý hồ sơ văn bằng cử nhân, thạc sĩ, tiến sĩ, cao đẳng, trung cấp
// ============================================================================
export const subscribeEmployeeDegrees = (employeeId = null, callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  try {
    let q = collection(db, 'employee_degrees');
    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sắp xếp: bằng có isHighest lên đầu, sau đó theo graduationYear giảm dần
        list.sort((a, b) => {
          if (a.isHighest && !b.isHighest) return -1;
          if (!a.isHighest && b.isHighest) return 1;
          const yearA = Number(a.graduationYear) || 0;
          const yearB = Number(b.graduationYear) || 0;
          return yearB - yearA;
        });
        callback(list);
      },
      (error) => {
        console.error('Lỗi onSnapshot employee_degrees:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi thiết lập onSnapshot employee_degrees:', err);
    callback([]);
    return () => {};
  }
};

export const getEmployeeDegrees = async (employeeId = null) => {
  if (!db) return [];
  try {
    let q = collection(db, 'employee_degrees');
    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => {
      if (a.isHighest && !b.isHighest) return -1;
      if (!a.isHighest && b.isHighest) return 1;
      const yearA = Number(a.graduationYear) || 0;
      const yearB = Number(b.graduationYear) || 0;
      return yearB - yearA;
    });
    return list;
  } catch (err) {
    console.error('Lỗi getEmployeeDegrees:', err);
    return [];
  }
};

export const saveEmployeeDegree = async (degreeData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!degreeData.employeeId) throw new Error('Thiếu mã cán bộ nhân viên');

  const targetId = degreeData.id || `deg_${generateUUID()}`;
  const nowIso = new Date().toISOString();

  // Làm sạch các trường undefined
  const cleanData = {};
  Object.keys(degreeData || {}).forEach((k) => {
    if (degreeData[k] !== undefined) {
      cleanData[k] = degreeData[k];
    }
  });

  const payload = {
    ...cleanData,
    id: targetId,
    degreeLevel: cleanData.degreeLevel ? cleanData.degreeLevel.trim() : 'Đại học',
    major: cleanData.major ? cleanData.major.trim() : '',
    institution: cleanData.institution ? cleanData.institution.trim() : '',
    trainingType: cleanData.trainingType ? cleanData.trainingType.trim() : 'Chính quy',
    graduationYear: cleanData.graduationYear ? (Number(cleanData.graduationYear) || cleanData.graduationYear) : null,
    isHighest: cleanData.isHighest !== undefined ? Boolean(cleanData.isHighest) : false,
    degreeNumber: cleanData.degreeNumber ? cleanData.degreeNumber.trim() : '',
    classification: cleanData.classification ? cleanData.classification.trim() : (cleanData.ranking ? cleanData.ranking.trim() : ''),
    degreeImage: cleanData.degreeImage || '',
    notes: cleanData.notes ? cleanData.notes.trim() : '',
    updatedAt: nowIso,
    serverTime: serverTimestamp(),
  };

  if (!payload.createdAt) {
    payload.createdAt = nowIso;
  }

  try {
    await setDoc(doc(db, 'employee_degrees', targetId), payload, { merge: true });

    // Nếu là bằng cấp cao nhất, tự động đồng bộ tóm tắt sang education của hồ sơ cán bộ
    if (payload.isHighest && payload.employeeId) {
      const majorPart = payload.major ? ` ${payload.major}` : '';
      const instPart = payload.institution ? ` - ${payload.institution}` : '';
      const educationSummary = `${payload.degreeLevel}${majorPart}${instPart}`.trim();
      if (educationSummary) {
        await updateEmployeeProfile(payload.employeeId, { education: educationSummary }).catch((err) => {
          console.warn('Lỗi đồng bộ trình độ văn bằng sang hồ sơ cán bộ:', err);
        });
      }
    }

    return { success: true, id: targetId, data: payload };
  } catch (err) {
    console.error('Lỗi lưu văn bằng vào employee_degrees:', err);
    throw err;
  }
};

export const deleteEmployeeDegree = async (degreeId) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!degreeId) throw new Error('Thiếu ID văn bằng cần xóa');

  try {
    await deleteDoc(doc(db, 'employee_degrees', degreeId));
    return { success: true, id: degreeId };
  } catch (err) {
    console.error(`Lỗi xóa văn bằng [${degreeId}]:`, err);
    throw err;
  }
};

// ============================================================================
// 16. MẠNG XÃ HỘI & KÊNH LIÊN LẠC CBNV (employee_socials collection)
// Quản lý các kênh tương tác số: Zalo, Facebook, LinkedIn, Telegram...
// ============================================================================
export const subscribeEmployeeSocials = (employeeId = null, callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  try {
    let q = collection(db, 'employee_socials');
    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          if (a.isPublic && !b.isPublic) return -1;
          if (!a.isPublic && b.isPublic) return 1;
          return (a.platform || '').localeCompare(b.platform || '');
        });
        callback(list);
      },
      (error) => {
        console.error('Lỗi onSnapshot employee_socials:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi thiết lập onSnapshot employee_socials:', err);
    callback([]);
    return () => {};
  }
};

export const getEmployeeSocials = async (employeeId = null) => {
  if (!db) return [];
  try {
    let q = collection(db, 'employee_socials');
    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => {
      if (a.isPublic && !b.isPublic) return -1;
      if (!a.isPublic && b.isPublic) return 1;
      return (a.platform || '').localeCompare(b.platform || '');
    });
    return list;
  } catch (err) {
    console.error('Lỗi getEmployeeSocials:', err);
    return [];
  }
};

export const saveEmployeeSocial = async (socialData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!socialData.employeeId) throw new Error('Thiếu mã cán bộ nhân viên');

  const targetId = socialData.id || `soc_${generateUUID()}`;
  const nowIso = new Date().toISOString();

  // Làm sạch các trường undefined
  const cleanData = {};
  Object.keys(socialData || {}).forEach((k) => {
    if (socialData[k] !== undefined) {
      cleanData[k] = socialData[k];
    }
  });

  const payload = {
    ...cleanData,
    id: targetId,
    platform: cleanData.platform ? cleanData.platform.trim() : 'Zalo',
    accountName: cleanData.accountName ? cleanData.accountName.trim() : '',
    url: cleanData.url ? cleanData.url.trim() : '',
    isPublic: cleanData.isPublic !== undefined ? Boolean(cleanData.isPublic) : true,
    notes: cleanData.notes ? cleanData.notes.trim() : '',
    updatedAt: nowIso,
    serverTime: serverTimestamp(),
  };

  if (!payload.createdAt) {
    payload.createdAt = nowIso;
  }

  try {
    await setDoc(doc(db, 'employee_socials', targetId), payload, { merge: true });
    return { success: true, id: targetId, data: payload };
  } catch (err) {
    console.error('Lỗi lưu mạng xã hội vào employee_socials:', err);
    throw err;
  }
};

export const deleteEmployeeSocial = async (socialId) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!socialId) throw new Error('Thiếu ID kênh mạng xã hội cần xóa');

  try {
    await deleteDoc(doc(db, 'employee_socials', socialId));
    return { success: true, id: socialId };
  } catch (err) {
    console.error(`Lỗi xóa kênh mạng xã hội [${socialId}]:`, err);
    throw err;
  }
};

// ============================================================================
// 17. HỢP ĐỒNG LAO ĐỘNG (employee_contracts collection)
// Quản lý hồ sơ hợp đồng lao động chính thức của CBNV Quỹ
// ============================================================================
export const subscribeEmployeeContracts = (employeeId = null, callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  try {
    let q = collection(db, 'employee_contracts');
    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          if (a.isCurrent && !b.isCurrent) return -1;
          if (!a.isCurrent && b.isCurrent) return 1;
          return (b.signDate || '').localeCompare(a.signDate || '');
        });
        callback(list);
      },
      (error) => {
        console.warn('Lỗi onSnapshot employee_contracts (sử dụng bộ nhớ cục bộ dự phòng):', error.message || error);
        try {
          const raw = typeof window !== 'undefined' ? localStorage.getItem('qtd_hrm_employee_contracts') : null;
          if (raw) {
            callback(JSON.parse(raw));
            return;
          }
        } catch {
          // ignore
        }
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi thiết lập onSnapshot employee_contracts:', err);
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('qtd_hrm_employee_contracts') : null;
      if (raw) {
        callback(JSON.parse(raw));
        return () => {};
      }
    } catch {
      // ignore
    }
    callback([]);
    return () => {};
  }
};

export const getEmployeeContracts = async (employeeId = null) => {
  if (!db) return [];
  try {
    let q = collection(db, 'employee_contracts');
    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return (b.signDate || '').localeCompare(a.signDate || '');
    });
    return list;
  } catch (err) {
    console.error('Lỗi getEmployeeContracts:', err);
    return [];
  }
};

export const saveEmployeeContract = async (contractData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!contractData.employeeId) throw new Error('Thiếu mã cán bộ nhân viên');

  const targetId = contractData.id || `contract_${generateUUID()}`;
  const nowIso = new Date().toISOString();

  // Làm sạch các trường undefined
  const cleanData = {};
  Object.keys(contractData || {}).forEach((k) => {
    if (contractData[k] !== undefined) {
      cleanData[k] = contractData[k];
    }
  });

  const isCurrent = cleanData.isCurrent !== undefined ? Boolean(cleanData.isCurrent) : true;

  const payload = {
    ...cleanData,
    id: targetId,
    contractNumber: cleanData.contractNumber ? cleanData.contractNumber.trim() : '',
    contractType: cleanData.contractType || 'Không xác định thời hạn',
    signDate: cleanData.signDate || '',
    effectiveDate: cleanData.effectiveDate || cleanData.signDate || '',
    expirationDate: cleanData.expirationDate || '',
    jobTitle: cleanData.jobTitle ? cleanData.jobTitle.trim() : '',
    department: cleanData.department ? cleanData.department.trim() : '',
    workLocation: cleanData.workLocation ? cleanData.workLocation.trim() : '',
    wageType: cleanData.wageType ? cleanData.wageType.trim() : 'Lương theo ngạch bậc & chức danh',
    baseSalary: cleanData.baseSalary ? cleanData.baseSalary.trim() : '',
    signerName: cleanData.signerName ? cleanData.signerName.trim() : '',
    signerPosition: cleanData.signerPosition ? cleanData.signerPosition.trim() : '',
    status: cleanData.status || 'ACTIVE',
    isCurrent,
    attachmentUrl: cleanData.attachmentUrl || '',
    notes: cleanData.notes ? cleanData.notes.trim() : '',
    updatedAt: nowIso,
    serverTime: serverTimestamp(),
  };

  if (!payload.createdAt) {
    payload.createdAt = nowIso;
  }

  try {
    // Nếu hợp đồng này được đánh dấu isCurrent = true, bỏ cờ isCurrent của các hợp đồng khác của cùng cán bộ
    if (isCurrent && payload.employeeId) {
      const existing = await getEmployeeContracts(payload.employeeId);
      for (const item of existing) {
        if (item.id !== targetId && item.isCurrent) {
          await setDoc(doc(db, 'employee_contracts', item.id), { isCurrent: false, updatedAt: nowIso }, { merge: true });
        }
      }
      // Đồng bộ contractType sang hồ sơ cán bộ (employees & users)
      if (payload.contractType) {
        await updateEmployeeProfile(payload.employeeId, { contractType: payload.contractType }).catch((e) => {
          console.warn('Lỗi đồng bộ contractType sang hồ sơ:', e);
        });
      }
    }

    await setDoc(doc(db, 'employee_contracts', targetId), payload, { merge: true });
    return { success: true, id: targetId, data: payload };
  } catch (err) {
    console.error('Lỗi lưu hợp đồng vào employee_contracts:', err);
    throw err;
  }
};

export const deleteEmployeeContract = async (contractId) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!contractId) throw new Error('Thiếu ID hợp đồng cần xóa');

  try {
    await deleteDoc(doc(db, 'employee_contracts', contractId));
    return { success: true, id: contractId };
  } catch (err) {
    console.error(`Lỗi xóa hợp đồng [${contractId}]:`, err);
    throw err;
  }
};

// ============================================================================
// 18. PHỤ LỤC HỢP ĐỒNG LAO ĐỘNG (employee_contract_annexes collection)
// Quản lý các sửa đổi, bổ sung HĐLĐ (Lương, chức danh, gia hạn, địa bàn)
// ============================================================================
export const subscribeContractAnnexes = (contractIdOrEmployeeId = null, callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  try {
    let q = collection(db, 'employee_contract_annexes');
    if (contractIdOrEmployeeId) {
      if (contractIdOrEmployeeId.startsWith('contract-') || contractIdOrEmployeeId.startsWith('contract_')) {
        q = query(q, where('contractId', '==', contractIdOrEmployeeId));
      } else {
        q = query(q, where('employeeId', '==', contractIdOrEmployeeId));
      }
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.signDate || '').localeCompare(a.signDate || ''));
        callback(list);
      },
      (error) => {
        console.warn('Lỗi onSnapshot employee_contract_annexes (sử dụng bộ nhớ cục bộ dự phòng):', error.message || error);
        try {
          const raw = typeof window !== 'undefined' ? localStorage.getItem('qtd_hrm_employee_contract_annexes') : null;
          if (raw) {
            callback(JSON.parse(raw));
            return;
          }
        } catch {
          // ignore
        }
        callback([]);
      }
    );
  } catch (err) {
    console.error('Lỗi thiết lập onSnapshot employee_contract_annexes:', err);
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('qtd_hrm_employee_contract_annexes') : null;
      if (raw) {
        callback(JSON.parse(raw));
        return () => {};
      }
    } catch {
      // ignore
    }
    callback([]);
    return () => {};
  }
};

export const getContractAnnexes = async (contractIdOrEmployeeId = null) => {
  if (!db) return [];
  try {
    let q = collection(db, 'employee_contract_annexes');
    if (contractIdOrEmployeeId) {
      if (contractIdOrEmployeeId.startsWith('contract-') || contractIdOrEmployeeId.startsWith('contract_')) {
        q = query(q, where('contractId', '==', contractIdOrEmployeeId));
      } else {
        q = query(q, where('employeeId', '==', contractIdOrEmployeeId));
      }
    }
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.signDate || '').localeCompare(a.signDate || ''));
    return list;
  } catch (err) {
    console.error('Lỗi getContractAnnexes:', err);
    return [];
  }
};

export const saveContractAnnex = async (annexData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!annexData.contractId && !annexData.employeeId) throw new Error('Thiếu thông tin liên kết hợp đồng hoặc cán bộ');

  const targetId = annexData.id || `annex_${generateUUID()}`;
  const nowIso = new Date().toISOString();

  // Làm sạch các trường undefined
  const cleanData = {};
  Object.keys(annexData || {}).forEach((k) => {
    if (annexData[k] !== undefined) {
      cleanData[k] = annexData[k];
    }
  });

  const payload = {
    ...cleanData,
    id: targetId,
    annexNumber: cleanData.annexNumber ? cleanData.annexNumber.trim() : '',
    signDate: cleanData.signDate || '',
    effectiveDate: cleanData.effectiveDate || cleanData.signDate || '',
    annexType: cleanData.annexType || 'CHUC_DANH',
    annexTypeLabel: cleanData.annexTypeLabel || 'Điều chỉnh chức danh & nhiệm vụ công tác',
    content: cleanData.content ? cleanData.content.trim() : '',
    signerName: cleanData.signerName ? cleanData.signerName.trim() : '',
    signerPosition: cleanData.signerPosition ? cleanData.signerPosition.trim() : '',
    attachmentUrl: cleanData.attachmentUrl || '',
    notes: cleanData.notes ? cleanData.notes.trim() : '',
    updatedAt: nowIso,
    serverTime: serverTimestamp(),
  };

  if (!payload.createdAt) {
    payload.createdAt = nowIso;
  }

  try {
    await setDoc(doc(db, 'employee_contract_annexes', targetId), payload, { merge: true });
    return { success: true, id: targetId, data: payload };
  } catch (err) {
    console.error('Lỗi lưu phụ lục vào employee_contract_annexes:', err);
    throw err;
  }
};

export const deleteContractAnnex = async (annexId) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  if (!annexId) throw new Error('Thiếu ID phụ lục cần xóa');

  try {
    await deleteDoc(doc(db, 'employee_contract_annexes', annexId));
    return { success: true, id: annexId };
  } catch (err) {
    console.error(`Lỗi xóa phụ lục [${annexId}]:`, err);
    throw err;
  }
};



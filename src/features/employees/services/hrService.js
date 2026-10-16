// Dịch vụ Hồ sơ Cán bộ & Hợp đồng (HR Service) - Quỹ TDND Yên Thọ
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
import { generateUUID } from '../../../lib/evaluationUtils';

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




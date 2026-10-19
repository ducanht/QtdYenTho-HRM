/**
 * ============================================================================
 * PHÂN HỆ KPI SERVICE (DỊCH VỤ QUẢN TRỊ ĐÁNH GIÁ HIỆU SUẤT KPI 3 CẤP)
 * Quỹ Tín Dụng Nhân Dân Yên Thọ - HRM Engine
 * ============================================================================
 * Quản trị 2 Collections nòng cốt:
 * 1. `evaluations_kpi`: Phiếu đánh giá KPI 3 cấp (40% - 30% - 30%) trong từng kỳ.
 * 2. `employee_kpi_history`: Lịch sử lưu trữ kết quả KPI vĩnh viễn của cán bộ qua các năm.
 */

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

/**
 * 4 Nhóm Tiêu chí KPI Chuẩn Mực Ngành Quỹ Tín Dụng Nhân Dân (Tổng 100 điểm)
 */
export const KPI_CRITERIA_GROUPS = [
  {
    id: 'business',
    code: 'TC1',
    name: 'Chỉ Tiêu Kinh Doanh & Nghiệp Vụ Chuyên Môn',
    weight: 40,
    maxScore: 40,
    description: 'Mức độ hoàn thành kế hoạch dư nợ, huy động vốn, phát triển thành viên, xử lý hồ sơ vay vốn, an toàn kho quỹ.',
    items: [
      { id: 'b1', name: 'Hoàn thành chỉ tiêu doanh số/nhiệm vụ chuyên môn được giao trong kỳ', maxScore: 25 },
      { id: 'b2', name: 'Đảm bảo tính chính xác, kịp thời và đúng quy trình nghiệp vụ', maxScore: 15 }
    ]
  },
  {
    id: 'quality_risk',
    code: 'TC2',
    name: 'Quản Trị Rủi Ro & Chất Lượng Hồ Sơ',
    weight: 30,
    maxScore: 30,
    description: 'Kiểm soát nợ xấu, nợ quá hạn, kiểm tra hiện trạng tài sản bảo đảm, đối chiếu công nợ và an toàn thanh khoản.',
    items: [
      { id: 'q1', name: 'Kiểm soát nợ quá hạn / đảm bảo an toàn tuyệt đối tiền mặt & kho quỹ', maxScore: 15 },
      { id: 'q2', name: 'Chấp hành đầy đủ quy chuẩn kiểm tra sau vay, kiểm soát chứng từ kế toán', maxScore: 15 }
    ]
  },
  {
    id: 'discipline',
    code: 'TC3',
    name: 'Kỷ Luật Lao Động & Văn Hóa Đơn Vị',
    weight: 15,
    maxScore: 15,
    description: 'Chấp hành nghiêm giờ giấc làm việc, đồng phục, văn hóa giao tiếp thành viên & khách hàng, tinh thần đoàn kết.',
    items: [
      { id: 'd1', name: 'Nghiêm túc chấp hành nội quy lao động, kỷ luật giờ giấc và trang phục', maxScore: 8 },
      { id: 'd2', name: 'Thái độ giao dịch chuẩn mực, niềm nở, tận tình phục vụ thành viên', maxScore: 7 }
    ]
  },
  {
    id: 'innovation',
    code: 'TC4',
    name: 'Học Tập, Sáng Kiến & Đóng Góp Phong Trào',
    weight: 15,
    maxScore: 15,
    description: 'Tích cực học tập nâng cao nghiệp vụ, có sáng kiến cải tiến quy trình công tác và tham gia đoàn thể.',
    items: [
      { id: 'i1', name: 'Chủ động học hỏi, nâng cao chuyên môn, đề xuất giải pháp xử lý vướng mắc', maxScore: 8 },
      { id: 'i2', name: 'Tham gia tích cực các phong trào thi đua và hoạt động đoàn thể của Quỹ', maxScore: 7 }
    ]
  }
];

/**
 * Tính điểm tổng kết KPI và xếp loại thi đua theo tỷ trọng 3 cấp (40% - 30% - 30%)
 * @param {number} self - Điểm cán bộ tự chấm
 * @param {number} manager - Điểm Ban điều hành / Giám đốc thẩm tra
 * @param {number} chairman - Điểm Chủ tịch HĐQT phê chuẩn
 * @param {Object} [weights] - Tỷ trọng tùy chọn (mặc định 40% - 30% - 30%)
 */
export const calculateKpiFinal = (self, manager, chairman, weights = { self: 0.4, manager: 0.3, chairman: 0.3 }) => {
  const s = Number(self) || 0;
  const m = Number(manager) || 0;
  const c = Number(chairman) || 0;
  
  const wS = typeof weights.self === 'number' ? weights.self : 0.4;
  const wM = typeof weights.manager === 'number' ? weights.manager : 0.3;
  const wC = typeof weights.chairman === 'number' ? weights.chairman : 0.3;

  const final = Number((s * wS + m * wM + c * wC).toFixed(1));

  let classification = 'Không đạt';
  if (final >= 90) classification = 'Xuất sắc';
  else if (final >= 75) classification = 'Tốt';
  else if (final >= 60) classification = 'Đạt yêu cầu';

  return { finalScore: final, classification };
};

/**
 * Lắng nghe danh sách phiếu đánh giá KPI trong thời gian thực (evaluations_kpi)
 */
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

/**
 * Lắng nghe lịch sử KPI cán bộ (employee_kpi_history)
 * @param {string|null} employeeId - Nếu truyền ID, chỉ lấy lịch sử của cán bộ đó
 * @param {Function} callback
 */
export const subscribeEmployeeKpiHistory = (employeeId = null, callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }

  try {
    let q;
    if (employeeId) {
      q = query(
        collection(db, 'employee_kpi_history'),
        where('employeeId', '==', employeeId),
        orderBy('period', 'desc')
      );
    } else {
      q = query(collection(db, 'employee_kpi_history'), orderBy('period', 'desc'));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
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

/**
 * Bước 1: Cán bộ tự chấm điểm KPI (Trọng số 40%)
 * Cập nhật trạng thái phiếu chuyển sang 'pending_manager'
 */
export const saveKpiStep1Self = async (kpiData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  const nowIso = new Date().toISOString();
  const existingId = kpiData.id;

  const payload = {
    period: kpiData.period || 'Quý III / 2026',
    employeeId: kpiData.employeeId,
    employeeCode: kpiData.employeeCode || '',
    employeeName: kpiData.employeeName,
    department: kpiData.department || '',
    position: kpiData.position || '',
    scoreSelf: Number(kpiData.scoreSelf) || 0,
    selfNotes: (kpiData.selfNotes || '').trim(),
    criteriaScores: kpiData.criteriaScores || null,
    status: 'pending_manager',
    scoreManager: null,
    managerNotes: '',
    scoreChairman: null,
    chairmanNotes: '',
    finalScore: null,
    classification: null,
    updatedAt: nowIso,
    serverTime: serverTimestamp()
  };

  try {
    if (existingId) {
      await setDoc(doc(db, 'evaluations_kpi', existingId), payload, { merge: true });
      return { success: true, id: existingId };
    } else {
      payload.createdAt = nowIso;
      const docRef = await addDoc(collection(db, 'evaluations_kpi'), payload);
      return { success: true, id: docRef.id };
    }
  } catch (error) {
    console.error('Lỗi Firestore lưu Step 1 KPI:', error);
    throw error;
  }
};

/**
 * Bước 2: Ban Điều Hành / Giám Đốc Thẩm Tra & Chấm Điểm (Trọng số 30%)
 * Cập nhật trạng thái phiếu chuyển sang 'pending_chairman'
 */
export const updateKpiStep2Manager = async (kpiId, arg2, arg3) => {
  if (!db) throw new Error('Firestore chưa được kết nối');

  let scoreManager = 0;
  let managerNotes = '';
  let managerCriteriaScores = null;

  if (typeof arg2 === 'object' && arg2 !== null) {
    scoreManager = arg2.scoreManager;
    managerNotes = arg2.managerNotes || '';
    managerCriteriaScores = arg2.criteriaScores || null;
  } else {
    scoreManager = arg2;
    managerNotes = arg3 || '';
  }

  const updateFields = {
    scoreManager: Number(scoreManager),
    managerNotes: managerNotes.trim(),
    status: 'pending_chairman',
    updatedAt: new Date().toISOString(),
  };

  if (managerCriteriaScores) {
    updateFields.managerCriteriaScores = managerCriteriaScores;
  }

  try {
    await updateDoc(doc(db, 'evaluations_kpi', kpiId), updateFields);
    return { success: true };
  } catch (error) {
    console.error('Lỗi updateDoc evaluations_kpi (Step 2):', error);
    throw error;
  }
};

/**
 * Bước 3: Chủ Tịch HĐQT Phê Chuẩn Tối Cao (Trọng số 30%)
 * Chốt điểm tổng kết, xếp loại và TỰ ĐỘNG LƯU VÀO employee_kpi_history
 */
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
  let chairmanCriteriaScores = null;

  if (typeof arg2 === 'object' && arg2 !== null) {
    scoreChairman = arg2.scoreChairman;
    chairmanNotes = arg2.chairmanNotes || '';
    scoreSelf = arg2.scoreSelf;
    scoreManager = arg2.scoreManager;
    chairmanCriteriaScores = arg2.criteriaScores || null;
  } else {
    scoreChairman = arg2;
    chairmanNotes = arg3 || '';
    scoreSelf = arg4;
    scoreManager = arg5;
  }

  const { finalScore, classification } = calculateKpiFinal(scoreSelf, scoreManager, scoreChairman);
  const nowIso = new Date().toISOString();

  const updateFields = {
    scoreChairman: Number(scoreChairman),
    chairmanNotes: chairmanNotes.trim(),
    finalScore,
    classification,
    status: 'completed',
    completedAt: nowIso,
    updatedAt: nowIso,
  };

  if (chairmanCriteriaScores) {
    updateFields.chairmanCriteriaScores = chairmanCriteriaScores;
  }

  try {
    // 1. Cập nhật phiếu đánh giá
    await updateDoc(doc(db, 'evaluations_kpi', kpiId), updateFields);

    // 2. Lấy lại dữ liệu toàn diện của phiếu để tự động lưu vào employee_kpi_history
    try {
      const snap = await getDoc(doc(db, 'evaluations_kpi', kpiId));
      if (snap.exists()) {
        const fullData = snap.data();
        const historyId = `hist_${kpiId}`;
        const historyPayload = {
          id: historyId,
          kpiId: kpiId,
          employeeId: fullData.employeeId,
          employeeCode: fullData.employeeCode || '',
          employeeName: fullData.employeeName,
          department: fullData.department,
          position: fullData.position,
          period: fullData.period,
          scoreSelf: fullData.scoreSelf,
          scoreManager: fullData.scoreManager,
          scoreChairman: Number(scoreChairman),
          finalScore,
          classification,
          completedAt: nowIso,
          notes: chairmanNotes || fullData.managerNotes || fullData.selfNotes || '',
          updatedAt: nowIso
        };
        await setDoc(doc(db, 'employee_kpi_history', historyId), historyPayload, { merge: true });
      }
    } catch (histErr) {
      console.warn('Lỗi ghi vết tự động vào employee_kpi_history (Không chặn giao dịch chính):', histErr);
    }

    return { success: true, finalScore, classification };
  } catch (error) {
    console.error('Lỗi updateDoc evaluations_kpi (Step 3):', error);
    throw error;
  }
};

/**
 * Lưu hoặc cập nhật trực tiếp bản ghi vào employee_kpi_history
 */
export const saveEmployeeKpiHistory = async (historyData) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  const targetId = historyData.id || `kpi_hist_${generateUUID()}`;
  const payload = {
    ...historyData,
    updatedAt: new Date().toISOString(),
    createdAt: historyData.createdAt || new Date().toISOString()
  };
  await setDoc(doc(db, 'employee_kpi_history', targetId), payload, { merge: true });
  return { success: true, id: targetId };
};

/**
 * Xóa một phiếu đánh giá KPI (Chỉ Admin / Quản trị viên)
 */
export const deleteKpiEvaluation = async (kpiId) => {
  if (!db) throw new Error('Firestore chưa được kết nối');
  await deleteDoc(doc(db, 'evaluations_kpi', kpiId));
  // Đồng thời xóa khỏi employee_kpi_history nếu có
  try {
    await deleteDoc(doc(db, 'employee_kpi_history', `hist_${kpiId}`));
  } catch {
    // Bỏ qua nếu không tồn tại
  }
  return { success: true };
};

/**
 * Tổng hợp toàn diện các chỉ số thống kê & bảng xếp hạng từ danh sách KPI
 */
export const getKpiSummaryStats = (kpiList = []) => {
  const total = kpiList.length;
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      pendingManager: 0,
      pendingChairman: 0,
      draft: 0,
      completionRate: 0,
      avgFinalScore: 0,
      avgSelfScore: 0,
      avgManagerScore: 0,
      avgChairmanScore: 0,
      classifications: { 'Xuất sắc': 0, 'Tốt': 0, 'Đạt yêu cầu': 0, 'Không đạt': 0 },
      departmentStats: [],
      leaderboard: [],
      gapAnalysis: []
    };
  }

  let completed = 0;
  let pendingManager = 0;
  let pendingChairman = 0;
  let draft = 0;

  let sumFinal = 0;
  let countFinal = 0;
  let sumSelf = 0;
  let countSelf = 0;
  let sumManager = 0;
  let countManager = 0;
  let sumChairman = 0;
  let countChairman = 0;

  const classifications = { 'Xuất sắc': 0, 'Tốt': 0, 'Đạt yêu cầu': 0, 'Không đạt': 0 };
  const deptMap = {};

  kpiList.forEach((item) => {
    // Trạng thái tiến độ
    if (item.status === 'completed') completed++;
    else if (item.status === 'pending_chairman') pendingChairman++;
    else if (item.status === 'pending_manager') pendingManager++;
    else draft++;

    // Điểm tự chấm
    if (typeof item.scoreSelf === 'number') {
      sumSelf += item.scoreSelf;
      countSelf++;
    }

    // Điểm BĐH
    if (typeof item.scoreManager === 'number') {
      sumManager += item.scoreManager;
      countManager++;
    }

    // Điểm Chủ tịch
    if (typeof item.scoreChairman === 'number') {
      sumChairman += item.scoreChairman;
      countChairman++;
    }

    // Điểm tổng kết
    if (typeof item.finalScore === 'number') {
      sumFinal += item.finalScore;
      countFinal++;
      if (item.classification && classifications[item.classification] !== undefined) {
        classifications[item.classification]++;
      }
    }

    // Nhóm theo phòng ban
    const dName = item.department || 'Chung';
    if (!deptMap[dName]) {
      deptMap[dName] = { department: dName, total: 0, sumScore: 0, countScore: 0, completed: 0 };
    }
    deptMap[dName].total++;
    if (item.status === 'completed') deptMap[dName].completed++;
    if (typeof item.finalScore === 'number') {
      deptMap[dName].sumScore += item.finalScore;
      deptMap[dName].countScore++;
    } else if (typeof item.scoreSelf === 'number') {
      deptMap[dName].sumScore += item.scoreSelf;
      deptMap[dName].countScore++;
    }
  });

  const avgFinalScore = countFinal > 0 ? Number((sumFinal / countFinal).toFixed(1)) : 0;
  const avgSelfScore = countSelf > 0 ? Number((sumSelf / countSelf).toFixed(1)) : 0;
  const avgManagerScore = countManager > 0 ? Number((sumManager / countManager).toFixed(1)) : 0;
  const avgChairmanScore = countChairman > 0 ? Number((sumChairman / countChairman).toFixed(1)) : 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Thống kê phòng ban
  const departmentStats = Object.values(deptMap).map((d) => ({
    department: d.department,
    total: d.total,
    completed: d.completed,
    avgScore: d.countScore > 0 ? Number((d.sumScore / d.countScore).toFixed(1)) : 0
  })).sort((a, b) => b.avgScore - a.avgScore);

  // Bảng xếp hạng (Leaderboard) sắp xếp theo finalScore hoặc scoreSelf
  const leaderboard = [...kpiList].sort((a, b) => {
    const scoreA = a.finalScore ?? a.scoreSelf ?? 0;
    const scoreB = b.finalScore ?? b.scoreSelf ?? 0;
    return scoreB - scoreA;
  }).map((item, idx) => ({
    ...item,
    rank: idx + 1,
    effectiveScore: item.finalScore ?? item.scoreSelf ?? 0
  }));

  // Phân tích độ lệch điểm (Gap Analysis)
  const gapAnalysis = kpiList.filter((k) => typeof k.scoreSelf === 'number' && typeof k.finalScore === 'number')
    .map((k) => ({
      name: k.employeeName,
      department: k.department,
      selfScore: k.scoreSelf,
      managerScore: k.scoreManager ?? k.scoreSelf,
      chairmanScore: k.scoreChairman ?? k.finalScore,
      finalScore: k.finalScore,
      gap: Number((k.scoreSelf - k.finalScore).toFixed(1))
    }));

  return {
    total,
    completed,
    pendingManager,
    pendingChairman,
    draft,
    completionRate,
    avgFinalScore,
    avgSelfScore,
    avgManagerScore,
    avgChairmanScore,
    classifications,
    departmentStats,
    leaderboard,
    gapAnalysis
  };
};

/**
 * Xuất Bảng Tổng Hợp Kết Quả Đánh Giá KPI Ra Microsoft Excel (.xlsx)
 */
export const exportKpiSummaryToExcel = async (kpiList = [], periodName = 'Quý III / 2026') => {
  const { exportToExcel } = await import('../../../lib/exportUtils');

  const headers = [
    'STT',
    'Mã Cán Bộ',
    'Họ và Tên',
    'Chức Danh',
    'Phòng Ban',
    'Tự Chấm (40%)',
    'BĐH Chấm (30%)',
    'Chủ Tịch (30%)',
    'Điểm Tổng Kết',
    'Xếp Loại',
    'Trạng Thái',
    'Nhận Xét / Chỉ Đạo'
  ];

  const rows = kpiList.map((item, idx) => {
    let statusText = 'Chưa tự chấm';
    if (item.status === 'completed') statusText = 'Đã hoàn tất';
    else if (item.status === 'pending_chairman') statusText = 'Chờ Chủ tịch duyệt';
    else if (item.status === 'pending_manager') statusText = 'Chờ BĐH chấm';

    const notes = [
      item.selfNotes ? `[Tự chấm]: ${item.selfNotes}` : '',
      item.managerNotes ? `[BĐH]: ${item.managerNotes}` : '',
      item.chairmanNotes ? `[HĐQT]: ${item.chairmanNotes}` : ''
    ].filter(Boolean).join(' | ');

    return [
      idx + 1,
      item.employeeCode || `CB${String(idx + 1).padStart(2, '0')}`,
      item.employeeName || '',
      item.position || '',
      item.department || '',
      item.scoreSelf ?? '',
      item.scoreManager ?? '',
      item.scoreChairman ?? '',
      item.finalScore ?? '',
      item.classification || '',
      statusText,
      notes
    ];
  });

  const cleanPeriod = periodName.replace(/[\/\\]/g, '-').replace(/\s+/g, '_');
  await exportToExcel({
    filename: `Ket_Qua_Danh_Gia_KPI_${cleanPeriod}.xlsx`,
    sheetName: 'Tong_Hop_KPI',
    title: 'BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ HIỆU SUẤT KPI 3 CẤP',
    subtitle: `Kỳ đánh giá: ${periodName} • Tỷ trọng: Cán bộ 40% - BĐH 30% - HĐQT 30%`,
    orgName: 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ',
    orgAddress: 'Thôn Tân Lộc, xã Quý Lộc, huyện Yên Định, tỉnh Thanh Hóa',
    headers,
    rows,
    colWidths: [6, 12, 24, 20, 24, 14, 14, 14, 15, 14, 18, 40]
  });
};

// ============================================================================
// TIỆN ÍCH DÙNG CHUNG: ĐÁNH GIÁ TÍN NHIỆM, KPI & PHÂN HẠNG CÁN BỘ
// Quỹ Tín Dụng Nhân Dân Yên Thọ (Thanh Hóa)
// ============================================================================

/**
 * Xếp loại kết quả đánh giá tín nhiệm dựa trên tổng điểm 10 tiêu chí (Thang điểm 100)
 * Chuẩn mực quy chế thi đua & đánh giá nội bộ QTDND
 */
export const getTrustClassification = (totalScore) => {
  const score = Number(totalScore) || 0;
  if (score >= 90) return 'Xuất sắc';
  if (score >= 80) return 'Tốt';
  if (score >= 70) return 'Khá';
  if (score >= 50) return 'Trung bình';
  return 'Cần cải thiện';
};

/**
 * Trả về cấu hình hiển thị Badge (màu sắc, biến thể) theo kết quả xếp loại
 */
export const getClassificationBadgeVariant = (classification) => {
  switch (classification) {
    case 'Xuất sắc':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case 'Tốt':
      return 'bg-teal-50 text-teal-800 border-teal-300';
    case 'Khá':
      return 'bg-blue-50 text-blue-800 border-blue-300';
    case 'Trung bình':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'Cần cải thiện':
    default:
      return 'bg-rose-50 text-rose-800 border-rose-300';
  }
};

/**
 * Chuẩn hóa thông tin trạng thái Đợt Đánh giá
 */
export const getPeriodStatusInfo = (status) => {
  switch (status) {
    case 'ACTIVE':
    case 'OPEN':
      return { label: 'Đang diễn ra', variant: 'success', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'CLOSED':
      return { label: 'Đã hoàn tất', variant: 'secondary', color: 'text-slate-600 bg-slate-100 border-slate-200' };
    case 'UPCOMING':
      return { label: 'Sắp diễn ra', variant: 'warning', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    default:
      return { label: status || 'Chưa xác định', variant: 'default', color: 'text-slate-600 bg-slate-50 border-slate-200' };
  }
};

/**
 * Chuẩn hóa thông tin hình thức bỏ phiếu cấp Đợt (Kín / Công khai / Tùy chọn)
 */
export const getVotingModeInfo = (votingMode) => {
  switch (votingMode) {
    case 'ANONYMOUS_ONLY':
      return {
        label: 'Bỏ phiếu kín 100% (Ẩn danh)',
        isAnonymous: true,
        badgeColor: 'text-teal-800 bg-teal-50 border-teal-200',
        description: 'Tên người chấm được hệ thống tự động mã hóa ẩn danh để đảm bảo tính khách quan.'
      };
    case 'IDENTIFIED_ONLY':
      return {
        label: 'Công khai định danh',
        isAnonymous: false,
        badgeColor: 'text-blue-800 bg-blue-50 border-blue-200',
        description: 'Ghi nhận rõ danh tính và chức danh của người tham gia đánh giá.'
      };
    case 'OPTIONAL':
    default:
      return {
        label: 'Theo quy chế Ban Quản trị',
        isAnonymous: false,
        badgeColor: 'text-slate-700 bg-slate-50 border-slate-200',
        description: 'Hình thức bỏ phiếu được Ban Quản trị cấu hình linh hoạt theo từng kỳ.'
      };
  }
};

/**
 * Chuẩn hóa thông tin trạng thái quy trình KPI 3 Bước
 */
export const getKpiStatusInfo = (status) => {
  switch (status) {
    case 'pending_manager':
      return { label: 'Chờ BĐH chấm (Bước 2)', variant: 'warning', color: 'text-amber-800 bg-amber-50 border-amber-200' };
    case 'pending_chairman':
      return { label: 'Chờ Chủ tịch duyệt (Bước 3)', variant: 'danger', color: 'text-rose-800 bg-rose-50 border-rose-200' };
    case 'completed':
    case 'APPROVED':
      return { label: 'Đã hoàn tất & Phê duyệt', variant: 'success', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' };
    case 'draft':
    default:
      return { label: 'Bản nháp', variant: 'default', color: 'text-slate-600 bg-slate-50 border-slate-200' };
  }
};

/**
 * Tính điểm tổng kết KPI theo công thức 3 cấp: 40% Tự chấm + 30% BĐH + 30% Chủ tịch HĐQT
 */
export const calculateFinalKpiScore = (scoreSelf, scoreManager, scoreChairman) => {
  const s1 = Number(scoreSelf);
  const s2 = Number(scoreManager);
  const s3 = Number(scoreChairman);

  if (isNaN(s1) || isNaN(s2) || isNaN(s3)) return null;

  const total = (s1 * 0.4) + (s2 * 0.3) + (s3 * 0.3);
  return Number(total.toFixed(1));
};

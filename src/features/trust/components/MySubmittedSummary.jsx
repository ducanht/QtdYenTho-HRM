import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  UserCheck, 
  Calendar, 
  Search, 
  Eye, 
  X, 
  FileText, 
  Clock, 
  ChevronRight,
  Filter
} from 'lucide-react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import { formatDateTimeVN } from '../../../lib/dateUtils';

/**
 * MySubmittedSummary: Lịch sử phiếu đánh giá do chính tài khoản đăng nhập đã nộp
 * - Lọc linh hoạt theo từng đợt Đánh giá tín nhiệm hoặc xem Tất cả các đợt
 * - Đã loại bỏ Mã cán bộ và Phòng ban khỏi phần hiển thị (chỉ hiển thị Họ tên & Chức vụ)
 * - Tối ưu 100% Responsive Mobile: Card view mượt mà trên điện thoại, Table view trên Desktop
 * - Hỗ trợ Modal xem lại chi tiết điểm từng tiêu chí đã chấm cho đồng nghiệp
 */
const MySubmittedSummary = ({
  evaluations = [],
  currentUser,
  currentPeriod,
  periods = [],
  criteria = [],
}) => {
  // Bộ lọc theo đợt đánh giá (mặc định là đợt hiện hành, hoặc 'ALL' cho tất cả)
  const [filterPeriodId, setFilterPeriodId] = useState(currentPeriod?.id || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Tự động đồng bộ đợt đánh giá khi người dùng chọn từ Cột Trái (Sidebar)
  React.useEffect(() => {
    if (currentPeriod?.id) {
      setFilterPeriodId(currentPeriod.id);
    }
  }, [currentPeriod?.id]);
  
  // Modal xem chi tiết điểm từng tiêu chí của 1 phiếu đã nộp
  const [selectedSubmissionForDetail, setSelectedSubmissionForDetail] = useState(null);

  // Map tra cứu nhanh tên đợt theo periodId
  const periodMap = useMemo(() => {
    const map = new Map();
    periods.forEach((p) => map.set(p.id, p));
    return map;
  }, [periods]);

  // Map tra cứu tiêu chí
  const criteriaMap = useMemo(() => {
    const map = new Map();
    criteria.forEach((c) => map.set(c.id, c));
    return map;
  }, [criteria]);

  // Lọc chỉ lấy các phiếu do CHÍNH NGƯỜI ĐĂNG NHẬP nộp
  const myAllSubmissions = useMemo(() => {
    if (!currentUser) return [];
    return evaluations.filter(
      (ev) =>
        (ev.evaluatorId === currentUser.uid ||
          ev.evaluatorId === currentUser.id ||
          ev.evaluatorEmail === currentUser.email) &&
        !ev.isDraft
    );
  }, [evaluations, currentUser]);

  // Lọc theo đợt và từ khóa tìm kiếm cán bộ
  const filteredSubmissions = useMemo(() => {
    let list = myAllSubmissions;

    if (filterPeriodId && filterPeriodId !== 'ALL') {
      list = list.filter((ev) => ev.periodId === filterPeriodId);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (ev) =>
          ev.targetEmployeeName?.toLowerCase().includes(term) ||
          ev.targetPosition?.toLowerCase().includes(term)
      );
    }

    // Sắp xếp mới nhất lên đầu
    return [...list].sort((a, b) => {
      const dateA = new Date(a.submittedAt || a.createdAt || 0);
      const dateB = new Date(b.submittedAt || b.createdAt || 0);
      return dateB - dateA;
    });
  }, [myAllSubmissions, filterPeriodId, searchTerm]);

  // Tính điểm trung bình chung mà người dùng đã đánh giá
  const overallAverageGiven = useMemo(() => {
    if (filteredSubmissions.length === 0) return 0;
    let totalScoreSum = 0;
    let totalScoreCount = 0;

    filteredSubmissions.forEach((sub) => {
      const scoreVals = Object.values(sub.scores || {}).map(Number).filter((s) => !isNaN(s) && s > 0);
      if (scoreVals.length > 0) {
        totalScoreSum += scoreVals.reduce((a, b) => a + b, 0);
        totalScoreCount += scoreVals.length;
      }
    });

    return totalScoreCount > 0 ? (totalScoreSum / totalScoreCount).toFixed(1) : 0;
  }, [filteredSubmissions]);

  return (
    <div className="space-y-4">
      {/* 1. Thanh công cụ & Bộ lọc đợt */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Bộ chọn đợt */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-[#0f766e]" />
              Đợt đánh giá:
            </span>
            <select
              value={filterPeriodId}
              onChange={(e) => setFilterPeriodId(e.target.value)}
              className="text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 shadow-2xs cursor-pointer hover:border-teal-500"
            >
              <option value="ALL">Tất cả các đợt ({myAllSubmissions.length} phiếu)</option>
              {periods.map((p) => {
                const countInPeriod = myAllSubmissions.filter((s) => s.periodId === p.id).length;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({countInPeriod} phiếu)
                  </option>
                );
              })}
            </select>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Tổng cộng: <strong className="text-teal-900 font-bold">{filteredSubmissions.length}</strong> phiếu đã nộp
          </span>
          {filteredSubmissions.length > 0 && (
            <span className="text-xs font-semibold text-slate-500">
              • Điểm TB đã cho: <strong className="text-teal-900 font-bold">{overallAverageGiven}/10</strong>
            </span>
          )}
        </div>

        {/* Ô tìm kiếm nhanh */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm cán bộ đã chấm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 bg-white"
          />
        </div>
      </div>

      {/* 2. Danh sách Phiếu Đã Nộp */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 space-y-2">
          <UserCheck className="w-10 h-10 mx-auto text-slate-300" />
          <div className="text-sm font-bold text-slate-600">
            Chưa có phiếu đánh giá nào phù hợp với bộ lọc
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Vui lòng chọn đợt đánh giá khác hoặc chuyển sang tab "Đánh giá" để thực hiện chấm điểm cho đồng nghiệp.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* View Desktop: Bảng Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-center w-12">TT</th>
                  <th className="py-3 px-4 min-w-[180px]">Cán bộ được đánh giá</th>
                  <th className="py-3 px-4 min-w-[140px]">Chức vụ</th>
                  <th className="py-3 px-4 min-w-[140px]">Kỳ đánh giá</th>
                  <th className="py-3 px-4 text-center min-w-[110px]">Điểm TB đã cho</th>
                  <th className="py-3 px-4 min-w-[140px]">Thời gian nộp</th>
                  <th className="py-3 px-4 min-w-[160px]">Ghi chú</th>
                  <th className="py-3 px-4 text-center min-w-[100px]">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub, idx) => {
                  const scoreVals = Object.values(sub.scores || {}).map(Number).filter((s) => !isNaN(s) && s > 0);
                  const avg = scoreVals.length > 0 ? (scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length).toFixed(1) : 0;
                  const pInfo = periodMap.get(sub.periodId);

                  return (
                    <tr key={sub.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {sub.targetEmployeeName}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">
                          {sub.targetPosition || 'Cán bộ'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          {pInfo?.name || sub.periodName || 'Đợt đánh giá'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                          {avg} / 10
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {formatDateTimeVN(sub.submittedAt || sub.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 italic text-xs">
                        {sub.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedSubmissionForDetail(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem điểm
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* View Mobile (< md): Thẻ Card 1 chạm */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredSubmissions.map((sub, idx) => {
              const scoreVals = Object.values(sub.scores || {}).map(Number).filter((s) => !isNaN(s) && s > 0);
              const avg = scoreVals.length > 0 ? (scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length).toFixed(1) : 0;
              const pInfo = periodMap.get(sub.periodId);

              return (
                <div key={sub.id || idx} className="p-3.5 space-y-2 hover:bg-slate-50/50 transition-colors">
                  {/* Hàng 1: TT, Tên, Chức vụ và Điểm TB */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 shrink-0">#{idx + 1}</span>
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {sub.targetEmployeeName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium pl-5">
                        {sub.targetPosition || 'Cán bộ'}
                      </div>
                    </div>

                    <span className="text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200 shrink-0">
                      {avg} / 10
                    </span>
                  </div>

                  {/* Hàng 2: Kỳ đánh giá & Ngày nộp */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2 pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {pInfo?.name || sub.periodName || 'Đợt đánh giá'}
                    </span>
                    <span className="text-slate-400">
                      {formatDateTimeVN(sub.submittedAt || sub.createdAt)}
                    </span>
                  </div>

                  {/* Hàng 3: Ghi chú (nếu có) & Nút Xem chi tiết */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] text-slate-500 italic truncate max-w-[200px]">
                      {sub.notes ? `"${sub.notes}"` : 'Không có ghi chú'}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSubmissionForDetail(sub)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem điểm
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Modal Xem Lại Chi Tiết Điểm Từng Tiêu Chí Của Phiếu Đã Nộp */}
      {selectedSubmissionForDetail && (
        <Modal
          isOpen={Boolean(selectedSubmissionForDetail)}
          onClose={() => setSelectedSubmissionForDetail(null)}
          title={`Chi Tiết Điểm Đã Chấm: ${selectedSubmissionForDetail.targetEmployeeName}`}
          subtitle={`Kỳ: ${periodMap.get(selectedSubmissionForDetail.periodId)?.name || selectedSubmissionForDetail.periodName || 'Đợt đánh giá'}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header tóm tắt */}
            <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-teal-900 font-bold">
                  Cán bộ: <span className="font-black text-sm">{selectedSubmissionForDetail.targetEmployeeName}</span>
                </div>
                <div className="text-[11px] text-teal-700 font-medium">
                  Chức vụ: {selectedSubmissionForDetail.targetPosition || 'Cán bộ'}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Thời gian nộp phiếu</div>
                <div className="text-xs font-semibold text-slate-800">
                  {formatDateTimeVN(selectedSubmissionForDetail.submittedAt || selectedSubmissionForDetail.createdAt)}
                </div>
              </div>
            </div>

            {/* Bảng kê điểm từng tiêu chí */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3 w-10 text-center">TT</th>
                    <th className="py-2.5 px-3">Tiêu chí đánh giá</th>
                    <th className="py-2.5 px-3 text-center w-24">Điểm đã cho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {criteria.map((c, idx) => {
                    const score = selectedSubmissionForDetail.scores?.[c.id];
                    return (
                      <tr key={c.id || idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{c.title}</div>
                          {c.description && (
                            <div className="text-[10px] text-slate-400 leading-snug">{c.description}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {score !== undefined && score !== null ? (
                            <span className="text-xs font-black text-[#0f766e] bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                              {score} / 10
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Ghi chú đã gửi */}
            {selectedSubmissionForDetail.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-[11px] font-bold text-slate-700">Ghi chú đã gửi:</div>
                <div className="text-xs text-slate-800 italic">
                  "{selectedSubmissionForDetail.notes}"
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default React.memo(MySubmittedSummary);

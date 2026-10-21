import React, { useState } from 'react';
import { 
  Award, 
  Printer, 
  AlertCircle, 
  FileText,
  Send,
  MessageSquare
} from 'lucide-react';
import KpiStatusBadge from '../shared/KpiStatusBadge';
import KpiClassificationBadge from '../shared/KpiClassificationBadge';
import KpiAppealModal from '../scoring/KpiAppealModal';

/**
 * Tab 3: Xem Kết Quả KPI Cá Nhân Trong Kỳ (SPECIFIC)
 */
const KpiMyResultsTab = ({
  myCurrentKpi = null,
  period = '',
  currentUser = null,
  onGoToSelfScoring,
  onOpenPrintModal,
}) => {
  const [isAppealOpen, setIsAppealOpen] = useState(false);

  if (!myCurrentKpi) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <FileText className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            Chưa Có Kết Quả Đánh Giá Trong Kỳ {period}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Đồng chí <span className="font-semibold text-slate-700">{currentUser?.name}</span> chưa gửi phiếu tự đánh giá KPI trong kỳ này.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onGoToSelfScoring}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Thực Hiện Tự Chấm Điểm Ngay</span>
          </button>
        </div>
      </div>
    );
  }

  const criteriaSnapshot = myCurrentKpi.criteriaSnapshot || [];
  const selfScores = myCurrentKpi.selfCriteriaScores || myCurrentKpi.criteriaScores || {};
  const managerScores = myCurrentKpi.managerCriteriaScores || {};
  const chairmanScores = myCurrentKpi.chairmanCriteriaScores || {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header Thẻ Tổng Quan Kết Quả */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">
                Phiếu Đánh Giá Hiệu Suất KPI
              </h2>
              <KpiStatusBadge status={myCurrentKpi.status} />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Cán bộ: <span className="font-bold text-slate-800">{myCurrentKpi.employeeName}</span> ({myCurrentKpi.employeeCode || '—'}) • {myCurrentKpi.department} • Kỳ: <span className="font-bold text-slate-800">{myCurrentKpi.period}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPrintModal && (
              <button
                type="button"
                onClick={() => onOpenPrintModal(myCurrentKpi)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-300 hover:border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                <span>In A4</span>
              </button>
            )}

            {/* Nút gửi đề nghị xem xét lại nếu có thắc mắc */}
            <button
              type="button"
              onClick={() => setIsAppealOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Khiếu nại / Phúc tra</span>
            </button>
          </div>
        </div>

        {/* 4 Thẻ Điểm Số Nòng Cốt */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 font-numeric">
          {/* Cấp 1 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">
              1. Tự chấm (40%)
            </span>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {myCurrentKpi.scoreSelf ?? '—'}đ
            </div>
            <span className="text-[11px] text-slate-400 font-sans">Điểm cá nhân</span>
          </div>

          {/* Cấp 2 */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-center">
            <span className="text-[10px] text-blue-600 block uppercase font-sans font-bold">
              2. BĐH chấm (30%)
            </span>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              {myCurrentKpi.scoreManager ?? '—'}đ
            </div>
            <span className="text-[11px] text-blue-500 font-sans">Trưởng phòng duyệt</span>
          </div>

          {/* Cấp 3 */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-center">
            <span className="text-[10px] text-amber-700 block uppercase font-sans font-bold">
              3. HĐQT chấm (30%)
            </span>
            <div className="text-2xl font-bold text-amber-800 mt-1">
              {myCurrentKpi.scoreChairman ?? '—'}đ
            </div>
            <span className="text-[11px] text-amber-600 font-sans">Chủ tịch phê chuẩn</span>
          </div>

          {/* Tổng kết */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-center shadow-xs">
            <span className="text-[10px] text-emerald-800 block uppercase font-sans font-bold">
              Tổng kết chính thức
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
              {myCurrentKpi.finalScore ?? '—'}đ
            </div>
            <div className="mt-1 flex justify-center">
              <KpiClassificationBadge classification={myCurrentKpi.classification} />
            </div>
          </div>
        </div>

        {/* Thông tin đơn khiếu nại nếu đang trong quá trình phúc tra */}
        {myCurrentKpi.status === 'appealed' && (
          <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Đang trong tiến trình giải quyết phúc tra / khiếu nại</p>
              <p className="text-rose-700 mt-0.5">Lý do cán bộ đề nghị: {myCurrentKpi.appealReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Chi Tiết Từng Tiêu Chí Chấm */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-700" />
            <span>Chi Tiết Đánh Giá Từng Tiêu Chí</span>
          </h3>
          <span className="text-xs text-slate-400 font-numeric">
            {criteriaSnapshot.length} tiêu chí
          </span>
        </div>

        <div className="divide-y divide-slate-100 p-2 sm:p-4">
          {criteriaSnapshot.map((crit) => {
            const sItem = selfScores[crit.id] || { score: crit.maxScore, note: '' };
            const mItem = managerScores[crit.id] || { score: sItem.score, feedback: '' };
            const cItem = chairmanScores[crit.id] || { score: mItem.score, feedback: '' };

            return (
              <div key={crit.id} className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-numeric border border-slate-200">
                        {crit.code}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{crit.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{crit.description}</p>
                  </div>

                  {/* Đối chiếu điểm 3 bên */}
                  <div className="flex items-center gap-2.5 shrink-0 font-numeric text-center">
                    <div className="p-1 px-2 rounded bg-slate-100">
                      <span className="text-[10px] text-slate-400 block font-sans">Tự chấm</span>
                      <span className="text-xs font-bold text-slate-700">{sItem.score}đ</span>
                    </div>
                    <div className="p-1 px-2 rounded bg-blue-50">
                      <span className="text-[10px] text-blue-500 block font-sans">BĐH</span>
                      <span className="text-xs font-bold text-blue-700">{mItem.score}đ</span>
                    </div>
                    <div className="p-1 px-2 rounded bg-amber-50">
                      <span className="text-[10px] text-amber-600 block font-sans">HĐQT</span>
                      <span className="text-xs font-bold text-amber-800">{cItem.score}đ</span>
                    </div>
                  </div>
                </div>

                {/* Các nhận xét chi tiết */}
                <div className="space-y-1.5 text-xs">
                  {sItem.note && (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                      <span className="font-semibold text-slate-500">[Cán bộ giải trình]:</span> {sItem.note}
                    </div>
                  )}
                  {mItem.feedback && (
                    <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-blue-900">
                      <span className="font-semibold text-blue-600">[BĐH nhận xét]:</span> {mItem.feedback}
                    </div>
                  )}
                  {cItem.feedback && (
                    <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-amber-900">
                      <span className="font-semibold text-amber-700">[HĐQT chỉ đạo]:</span> {cItem.feedback}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Lời Nhận Xét Chung Của Các Cấp */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-700" />
          <span>Ý Kiến Đánh Giá Chung & Quyết Định Công Nhận</span>
        </h3>

        <div className="space-y-3 text-xs leading-relaxed">
          {myCurrentKpi.selfNotes && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Cán bộ tự đánh giá toàn kỳ:</span>
              <p className="text-slate-800">{myCurrentKpi.selfNotes}</p>
            </div>
          )}

          {myCurrentKpi.managerNotes && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="font-bold text-blue-900 block mb-1">Nhận xét của Ban Điều Hành / Trưởng phòng:</span>
              <p className="text-blue-950">{myCurrentKpi.managerNotes}</p>
            </div>
          )}

          {myCurrentKpi.chairmanNotes && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300">
              <span className="font-bold text-emerald-900 block mb-1">Ý kiến chỉ đạo của Chủ tịch Hội đồng Quản trị:</span>
              <p className="text-emerald-950 font-medium">{myCurrentKpi.chairmanNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Khiếu nại */}
      <KpiAppealModal
        isOpen={isAppealOpen}
        onClose={() => setIsAppealOpen(false)}
        kpiItem={myCurrentKpi}
      />
    </div>
  );
};

export default KpiMyResultsTab;

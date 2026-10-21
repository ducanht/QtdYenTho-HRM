import React, { useState } from 'react';
import { 
  AlertCircle, 
  X, 
  Send, 
  HelpCircle,
  Loader2 
} from 'lucide-react';
import { submitKpiAppeal } from '../../services/kpiService';
import { useToast } from '../../../../context/ToastContext';

/**
 * Modal CBNV Gửi Đề Nghị Xem Xét Lại / Khiếu Nại Điểm Số KPI
 */
const KpiAppealModal = ({
  isOpen,
  onClose,
  kpiItem = null,
  onAppealSubmitted
}) => {
  const toast = useToast();
  const [appealReason, setAppealReason] = useState('');
  const [appealRequestedScore, setAppealRequestedScore] = useState('');
  const [appealNotes, setAppealNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !kpiItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appealReason.trim()) {
      toast.error('Vui lòng nhập lý do đề nghị xem xét lại điểm số.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitKpiAppeal(kpiItem.id, {
        appealReason: appealReason.trim(),
        appealRequestedScore: appealRequestedScore ? Number(appealRequestedScore) : null,
        appealNotes: appealNotes.trim(),
      });
      toast.success('Đã gửi phản ánh / đề nghị xem xét lại điểm thành công! Lãnh đạo sẽ xem xét phúc tra.');
      if (onAppealSubmitted) onAppealSubmitted();
      onClose();
    } catch (err) {
      console.error('Lỗi gửi khiếu nại KPI:', err);
      toast.error('Có lỗi xảy ra khi gửi đề nghị.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Đề Nghị Xem Xét Lại Điểm KPI</h3>
              <p className="text-xs text-rose-200 mt-0.5">Kỳ đánh giá: {kpiItem.period}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Thông tin điểm hiện tại */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center font-numeric">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Tự chấm</span>
              <span className="text-sm font-bold text-slate-700">{kpiItem.scoreSelf ?? '—'}đ</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-sans">BĐH chấm</span>
              <span className="text-sm font-bold text-blue-700">{kpiItem.scoreManager ?? '—'}đ</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Điểm chốt</span>
              <span className="text-sm font-bold text-rose-700">{kpiItem.finalScore ?? kpiItem.scoreChairman ?? '—'}đ</span>
            </div>
          </div>

          {/* Lý do đề nghị */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Lý Do Đề Nghị Phúc Tra / Xem Xét Lại <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="VD: Kết quả giải ngân thực tế tháng cuối quý đạt vượt chỉ tiêu..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            />
          </div>

          {/* Điểm đề nghị mong muốn */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Điểm Số Đề Nghị Được Công Nhận (Tùy chọn)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={appealRequestedScore}
              onChange={(e) => setAppealRequestedScore(e.target.value)}
              placeholder="VD: 88"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 font-numeric focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            />
          </div>

          {/* Chi tiết giải trình / số liệu minh chứng */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Giải Trình Chi Tiết & Dẫn Chứng Minh Họa
            </label>
            <textarea
              rows={3}
              value={appealNotes}
              onChange={(e) => setAppealNotes(e.target.value)}
              placeholder="Nêu rõ các số liệu hồ sơ, hợp đồng tín dụng hoặc chứng từ kế toán liên quan để Ban Lãnh đạo đối chiếu..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Đơn khiếu nại sẽ được gửi trực tiếp đến Trưởng phòng và Chủ tịch HĐQT xem xét.</span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Đề Nghị Phúc Tra</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KpiAppealModal;

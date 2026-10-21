import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  X, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { resolveKpiAppeal } from '../../services/kpiService';
import { useToast } from '../../../../context/ToastContext';

/**
 * Modal Dành Cho Quản Lý / HĐQT Xử Lý Khiếu Nại Điểm KPI
 */
const KpiAppealResolutionModal = ({
  isOpen,
  onClose,
  kpiItem = null,
  currentUser = null,
  onResolved
}) => {
  const toast = useToast();
  const [resolutionAction, setResolutionAction] = useState('ACCEPT'); // 'ACCEPT' | 'REJECT'
  const [adjustedScore, setAdjustedScore] = useState(
    kpiItem?.appealRequestedScore ?? (kpiItem?.finalScore ?? 85)
  );
  const [resolutionNote, setResolutionNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !kpiItem) return null;

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      toast.error('Vui lòng nhập văn bản giải trình hoặc căn cứ quyết định.');
      return;
    }

    if (resolutionAction === 'ACCEPT') {
      const scoreNum = Number(adjustedScore);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
        toast.error('Điểm điều chỉnh phải nằm trong khoảng từ 0 đến 100.');
        return;
      }
    }

    setIsProcessing(true);
    try {
      await resolveKpiAppeal(kpiItem.id, {
        action: resolutionAction,
        adjustedScore: resolutionAction === 'ACCEPT' ? Number(adjustedScore) : undefined,
        note: resolutionNote.trim(),
        resolvedBy: currentUser?.name || 'Hội đồng Quản trị',
        resolvedByRole: currentUser?.role || 'HĐQT'
      });

      toast.success(
        resolutionAction === 'ACCEPT'
          ? `Đã chấp thuận điều chỉnh điểm cho đ/c ${kpiItem.employeeName} thành ${adjustedScore} điểm!`
          : `Đã bảo lưu kết quả đánh giá của đ/c ${kpiItem.employeeName} kèm văn bản giải thích!`
      );
      if (onResolved) onResolved();
      onClose();
    } catch (err) {
      console.error('Lỗi resolveKpiAppeal:', err);
      toast.error('Có lỗi xảy ra khi xử lý khiếu nại.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Xem Xét Phúc Tra Điểm KPI</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Cán bộ: {kpiItem.employeeName} • {kpiItem.department}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleResolve} className="p-6 space-y-4">
          {/* Thông tin phản ánh từ CBNV */}
          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-2 text-xs">
            <div className="font-bold text-rose-900 uppercase tracking-wide">
              Đơn Đề Nghị Của Cán Bộ
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Lý do:</span>{' '}
              <span className="text-slate-900 font-medium">{kpiItem.appealReason || 'Không có lý do chi tiết'}</span>
            </div>
            {typeof kpiItem.appealRequestedScore === 'number' && (
              <div>
                <span className="text-slate-500 font-semibold">Điểm mong muốn:</span>{' '}
                <span className="text-emerald-700 font-bold font-numeric">{kpiItem.appealRequestedScore}đ</span>
              </div>
            )}
            {kpiItem.appealNotes && (
              <div>
                <span className="text-slate-500 font-semibold">Giải trình dẫn chứng:</span>{' '}
                <span className="text-slate-700 italic">{kpiItem.appealNotes}</span>
              </div>
            )}
          </div>

          {/* Lựa chọn hướng giải quyết */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Quyết Định Xử Lý Của Lãnh Đạo
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResolutionAction('ACCEPT')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  resolutionAction === 'ACCEPT'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <CheckCircle className={`w-4 h-4 mt-0.5 ${resolutionAction === 'ACCEPT' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-800">Chấp Thuận</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Điều chỉnh lại điểm số</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setResolutionAction('REJECT')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  resolutionAction === 'REJECT'
                    ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <XCircle className={`w-4 h-4 mt-0.5 ${resolutionAction === 'REJECT' ? 'text-rose-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-800">Bảo Lưu</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Giữ nguyên kết quả cũ</div>
                </div>
              </button>
            </div>
          </div>

          {/* Nếu chấp thuận: Nhập điểm mới */}
          {resolutionAction === 'ACCEPT' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Điểm Số Sau Khi Thẩm Định Lại <span className="text-emerald-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                required
                value={adjustedScore}
                onChange={(e) => setAdjustedScore(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 font-numeric font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          )}

          {/* Căn cứ quyết định / Văn bản giải thích */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Căn Cứ Quyết Định / Giải Thích Cho CBNV <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Ghi rõ lý do điều chỉnh hoặc căn cứ bảo lưu kết quả..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-500 outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang ghi nhận...</span>
                </>
              ) : (
                <span>Lưu Quyết Định Phúc Tra</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KpiAppealResolutionModal;

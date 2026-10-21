import React, { useState } from 'react';
import { 
  CheckCheck, 
  X, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

/**
 * Modal Phê Duyệt Hàng Loạt Dành Cho HĐQT
 */
const KpiBulkApproveModal = ({
  isOpen,
  onClose,
  pendingList = [],
  period = '',
  onBulkApprove,
  isProcessing = false
}) => {
  const [approverNotes, setApproverNotes] = useState(`HĐQT nhất trí phê chuẩn kết quả đánh giá KPI ${period}`);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onBulkApprove({
      notes: approverNotes.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <CheckCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Phê Duyệt Hàng Loạt HĐQT</h3>
              <p className="text-xs text-emerald-200 mt-0.5">Kỳ đánh giá: {period}</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold mb-1">
                Xác nhận phê chuẩn <span className="font-numeric font-bold text-amber-950">({pendingList.length})</span> phiếu đánh giá đang chờ duyệt
              </p>
              <p>
                Hệ thống sẽ tự động tính điểm tổng kết (Cán bộ 40% - BĐH 30% - HĐQT 30%), chốt danh hiệu thi đua và ghi nhận vĩnh viễn vào lịch sử KPI toàn đơn vị.
              </p>
            </div>
          </div>

          {/* Danh sách cán bộ sẽ duyệt */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Danh Sách Cán Bộ Được Phê Chuẩn ({pendingList.length})
            </label>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1.5 bg-slate-50/50">
              {pendingList.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between text-xs p-1.5 bg-white rounded border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-numeric w-5">{idx + 1}.</span>
                    <span className="font-semibold text-slate-800">{item.employeeName}</span>
                    <span className="text-[11px] text-slate-400">({item.department})</span>
                  </div>
                  <div className="font-numeric text-slate-600">
                    BĐH: <b className="text-emerald-700">{item.scoreManager ?? item.scoreSelf}đ</b>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ý kiến chỉ đạo của HĐQT */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ý Kiến Chỉ Đạo Của HĐQT
            </label>
            <textarea
              rows={2}
              value={approverNotes}
              onChange={(e) => setApproverNotes(e.target.value)}
              placeholder="Nhập ý kiến chỉ đạo chung cho toàn đợt..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
              disabled={isProcessing || pendingList.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang phê duyệt...</span>
                </>
              ) : (
                <>
                  <CheckCheck className="w-4 h-4" />
                  <span>Phê Chuẩn Hàng Loạt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KpiBulkApproveModal;

import React from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { ROLES } from '../../../lib/constants';
import { calculateKpiFinal } from '../../../lib/services';

/**
 * Modal Chấm Điểm & Phê Duyệt KPI dành cho Ban Điều Hành (30%) hoặc Chủ Tịch HĐQT (30%)
 */
const KpiGradingModal = ({
  activeModalItem,
  onClose,
  role,
  modalScore,
  setModalScore,
  modalNotes,
  setModalNotes,
  onSaveScore,
  isSubmitting
}) => {
  if (!activeModalItem) return null;

  return (
    <Modal
      isOpen={Boolean(activeModalItem)}
      onClose={onClose}
      title={
        role === ROLES.MANAGER
          ? 'Ban Điều Hành Chấm Điểm KPI (Trọng số 30%)'
          : 'Chủ Tịch HĐQT Phê Duyệt & Chấm Điểm (Trọng số 30%)'
      }
      subtitle={`Cán bộ: ${activeModalItem?.employeeName} • ${activeModalItem?.department}`}
      maxWidth="max-w-lg"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="primary"
            isLoading={isSubmitting}
            onClick={onSaveScore}
          >
            Lưu điểm đánh giá
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Previous Step Summary */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Điểm cán bộ tự chấm (40%):</span>
            <span className="font-bold text-[#0f766e] text-sm">
              {activeModalItem.scoreSelf} điểm
            </span>
          </div>
          {activeModalItem.scoreManager !== null && activeModalItem.scoreManager !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-500">Điểm Ban điều hành đã chấm (30%):</span>
              <span className="font-bold text-slate-800 text-sm">
                {activeModalItem.scoreManager} điểm
              </span>
            </div>
          )}
          {activeModalItem.selfNotes && (
            <div className="pt-2 border-t border-slate-200 text-slate-600 italic">
              "{activeModalItem.selfNotes}"
            </div>
          )}
        </div>

        {/* Score Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            {role === ROLES.MANAGER
              ? 'Điểm Ban điều hành chấm (0 - 100)'
              : 'Điểm Chủ tịch HĐQT chấm (0 - 100)'}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="100"
              value={modalScore}
              onChange={(e) => setModalScore(e.target.value)}
              className="w-24 text-center py-2 px-3 border border-slate-300 rounded-xl text-lg font-black text-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
            />
            <input
              type="range"
              min="0"
              max="100"
              value={modalScore}
              onChange={(e) => setModalScore(e.target.value)}
              className="flex-1 accent-[#0f766e]"
            />
          </div>
        </div>

        {/* Preview Estimated Final Score if Chairman */}
        {role === ROLES.CHAIRMAN && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
              Điểm tổng kết dự kiến sau khi lưu:
            </span>
            <span className="text-2xl font-black text-emerald-700">
              {calculateKpiFinal(
                activeModalItem.scoreSelf,
                activeModalItem.scoreManager,
                modalScore
              )}{' '}
              <span className="text-xs font-normal text-slate-500">/ 100</span>
            </span>
          </div>
        )}

        {/* Remarks */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Nhận xét chỉ đạo / Góp ý
          </label>
          <textarea
            rows={3}
            value={modalNotes}
            onChange={(e) => setModalNotes(e.target.value)}
            placeholder="Ý kiến đánh giá từ cấp quản lý..."
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
          />
        </div>
      </div>
    </Modal>
  );
};

export default KpiGradingModal;

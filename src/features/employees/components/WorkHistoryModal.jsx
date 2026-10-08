import React from 'react';
import { 
  ArrowRightLeft, 
  FileText, 
  Calendar 
} from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { formatDateVN } from '../../../lib/dateUtils';

const WorkHistoryModal = ({
  selectedEmp,
  onClose,
  workHistory = [],
}) => {
  if (!selectedEmp) return null;

  return (
    <Modal
      isOpen={Boolean(selectedEmp)}
      onClose={onClose}
      title="Lịch Sử Luân Chuyển & Điều Động Công Tác"
      subtitle={`Cán bộ: ${selectedEmp.name} (${selectedEmp.code}) • ${selectedEmp.position}`}
      maxWidth="max-w-2xl"
      footer={
        <Button variant="outline" onClick={onClose}>
          Đóng cửa sổ
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Header info card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-slate-400 block text-[10px]">Số CCCD:</span>
            <span className="font-mono font-bold text-slate-900">{selectedEmp.cccd || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Giới tính & SĐT:</span>
            <span className="font-bold text-slate-800">
              {selectedEmp.gender || '—'} • {selectedEmp.phone || '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Ngày vào Đảng:</span>
            <span className="font-semibold text-amber-800">
              {selectedEmp.partyDate ? formatDateVN(selectedEmp.partyDate) : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Ngày chính thức Đảng:</span>
            <span className="font-semibold text-amber-900">
              {selectedEmp.partyOfficialDate ? formatDateVN(selectedEmp.partyOfficialDate) : '—'}
            </span>
          </div>
        </div>

        {/* Timeline of Job Transfers */}
        {workHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Chưa có ghi nhận luân chuyển điều động nào cho cán bộ này.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-200">
            {workHistory.map((item, idx) => (
              <div key={item.id || idx} className="relative group text-xs">
                {/* Timeline bullet dot */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0f766e] text-white flex items-center justify-center text-[10px] shadow-sm">
                  <ArrowRightLeft className="w-2.5 h-2.5" />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition-all shadow-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#0f766e]" />
                      <span>QĐ số: {item.decisionNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Hiệu lực: {formatDateVN(item.effectiveDate)}</span>
                      {item.decisionDate && (
                        <span className="text-slate-400">
                          (Ký: {formatDateVN(item.decisionDate)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Transfer Type Badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                      {item.transferTypeLabel || item.transferType}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Người ký: {item.signer}
                    </span>
                  </div>

                  {/* Transition Box */}
                  <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Trước điều chuyển:</span>
                      <span className="font-semibold text-slate-700">
                        {item.fromPosition} ({item.fromAssignedArea})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-teal-900 font-bold">
                      <span>Vị trí / Địa bàn mới:</span>
                      <span className="text-[#0f766e]">
                        {item.toPosition} ({item.toAssignedArea})
                      </span>
                    </div>
                  </div>

                  {/* Reason & handover */}
                  {item.reason && (
                    <div className="text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">Căn cứ: </span>
                      <span>{item.reason}</span>
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-[11px] text-slate-500 italic">
                      "{item.notes}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default React.memo(WorkHistoryModal);

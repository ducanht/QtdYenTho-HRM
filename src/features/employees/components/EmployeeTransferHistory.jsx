import React, { useMemo } from 'react';
import { 
  ArrowRightLeft, 
  PlusCircle, 
  FileText, 
  Calendar, 
  MapPin, 
  User, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Building2 
} from 'lucide-react';
import { calculatePositionTenure } from '../../../lib/evaluationUtils';
import { formatDateVN } from '../../../lib/dateUtils';
import { deleteWorkHistory } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';

/**
 * EmployeeTransferHistory: Cột Phải cho Tab TRANSFERS
 * Giám sát chu kỳ luân chuyển cán bộ theo quy định của Ngân hàng Nhà nước và hiển thị Timeline quá trình công tác
 */
const EmployeeTransferHistory = ({
  emp,
  workHistory = [],
  onOpenCreateTransfer,
  canManage = false,
}) => {
  const toast = useToast();

  // Nhận diện vị trí nhạy cảm cần luân chuyển
  const isSensitive = useMemo(() => {
    if (!emp) return false;
    const p = (emp.position || '').toLowerCase();
    return (
      p.includes('tín dụng') ||
      p.includes('kế toán') ||
      p.includes('thủ quỹ') ||
      p.includes('kiểm soát')
    );
  }, [emp?.position]);

  // Tính số tháng công tác tại vị trí hiện tại
  const effectiveStart = emp ? (emp.positionStartDate || emp.joinDate) : null;
  const tenureText = calculatePositionTenure(effectiveStart);

  const tenureMonths = useMemo(() => {
    if (!effectiveStart) return 0;
    try {
      const start = new Date(effectiveStart);
      const now = new Date();
      if (isNaN(start.getTime())) return 0;
      return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    } catch {
      return 0;
    }
  }, [effectiveStart]);

  const maxMonths = 36; // Chu kỳ luân chuyển tối đa theo quy định (36 tháng)
  const percent = Math.min(100, Math.round((tenureMonths / maxMonths) * 100));

  const isDue = isSensitive && tenureMonths >= 36;
  const isNear = isSensitive && tenureMonths >= 30 && tenureMonths < 36;

  // Lọc lịch sử luân chuyển của cán bộ đang chọn
  const empHistory = useMemo(() => {
    if (!emp) return [];
    return workHistory
      .filter((rec) => rec.employeeId === emp.id || (rec.employeeCode && rec.employeeCode === emp.code))
      .sort((a, b) => (b.effectiveDate || '').localeCompare(a.effectiveDate || ''));
  }, [workHistory, emp?.id, emp?.code]);

  if (!emp) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
        Vui lòng chọn cán bộ từ danh sách bên trái để theo dõi quá trình luân chuyển.
      </div>
    );
  }

  // Xóa bản ghi lịch sử luân chuyển
  const handleDelete = async (recordId, decNo) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa quyết định luân chuyển số "${decNo || recordId}" không?`)) {
      return;
    }
    try {
      await deleteWorkHistory(recordId);
      toast?.showSuccess?.('Đã xóa bản ghi quyết định luân chuyển thành công');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xóa quyết định');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header & Cảnh Báo Giám Sát Luân Chuyển NHNN */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-700" />
              <span>Theo Dõi Luân Chuyển Công Tác</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {emp.name}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chức vụ hiện tại: <span className="font-bold text-slate-800">{emp.position}</span> • {emp.department}
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => onOpenCreateTransfer(emp)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Lập quyết định luân chuyển</span>
            </button>
          )}
        </div>

        {/* Khung Tiến Độ Thời Gian Giữ Vị Trí Nhạy Cảm */}
        {isSensitive ? (
          <div className={`p-4 rounded-xl border ${
            isDue 
              ? 'bg-rose-50/70 border-rose-200' 
              : isNear 
              ? 'bg-amber-50/70 border-amber-200' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                {isDue ? (
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                ) : isNear ? (
                  <Clock className="w-4 h-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span>Chu kỳ luân chuyển theo quy định NHNN:</span>
              </span>
              <span className={`font-black tabular-nums ${
                isDue ? 'text-rose-700' : isNear ? 'text-amber-700' : 'text-slate-700'
              }`}>
                {tenureText} / 3 năm (36 tháng)
              </span>
            </div>

            {/* Thanh Progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  isDue 
                    ? 'bg-rose-600' 
                    : isNear 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-700'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between">
              <span>Ngày bắt đầu: {formatDateVN(effectiveStart)}</span>
              <span className="font-bold">
                {isDue 
                  ? 'Đã đến hạn luân chuyển bắt buộc (Đề nghị lập phương án điều động)' 
                  : isNear 
                  ? 'Sắp đến hạn luân chuyển trong vòng 6 tháng tới' 
                  : 'Thời hạn công tác trong ngưỡng an toàn'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Vị trí công tác hiện tại không thuộc nhóm bắt buộc luân chuyển theo chu kỳ 3 năm của NHNN.</span>
            <span className="font-bold text-slate-800">Thâm niên: {tenureText}</span>
          </div>
        )}
      </div>

      {/* 2. Timeline Quá Trình Luân Chuyển & Điều Động */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>Lịch Sử Quyết Định Điều Động & Luân Chuyển ({empHistory.length})</span>
          </h3>
        </div>

        {empHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Chưa có bản ghi quyết định luân chuyển nào cho cán bộ này.
          </div>
        ) : (
          <div className="space-y-4">
            {empHistory.map((item, idx) => {
              const isLatest = idx === 0;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all text-xs space-y-3 ${
                    isLatest 
                      ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {item.decisionNumber || 'Chưa ghi số QĐ'}
                      </span>
                      <span className="font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        {item.transferType === 'LUAN_CHUYEN_DINH_KY'
                          ? 'Luân chuyển định kỳ'
                          : item.transferType === 'BO_NHIEM'
                          ? 'Bổ nhiệm chức vụ'
                          : item.transferType === 'THAY_DOI_DIA_BAN'
                          ? 'Thay đổi địa bàn tín dụng'
                          : 'Điều động nội bộ'}
                      </span>
                      {isLatest && (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-200 px-1.5 py-0.5 rounded-md">
                          Gần nhất
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>Ngày ký: {formatDateVN(item.decisionDate)}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-700">Hiệu lực: {formatDateVN(item.effectiveDate)}</span>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.decisionNumber)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Xóa quyết định này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chi tiết thay đổi chức danh & địa bàn */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Trước điều động:</span>
                      <p className="font-bold text-slate-700">
                        {item.fromPosition || 'Chưa xác định'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {item.fromDepartment || '—'}
                      </p>
                      {item.fromAssignedArea && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{item.fromAssignedArea}</span>
                        </p>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 block uppercase">Tiếp nhận mới:</span>
                      <p className="font-bold text-emerald-950">
                        {item.toPosition || emp.position}
                      </p>
                      <p className="text-[11px] text-emerald-800">
                        {item.toDepartment || emp.department}
                      </p>
                      {item.toAssignedArea && (
                        <p className="text-[11px] text-emerald-800 flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{item.toAssignedArea}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Thông tin bàn giao và người ký */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Người ký:</span>
                      <span className="font-bold text-slate-800">{item.signer || 'Chủ tịch HĐQT'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Bàn giao hồ sơ nợ & sổ sách:</span>
                      <span className={`font-bold px-2 py-0.5 rounded-md ${
                        item.handoverStatus === 'DA_BAN_GIAO'
                          ? 'text-emerald-800 bg-emerald-100'
                          : item.handoverStatus === 'DANG_BAN_GIAO'
                          ? 'text-amber-800 bg-amber-100'
                          : 'text-rose-800 bg-rose-100'
                      }`}>
                        {item.handoverStatus === 'DA_BAN_GIAO'
                          ? 'Đã hoàn tất bàn giao'
                          : item.handoverStatus === 'DANG_BAN_GIAO'
                          ? 'Đang tiến hành bàn giao'
                          : 'Chưa bàn giao'}
                      </span>
                    </div>
                  </div>

                  {item.reason && (
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-600">Căn cứ điều động:</span> {item.reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(EmployeeTransferHistory);

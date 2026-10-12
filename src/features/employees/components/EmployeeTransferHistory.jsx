import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  FileText, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Trash2,
  Plus,
  Edit3,
  Calendar,
  Building2,
  Briefcase
} from 'lucide-react';
import { calculatePositionTenure, calculateAreaTenureAndDueDate } from '../../../lib/evaluationUtils';
import { formatDateVN } from '../../../lib/dateUtils';
import { deleteWorkHistory } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';
import WorkHistoryPeriodModal from './WorkHistoryPeriodModal';

/**
 * EmployeeTransferHistory: Cột Phải cho Tab TRANSFERS
 * Giám sát chu kỳ luân chuyển cán bộ theo quy định của Ngân hàng Nhà nước và hiển thị Timeline quá trình công tác
 */
const EmployeeTransferHistory = ({
  emp,
  workHistory = [],
  hrConfig = null,
  departments = [],
  positions = [],
  canManage = false,
}) => {
  const toast = useToast();
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriodData, setEditingPeriodData] = useState(null);

  // Nhận diện quy tắc luân chuyển theo chức vụ cấu hình
  const positionRule = useMemo(() => {
    if (!emp?.position) return null;
    const rules = hrConfig?.transferRules || [];
    const found = rules.find((r) => r.positionName === emp.position);
    if (found) return found;

    // Fallback logic ban đầu nếu chưa có cấu hình riêng
    const p = emp.position.toLowerCase();
    const defaultRequires = (
      p.includes('tín dụng') ||
      p.includes('kế toán') ||
      p.includes('thủ quỹ') ||
      p.includes('kiểm soát')
    );
    return {
      positionName: emp.position,
      requiresTransfer: defaultRequires,
      maxMonths: hrConfig?.transferMaxMonths || 36,
      warningMonths: hrConfig?.transferWarningMonths || 6,
    };
  }, [emp?.position, hrConfig]);

  const requiresTransfer = Boolean(positionRule?.requiresTransfer);
  const maxMonths = Number(positionRule?.maxMonths) || 36;
  const warningMonths = Number(positionRule?.warningMonths) || 6;

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

  const percent = Math.min(100, Math.round((tenureMonths / maxMonths) * 100));
  const isDue = requiresTransfer && tenureMonths >= maxMonths;
  const isNear = requiresTransfer && tenureMonths >= (maxMonths - warningMonths) && tenureMonths < maxMonths;

  // Theo dõi tiến độ quản lý địa bàn dành riêng cho Cán bộ Tín dụng
  const isCreditOfficer = (emp?.department || '').includes('Tín dụng') || 
    (emp?.position || '').toLowerCase().includes('tín dụng') || 
    Boolean(emp?.assignedArea);

  const areaInfo = isCreditOfficer 
    ? calculateAreaTenureAndDueDate(emp?.areaStartDate || effectiveStart, maxMonths, warningMonths) 
    : null;
  const areaPercent = areaInfo ? Math.min(100, Math.round((areaInfo.tenureMonths / maxMonths) * 100)) : 0;

  // Lọc và sắp xếp lịch sử quá trình công tác của cán bộ đang chọn
  // Mốc hiện tại (isCurrent: true) lên đầu tiên, sau đó theo ngày bắt đầu giảm dần
  const empHistory = useMemo(() => {
    if (!emp) return [];
    return workHistory
      .filter((rec) => rec.employeeId === emp.id || (rec.employeeCode && rec.employeeCode === emp.code))
      .sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        const dateA = a.startDate || a.effectiveDate || '';
        const dateB = b.startDate || b.effectiveDate || '';
        return dateB.localeCompare(dateA);
      });
  }, [workHistory, emp?.id, emp?.code]);

  if (!emp) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
        Vui lòng chọn cán bộ từ danh sách bên trái để theo dõi quá trình luân chuyển.
      </div>
    );
  }

  // Xóa bản ghi lịch sử luân chuyển
  const handleDelete = async (recordId, label) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa mốc công tác "${label || recordId}" không?`)) {
      return;
    }
    try {
      await deleteWorkHistory(recordId);
      toast?.showSuccess?.('Đã xóa mốc quá trình công tác thành công');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xóa mốc công tác');
    }
  };

  const handleOpenAddPeriod = () => {
    setEditingPeriodData(null);
    setIsPeriodModalOpen(true);
  };

  const handleOpenEditPeriod = (record) => {
    setEditingPeriodData(record);
    setIsPeriodModalOpen(true);
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

          <div className="flex items-center gap-2 shrink-0">
            {requiresTransfer ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Vị trí luân chuyển định kỳ ({maxMonths} tháng)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Theo nhiệm kỳ / HĐLĐ</span>
              </span>
            )}
          </div>
        </div>

        {/* Khung Tiến Độ Thời Gian Giữ Vị Trí Theo Cấu Hình */}
        {requiresTransfer ? (
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
                <span>Thời gian công tác tại vị trí hiện tại:</span>
              </span>
              <span className={`font-black tabular-nums ${
                isDue ? 'text-rose-700' : isNear ? 'text-amber-700' : 'text-slate-700'
              }`}>
                {tenureText} / {maxMonths} tháng
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

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2.5 text-[11px]">
              <span className="text-slate-500">
                Ngày bắt đầu giữ vị trí: <strong className="text-slate-700">{formatDateVN(effectiveStart)}</strong>
              </span>
              <span className={`font-bold ${
                isDue 
                  ? 'text-rose-700' 
                  : isNear 
                  ? 'text-amber-700' 
                  : 'text-emerald-700'
              }`}>
                {isDue 
                  ? `Đã vượt thời hạn luân chuyển (${tenureMonths - maxMonths} tháng)` 
                  : isNear 
                  ? `Sắp đến hạn luân chuyển (còn ${maxMonths - tenureMonths} tháng)` 
                  : 'Trong thời hạn công tác an toàn'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center gap-3 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-800">
                Vị trí công tác hiện tại theo dõi theo nhiệm kỳ / HĐLĐ
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chức danh này không thuộc diện bắt buộc luân chuyển định kỳ theo cấu hình hệ thống hiện tại của Quỹ.
              </p>
            </div>
          </div>
        )}

        {/* Khung Tiến Độ Luân Chuyển Địa Bàn Dành Cho Cán Bộ Tín Dụng */}
        {isCreditOfficer && areaInfo && (
          <div className={`p-4 rounded-xl border ${
            areaInfo.isDue 
              ? 'bg-rose-50/70 border-rose-200' 
              : areaInfo.isNear 
              ? 'bg-amber-50/70 border-amber-200' 
              : 'bg-emerald-50/60 border-emerald-200'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Tiến Độ Quản Lý Địa Bàn & Luân Chuyển Định Kỳ:</span>
                <span className="font-bold text-emerald-950 underline">{emp.assignedArea || 'Chưa phân công địa bàn'}</span>
              </span>
              <span className={`font-black tabular-nums ${
                areaInfo.isDue ? 'text-rose-700' : areaInfo.isNear ? 'text-amber-700' : 'text-emerald-900'
              }`}>
                {areaInfo.tenureText} / {maxMonths} tháng
              </span>
            </div>

            {/* Thanh Progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  areaInfo.isDue 
                    ? 'bg-rose-600' 
                    : areaInfo.isNear 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-700'
                }`}
                style={{ width: `${areaPercent}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2.5 text-[11px]">
              <span className="text-slate-600">
                Ngày nhận địa bàn: <strong className="text-slate-800">{emp.areaStartDate ? formatDateVN(emp.areaStartDate) : (effectiveStart ? formatDateVN(effectiveStart) : 'Chưa cập nhật')}</strong>
                {areaInfo.dueDateText && (
                  <>
                    <span className="mx-1 text-slate-400">•</span>
                    <span>Hạn luân chuyển: <strong className="text-slate-900">{areaInfo.dueDateText}</strong></span>
                  </>
                )}
              </span>
              <span className={`font-bold ${
                areaInfo.isDue 
                  ? 'text-rose-700' 
                  : areaInfo.isNear 
                  ? 'text-amber-700' 
                  : 'text-emerald-800'
              }`}>
                {areaInfo.statusText}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Timeline Quá Trình Công Tác & Luân Chuyển Chi Tiết */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Quá Trình Công Tác & Lịch Sử Luân Chuyển ({empHistory.length})</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Toàn bộ các mốc bổ nhiệm, luân chuyển công tác và thay đổi địa bàn phụ trách
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={handleOpenAddPeriod}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Mốc Công Tác</span>
            </button>
          )}
        </div>

        {empHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <p>Chưa có bản ghi mốc quá trình công tác nào cho cán bộ này.</p>
            {canManage && (
              <button
                type="button"
                onClick={handleOpenAddPeriod}
                className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Bấm vào đây để tạo mốc công tác đầu tiên</span>
              </button>
            )}
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:top-3 before:bottom-3 before:left-[11px] before:w-0.5 before:bg-slate-200">
            {empHistory.map((item, idx) => {
              const isCurrentPeriod = Boolean(item.isCurrent || (!item.endDate && idx === 0));
              const currentPosition = item.position || item.toPosition || emp.position;
              const currentDepartment = item.department || item.toDepartment || emp.department;
              const currentArea = item.assignedArea || item.toAssignedArea;

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot Indicator */}
                  <div className="absolute -left-6 top-4 -translate-x-1/2 flex items-center justify-center">
                    {isCurrentPeriod ? (
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600 border-2 border-white shadow-xs" />
                      </span>
                    ) : (
                      <span className="h-3 w-3 rounded-full bg-slate-300 border-2 border-white ring-1 ring-slate-300" />
                    )}
                  </div>

                  {/* Card nội dung mốc công tác */}
                  <div className={`p-4 rounded-xl border transition-all text-xs space-y-3 ${
                    isCurrentPeriod 
                      ? 'bg-emerald-50/40 border-emerald-300/80 shadow-2xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}>
                    {/* Header Card: Khoảng thời gian & Badges */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Thời gian hiển thị chuẩn */}
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold tabular-nums ${
                          isCurrentPeriod 
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          <Calendar className="w-3.5 h-3.5 opacity-70" />
                          <span>
                            {formatDateVN(item.startDate || item.effectiveDate)} — {isCurrentPeriod ? 'Đến nay' : (item.endDate ? formatDateVN(item.endDate) : '—')}
                          </span>
                        </div>

                        {/* Badge loại điều động */}
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                          {item.transferTypeLabel || (
                            item.transferType === 'LUAN_CHUYEN_DINH_KY'
                              ? 'Luân chuyển định kỳ'
                              : item.transferType === 'BO_NHIEM'
                              ? 'Bổ nhiệm chức danh'
                              : item.transferType === 'THAY_DOI_DIA_BAN'
                              ? 'Thay đổi địa bàn tín dụng'
                              : item.transferType === 'CONG_TAC_BAN_DAU'
                              ? 'Tiếp nhận ban đầu'
                              : 'Điều động nội bộ'
                          )}
                        </span>

                        {isCurrentPeriod && (
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
                            <span>Đang đảm nhiệm</span>
                          </span>
                        )}
                      </div>

                      {/* Tác vụ Quản trị: Sửa / Xóa */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {item.decisionNumber && (
                          <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Số QĐ: {item.decisionNumber}
                          </span>
                        )}

                        {canManage && (
                          <div className="flex items-center gap-1 pl-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPeriod(item)}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Chỉnh sửa mốc công tác này"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, item.decisionNumber || currentPosition)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Xóa mốc công tác này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vị Trí & Địa Bàn */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      {/* Cột Vị trí & Phòng ban */}
                      <div className="p-3 rounded-lg bg-white border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Chức Danh & Phòng Ban
                        </span>
                        <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{currentPosition}</span>
                        </p>
                        <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{currentDepartment}</span>
                        </p>
                      </div>

                      {/* Cột Địa bàn quản lý */}
                      <div className={`p-3 rounded-lg border space-y-1 ${
                        currentArea 
                          ? 'bg-emerald-50/50 border-emerald-200/80' 
                          : 'bg-slate-50 border-slate-200/80'
                      }`}>
                        <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                          Địa Bàn Quản Lý & Phụ Trách
                        </span>
                        {currentArea ? (
                          <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>{currentArea}</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">
                            Chưa phân công địa bàn cụ thể
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Trường hợp có chi tiết chuyển dịch chức danh trước/sau */}
                    {item.fromPosition && item.fromPosition !== currentPosition && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-150 text-[11px] text-slate-600 flex flex-wrap items-center gap-1.5">
                        <span className="text-slate-400">Điều động từ:</span>
                        <span className="font-bold text-slate-700">{item.fromPosition}</span>
                        {item.fromDepartment && <span>({item.fromDepartment})</span>}
                        <ArrowRightLeft className="w-3 h-3 text-emerald-600 mx-1" />
                        <span className="font-bold text-emerald-900">{currentPosition}</span>
                      </div>
                    )}

                    {/* Người ký, Bàn giao & Ghi chú */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                      {item.signer && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Thẩm quyền ký:</span>
                          <span className="font-bold text-slate-800">{item.signer}</span>
                        </div>
                      )}

                      {item.handoverStatus && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Bàn giao:</span>
                          <span className={`font-bold px-2 py-0.5 rounded-md ${
                            item.handoverStatus === 'DA_BAN_GIAO'
                              ? 'text-emerald-800 bg-emerald-100'
                              : item.handoverStatus === 'DANG_BAN_GIAO'
                              ? 'text-amber-800 bg-amber-100'
                              : 'text-rose-800 bg-rose-100'
                          }`}>
                            {item.handoverStatus === 'DA_BAN_GIAO'
                              ? 'Đã bàn giao đầy đủ'
                              : item.handoverStatus === 'DANG_BAN_GIAO'
                              ? 'Đang bàn giao'
                              : 'Chưa bàn giao'}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.notes && (
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-150">
                        <strong className="text-slate-700 font-bold">Nhiệm vụ / Ghi chú:</strong> {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Thêm / Sửa Mốc Quá Trình Công Tác */}
      <WorkHistoryPeriodModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        emp={emp}
        initialData={editingPeriodData}
        departments={departments}
        positions={positions}
      />
    </div>
  );
};

export default React.memo(EmployeeTransferHistory);


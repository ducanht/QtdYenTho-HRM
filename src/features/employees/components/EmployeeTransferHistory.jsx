import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  FileText, 
  MapPin, 
  Building2,
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Trash2,
  Plus,
  Pencil,
  Calendar
} from 'lucide-react';
import { calculatePositionTenure, calculateAreaTenureAndDueDate, isCreditOfficerRole } from '../../../lib/evaluationUtils';
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
  canManage = false,
  departments = [],
  positions = [],
}) => {
  const toast = useToast();

  // State điều khiển WorkHistoryPeriodModal
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);

  const handleOpenAddPeriod = () => {
    setEditingPeriod(null);
    setIsPeriodModalOpen(true);
  };

  const handleOpenEditPeriod = (record) => {
    setEditingPeriod(record);
    setIsPeriodModalOpen(true);
  };

  const handleClosePeriodModal = () => {
    setIsPeriodModalOpen(false);
    setEditingPeriod(null);
  };

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

  // Theo dõi tiến độ quản lý địa bàn dành riêng cho Cán bộ Tín dụng (HĐQT, BKS, Giám đốc, Kế toán... KHÔNG áp dụng)
  const isCreditOfficer = isCreditOfficerRole(emp?.position, emp?.department);

  const areaInfo = isCreditOfficer 
    ? calculateAreaTenureAndDueDate(emp?.areaStartDate || effectiveStart, maxMonths, warningMonths) 
    : null;
  const areaPercent = areaInfo ? Math.min(100, Math.round((areaInfo.tenureMonths / maxMonths) * 100)) : 0;

  // Lọc lịch sử luân chuyển & mốc công tác của cán bộ đang chọn
  // Sắp xếp: Mốc có isCurrent: true lên đầu tiên, các mốc quá khứ sắp xếp theo thời gian bắt đầu giảm dần
  const empHistory = useMemo(() => {
    if (!emp) return [];
    const list = workHistory.filter(
      (rec) => rec.employeeId === emp.id || (rec.employeeCode && rec.employeeCode === emp.code)
    );
    return list.sort((a, b) => {
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

  // Xóa bản ghi lịch sử luân chuyển an toàn, không hiển thị Technical ID
  const handleDelete = async (recordId, decNo, posName) => {
    const label = decNo ? `số "${decNo}"` : (posName ? `vị trí "${posName}"` : 'công tác này');
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa mốc ${label} không?`)) {
      return;
    }
    try {
      await deleteWorkHistory(recordId);
      toast?.showSuccess?.('Đã xóa mốc quá trình công tác thành công');
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

      {/* 2. Timeline Quá Trình Công Tác & Luân Chuyển */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>Quá Trình Công Tác &amp; Luân Chuyển ({empHistory.length})</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Theo dõi trục thời gian các mốc vị trí, phòng ban và địa bàn quản lý tín dụng
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={handleOpenAddPeriod}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f766e] hover:bg-[#115e59] text-white transition-colors text-xs font-bold cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm mốc công tác</span>
            </button>
          )}
        </div>

        {empHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Chưa có mốc quá trình công tác nào được ghi nhận cho cán bộ này.
          </div>
        ) : (
          <div className="space-y-4">
            {empHistory.map((item) => {
              const isCurrent = Boolean(item.isCurrent);
              const posName = item.position || item.toPosition || emp.position;
              const deptName = item.department || item.toDepartment || emp.department;
              const areaName = item.assignedArea || item.toAssignedArea || '';
              const startDateText = formatDateVN(item.startDate || item.effectiveDate);
              const endDateText = isCurrent ? 'Đến nay (Hiện tại)' : formatDateVN(item.endDate || item.effectiveDate);
              const timeRangeText = `${startDateText} - ${endDateText}`;

              const typeMap = {
                LUAN_CHUYEN_DINH_KY: 'Luân chuyển định kỳ',
                BO_NHIEM: 'Bổ nhiệm chức vụ',
                THAY_DOI_DIA_BAN: 'Thay đổi địa bàn tín dụng',
                DIEU_DONG_NOI_BO: 'Điều động nội bộ',
                CONG_TAC_BAN_DAU: 'Tiếp nhận / Ban đầu',
              };
              const typeLabel = item.transferTypeLabel || typeMap[item.transferType] || 'Công tác';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all text-xs space-y-3 ${
                    isCurrent 
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${
                        isCurrent 
                          ? 'bg-[#0f766e] text-white shadow-2xs' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{timeRangeText}</span>
                      </span>

                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Đang đảm nhiệm</span>
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {typeLabel}
                      </span>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPeriod(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
                          title="Chỉnh sửa mốc công tác này"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Sửa mốc</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.decisionNumber, posName)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa mốc công tác này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Chức vụ & Phòng ban */}
                  <div className="pt-1">
                    <h4 className="text-sm font-extrabold text-emerald-950">
                      {posName}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {deptName}
                    </p>
                  </div>

                  {/* Nơi làm việc & Địa bàn quản lý tín dụng */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {item.workLocation && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span>Nơi làm việc: {item.workLocation}</span>
                      </div>
                    )}
                    {isCreditOfficerRole(posName, deptName) && areaName && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/70 border border-emerald-300 text-emerald-950 text-[11px] font-bold">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Địa bàn tín dụng: {areaName}</span>
                      </div>
                    )}
                  </div>

                  {/* Chi tiết thay đổi chức danh & địa bàn nếu là quyết định điều chuyển */}
                  {item.fromPosition && item.fromPosition !== posName && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
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
                          {item.toPosition || posName}
                        </p>
                        <p className="text-[11px] text-emerald-800">
                          {item.toDepartment || deptName}
                        </p>
                        {item.toAssignedArea && (
                          <p className="text-[11px] text-emerald-800 flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>{item.toAssignedArea}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Thông tin số QĐ, ngày ký và người ký */}
                  {(item.decisionNumber || item.decisionDate || item.signer) && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                      <div className="flex flex-wrap items-center gap-3">
                        {item.decisionNumber && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>Số QĐ: <strong className="text-slate-800 font-bold">{item.decisionNumber}</strong></span>
                          </div>
                        )}
                        {item.decisionDate && (
                          <div className="flex items-center gap-1">
                            <span>Ngày ký: <strong className="text-slate-800 font-medium tabular-nums">{formatDateVN(item.decisionDate)}</strong></span>
                          </div>
                        )}
                      </div>

                      {item.signer && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Người ký:</span>
                          <span className="font-bold text-slate-800">{item.signer}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bàn giao nếu có */}
                  {item.handoverStatus && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-400">Bàn giao hồ sơ nợ &amp; sổ sách:</span>
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
                  )}

                  {/* Ghi chú hoặc Căn cứ điều động */}
                  {(item.notes || item.reason) && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-700">Ghi chú / Căn cứ:</span> {item.notes || item.reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Thêm Mới & Chỉnh Sửa Mốc Quá Trình Công Tác */}
      <WorkHistoryPeriodModal
        isOpen={isPeriodModalOpen}
        onClose={handleClosePeriodModal}
        selectedEmp={emp}
        editingRecord={editingPeriod}
        departments={departments}
        positions={positions}
        hrConfig={hrConfig}
        onSuccess={() => {
          // Callback khi lưu thành công mốc công tác
        }}
      />
    </div>
  );
};

export default React.memo(EmployeeTransferHistory);

import React, { useMemo } from 'react';
import { 
  Briefcase, 
  MapPin, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  FileText, 
  Pencil, 
  Trash2, 
  Plus,
  ChevronRight,
  Award
} from 'lucide-react';
import { formatDateVN } from '../../../lib/dateUtils';
import { calculatePositionTenure, calculateAreaTenureAndDueDate, isCreditOfficerRole } from '../../../lib/evaluationUtils';
import Tooltip from '../../../components/common/Tooltip';
import Button from '../../../components/common/Button';

// Từ điển định danh loại hình công tác chuẩn cơ quan
const TRANSFER_TYPE_LABELS = {
  LUAN_CHUYEN_DINH_KY: 'Luân chuyển định kỳ',
  BO_NHIEM: 'Bổ nhiệm chức vụ',
  THAY_DOI_DIA_BAN: 'Thay đổi địa bàn tín dụng',
  DIEU_DONG_NOI_BO: 'Điều động nội bộ',
  CONG_TAC_BAN_DAU: 'Tiếp nhận / Ban đầu',
};

/**
 * Helper: Tính toán thời lượng thâm niên giữa 2 mốc thời gian dạng "X năm Y tháng"
 */
const getPeriodDuration = (startDate, endDate) => {
  if (!startDate) return '';
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() >= start.getDate()) {
    // cùng tháng
  } else {
    months = Math.max(0, months - 1);
  }

  if (months <= 0) return 'Dưới 1 tháng';
  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  if (years > 0 && remMonths > 0) return `${years} năm ${remMonths} tháng`;
  if (years > 0) return `${years} năm`;
  return `${remMonths} tháng`;
};

/**
 * CareerWorkHistoryTimeline: Thành phần Quá Trình Công Tác & Chức Vụ Tinh Gọn, Thoáng Mắt
 * Thiết kế phẳng (Flat Design), loại bỏ các khung hộp lồng nhau gây rối mắt.
 * Thể hiện rõ nét dòng thời gian, thâm niên từng mốc, địa bàn CBTD và căn cứ quyết định.
 */
const CareerWorkHistoryTimeline = ({
  emp,
  workHistory = [],
  hrConfig = null,
  canManage = false,
  onOpenAddPeriod,
  onOpenEditPeriod,
  onDeletePeriod,
}) => {
  // Lọc và sắp xếp các mốc quá trình công tác của cán bộ
  const sortedHistory = useMemo(() => {
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
  }, [workHistory, emp]);

  if (!emp) return null;

  // Nhận diện CBTD & Chu kỳ luân chuyển địa bàn theo quy định NHNN
  const isCreditOfficer = isCreditOfficerRole(emp.position, emp.department);
  const maxMonths = Number(hrConfig?.creditRotationMonths || hrConfig?.transferMaxMonths || hrConfig?.transferCycleMonths || 36);
  const warningMonths = Number(hrConfig?.creditWarningMonths || hrConfig?.transferWarningMonths || hrConfig?.warningMonths || 6);

  const effectiveStart = emp.positionStartDate || emp.joinDate;
  const tenureText = calculatePositionTenure(effectiveStart);

  const areaInfo = isCreditOfficer
    ? calculateAreaTenureAndDueDate(emp.areaStartDate || effectiveStart, maxMonths, warningMonths)
    : null;
  const areaPercent = areaInfo ? Math.min(100, Math.round((areaInfo.tenureMonths / maxMonths) * 100)) : 0;
  const isDue = areaInfo?.isOverdue;
  const isNear = areaInfo?.isNearDue;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
      {/* 1. Header Khối: Tiêu Đề & Nút Thao Tác */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-800" />
            <span>Quá Trình Công Tác &amp; Luân Chuyển Vị Trí</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp lộ trình đảm nhiệm chức vụ, thâm niên và các quyết định luân chuyển
          </p>
        </div>

        {canManage && (
          <Button
            type="button"
            variant="primary"
            onClick={onOpenAddPeriod}
            icon={Plus}
            className="text-xs shrink-0"
          >
            Thêm mốc công tác
          </Button>
        )}
      </div>

      {/* 2. Thẻ Tóm Tắt Nhanh Hành Trình Sự Nghiệp (3 Cột Tinh Gọn) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cột 1: Vị trí hiện tại */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Chức danh hiện tại
          </div>
          <div className="text-xs font-black text-slate-900 truncate">
            {emp.position || 'Cán bộ'}
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Đảm nhiệm: {tenureText}</span>
          </div>
        </div>

        {/* Cột 2: Nơi làm việc & Đơn vị */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Phòng ban &amp; Nơi làm việc
          </div>
          <div className="text-xs font-black text-slate-900 truncate">
            {emp.department || 'Quỹ TDND Yên Thọ'}
          </div>
          <div className="text-[11px] text-slate-600 truncate flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{emp.workLocation || 'Trụ sở chính'}</span>
          </div>
        </div>

        {/* Cột 3: Tổng thâm niên tại Quỹ */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Thâm niên cống hiến
          </div>
          <div className="text-xs font-black text-emerald-900 truncate">
            {calculatePositionTenure(emp.joinDate) || tenureText}
          </div>
          <div className="text-[11px] text-slate-500">
            Gia nhập: {formatDateVN(emp.joinDate || emp.positionStartDate)} • {sortedHistory.length} mốc ghi nhận
          </div>
        </div>
      </div>

      {/* 3. Tiến Độ Luân Chuyển Địa Bàn (Chuyên Biệt Dành Cho CBTD Theo Quy Định NHNN) */}
      {isCreditOfficer && (
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Địa bàn tín dụng phụ trách: <strong className="text-emerald-950">{emp.assignedArea || 'Chưa phân công'}</strong>
              </span>
            </span>
            <span className="font-bold text-slate-700 tabular-nums text-xs">
              Đã phụ trách: {areaInfo ? areaInfo.tenureText : tenureText} / {maxMonths} tháng
            </span>
          </div>

          <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isDue ? 'bg-rose-600' : isNear ? 'bg-amber-500' : 'bg-emerald-700'
              }`}
              style={{ width: `${areaPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-600">
              Ngày nhận địa bàn: <strong>{formatDateVN(emp.areaStartDate || effectiveStart)}</strong>
            </span>

            {isDue ? (
              <span className="font-bold text-rose-700 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-rose-300 shadow-2xs">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Đến hạn luân chuyển địa bàn (Theo quy định NHNN)
              </span>
            ) : isNear ? (
              <span className="font-bold text-amber-700 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Sắp đến hạn luân chuyển (&lt; {warningMonths} tháng)
              </span>
            ) : (
              <span className="font-semibold text-emerald-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Trong thời hạn an toàn
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4. Dòng Thời Gian Lịch Sử Công Tác (Timeline Tinh Gọn, Thoáng Mắt) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
            Trục Thời Gian Quá Trình Công Tác ({sortedHistory.length} mốc)
          </span>
          <span className="text-[11px] text-slate-400">
            Sắp xếp từ mốc mới nhất đến khởi điểm
          </span>
        </div>

        {sortedHistory.length === 0 ? (
          <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            Chưa có dữ liệu lịch sử công tác. Bấm nút <strong>&ldquo;+ Thêm mốc công tác&rdquo;</strong> ở trên để ghi nhận mốc đầu tiên.
          </div>
        ) : (
          <div className="relative pl-7 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {sortedHistory.map((item, index) => {
              const startDateText = formatDateVN(item.startDate || item.effectiveDate);
              const endDateText = item.isCurrent ? 'Đến nay' : formatDateVN(item.endDate);
              const durationText = getPeriodDuration(item.startDate || item.effectiveDate, item.isCurrent ? null : item.endDate);
              const typeLabel = TRANSFER_TYPE_LABELS[item.transferType] || item.transferType;

              return (
                <div key={item.id || index} className="relative group">
                  {/* Điểm mốc (Node) trên trục thời gian */}
                  <div
                    className={`absolute -left-7 sm:-left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      item.isCurrent
                        ? 'bg-emerald-800 text-white shadow-xs ring-4 ring-emerald-100'
                        : 'bg-white border-2 border-slate-300 text-slate-400 group-hover:border-emerald-600 group-hover:text-emerald-700'
                    }`}
                  >
                    {item.isCurrent ? (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-emerald-600" />
                    )}
                  </div>

                  {/* Khối Nội Dung Mốc Công Tác - Thiết Kế Thoáng Mắt */}
                  <div
                    className={`p-4 rounded-2xl transition-all ${
                      item.isCurrent
                        ? 'bg-emerald-50/30 border border-emerald-200/90 shadow-2xs'
                        : 'bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* Hàng 1: Thời gian & Các Huy Hiệu Trạng Thái */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 tabular-nums">
                          {startDateText} — {endDateText}
                        </span>

                        {durationText && (
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {durationText}
                          </span>
                        )}

                        {item.isCurrent && (
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            Đang đảm nhiệm
                          </span>
                        )}

                        {typeLabel && (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                            {typeLabel}
                          </span>
                        )}
                      </div>

                      {/* Các nút thao tác Sửa / Xóa */}
                      {canManage && (
                        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                          <Tooltip content="Chỉnh sửa thông tin mốc công tác này" position="top">
                            <button
                              type="button"
                              onClick={() => onOpenEditPeriod(item)}
                              className="p-1.5 text-slate-400 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Sửa mốc"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>

                          <Tooltip content="Xóa mốc công tác này khỏi lịch sử" position="top">
                            <button
                              type="button"
                              onClick={() => onDeletePeriod(item.id, item.decisionNumber, item.position)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa mốc"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        </div>
                      )}
                    </div>

                    {/* Hàng 2: Chức Danh & Bộ Phận Công Tác */}
                    <div className="pt-2.5 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-slate-900 tracking-tight">
                          {item.position || emp.position}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-bold text-slate-700">
                          {item.department || emp.department}
                        </span>
                      </div>

                      {/* Nơi làm việc & Địa bàn tín dụng */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        {item.workLocation && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Nơi làm việc: <strong className="text-slate-800">{item.workLocation}</strong></span>
                          </div>
                        )}

                        {item.assignedArea && (
                          <div className="flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>Địa bàn phụ trách: <strong>{item.assignedArea}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Hàng 3: Quyết Định & Căn Cứ Điều Động */}
                      {(item.decisionNumber || item.signer) && (
                        <div className="pt-1.5 text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {item.decisionNumber && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span>QĐ số: <strong className="text-slate-700">{item.decisionNumber}</strong></span>
                              {item.decisionDate && ` (Ký ngày ${formatDateVN(item.decisionDate)})`}
                            </span>
                          )}

                          {item.signer && (
                            <span>
                              Người ký: <strong className="text-slate-700">{item.signer}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Ghi chú mốc công tác */}
                      {item.notes && (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic">
                          Căn cứ / Ghi chú: {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(CareerWorkHistoryTimeline);

import React, { useMemo, useState } from 'react';
import { Search, UserPlus, ShieldAlert, Clock, Building2, FileSpreadsheet } from 'lucide-react';
import { calculatePositionTenure, isCreditOfficerRole } from '../../../lib/evaluationUtils';
import { exportEmployeesDirectoryToExcel } from '../../../lib/exportUtils';
import { useToast } from '../../../context/ToastContext';

/**
 * EmployeeMasterSidebar: Cột Trái (Master Sidebar) của phân hệ Quản trị Nhân sự
 * Tuân thủ: Ẩn toàn bộ mã CB, UUID, font-mono. Chỉ hiển thị họ tên, chức danh và phòng ban.
 */
const EmployeeMasterSidebar = ({
  employees = [],
  selectedEmployeeId,
  onSelectEmployee,
  searchTerm,
  setSearchTerm,
  hrConfig = null,
  onOpenAddModal,
  canManage = false,
}) => {
  const toast = useToast();
  const [exportingExcel, setExportingExcel] = useState(false);

  // Tra cứu quy tắc luân chuyển: CHỈ áp dụng cho Cán bộ Tín dụng (CBTD)
  const getTransferRule = (pos = '', dept = '') => {
    const isCBTD = isCreditOfficerRole(pos, dept);
    if (!isCBTD) return { requiresTransfer: false, maxMonths: 36, warningMonths: 6 };

    const maxMonths = Number(hrConfig?.creditRotationMonths || hrConfig?.transferMaxMonths || hrConfig?.transferCycleMonths || 36);
    const warningMonths = Number(hrConfig?.creditWarningMonths || hrConfig?.transferWarningMonths || hrConfig?.warningMonths || 6);

    return {
      positionName: pos,
      requiresTransfer: true,
      maxMonths,
      warningMonths,
    };
  };

  // Tính số tháng công tác tại vị trí hiện tại
  const getTenureMonths = (startDate) => {
    if (!startDate) return 0;
    try {
      const start = new Date(startDate);
      const now = new Date();
      if (isNaN(start.getTime())) return 0;
      return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    } catch {
      return 0;
    }
  };

  // Lọc danh sách theo từ khóa tìm kiếm (họ tên, chức danh, phòng ban, số điện thoại, địa bàn)
  const filteredList = useMemo(() => {
    const s = (searchTerm || '').toLowerCase().trim();
    if (!s) return employees;
    return employees.filter((emp) => {
      return (
        emp.name?.toLowerCase().includes(s) ||
        emp.position?.toLowerCase().includes(s) ||
        emp.department?.toLowerCase().includes(s) ||
        emp.phone?.includes(s) ||
        emp.assignedArea?.toLowerCase().includes(s)
      );
    });
  }, [employees, searchTerm]);

  // Xuất danh bạ toàn Quỹ sang Excel
  const handleExportDirectory = async () => {
    try {
      setExportingExcel(true);
      await exportEmployeesDirectoryToExcel(employees);
      toast?.showSuccess?.('Đã xuất danh bạ toàn Quỹ sang file Excel (.xlsx) thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xuất danh bạ');
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Header Sidebar: Tiêu đề & Nút Thêm Cán Bộ / Xuất Excel */}
      <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Danh Bạ Cán Bộ</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold tabular-nums">
                {employees.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Quỹ TDND Yên Thọ</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExportDirectory}
              disabled={exportingExcel || employees.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Xuất toàn bộ danh bạ cán bộ sang Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>{exportingExcel ? '...' : 'Xuất Excel'}</span>
            </button>

            {canManage && (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                title="Thêm cán bộ mới"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Thêm mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Ô tìm kiếm nhanh */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, chức vụ, phòng ban..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Danh sách Cán bộ */}
      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[380px] p-2 space-y-1">
        {filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Không tìm thấy cán bộ phù hợp
          </div>
        ) : (
          filteredList.map((emp) => {
            const isSelected = selectedEmployeeId === emp.id;
            const isCBTD = isCreditOfficerRole(emp.position, emp.department);
            const effectiveStart = isCBTD
              ? (emp.areaStartDate || emp.positionStartDate || emp.joinDate)
              : (emp.positionStartDate || emp.joinDate);
            const tenureText = calculatePositionTenure(effectiveStart);

            let tenureMonths = 0;
            if (effectiveStart) {
              try {
                const start = new Date(effectiveStart);
                const now = new Date();
                if (!isNaN(start.getTime())) {
                  tenureMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
                }
              } catch {
                tenureMonths = 0;
              }
            }

            const rule = getTransferRule(emp.position, emp.department);
            const requiresTransfer = Boolean(rule?.requiresTransfer);
            const maxM = Number(rule?.maxMonths) || 36;
            const warnM = Number(rule?.warningMonths) || 6;
            const isDueTransfer = requiresTransfer && tenureMonths >= maxM;
            const isNearTransfer = requiresTransfer && tenureMonths >= (maxM - warnM) && tenureMonths < maxM;

            return (
              <div
                key={emp.id}
                onClick={() => onSelectEmployee(emp.id)}
                className={`p-3 rounded-xl transition-all cursor-pointer text-left select-none ${
                  isSelected
                    ? 'bg-emerald-50/80 border-2 border-emerald-700 shadow-2xs'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar thu nhỏ */}
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {emp.avatar ? (
                      <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                    ) : (
                      emp.name.charAt(0)
                    )}
                  </div>

                  {/* Thông tin cốt lõi */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-950 font-black' : 'text-slate-900'}`}>
                        {emp.name}
                      </h3>

                      {isDueTransfer && (
                        <span className="text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          Hạn luân chuyển
                        </span>
                      )}
                      {!isDueTransfer && isNearTransfer && (
                        <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Sắp đến hạn
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {emp.position || 'Cán bộ nghiệp vụ'}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <span className="truncate flex items-center gap-1">
                        <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
                        {emp.department}
                      </span>
                      <span>•</span>
                      <span className="shrink-0 text-slate-600 font-medium">{tenureText}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(EmployeeMasterSidebar);

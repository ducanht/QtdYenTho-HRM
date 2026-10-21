import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  FileSpreadsheet, 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  ShieldAlert, 
  User, 
  ArrowRight,
  Award
} from 'lucide-react';
import { 
  calculatePositionTenure, 
  isCreditOfficerRole 
} from '../../../lib/evaluationUtils';
import { exportEmployeesDirectoryToExcel } from '../../../lib/exportUtils';
import { useToast } from '../../../context/ToastContext';

/**
 * EmployeeDirectoryTab: Màn hình Danh Bạ Cán Bộ Nhân Viên (Tab Cấp Quản Trị)
 * Cung cấp danh bạ toàn diện, tìm kiếm nhanh, lọc theo phòng ban trực quan,
 * xem dạng lưới thẻ card thoáng đãng, thân thiện trên cả Mobile và Desktop.
 */
const EmployeeDirectoryTab = ({
  employees = [],
  departments = [],
  selectedEmployeeId,
  onSelectEmployee,
  onOpenAddModal,
  canManage = false,
  hrConfig = null,
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [exportingExcel, setExportingExcel] = useState(false);

  // Tra cứu quy tắc luân chuyển cho CBTD
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

  // Danh sách phòng ban duy nhất để tạo bộ lọc pills
  const departmentOptions = useMemo(() => {
    const set = new Set();
    departments.forEach((d) => set.add(typeof d === 'string' ? d : d.name));
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).filter(Boolean);
  }, [departments, employees]);

  // Đếm số lượng cán bộ theo từng phòng ban
  const deptCountMap = useMemo(() => {
    const map = { ALL: employees.length };
    employees.forEach((e) => {
      const dept = e.department || 'Khác';
      map[dept] = (map[dept] || 0) + 1;
    });
    return map;
  }, [employees]);

  // Lọc cán bộ theo từ khóa và phòng ban
  const filteredEmployees = useMemo(() => {
    let list = employees;
    if (selectedDept !== 'ALL') {
      list = list.filter((e) => e.department === selectedDept);
    }
    const s = searchTerm.toLowerCase().trim();
    if (!s) return list;
    return list.filter((emp) => {
      return (
        emp.name?.toLowerCase().includes(s) ||
        emp.position?.toLowerCase().includes(s) ||
        emp.department?.toLowerCase().includes(s) ||
        emp.phone?.includes(s) ||
        emp.assignedArea?.toLowerCase().includes(s)
      );
    });
  }, [employees, selectedDept, searchTerm]);

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
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Danh bạ & Công cụ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Danh Bạ Cán Bộ Nhân Viên</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold tabular-nums">
                {employees.length} cán bộ
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quỹ tín dụng nhân dân Yên Thọ • Tra cứu hồ sơ và thông tin liên hệ cán bộ
            </p>
          </div>

          {/* Thanh nút công cụ */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportDirectory}
              disabled={exportingExcel || employees.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 min-h-[40px]"
              title="Xuất toàn bộ danh bạ cán bộ sang Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>{exportingExcel ? 'Đang tạo...' : 'Xuất Excel'}</span>
            </button>

            {canManage && (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 min-h-[40px]"
                title="Thêm cán bộ mới vào danh bạ"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm cán bộ</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Ô tìm kiếm nhanh */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, chức danh, phòng ban, số điện thoại, địa bàn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* 3. Bộ lọc theo Phòng Ban (Pills 1 chạm, chống cuộn ngang) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedDept('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
              selectedDept === 'ALL'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Tất cả ({deptCountMap.ALL || 0})
          </button>
          {departmentOptions.map((dept) => {
            const count = deptCountMap[dept] || 0;
            const isSelected = selectedDept === dept;
            return (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {dept} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Lưới Danh Sách Cán Bộ (Responsive Cards) */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          Không tìm thấy cán bộ phù hợp với điều kiện tìm kiếm.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredEmployees.map((emp) => {
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
                className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between cursor-pointer select-none group active:scale-[0.99] ${
                  isSelected
                    ? 'border-emerald-700 shadow-md ring-1 ring-emerald-700/20 bg-emerald-50/20'
                    : 'border-slate-200/90 hover:border-emerald-500/60 hover:shadow-xs'
                }`}
              >
                {/* Phần trên thẻ: Avatar, Họ tên, Chức vụ, Phòng ban */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center overflow-hidden shrink-0 shadow-2xs group-hover:border-emerald-300 transition-colors">
                      {emp.avatar ? (
                        <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                      ) : (
                        emp.name?.charAt(0) || <User className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h2 className="text-sm font-bold text-slate-900 group-hover:text-emerald-900 transition-colors truncate">
                          {emp.name}
                        </h2>
                      </div>
                      <p className="text-xs font-semibold text-emerald-800 truncate mt-0.5">
                        {emp.position || 'Cán bộ'}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{emp.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Huy hiệu trạng thái: Luân chuyển, Đảng viên */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {isDueTransfer && (
                      <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                        Hạn luân chuyển
                      </span>
                    )}
                    {!isDueTransfer && isNearTransfer && (
                      <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Sắp đến hạn
                      </span>
                    )}
                    {emp.partyMember && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Award className="w-3 h-3 text-red-600" />
                        Đảng viên
                      </span>
                    )}
                  </div>

                  {/* Thông tin thâm niên & địa bàn */}
                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 space-y-1 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Thâm niên vị trí:</span>
                      <strong className="text-slate-800 font-semibold">{tenureText}</strong>
                    </div>
                    {isCBTD && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Địa bàn:</span>
                        </span>
                        <strong className="text-emerald-950 font-bold truncate max-w-[150px]">
                          {emp.assignedArea || 'Chưa phân công'}
                        </strong>
                      </div>
                    )}
                    {emp.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>SĐT:</span>
                        </span>
                        <span className="font-semibold text-slate-800 tabular-nums">
                          {emp.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phần chân thẻ: Nút xem hồ sơ */}
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <div className="w-full py-2 px-3 bg-slate-50 group-hover:bg-emerald-800 text-slate-700 group-hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs">
                    <span>Xem hồ sơ chi tiết</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(EmployeeDirectoryTab);

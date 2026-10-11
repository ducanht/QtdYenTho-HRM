import React, { useMemo } from 'react';
import { Search, UserPlus, ShieldAlert, Clock, Building2 } from 'lucide-react';
import { calculatePositionTenure } from '../../../lib/evaluationUtils';

/**
 * EmployeeMasterSidebar: Cột Trái (Master Sidebar) của phân hệ Quản trị Nhân sự
 * Kế thừa chuẩn mực thiết kế Master-Detail iPad từ PeriodMasterSidebar của Phân hệ Tín nhiệm
 */
const EmployeeMasterSidebar = ({
  employees = [],
  selectedEmployeeId,
  onSelectEmployee,
  searchTerm,
  setSearchTerm,
  selectedDept,
  setSelectedDept,
  departments = [],
  onOpenAddModal,
  canManage = false,
}) => {
  // Nhận diện vị trí nhạy cảm cần luân chuyển định kỳ theo quy định NHNN
  const isSensitivePosition = (pos = '') => {
    const p = pos.toLowerCase();
    return (
      p.includes('tín dụng') ||
      p.includes('kế toán') ||
      p.includes('thủ quỹ') ||
      p.includes('kiểm soát')
    );
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

  // Lọc danh sách theo phòng ban và từ khóa tìm kiếm
  const filteredList = useMemo(() => {
    return employees.filter((emp) => {
      const matchDept = selectedDept === 'ALL' || emp.department === selectedDept;
      const s = (searchTerm || '').toLowerCase().trim();
      const matchSearch =
        !s ||
        emp.name?.toLowerCase().includes(s) ||
        emp.code?.toLowerCase().includes(s) ||
        emp.position?.toLowerCase().includes(s) ||
        emp.phone?.includes(s);
      return matchDept && matchSearch;
    });
  }, [employees, selectedDept, searchTerm]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Header Sidebar: Tiêu đề & Nút Thêm Cán Bộ */}
      <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Danh Bạ Cán Bộ</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                {employees.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Quỹ TDND Yên Thọ</p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="Thêm cán bộ mới vào cơ sở dữ liệu"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Thêm mới</span>
            </button>
          )}
        </div>

        {/* Ô tìm kiếm nhanh */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã CB, chức vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Bộ lọc nhanh Phòng ban dạng Chips cuộn ngang mượt mà */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setSelectedDept('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              selectedDept === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tất cả ({employees.length})
          </button>
          {departments.map((dept) => {
            const count = employees.filter((e) => e.department === dept).length;
            const isSelected = selectedDept === dept;
            return (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-800 text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {dept} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Danh sách Cán bộ dạng cuộn (Scrollable Master List) */}
      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[380px] p-2 space-y-1">
        {filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Không tìm thấy cán bộ phù hợp
          </div>
        ) : (
          filteredList.map((emp) => {
            const isSelected = selectedEmployeeId === emp.id;
            const effectiveStart = emp.positionStartDate || emp.joinDate;
            const tenureText = calculatePositionTenure(effectiveStart);
            const tenureMonths = getTenureMonths(effectiveStart);
            const isSensitive = isSensitivePosition(emp.position);
            const isDueTransfer = isSensitive && tenureMonths >= 36;
            const isNearTransfer = isSensitive && tenureMonths >= 30 && tenureMonths < 36;

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
                      <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
                        {emp.code || 'CB'}
                      </span>
                      {isDueTransfer && (
                        <span className="text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          Hạn luân chuyển
                        </span>
                      )}
                      {!isDueTransfer && isNearTransfer && (
                        <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Sắp đến hạn
                        </span>
                      )}
                    </div>

                    <h3 className={`text-xs font-bold truncate mt-1 ${isSelected ? 'text-emerald-950 font-black' : 'text-slate-900'}`}>
                      {emp.name}
                    </h3>

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

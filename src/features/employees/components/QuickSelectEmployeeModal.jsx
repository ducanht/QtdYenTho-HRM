import React, { useState, useMemo } from 'react';
import { Search, X, Check, Building2, User } from 'lucide-react';
import Modal from '../../../components/common/Modal';

/**
 * QuickSelectEmployeeModal: Modal đổi nhanh cán bộ trên Di động và Máy tính bảng
 * Giúp người dùng chuyển đổi ngay lập tức sang cán bộ khác mà không phải cuộn trang
 */
const QuickSelectEmployeeModal = ({
  isOpen,
  onClose,
  employees = [],
  selectedEmployeeId,
  onSelectEmployee,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chọn Cán Bộ Nhân Viên"
      size="md"
    >
      <div className="space-y-3.5">
        {/* Ô tìm kiếm nhanh */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, chức vụ, phòng ban, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all text-slate-800 placeholder-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Danh sách cán bộ */}
        <div className="divide-y divide-slate-100 max-h-[55vh] overflow-y-auto space-y-1 pr-1">
          {filteredEmployees.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Không tìm thấy cán bộ phù hợp với từ khóa
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              const isSelected = emp.id === selectedEmployeeId;
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => {
                    onSelectEmployee(emp.id);
                    onClose();
                  }}
                  className={`w-full p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 text-left cursor-pointer active:scale-98 ${
                    isSelected
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                      : 'hover:bg-slate-50 border border-transparent text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {emp.avatar ? (
                        <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                      ) : (
                        emp.name?.charAt(0) || <User className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {emp.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{emp.position || 'Cán bộ'} • {emp.department}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Chân modal */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Tổng số: <strong className="text-slate-800 tabular-nums">{filteredEmployees.length}</strong> cán bộ</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(QuickSelectEmployeeModal);

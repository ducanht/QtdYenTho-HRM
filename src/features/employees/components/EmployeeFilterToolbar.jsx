import React from 'react';
import { Search, Building2 } from 'lucide-react';
import Card from '../../../components/common/Card';

const EmployeeFilterToolbar = ({
  searchTerm = '',
  setSearchTerm,
  selectedDept = 'ALL',
  setSelectedDept,
  departments = [],
  totalEmployees = 0,
}) => {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, mã CB hoặc chức vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Phòng ban:
            </span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 cursor-pointer"
            >
              <option value="ALL">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs bg-teal-50 px-3 py-2 rounded-xl border border-teal-200 flex items-center gap-1.5 font-bold text-[#0f766e]">
            <Building2 className="w-4 h-4" />
            <span>{totalEmployees} cán bộ</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(EmployeeFilterToolbar);

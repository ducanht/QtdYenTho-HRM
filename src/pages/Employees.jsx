import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Building2, 
  ShieldCheck, 
  UserCheck,
  Briefcase
} from 'lucide-react';
import { INITIAL_EMPLOYEES, DEPARTMENTS, ROLE_LABELS } from '../lib/mockData';
import { subscribeEmployees } from '../lib/services';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

const Employees = () => {
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  useEffect(() => {
    const unsub = subscribeEmployees((list) => {
      if (list && list.length > 0) setEmployees(list);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const matchDept = selectedDept === 'ALL' || emp.department === selectedDept;
      const matchSearch =
        !searchTerm.trim() ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [employees, selectedDept, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0f766e] uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Hệ Thống Nhân Sự</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Danh Bạ Cán Bộ QTDND Yên Thọ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Danh sách nhân sự trực thuộc các phòng ban và chức danh chuyên môn
          </p>
        </div>

        <div className="text-xs bg-white px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2 self-start md:self-auto">
          <Building2 className="w-4 h-4 text-[#0f766e]" />
          <span className="text-slate-500">Quy mô nhân sự:</span>
          <span className="font-bold text-[#0f766e]">{employees.length} cán bộ</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, mã CB hoặc chức vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Phòng ban:
            </span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none"
            >
              <option value="ALL">Tất cả phòng ban</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Grid of Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((emp) => (
          <div
            key={emp.id}
            className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-300 hover:shadow-md p-5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#0f766e] font-bold text-base flex items-center justify-center overflow-hidden shrink-0">
                  {emp.avatar ? (
                    <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                  ) : (
                    emp.name.charAt(0)
                  )}
                </div>

                <Badge
                  variant={
                    emp.role === 'chairman'
                      ? 'danger'
                      : emp.role === 'manager'
                      ? 'primary'
                      : 'default'
                  }
                  size="sm"
                >
                  {ROLE_LABELS[emp.role] || emp.role}
                </Badge>
              </div>

              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
                <div className="text-[11px] font-bold text-[#0f766e] uppercase tracking-wider">
                  {emp.code} • {emp.position}
                </div>
                <div className="text-xs text-slate-500">{emp.department}</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{emp.email}</span>
              </div>
              {emp.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{emp.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Employees;

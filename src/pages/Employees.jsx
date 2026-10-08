import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Building2, 
  ShieldCheck, 
  UserCheck,
  Briefcase,
  History,
  FileText,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  MapPin,
  Award
} from 'lucide-react';
import { DEPARTMENTS as FALLBACK_DEPARTMENTS, ROLE_LABELS } from '../lib/constants';
import { subscribeEmployees, subscribeWorkHistory, subscribeDepartments } from '../lib/services';
import { formatDateVN } from '../lib/dateUtils';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Quản lý Modal xem Lịch sử luân chuyển công tác
  const [selectedEmpHistory, setSelectedEmpHistory] = useState(null);
  const [empWorkHistory, setEmpWorkHistory] = useState([]);

  useEffect(() => {
    const unsubEmp = subscribeEmployees((list) => {
      setEmployees(list || []);
      setLoading(false);
    });
    const unsubDept = subscribeDepartments((list) => {
      if (list && list.length > 0) {
        setDepartments(list.map((d) => d.name));
      } else {
        setDepartments(FALLBACK_DEPARTMENTS);
      }
    });
    return () => {
      unsubEmp();
      unsubDept();
    };
  }, []);

  // Lắng nghe lịch sử luân chuyển khi mở modal cho 1 cán bộ
  useEffect(() => {
    if (!selectedEmpHistory) return;
    const unsub = subscribeWorkHistory(selectedEmpHistory.id, (list) => {
      setEmpWorkHistory(list || []);
    });
    return () => unsub();
  }, [selectedEmpHistory]);

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
      {/* Filter toolbar & Action Bar (Gọn gàng, không lặp tiêu đề phân hệ) */}
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
              <span>{employees.length} cán bộ</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Loading & Grid of Employee Cards */}
      {loading && employees.length === 0 ? (
        <div className="py-20 flex justify-center items-center">
          <Spinner text="Đang đồng bộ hồ sơ cán bộ từ cơ sở dữ liệu..." />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-slate-500 text-sm">Không tìm thấy cán bộ nào phù hợp với điều kiện tìm kiếm.</p>
        </Card>
      ) : (
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

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
                  {emp.gender && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                      {emp.gender}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-bold text-[#0f766e] uppercase tracking-wider">
                  {emp.code} • {emp.position}
                </div>
                <div className="text-xs text-slate-500">{emp.department}</div>
                {emp.cccd && (
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                    <span className="text-slate-400">CCCD:</span>
                    <span className="font-semibold text-slate-700">{emp.cccd}</span>
                  </div>
                )}
                {emp.partyDate && (
                  <div className="text-[10px] text-amber-900 bg-amber-50/90 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-medium mt-1">
                    <Award className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Đảng viên (Vào: {formatDateVN(emp.partyDate)}{emp.partyOfficialDate ? ` • CT: ${formatDateVN(emp.partyOfficialDate)}` : ''})</span>
                  </div>
                )}
                {emp.assignedArea && (
                  <div className="text-[11px] text-slate-600 flex items-center gap-1 pt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.assignedArea}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
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

              {/* Nút Xem Quá trình Luân chuyển công tác */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEmpHistory(emp)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 text-[#0f766e] font-semibold text-xs transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-[#0f766e]" />
                  <span>Lịch sử luân chuyển công tác</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

      {/* Modal Xem Quá trình Luân chuyển công tác (work_history) */}
      <Modal
        isOpen={Boolean(selectedEmpHistory)}
        onClose={() => setSelectedEmpHistory(null)}
        title="Lịch Sử Luân Chuyển & Điều Động Công Tác"
        subtitle={`Cán bộ: ${selectedEmpHistory?.name} (${selectedEmpHistory?.code}) • ${selectedEmpHistory?.position}`}
        maxWidth="max-w-2xl"
        footer={
          <Button variant="outline" onClick={() => setSelectedEmpHistory(null)}>
            Đóng cửa sổ
          </Button>
        }
      >
        {selectedEmpHistory && (
          <div className="space-y-4">
            {/* Header info card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">Số CCCD:</span>
                <span className="font-mono font-bold text-slate-900">{selectedEmpHistory.cccd || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Giới tính & SĐT:</span>
                <span className="font-bold text-slate-800">
                  {selectedEmpHistory.gender || '—'} • {selectedEmpHistory.phone || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Ngày vào Đảng:</span>
                <span className="font-semibold text-amber-800">
                  {selectedEmpHistory.partyDate ? formatDateVN(selectedEmpHistory.partyDate) : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Ngày chính thức Đảng:</span>
                <span className="font-semibold text-amber-900">
                  {selectedEmpHistory.partyOfficialDate ? formatDateVN(selectedEmpHistory.partyOfficialDate) : '—'}
                </span>
              </div>
            </div>

            {/* Timeline of Job Transfers */}
            {empWorkHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Chưa có ghi nhận luân chuyển điều động nào cho cán bộ này.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-200">
                {empWorkHistory.map((item, idx) => (
                  <div key={item.id || idx} className="relative group text-xs">
                    {/* Timeline bullet dot */}
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0f766e] text-white flex items-center justify-center text-[10px] shadow-sm">
                      <ArrowRightLeft className="w-2.5 h-2.5" />
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition-all shadow-xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#0f766e]" />
                          <span>QĐ số: {item.decisionNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Hiệu lực: {formatDateVN(item.effectiveDate)}</span>
                          {item.decisionDate && (
                            <span className="text-slate-400">
                              (Ký: {formatDateVN(item.decisionDate)})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Transfer Type Badge */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                          {item.transferTypeLabel || item.transferType}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Người ký: {item.signer}
                        </span>
                      </div>

                      {/* Transition Box */}
                      <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Trước điều chuyển:</span>
                          <span className="font-semibold text-slate-700">
                            {item.fromPosition} ({item.fromAssignedArea})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-teal-900 font-bold">
                          <span>Vị trí / Địa bàn mới:</span>
                          <span className="text-[#0f766e]">
                            {item.toPosition} ({item.toAssignedArea})
                          </span>
                        </div>
                      </div>

                      {/* Reason & handover */}
                      {item.reason && (
                        <div className="text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">Căn cứ: </span>
                          <span>{item.reason}</span>
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-[11px] text-slate-500 italic">
                          "{item.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Employees;

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  PlayCircle,
  Lock,
  Clock,
  Users,
  Check,
  X,
  Save,
  Loader2,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { saveKpiPeriod, deleteKpiPeriod, updateKpiPeriodStatus } from '../../services/kpiService';
import { useToast } from '../../../../context/ToastContext';

/**
 * Cấu Hình & Quản Trị Kỳ Chấm Điểm KPI (kpi_periods)
 * Quản trị các kỳ đánh giá hàng tháng, tổng hợp quý và cấu hình CBNV tham gia
 */
const KpiPeriodConfigCard = ({
  periods = [],
  employees = [],
  canManage = false,
  onRefresh,
}) => {
  const toast = useToast();
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'MONTHLY' | 'QUARTERLY'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [type, setType] = useState('MONTHLY');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [name, setName] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selfDeadline, setSelfDeadline] = useState('');
  const [managerDeadline, setManagerDeadline] = useState('');
  const [chairmanDeadline, setChairmanDeadline] = useState('');
  const [quarterSummaryPeriodId, setQuarterSummaryPeriodId] = useState('');
  const [participantScope, setParticipantScope] = useState('ALL'); // 'ALL' | 'SPECIFIC'
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [notes, setNotes] = useState('');
  const [empSearch, setEmpSearch] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Danh sách kỳ Quý để liên kết
  const quarterlyPeriods = useMemo(() => {
    return periods.filter((p) => p.type === 'QUARTERLY');
  }, [periods]);

  // Lọc kỳ hiển thị
  const filteredPeriods = useMemo(() => {
    return periods.filter((p) => {
      if (filterType === 'ALL') return true;
      return p.type === filterType;
    });
  }, [periods, filterType]);

  // Cán bộ nhân viên đang hoạt động
  const activeEmployees = useMemo(() => {
    return employees.filter((e) => e.status !== 'INACTIVE' && e.status !== 'DA_NGHI_VIEC');
  }, [employees]);

  // Lọc CBNV trong modal cấu hình
  const filteredEmployeesInModal = useMemo(() => {
    if (!empSearch.trim()) return activeEmployees;
    const q = empSearch.toLowerCase();
    return activeEmployees.filter(
      (e) =>
        (e.fullName || '').toLowerCase().includes(q) ||
        (e.code || '').toLowerCase().includes(q) ||
        (e.department || '').toLowerCase().includes(q) ||
        (e.position || '').toLowerCase().includes(q)
    );
  }, [activeEmployees, empSearch]);

  const openCreateModal = () => {
    const curYear = new Date().getFullYear();
    const curMonth = new Date().getMonth() + 1;
    const curQuarter = Math.ceil(curMonth / 3);

    setEditingPeriod(null);
    setType('MONTHLY');
    setYear(curYear);
    setMonth(curMonth);
    setQuarter(curQuarter);
    setName(`Tháng ${curMonth} / ${curYear}`);
    setStatus('ACTIVE');

    // Mặc định ngày đầu tháng đến cuối tháng
    const startStr = `${curYear}-${String(curMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(curYear, curMonth, 0).getDate();
    const endStr = `${curYear}-${String(curMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setStartDate(startStr);
    setEndDate(endStr);

    // Hạn mặc định
    const nextMonth = curMonth === 12 ? 1 : curMonth + 1;
    const nextYear = curMonth === 12 ? curYear + 1 : curYear;
    setSelfDeadline(`${nextYear}-${String(nextMonth).padStart(2, '0')}-05`);
    setManagerDeadline(`${nextYear}-${String(nextMonth).padStart(2, '0')}-08`);
    setChairmanDeadline(`${nextYear}-${String(nextMonth).padStart(2, '0')}-10`);

    setQuarterSummaryPeriodId(`kpi-${curYear}-q${curQuarter}`);
    setParticipantScope('ALL');
    setSelectedParticipantIds(activeEmployees.map((e) => e.id));
    setNotes('');
    setEmpSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (period) => {
    setEditingPeriod(period);
    setType(period.type || 'MONTHLY');
    setYear(period.year || new Date().getFullYear());
    setMonth(period.month || 1);
    setQuarter(period.quarter || 1);
    setName(period.name || '');
    setStatus(period.status || 'ACTIVE');
    setStartDate(period.startDate || '');
    setEndDate(period.endDate || '');
    setSelfDeadline(period.selfDeadline || '');
    setManagerDeadline(period.managerDeadline || '');
    setChairmanDeadline(period.chairmanDeadline || '');
    setQuarterSummaryPeriodId(period.quarterSummaryPeriodId || '');
    setParticipantScope(period.participantScope || 'ALL');
    setSelectedParticipantIds(Array.isArray(period.participantIds) ? period.participantIds : []);
    setNotes(period.notes || '');
    setEmpSearch('');
    setIsModalOpen(true);
  };

  // Cập nhật tên tự động khi đổi tháng/năm/loại
  const handleTypeOrDateChange = (newType, newYear, newMonth, newQuarter) => {
    if (newType === 'MONTHLY') {
      setName(`Tháng ${newMonth} / ${newYear}`);
      const q = Math.ceil(newMonth / 3);
      setQuarter(q);
      setQuarterSummaryPeriodId(`kpi-${newYear}-q${q}`);
      const lastDay = new Date(newYear, newMonth, 0).getDate();
      setStartDate(`${newYear}-${String(newMonth).padStart(2, '0')}-01`);
      setEndDate(`${newYear}-${String(newMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
    } else {
      const roman = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
      setName(`Quý ${roman[newQuarter] || newQuarter} / ${newYear}`);
      const startM = (newQuarter - 1) * 3 + 1;
      const endM = newQuarter * 3;
      const lastDay = new Date(newYear, endM, 0).getDate();
      setStartDate(`${newYear}-${String(startM).padStart(2, '0')}-01`);
      setEndDate(`${newYear}-${String(endM).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
    }
  };

  const toggleSelectAllEmployees = () => {
    if (selectedParticipantIds.length === activeEmployees.length) {
      setSelectedParticipantIds([]);
    } else {
      setSelectedParticipantIds(activeEmployees.map((e) => e.id));
    }
  };

  const toggleEmployeeSelect = (empId) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên kỳ đánh giá.');
      return;
    }

    setIsSaving(true);
    try {
      await saveKpiPeriod({
        id: editingPeriod?.id,
        name: name.trim(),
        type,
        year: Number(year),
        month: type === 'MONTHLY' ? Number(month) : null,
        quarter: Number(quarter),
        status,
        startDate,
        endDate,
        selfDeadline,
        managerDeadline,
        chairmanDeadline,
        quarterSummaryPeriodId: type === 'MONTHLY' ? quarterSummaryPeriodId : null,
        participantScope,
        participantIds: participantScope === 'ALL' ? [] : selectedParticipantIds,
        notes: notes.trim(),
      });

      toast.success(editingPeriod ? 'Đã cập nhật kỳ đánh giá KPI!' : 'Đã tạo kỳ đánh giá KPI mới!');
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lỗi saveKpiPeriod:', err);
      toast.error('Có lỗi xảy ra khi lưu kỳ đánh giá KPI.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickStatusChange = async (periodId, newStatus) => {
    try {
      await updateKpiPeriodStatus(periodId, newStatus);
      toast.success(
        newStatus === 'ACTIVE'
          ? 'Đã mở kỳ đánh giá!'
          : newStatus === 'CLOSED'
          ? 'Đã chốt sổ kỳ đánh giá!'
          : 'Đã cập nhật trạng thái kỳ!'
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lỗi updateKpiPeriodStatus:', err);
      toast.error('Lỗi cập nhật trạng thái kỳ.');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteKpiPeriod(deletingId);
      toast.success('Đã xóa kỳ đánh giá KPI thành công!');
      setDeletingId(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lỗi deleteKpiPeriod:', err);
      toast.error('Có lỗi xảy ra khi xóa kỳ.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>Cấu Hình & Quản Trị Kỳ Chấm Điểm KPI ({periods.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị các kỳ đánh giá hàng tháng (cơ sở), tổng hợp quý và phân bổ cán bộ tham gia
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Lọc loại kỳ */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterType === 'ALL' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({periods.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('MONTHLY')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterType === 'MONTHLY' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hàng tháng
            </button>
            <button
              type="button"
              onClick={() => setFilterType('QUARTERLY')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterType === 'QUARTERLY' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tổng hợp quý
            </button>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Kỳ Đánh Giá</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Danh sách kỳ */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-3 w-12 text-center">STT</th>
              <th className="py-3 px-4">Tên Kỳ Đánh Giá</th>
              <th className="py-3 px-3">Loại Kỳ</th>
              <th className="py-3 px-3">Thời Gian Thực Hiện</th>
              <th className="py-3 px-3">Hạn Chót 3 Cấp</th>
              <th className="py-3 px-3">Đối Tượng Tham Gia</th>
              <th className="py-3 px-3 text-center">Trạng Thái</th>
              {canManage && <th className="py-3 px-4 text-right">Thao Tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredPeriods.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  Chưa có kỳ đánh giá nào. Bấm &quot;Thêm Kỳ Đánh Giá&quot; để tạo kỳ mới.
                </td>
              </tr>
            ) : (
              filteredPeriods.map((p, idx) => {
                const isMonthly = p.type === 'MONTHLY';
                const participantText =
                  p.participantScope === 'SPECIFIC'
                    ? `${(p.participantIds || []).length} cán bộ chỉ định`
                    : 'Toàn bộ cán bộ (100%)';

                return (
                  <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center font-numeric text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{p.name}</span>
                        {p.status === 'ACTIVE' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      {p.notes && <div className="text-[11px] text-slate-400 mt-0.5">{p.notes}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isMonthly
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-violet-50 text-violet-700 border-violet-200'
                        }`}
                      >
                        {isMonthly ? 'Hàng tháng' : 'Tổng hợp quý'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-numeric text-slate-600">
                      <div>
                        {p.startDate || '—'} đến {p.endDate || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[11px] font-numeric space-y-0.5">
                      <div className="text-slate-600">
                        <span className="text-slate-400">Tự chấm:</span> {p.selfDeadline || '—'}
                      </div>
                      <div className="text-slate-600">
                        <span className="text-slate-400">BĐH:</span> {p.managerDeadline || '—'}
                      </div>
                      <div className="text-slate-600">
                        <span className="text-slate-400">HĐQT:</span> {p.chairmanDeadline || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs">{participantText}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {p.status === 'ACTIVE' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <PlayCircle className="w-3 h-3" />
                          Đang diễn ra
                        </span>
                      )}
                      {p.status === 'UPCOMING' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Sắp diễn ra
                        </span>
                      )}
                      {p.status === 'CLOSED' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Đã chốt sổ
                        </span>
                      )}
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status !== 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(p.id, 'ACTIVE')}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 transition-colors cursor-pointer"
                              title="Mở kỳ đánh giá"
                            >
                              Mở kỳ
                            </button>
                          )}
                          {p.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(p.id, 'CLOSED')}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
                              title="Chốt kỳ đánh giá"
                            >
                              Chốt kỳ
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa kỳ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(p.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa kỳ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm / Chỉnh Sửa Kỳ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base">
                {editingPeriod ? 'Chỉnh Sửa Kỳ Đánh Giá KPI' : 'Thêm Kỳ Đánh Giá KPI Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {/* 1. Loại kỳ & Thời gian */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Loại Kỳ Đánh Giá <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setType(newType);
                      handleTypeOrDateChange(newType, year, month, quarter);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="MONTHLY">Hàng tháng (Cơ sở)</option>
                    <option value="QUARTERLY">Tổng hợp quý</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Năm <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max="2035"
                    value={year}
                    onChange={(e) => {
                      const newY = Number(e.target.value);
                      setYear(newY);
                      handleTypeOrDateChange(type, newY, month, quarter);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 font-numeric focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {type === 'MONTHLY' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tháng <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={month}
                      onChange={(e) => {
                        const newM = Number(e.target.value);
                        setMonth(newM);
                        handleTypeOrDateChange(type, year, newM, quarter);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>Tháng {m}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Quý <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={quarter}
                      onChange={(e) => {
                        const newQ = Number(e.target.value);
                        setQuarter(newQ);
                        handleTypeOrDateChange(type, year, month, newQ);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="1">Quý I</option>
                      <option value="2">Quý II</option>
                      <option value="3">Quý III</option>
                      <option value="4">Quý IV</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 2. Tên hiển thị & Trạng thái */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên Hiển Thị Kỳ Đánh Giá <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Tháng 10 / 2026..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Trạng Thái Kỳ
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="ACTIVE">Đang diễn ra (ACTIVE)</option>
                    <option value="UPCOMING">Sắp diễn ra (UPCOMING)</option>
                    <option value="CLOSED">Đã chốt sổ (CLOSED)</option>
                  </select>
                </div>
              </div>

              {/* 3. Khoảng thời gian & Hạn chót */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ngày Bắt Đầu
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 font-numeric focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ngày Kết Thúc
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 font-numeric focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Hạn chót 3 cấp */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Hạn Chót Đánh Giá 3 Cấp
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Cấp 1: Cán bộ tự chấm
                    </label>
                    <input
                      type="date"
                      value={selfDeadline}
                      onChange={(e) => setSelfDeadline(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 font-numeric focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Cấp 2: BĐH thẩm tra
                    </label>
                    <input
                      type="date"
                      value={managerDeadline}
                      onChange={(e) => setManagerDeadline(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 font-numeric focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Cấp 3: HĐQT phê duyệt
                    </label>
                    <input
                      type="date"
                      value={chairmanDeadline}
                      onChange={(e) => setChairmanDeadline(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 font-numeric focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Nếu là kỳ tháng: liên kết kỳ Quý */}
              {type === 'MONTHLY' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Liên Kết Kỳ Quý Tổng Hợp
                  </label>
                  <select
                    value={quarterSummaryPeriodId}
                    onChange={(e) => setQuarterSummaryPeriodId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">-- Không liên kết --</option>
                    {quarterlyPeriods.map((qp) => (
                      <option key={qp.id} value={qp.id}>
                        {qp.name} ({qp.year})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Điểm số tháng này sẽ được tự động tích lũy vào kỳ tổng hợp quý tương ứng
                  </p>
                </div>
              )}

              {/* 4. Cấu hình Cán bộ nhân viên tham gia */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Cán Bộ Nhân Viên Được Chấm Điểm
                  </label>
                  <span className="text-xs text-emerald-700 font-bold font-numeric">
                    {participantScope === 'ALL'
                      ? `Toàn đơn vị (${activeEmployees.length} cán bộ)`
                      : `Đã chọn: ${selectedParticipantIds.length}/${activeEmployees.length} cán bộ`}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      value="ALL"
                      checked={participantScope === 'ALL'}
                      onChange={() => setParticipantScope('ALL')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-700">Toàn bộ cán bộ nhân viên</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      value="SPECIFIC"
                      checked={participantScope === 'SPECIFIC'}
                      onChange={() => setParticipantScope('SPECIFIC')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-700">Chỉ định danh sách cán bộ</span>
                  </label>
                </div>

                {participantScope === 'SPECIFIC' && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Tìm cán bộ theo tên, mã hoặc phòng ban..."
                        value={empSearch}
                        onChange={(e) => setEmpSearch(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs w-full outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={toggleSelectAllEmployees}
                        className="shrink-0 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                      >
                        {selectedParticipantIds.length === activeEmployees.length
                          ? 'Bỏ chọn tất cả'
                          : 'Chọn tất cả'}
                      </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                      {filteredEmployeesInModal.map((emp) => {
                        const isChecked = selectedParticipantIds.includes(emp.id);
                        return (
                          <div
                            key={emp.id}
                            onClick={() => toggleEmployeeSelect(emp.id)}
                            className={`p-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer text-xs transition-colors ${
                              isChecked ? 'bg-emerald-50/50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  isChecked
                                    ? 'bg-emerald-700 border-emerald-700 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-800">{emp.fullName}</span>
                                <span className="text-[11px] text-slate-400 ml-1.5 font-numeric">
                                  ({emp.code || '—'})
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-500">{emp.department || '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ghi Chú & Hướng Dẫn Kỳ Đánh Giá
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm về kỳ đánh giá này..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingPeriod ? 'Cập Nhật' : 'Tạo Kỳ Đánh Giá'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Kỳ */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Xác Nhận Xóa Kỳ Đánh Giá</h3>
              <p className="text-xs text-slate-500 mt-1">
                Đồng chí có chắc chắn muốn xóa kỳ đánh giá này khỏi hệ thống? Các phiếu đã chấm thuộc kỳ này vẫn được lưu giữ an toàn.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa Kỳ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KpiPeriodConfigCard;

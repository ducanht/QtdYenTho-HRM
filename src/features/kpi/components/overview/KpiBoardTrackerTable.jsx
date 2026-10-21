import React, { useState, useMemo } from 'react';
import { 
  Search, 
  FileSpreadsheet, 
  Printer, 
  CheckCheck, 
  Eye, 
  ChevronRight
} from 'lucide-react';
import KpiStatusBadge from '../shared/KpiStatusBadge';
import KpiClassificationBadge from '../shared/KpiClassificationBadge';

/**
 * Bảng Theo Dõi Tiến Trình KPI Toàn Đơn Vị Của HĐQT
 */
const KpiBoardTrackerTable = ({
  kpiList = [],
  loading = false,
  period = '',
  isChairman = false,
  isManager = false,
  isAdmin = false,
  onOpenActionModal,
  onOpenBulkApprove,
  onExportExcel,
  onOpenPrintModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Danh sách phòng ban duy nhất từ dữ liệu
  const departments = useMemo(() => {
    const set = new Set();
    kpiList.forEach((k) => {
      if (k.department) set.add(k.department);
    });
    return Array.from(set);
  }, [kpiList]);

  // Lọc dữ liệu
  const filteredList = useMemo(() => {
    return kpiList.filter((item) => {
      // 1. Tìm kiếm
      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        !term ||
        item.employeeName?.toLowerCase().includes(term) ||
        item.employeeCode?.toLowerCase().includes(term) ||
        item.department?.toLowerCase().includes(term);

      // 2. Lọc phòng ban
      const matchDept =
        departmentFilter === 'ALL' || item.department === departmentFilter;

      // 3. Lọc trạng thái
      const matchStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      return matchSearch && matchDept && matchStatus;
    });
  }, [kpiList, searchTerm, departmentFilter, statusFilter]);

  // Số lượng đang chờ HĐQT phê duyệt
  const pendingChairmanList = useMemo(() => {
    return kpiList.filter((k) => k.status === 'pending_chairman');
  }, [kpiList]);

  const canApprove = isChairman || isAdmin;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 1. Header Toolbar & Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo họ tên, mã cán bộ, chức vụ..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Bộ lọc phòng ban & trạng thái */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Lọc phòng ban */}
            <div className="relative">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">Tất cả phòng ban</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc trạng thái */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="completed">Đã hoàn tất</option>
                <option value="pending_chairman">Chờ HĐQT duyệt</option>
                <option value="pending_manager">Chờ BĐH thẩm định</option>
                <option value="draft">Chưa nộp</option>
                <option value="appealed">Đang khiếu nại</option>
              </select>
            </div>

            {/* Các nút tác vụ Quản trị (Chỉ để biểu tượng gọn gàng theo góp ý người dùng) */}
            <div className="flex items-center gap-1.5 ml-auto">
              {canApprove && pendingChairmanList.length > 0 && (
                <button
                  type="button"
                  onClick={onOpenBulkApprove}
                  title={`Phê duyệt nhanh (${pendingChairmanList.length}) phiếu chờ duyệt`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Duyệt nhanh</span>
                  <span className="font-numeric">({pendingChairmanList.length})</span>
                </button>
              )}

              {/* Xuất Excel */}
              <button
                type="button"
                onClick={onExportExcel}
                title="Xuất Bảng tổng hợp KPI ra Excel"
                className="p-2 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-300 hover:border-emerald-300 rounded-lg transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>

              {/* In ấn A4 */}
              <button
                type="button"
                onClick={onOpenPrintModal}
                title="In Phiếu / Báo cáo thi đua A4"
                className="p-2 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-300 hover:border-emerald-300 rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">STT</th>
              <th className="py-3 px-4">Cán Bộ Nhân Viên</th>
              <th className="py-3 px-4">Phòng Ban / Vị Trí</th>
              <th className="py-3 px-3 text-center">Tự Chấm (40%)</th>
              <th className="py-3 px-3 text-center">BĐH (30%)</th>
              <th className="py-3 px-3 text-center">HĐQT (30%)</th>
              <th className="py-3 px-3 text-center">Tổng Kết</th>
              <th className="py-3 px-4 text-center">Xếp Loại</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Tác Vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  Đang tải dữ liệu tiến trình KPI...
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  Không tìm thấy cán bộ nào phù hợp với bộ lọc
                </td>
              </tr>
            ) : (
              filteredList.map((item, idx) => (
                <tr 
                  key={item.id || idx}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="py-3 px-4 text-center text-xs text-slate-400 font-numeric">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{item.employeeName}</div>
                    {item.employeeCode && (
                      <div className="text-[11px] text-slate-400 font-numeric">{item.employeeCode}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs font-medium text-slate-700">{item.department || 'Chung'}</div>
                    <div className="text-[11px] text-slate-400">{item.position || '—'}</div>
                  </td>
                  <td className="py-3 px-3 text-center font-numeric font-medium text-slate-700">
                    {typeof item.scoreSelf === 'number' ? `${item.scoreSelf}đ` : '—'}
                  </td>
                  <td className="py-3 px-3 text-center font-numeric font-medium text-blue-700">
                    {typeof item.scoreManager === 'number' ? `${item.scoreManager}đ` : '—'}
                  </td>
                  <td className="py-3 px-3 text-center font-numeric font-medium text-amber-700">
                    {typeof item.scoreChairman === 'number' ? `${item.scoreChairman}đ` : '—'}
                  </td>
                  <td className="py-3 px-3 text-center font-numeric">
                    {typeof item.finalScore === 'number' ? (
                      <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {item.finalScore}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Chưa chốt</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <KpiClassificationBadge classification={item.classification} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <KpiStatusBadge status={item.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenActionModal(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>
                        {item.status === 'pending_chairman' && canApprove
                          ? 'Duyệt'
                          : (item.status === 'pending_manager' && isManager ? 'Thẩm định' : 'Xem')}
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Mobile Card View (Zero horizontal scroll!) */}
      <div className="md:hidden divide-y divide-slate-100">
        {loading ? (
          <div className="py-10 text-center text-slate-400 text-sm">
            Đang tải dữ liệu tiến trình KPI...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">
            Không tìm thấy cán bộ nào phù hợp với bộ lọc
          </div>
        ) : (
          filteredList.map((item, idx) => (
            <div 
              key={item.id || idx}
              onClick={() => onOpenActionModal(item)}
              className="p-4 hover:bg-slate-50/70 transition-colors active:bg-slate-100 cursor-pointer space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.employeeName}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>{item.department}</span>
                    <span className="text-slate-300">•</span>
                    <span>{item.position}</span>
                  </div>
                </div>
                <KpiStatusBadge status={item.status} />
              </div>

              {/* Điểm 3 cấp */}
              <div className="grid grid-cols-4 gap-1 p-2 bg-slate-50 rounded-lg border border-slate-100 text-center font-numeric">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Cán bộ</span>
                  <span className="text-xs font-bold text-slate-700">
                    {item.scoreSelf ?? '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">BĐH</span>
                  <span className="text-xs font-bold text-blue-700">
                    {item.scoreManager ?? '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">HĐQT</span>
                  <span className="text-xs font-bold text-amber-700">
                    {item.scoreChairman ?? '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Tổng</span>
                  <span className="text-xs font-bold text-emerald-700">
                    {item.finalScore ?? '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <KpiClassificationBadge classification={item.classification} />
                <div className="flex items-center text-xs font-semibold text-emerald-700">
                  <span>Chi tiết</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Count */}
      <div className="p-3 px-5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between font-numeric">
        <span>Hiển thị {filteredList.length} / {kpiList.length} cán bộ</span>
        <span>Kỳ đánh giá: {period}</span>
      </div>
    </div>
  );
};

export default KpiBoardTrackerTable;

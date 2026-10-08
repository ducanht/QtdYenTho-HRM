import React, { useMemo } from 'react';
import { Search, ArrowUpDown, UserCheck, Check, AlertCircle } from 'lucide-react';
import ScorePicker from '../../../components/common/ScorePicker';

/**
 * CriteriaScoringTable: Bảng chấm điểm cán bộ xếp theo hàng liên tiếp theo tiêu chí
 * - Sắp xếp theo vần ABC họ tên hoặc theo Phòng ban
 * - Điểm đánh giá từ 1 đến 10 (số nguyên, nút pick chọn 1 chạm, không lẻ điểm)
 * - Tự động loại trừ 100% bản thân người đang đăng nhập
 * - TUYỆT ĐỐI KHÔNG hiển thị điểm tổng khi chưa hoàn tất đánh giá
 */
const CriteriaScoringTable = ({
  criterion,
  criterionIndex = 0,
  employees = [],
  scores = {},
  notes = {},
  onSetScore,
  onSetNote,
  sortBy = 'ABC', // 'ABC' | 'DEPT'
  onChangeSortBy,
  searchTerm = '',
  onSearchChange,
  showTitle = true,
}) => {
  // Sắp xếp danh sách cán bộ theo vần ABC tên hoặc Phòng ban
  const sortedEmployees = useMemo(() => {
    const list = [...employees];

    if (sortBy === 'ABC') {
      list.sort((a, b) => {
        // Tách lấy từ cuối cùng của họ tên để so khớp vần tên tiếng Việt
        const nameA = a.name ? a.name.trim().split(' ').slice(-1)[0] : '';
        const nameB = b.name ? b.name.trim().split(' ').slice(-1)[0] : '';
        const comp = nameA.localeCompare(nameB, 'vi');
        return comp !== 0 ? comp : a.name.localeCompare(b.name, 'vi');
      });
    } else if (sortBy === 'DEPT') {
      list.sort((a, b) => {
        const deptComp = (a.department || '').localeCompare(b.department || '', 'vi');
        if (deptComp !== 0) return deptComp;
        return (a.name || '').localeCompare(b.name || '', 'vi');
      });
    }

    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(term) ||
        emp.code?.toLowerCase().includes(term) ||
        emp.position?.toLowerCase().includes(term) ||
        emp.department?.toLowerCase().includes(term)
    );
  }, [employees, sortBy, searchTerm]);

  // Đếm số cán bộ đã được chấm trong tiêu chí này
  const scoredCount = useMemo(() => {
    if (!criterion?.id) return 0;
    return employees.filter((emp) => {
      const val = scores[emp.id]?.[criterion.id];
      return val !== undefined && val !== null && val > 0;
    }).length;
  }, [employees, scores, criterion]);

  if (!criterion) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
      {/* 1. Header Khối Tiêu Chí */}
      {showTitle && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-50/70 via-white to-slate-50 border-b border-slate-200/80">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0f766e] text-white">
                  Tiêu chí {criterionIndex + 1}
                </span>
                {criterion.group && (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {criterion.group}
                  </span>
                )}
                <span className="text-xs font-bold text-teal-800 ml-1">
                  Đã chấm: {scoredCount} / {employees.length} cán bộ
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {criterion.title}
              </h3>

              {criterion.description && (
                <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                  <span className="font-semibold text-slate-700">Yêu cầu chuẩn mực:</span> {criterion.description}
                </p>
              )}
            </div>

            {/* Bộ lọc tên & Chọn thứ tự sắp xếp */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
              {/* Lọc tìm kiếm */}
              <div className="relative w-36 sm:w-44">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Lọc cán bộ..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 bg-white"
                />
              </div>

              {/* Sắp xếp ABC / Phòng ban */}
              <button
                type="button"
                onClick={() => onChangeSortBy && onChangeSortBy(sortBy === 'ABC' ? 'DEPT' : 'ABC')}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                title="Thay đổi cách sắp xếp danh sách"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#0f766e]" />
                <span>{sortBy === 'ABC' ? 'Xếp: Vần A-Z' : 'Xếp: Phòng ban'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Bảng Danh Sách Cán Bộ Xếp Theo Hàng Liên Tiếp */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 sm:px-4 text-center w-12">TT</th>
              <th className="py-3 px-3 sm:px-4 min-w-[180px]">Họ và tên cán bộ</th>
              <th className="py-3 px-3 sm:px-4 min-w-[160px]">Chức vụ & Phòng ban</th>
              <th className="py-3 px-3 sm:px-4 min-w-[320px]">
                Điểm đánh giá (Pick chọn từ 1 đến 10)
              </th>
              <th className="py-3 px-3 sm:px-4 min-w-[140px]">Ghi chú (Tùy chọn)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedEmployees.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Không tìm thấy cán bộ phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              sortedEmployees.map((emp, idx) => {
                const currentScore = scores[emp.id]?.[criterion.id];
                const hasScore = currentScore !== undefined && currentScore !== null && currentScore > 0;
                const empNote = notes[emp.id] || '';

                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors hover:bg-teal-50/30 ${
                      hasScore ? 'bg-white' : 'bg-amber-50/20'
                    }`}
                  >
                    {/* 1. TT */}
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>

                    {/* 2. Họ và tên */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                          {emp.avatar ? (
                            <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            emp.name?.charAt(0) || 'C'
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                            {emp.name}
                            {hasScore && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Đã có điểm" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Mã: {emp.code}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. Chức vụ & Phòng ban */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="font-semibold text-slate-800 text-xs">
                        {emp.position || 'Cán bộ'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {emp.department || 'Quỹ TDND Yên Thọ'}
                      </div>
                    </td>

                    {/* 4. Bộ nút chọn điểm 1..10 (Không lẻ điểm) */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-3">
                        <ScorePicker
                          value={currentScore}
                          onChange={(score) => onSetScore(emp.id, criterion.id, score)}
                          min={1}
                          max={10}
                          size="md"
                        />
                        {hasScore ? (
                          <span className="text-xs font-black text-[#0f766e] bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 shrink-0">
                            {currentScore} đ
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-semibold italic shrink-0">
                            Chưa chấm
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. Ghi chú */}
                    <td className="py-3 px-3 sm:px-4">
                      <input
                        type="text"
                        placeholder="Ghi chú thêm..."
                        value={empNote}
                        onChange={(e) => onSetNote(emp.id, e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0f766e] bg-slate-50/50 hover:bg-white"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(CriteriaScoringTable);

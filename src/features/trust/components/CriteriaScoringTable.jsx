import React, { useMemo } from 'react';
import { Search } from 'lucide-react';
import ScorePicker from '../../../components/common/ScorePicker';

/**
 * CriteriaScoringTable: Bảng chấm điểm cán bộ xếp theo hàng liên tiếp theo tiêu chí
 * - Xếp mặc định theo Phòng ban -> Tên cán bộ (vần ABC tiếng Việt), không hiển thị bộ chọn xếp
 * - Đã loại bỏ Mã cán bộ và Phòng ban khỏi phần hiển thị (chỉ hiển thị Họ tên & Chức vụ)
 * - Tối ưu 100% Responsive Mobile: Card view mượt mà trên điện thoại, Table view trên Desktop
 * - Điểm đánh giá từ 1 đến 10 (số nguyên, nút pick chọn 1 chạm, không lẻ điểm)
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
  searchTerm = '',
  onSearchChange,
  showTitle = true,
  currentUser = null,
}) => {
  // Sắp xếp mặc định: Phòng ban -> Tên cán bộ (theo vần ABC tiếng Việt)
  const sortedEmployees = useMemo(() => {
    const list = [...employees];

    list.sort((a, b) => {
      // 1. So khớp Phòng ban trước
      const deptComp = (a.department || '').localeCompare(b.department || '', 'vi');
      if (deptComp !== 0) return deptComp;

      // 2. So khớp Tên cán bộ (tách từ cuối cùng của họ tên)
      const nameA = a.name ? a.name.trim().split(' ').slice(-1)[0] : '';
      const nameB = b.name ? b.name.trim().split(' ').slice(-1)[0] : '';
      const comp = nameA.localeCompare(nameB, 'vi');
      return comp !== 0 ? comp : (a.name || '').localeCompare(b.name || '', 'vi');
    });

    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(term) ||
        emp.position?.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* 1. Header Khối Tiêu Chí */}
      {showTitle && (
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-teal-50/70 via-white to-slate-50 border-b border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            <div className="space-y-1 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
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

              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug pt-0.5">
                {criterion.title}
              </h3>

              {criterion.description && (
                <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                  <span className="font-semibold text-slate-700">Yêu cầu:</span> {criterion.description}
                </p>
              )}
            </div>

            {/* Ô tìm kiếm cán bộ nhanh */}
            <div className="relative w-full sm:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm cán bộ..."
                value={searchTerm}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Giao diện Desktop / Tablet: Bảng Table 4 cột tinh gọn */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 text-center w-12">TT</th>
              <th className="py-3 px-4 min-w-[200px]">Cán bộ</th>
              <th className="py-3 px-4 min-w-[340px]">Điểm đánh giá (1 - 10)</th>
              <th className="py-3 px-4 min-w-[180px]">Ghi chú (Tùy chọn)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedEmployees.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  Không tìm thấy cán bộ phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              sortedEmployees.map((emp, idx) => {
                const currentScore = scores[emp.id]?.[criterion.id];
                const hasScore = currentScore !== undefined && currentScore !== null && currentScore > 0;
                const empNote = notes[emp.id] || '';
                const isSelf = Boolean(
                  currentUser && (
                    emp.id === currentUser.id ||
                    emp.id === currentUser.uid ||
                    (currentUser.email && emp.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
                    (currentUser.code && emp.code === currentUser.code)
                  )
                );

                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors hover:bg-teal-50/30 ${
                      hasScore ? 'bg-white' : 'bg-amber-50/15'
                    }`}
                  >
                    {/* 1. TT */}
                    <td className="py-3 px-3 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>

                    {/* 2. Họ và tên & Chức vụ (Bỏ mã cán bộ, Bỏ phòng ban) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                          {emp.avatar ? (
                            <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            emp.name?.charAt(0) || 'C'
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                            <span>{emp.name}</span>
                            {isSelf && (
                              <span className="text-[10px] font-bold text-teal-800 bg-teal-100/90 border border-teal-300 px-1.5 py-0.2 rounded shrink-0">
                                Bản thân
                              </span>
                            )}
                            {hasScore && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Đã có điểm" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {emp.position || 'Cán bộ'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. Bộ chọn điểm 1..10 (Không lẻ điểm) */}
                    <td className="py-3 px-4">
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

                    {/* 4. Ghi chú */}
                    <td className="py-3 px-4">
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

      {/* 3. Giao diện Mobile (< md): Danh sách thẻ Card 1 chạm, cực kỳ tối ưu */}
      <div className="block md:hidden divide-y divide-slate-100">
        {sortedEmployees.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Không tìm thấy cán bộ phù hợp với bộ lọc.
          </div>
        ) : (
          sortedEmployees.map((emp, idx) => {
            const currentScore = scores[emp.id]?.[criterion.id];
            const hasScore = currentScore !== undefined && currentScore !== null && currentScore > 0;
            const empNote = notes[emp.id] || '';
            const isSelf = Boolean(
              currentUser && (
                emp.id === currentUser.id ||
                emp.id === currentUser.uid ||
                (currentUser.email && emp.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
                (currentUser.code && emp.code === currentUser.code)
              )
            );

            return (
              <div
                key={emp.id}
                className={`p-3.5 space-y-2.5 transition-colors ${
                  hasScore ? 'bg-white' : 'bg-amber-50/20'
                }`}
              >
                {/* Hàng 1: TT, Avatar, Tên cán bộ, Chức vụ và Huy hiệu điểm */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[11px] font-bold text-slate-400 w-5 text-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                      {emp.avatar ? (
                        <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                      ) : (
                        emp.name?.charAt(0) || 'C'
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{emp.name}</span>
                        {isSelf && (
                          <span className="text-[9px] font-bold text-teal-800 bg-teal-100/90 border border-teal-300 px-1 py-0.2 rounded shrink-0">
                            Bản thân
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium truncate">
                        {emp.position || 'Cán bộ'}
                      </div>
                    </div>
                  </div>

                  {/* Trạng thái điểm */}
                  <div className="shrink-0">
                    {hasScore ? (
                      <span className="text-xs font-black text-[#0f766e] bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                        {currentScore} đ
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        Chưa chấm
                      </span>
                    )}
                  </div>
                </div>

                {/* Hàng 2: Bộ chọn điểm 1..10 (Dàn đều 10 nút chuẩn touch target trên mobile) */}
                <div className="pt-1 overflow-x-auto pb-0.5 scrollbar-none">
                  <ScorePicker
                    value={currentScore}
                    onChange={(score) => onSetScore(emp.id, criterion.id, score)}
                    min={1}
                    max={10}
                    size="sm"
                    className="w-full justify-between sm:justify-start"
                  />
                </div>

                {/* Hàng 3: Ô nhập ghi chú mỏng gọn */}
                <div className="pt-0.5">
                  <input
                    type="text"
                    placeholder="Ghi chú (tùy chọn)..."
                    value={empNote}
                    onChange={(e) => onSetNote(emp.id, e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0f766e] bg-slate-50/50 hover:bg-white"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(CriteriaScoringTable);

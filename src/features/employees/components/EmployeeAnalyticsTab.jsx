import React, { useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  Award, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Building2, 
  PieChart 
} from 'lucide-react';
import { calculatePositionTenure } from '../../../lib/evaluationUtils';
import { formatDateVN } from '../../../lib/dateUtils';

/**
 * EmployeeAnalyticsTab: Cột Phải cho Tab ANALYTICS
 * Báo cáo Thống kê Cơ cấu Nhân sự toàn Quỹ & Bảng Giám sát Thời hạn Luân chuyển theo quy định NHNN
 */
const EmployeeAnalyticsTab = ({
  employees = [],
  departments = [],
  onSelectEmployeeForTransfer,
}) => {
  // 1. Thống kê cơ bản
  const totalEmployees = employees.length;

  const maleCount = employees.filter((e) => e.gender === 'Nam').length;
  const femaleCount = employees.filter((e) => e.gender === 'Nữ').length;
  const malePercent = totalEmployees ? Math.round((maleCount / totalEmployees) * 100) : 0;
  const femalePercent = totalEmployees ? Math.round((femaleCount / totalEmployees) * 100) : 0;

  const partyMembersCount = employees.filter((e) => e.partyMember).length;
  const partyPercent = totalEmployees ? Math.round((partyMembersCount / totalEmployees) * 100) : 0;

  // 2. Thống kê theo phòng ban
  const deptStats = useMemo(() => {
    return departments.map((dept) => {
      const count = employees.filter((e) => e.department === dept).length;
      const percent = totalEmployees ? Math.round((count / totalEmployees) * 100) : 0;
      return { name: dept, count, percent };
    });
  }, [employees, departments, totalEmployees]);

  // 3. Phân tích danh sách cán bộ vị trí nhạy cảm cần luân chuyển
  const transferMonitoringList = useMemo(() => {
    const list = [];

    employees.forEach((emp) => {
      const p = (emp.position || '').toLowerCase();
      const isSensitive =
        p.includes('tín dụng') ||
        p.includes('kế toán') ||
        p.includes('thủ quỹ') ||
        p.includes('kiểm soát');

      if (!isSensitive) return;

      const effectiveStart = emp.positionStartDate || emp.joinDate;
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

      const isDue = tenureMonths >= 36;
      const isNear = tenureMonths >= 30 && tenureMonths < 36;

      list.push({
        id: emp.id,
        code: emp.code,
        name: emp.name,
        department: emp.department,
        position: emp.position,
        assignedArea: emp.assignedArea,
        startDate: effectiveStart,
        tenureText,
        tenureMonths,
        isDue,
        isNear,
      });
    });

    // Sắp xếp theo thâm niên giảm dần (nguy cơ cao nhất lên đầu)
    list.sort((a, b) => b.tenureMonths - a.tenureMonths);
    return list;
  }, [employees]);

  const dueCount = transferMonitoringList.filter((i) => i.isDue).length;
  const nearCount = transferMonitoringList.filter((i) => i.isNear).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Thẻ Chỉ Số Tổng Quan Nhân Lực */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Tổng nhân sự</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalEmployees}</div>
          <div className="text-[11px] text-slate-500 mt-1">Cán bộ chính thức</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Tỷ lệ Đảng viên</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800">{partyPercent}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{partyMembersCount}/{totalEmployees} cán bộ</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Cơ cấu Giới tính</span>
            <PieChart className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-sm font-black text-slate-800 mt-1">
            Nam: {maleCount} ({malePercent}%)
          </div>
          <div className="text-sm font-black text-slate-800 mt-0.5">
            Nữ: {femaleCount} ({femalePercent}%)
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Hạn luân chuyển NHNN</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{dueCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {nearCount > 0 ? `+ ${nearCount} sắp đến hạn` : 'Không có sắp đến hạn'}
          </div>
        </div>
      </div>

      {/* 2. Bảng Theo Dõi Thời Hạn Luân Chuyển Toàn Quỹ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-700" />
              <span>Bảng Giám Sát Luân Chuyển Định Kỳ Toàn Quỹ (NHNN)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Áp dụng cho các vị trí nhạy cảm (CBTD, Kế toán, Thủ quỹ, BKS) theo chu kỳ 36 tháng
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200">
              Đến hạn: {dueCount}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200">
              Sắp đến hạn: {nearCount}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <th className="py-2.5 px-3 text-center w-12">STT</th>
                <th className="py-2.5 px-3">Họ và tên</th>
                <th className="py-2.5 px-3">Chức vụ & Phòng ban</th>
                <th className="py-2.5 px-3">Ngày bắt đầu</th>
                <th className="py-2.5 px-3">Thâm niên chức vụ</th>
                <th className="py-2.5 px-3 text-right">Trạng thái theo dõi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transferMonitoringList.map((row, idx) => (
                <tr 
                  key={row.id}
                  onClick={() => onSelectEmployeeForTransfer?.(row.id)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 text-center font-bold text-slate-500 tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {row.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <span className="font-bold text-slate-800">{row.position}</span>
                    <span className="text-[11px] text-slate-400 block">{row.department}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-medium">
                    {formatDateVN(row.startDate)}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">
                    {row.tenureText}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {row.isDue ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Đến hạn luân chuyển
                      </span>
                    ) : row.isNear ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        Sắp đến hạn (&lt; 6 tháng)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Trong hạn an toàn
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Phân Bổ Nhân Sự Theo Phòng Ban */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
          <Building2 className="w-4 h-4 text-emerald-700" />
          <span>Phân Bổ Nhân Sự Theo Phòng Ban & Bộ Phận</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {deptStats.map((d) => (
            <div key={d.name} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{d.name}</span>
                <span className="font-black text-emerald-800">{d.count} người ({d.percent}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-700 h-1.5 rounded-full"
                  style={{ width: `${d.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(EmployeeAnalyticsTab);

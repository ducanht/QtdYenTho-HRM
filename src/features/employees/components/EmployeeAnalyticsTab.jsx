import React, { useMemo } from 'react';
import { 
  Users, 
  Award, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  PieChart,
  GraduationCap,
  MapPin
} from 'lucide-react';
import { calculatePositionTenure, calculateAreaTenureAndDueDate } from '../../../lib/evaluationUtils';
import { formatDateVN } from '../../../lib/dateUtils';

/**
 * EmployeeAnalyticsTab: Cột Phải cho Tab ANALYTICS
 * Báo cáo Thống kê Cơ cấu Nhân sự toàn Quỹ & Bảng Giám sát Thời hạn Luân chuyển theo quy định NHNN
 */
const EmployeeAnalyticsTab = ({
  employees = [],
  hrConfig = {},
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

  // Tra cứu quy tắc luân chuyển theo cấu hình
  const getTransferRule = (posName) => {
    if (!posName) return null;
    const rules = hrConfig?.transferRules || [];
    const directMatch = rules.find(
      (r) => r.positionName?.trim().toLowerCase() === posName.trim().toLowerCase()
    );
    if (directMatch) return directMatch;

    const posLower = posName.toLowerCase();
    const partialMatch = rules.find(
      (r) => posLower.includes(r.positionName?.toLowerCase()) || r.positionName?.toLowerCase().includes(posLower)
    );
    return partialMatch || null;
  };

  // 2. Phân tích danh sách cán bộ vị trí nhạy cảm & cán bộ tín dụng luân chuyển địa bàn
  const transferMonitoringList = useMemo(() => {
    const list = [];
    const rules = hrConfig?.transferRules || [];

    employees.forEach((emp) => {
      const posName = emp.position || '';
      const isCreditOfficer = (emp.department || '').includes('Tín dụng') || 
        posName.toLowerCase().includes('tín dụng') || 
        Boolean(emp.assignedArea);

      let isSensitive = false;
      let maxMonths = 36;
      let warningMonths = 6;

      if (rules.length > 0) {
        const rule = getTransferRule(posName);
        if (rule && rule.requiresTransfer) {
          isSensitive = true;
          maxMonths = Number(rule.maxMonths) || 36;
          warningMonths = Number(rule.warningMonths) || 6;
        }
      } else {
        // Fallback mặc định theo Thông tư NHNN nếu chưa tải kịp cấu hình
        const p = posName.toLowerCase();
        isSensitive =
          p.includes('tín dụng') ||
          p.includes('kế toán') ||
          p.includes('thủ quỹ') ||
          p.includes('kiểm soát');
      }

      if (!isSensitive && !isCreditOfficer) return;

      const effectiveStart = emp.positionStartDate || emp.joinDate;
      const areaStart = emp.areaStartDate || effectiveStart;

      let tenureText = '';
      let tenureMonths = 0;
      let isDue = false;
      let isNear = false;
      let dueDateText = '';

      if (isCreditOfficer) {
        const areaInfo = calculateAreaTenureAndDueDate(areaStart, maxMonths, warningMonths);
        tenureText = areaInfo.tenureText;
        tenureMonths = areaInfo.tenureMonths;
        isDue = areaInfo.isDue;
        isNear = areaInfo.isNear;
        dueDateText = areaInfo.dueDateText;
      } else {
        tenureText = calculatePositionTenure(effectiveStart);
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
        const warningThreshold = Math.max(0, maxMonths - warningMonths);
        isDue = tenureMonths >= maxMonths;
        isNear = tenureMonths >= warningThreshold && tenureMonths < maxMonths;
      }

      list.push({
        id: emp.id,
        code: emp.code,
        name: emp.name,
        department: emp.department,
        position: emp.position,
        isCreditOfficer,
        assignedArea: emp.assignedArea || '',
        areaStartDate: emp.areaStartDate || '',
        startDate: effectiveStart,
        tenureText,
        tenureMonths,
        maxMonths,
        warningMonths,
        isDue,
        isNear,
        dueDateText,
      });
    });

    // Sắp xếp theo mức độ cấp thiết (Đến hạn trước, rồi đến thâm niên giảm dần)
    list.sort((a, b) => {
      if (a.isDue !== b.isDue) return a.isDue ? -1 : 1;
      if (a.isNear !== b.isNear) return a.isNear ? -1 : 1;
      return (b.tenureMonths - b.maxMonths) - (a.tenureMonths - a.maxMonths);
    });
    return list;
  }, [employees, hrConfig]);

  // 4. Thống kê theo trình độ chuyên môn / học vấn
  const educationStats = useMemo(() => {
    const buckets = [
      { key: 'THAC_SI', label: 'Thạc sĩ / Sau đại học', match: (edu) => edu.includes('thạc sĩ') || edu.includes('thạc sỹ') || edu.includes('cao học') || edu.includes('master') },
      { key: 'DAI_HOC', label: 'Đại học / Cử nhân / Kỹ sư', match: (edu) => edu.includes('đại học') || edu.includes('cử nhân') || edu.includes('kỹ sư') },
      { key: 'CAO_DANG', label: 'Cao đẳng', match: (edu) => edu.includes('cao đẳng') },
      { key: 'TRUNG_CAP', label: 'Trung cấp', match: (edu) => edu.includes('trung cấp') },
      { key: 'KHAC', label: 'Trình độ khác / Đang cập nhật', match: () => true },
    ];

    const counts = {
      THAC_SI: 0,
      DAI_HOC: 0,
      CAO_DANG: 0,
      TRUNG_CAP: 0,
      KHAC: 0,
    };

    employees.forEach((emp) => {
      const edu = (emp.education || '').toLowerCase().trim();
      if (!edu) {
        counts.KHAC++;
        return;
      }
      for (const b of buckets) {
        if (b.key === 'KHAC') {
          counts.KHAC++;
          break;
        }
        if (b.match(edu)) {
          counts[b.key]++;
          break;
        }
      }
    });

    return buckets
      .map((b) => ({
        key: b.key,
        label: b.label,
        count: counts[b.key],
        percent: totalEmployees ? Math.round((counts[b.key] / totalEmployees) * 100) : 0,
      }))
      .filter((b) => b.count > 0 || b.key === 'DAI_HOC' || b.key === 'THAC_SI');
  }, [employees, totalEmployees]);

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
            <span className="text-[11px] font-bold uppercase">Hạn luân chuyển</span>
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
              <span>Bảng Giám Sát Luân Chuyển Định Kỳ Toàn Quỹ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi thâm niên các vị trí theo danh mục chu kỳ luân chuyển đã thiết lập trong Cấu hình hệ thống & quy định NHNN
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

        {transferMonitoringList.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Hiện không có cán bộ nào thuộc vị trí luân chuyển hoặc toàn bộ nhân sự đang trong hạn an toàn.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                  <th className="py-2.5 px-3 text-center w-12">STT</th>
                  <th className="py-2.5 px-3">Họ và tên</th>
                  <th className="py-2.5 px-3">Chức vụ & Địa bàn / Bộ phận</th>
                  <th className="py-2.5 px-3">Ngày bắt đầu</th>
                  <th className="py-2.5 px-3">Thâm niên theo dõi</th>
                  <th className="py-2.5 px-3">Chu kỳ quy định</th>
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
                      {row.isCreditOfficer && row.assignedArea ? (
                        <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{row.assignedArea}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 block">{row.department}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {row.isCreditOfficer && row.areaStartDate ? (
                        <div>
                          <span className="font-semibold text-slate-800 block">{formatDateVN(row.areaStartDate)}</span>
                          <span className="text-[10px] text-slate-400 block">Địa bàn</span>
                        </div>
                      ) : (
                        formatDateVN(row.startDate)
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      <span>{row.tenureText}</span>
                      {row.dueDateText && (
                        <span className="text-[10px] text-slate-500 font-normal block">Hạn: {row.dueDateText}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {row.maxMonths} tháng
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {row.isDue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {row.isCreditOfficer ? 'Đến hạn đổi địa bàn' : 'Đến hạn luân chuyển'}
                        </span>
                      ) : row.isNear ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <Clock className="w-3.5 h-3.5" />
                          {row.isCreditOfficer ? 'Sắp đến hạn đổi địa bàn' : `Sắp đến hạn (< ${row.warningMonths} tháng)`}
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
        )}
      </div>

      {/* 3. Cơ Cấu Trình Độ Chuyên Môn / Học Vấn */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            <span>Cơ Cấu Trình Độ Chuyên Môn & Học Vấn Toàn Quỹ</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Tiêu chuẩn chức danh theo quy định NHNN
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {educationStats.map((item) => (
            <div key={item.key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{item.label}</span>
                <span className="font-black text-emerald-800">{item.count} người ({item.percent}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-700 h-1.5 rounded-full"
                  style={{ width: `${item.percent}%` }}
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

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Award, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  PieChart, 
  GraduationCap, 
  MapPin, 
  FileText, 
  Building2, 
  Sliders, 
  AlertTriangle,
  ChevronRight,
  MoreHorizontal,
  FileSpreadsheet
} from 'lucide-react';
import { calculateAreaTenureAndDueDate, isCreditOfficerRole } from '../../../lib/evaluationUtils';
import { formatDateVN } from '../../../lib/dateUtils';
import Button from '../../../components/common/Button';
import DropdownMenu from '../../../components/common/DropdownMenu';
import { 
  exportEmployeesDirectoryToExcel,
  exportCreditRotationReportToExcel,
  exportContractsReportToExcel,
  exportEducationReportToExcel,
} from '../../../lib/exportUtils';

/**
 * EmployeeOverviewTab: Màn hình Tổng quan Nhân sự lao động của Quỹ (Tab OVERVIEW)
 * Cung cấp bức tranh toàn cảnh nhân lực, cơ cấu HĐLĐ, trình độ chuyên môn, phân bổ phòng ban
 * và Bảng giám sát chu kỳ luân chuyển địa bàn Cán bộ tín dụng theo chuẩn quy định NHNN.
 * Hỗ trợ cấu hình hiển thị bật/tắt từng khối widget linh hoạt.
 */
const EmployeeOverviewTab = ({
  employees = [],
  departments = [],
  degrees = [],
  contracts = [],
  hrConfig = {},
  overviewDisplayConfig = {},
  onOpenDisplayConfigModal,
  onSelectEmployeeForProfile,
}) => {
  const totalEmployees = employees.length;

  // 1. Thống kê cơ bản
  const maleCount = employees.filter((e) => e.gender === 'Nam').length;
  const femaleCount = employees.filter((e) => e.gender === 'Nữ').length;
  const malePercent = totalEmployees ? Math.round((maleCount / totalEmployees) * 100) : 0;
  const femalePercent = totalEmployees ? Math.round((femaleCount / totalEmployees) * 100) : 0;

  const partyMembersCount = employees.filter((e) => e.partyMember).length;
  const partyPercent = totalEmployees ? Math.round((partyMembersCount / totalEmployees) * 100) : 0;

  // 2. Phân tích danh sách cán bộ tín dụng (CBTD) luân chuyển địa bàn
  const transferMonitoringList = useMemo(() => {
    const list = [];
    const maxMonths = Number(hrConfig?.creditRotationMonths || hrConfig?.transferMaxMonths || hrConfig?.transferCycleMonths || 36);
    const warningMonths = Number(hrConfig?.creditWarningMonths || hrConfig?.transferWarningMonths || hrConfig?.warningMonths || 6);

    employees.forEach((emp) => {
      // Chỉ theo dõi Cán bộ Tín dụng phụ trách địa bàn (loại trừ HĐQT, BKS, Giám đốc, Kế toán, Thủ quỹ)
      const isCreditOfficer = isCreditOfficerRole(emp.position, emp.department);
      if (!isCreditOfficer) return;

      const effectiveStart = emp.positionStartDate || emp.joinDate;
      const areaStart = emp.areaStartDate || effectiveStart;

      const areaInfo = calculateAreaTenureAndDueDate(areaStart, maxMonths, warningMonths);

      list.push({
        id: emp.id,
        code: emp.code,
        name: emp.name,
        department: emp.department,
        position: emp.position,
        isCreditOfficer: true,
        assignedArea: emp.assignedArea || 'Chưa phân công địa bàn',
        areaStartDate: emp.areaStartDate || '',
        startDate: effectiveStart,
        tenureText: areaInfo.tenureText,
        tenureMonths: areaInfo.tenureMonths,
        maxMonths,
        warningMonths,
        isDue: areaInfo.isDue,
        isNear: areaInfo.isNear,
        dueDateText: areaInfo.dueDateText,
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

  const dueCount = transferMonitoringList.filter((i) => i.isDue).length;
  const nearCount = transferMonitoringList.filter((i) => i.isNear).length;

  // 3. Cơ cấu Hợp đồng lao động & HĐ sắp hết hạn
  const contractStats = useMemo(() => {
    const counts = {
      INDEFINITE: 0, // Không xác định thời hạn
      DEFINITE: 0,   // Xác định thời hạn (12-36 tháng)
      PROBATION: 0,  // Thử việc
      OTHER: 0,      // Khác
    };

    const expiringContracts = [];
    const now = new Date();
    const sixtyDaysLater = new Date();
    sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);

    // Gom dữ liệu từ contracts hoặc fallback qua employees.contractType
    employees.forEach((emp) => {
      // Tìm hợp đồng hiện hành của cán bộ
      const empContracts = contracts.filter((c) => c.employeeId === emp.id || c.employeeCode === emp.code);
      const currentContract = empContracts.find((c) => c.isCurrent) || empContracts[0];

      let typeStr = '';
      if (currentContract) {
        typeStr = (currentContract.contractType || '').toLowerCase();
        // Kiểm tra hạn hợp đồng nếu có
        if (currentContract.expirationDate) {
          const expDate = new Date(currentContract.expirationDate);
          if (!isNaN(expDate.getTime())) {
            const isExpired = expDate < now;
            const isNearExp = expDate >= now && expDate <= sixtyDaysLater;
            if (isExpired || isNearExp) {
              expiringContracts.push({
                employeeId: emp.id,
                employeeName: emp.name,
                contractNumber: currentContract.contractNumber || 'HĐLĐ',
                contractType: currentContract.contractType,
                expirationDate: currentContract.expirationDate,
                isExpired,
                isNearExp,
              });
            }
          }
        }
      } else {
        typeStr = (emp.contractType || '').toLowerCase();
      }

      if (typeStr.includes('không xác định') || typeStr.includes('vô thời hạn')) {
        counts.INDEFINITE++;
      } else if (typeStr.includes('xác định') || typeStr.includes('thời hạn') || typeStr.includes('tháng') || typeStr.includes('năm')) {
        counts.DEFINITE++;
      } else if (typeStr.includes('thử việc')) {
        counts.PROBATION++;
      } else {
        // Mặc định nhân viên lâu năm là không xác định thời hạn nếu chưa ghi rõ
        counts.INDEFINITE++;
      }
    });

    const items = [
      { key: 'INDEFINITE', label: 'HĐLĐ Không xác định thời hạn', count: counts.INDEFINITE },
      { key: 'DEFINITE', label: 'HĐLĐ Có thời hạn (12 - 36 tháng)', count: counts.DEFINITE },
      { key: 'PROBATION', label: 'Hợp đồng thử việc', count: counts.PROBATION },
    ].map((item) => ({
      ...item,
      percent: totalEmployees ? Math.round((item.count / totalEmployees) * 100) : 0,
    }));

    return {
      items,
      expiringContracts,
    };
  }, [employees, contracts, totalEmployees]);

  // 4. Thống kê theo trình độ chuyên môn / học vấn
  const educationStats = useMemo(() => {
    const buckets = [
      { key: 'TIEN_SI', label: 'Tiến sĩ / Sau đại học', match: (edu) => edu.includes('tiến sĩ') || edu.includes('tiến sỹ') || edu.includes('phó giáo sư') || edu.includes('giáo sư') },
      { key: 'THAC_SI', label: 'Thạc sĩ / Cao học', match: (edu) => edu.includes('thạc sĩ') || edu.includes('thạc sỹ') || edu.includes('cao học') || edu.includes('master') },
      { key: 'DAI_HOC', label: 'Đại học / Cử nhân / Kỹ sư', match: (edu) => edu.includes('đại học') || edu.includes('cử nhân') || edu.includes('kỹ sư') },
      { key: 'CAO_DANG', label: 'Cao đẳng', match: (edu) => edu.includes('cao đẳng') },
      { key: 'TRUNG_CAP', label: 'Trung cấp', match: (edu) => edu.includes('trung cấp') },
      { key: 'KHAC', label: 'Trình độ khác / Đang cập nhật', match: () => true },
    ];

    const counts = {
      TIEN_SI: 0,
      THAC_SI: 0,
      DAI_HOC: 0,
      CAO_DANG: 0,
      TRUNG_CAP: 0,
      KHAC: 0,
    };

    employees.forEach((emp) => {
      // Tìm văn bằng cao nhất trong bảng employee_degrees
      const empDegs = degrees.filter((d) => d.employeeId === emp.id || d.employeeUuid === emp.id);
      let edu = '';
      if (empDegs.length > 0) {
        const highest = empDegs.find((d) => d.isHighest) || empDegs[0];
        edu = (highest.degreeLevel || '').toLowerCase().trim();
      }
      if (!edu) {
        edu = (emp.education || '').toLowerCase().trim();
      }

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
  }, [employees, totalEmployees, degrees]);

  // 5. Cơ cấu nhân sự theo Phòng ban / Bộ phận
  const departmentStats = useMemo(() => {
    const deptMap = {};
    if (Array.isArray(departments)) {
      departments.forEach((d) => {
        const name = typeof d === 'string' ? d : d?.name || d?.title || '';
        if (name && name !== 'undefined') {
          deptMap[name] = 0;
        }
      });
    }

    // Mặc định các bộ phận chuẩn nếu danh mục rỗng
    if (Object.keys(deptMap).length === 0) {
      deptMap['Hội đồng Quản trị'] = 0;
      deptMap['Ban Kiểm soát'] = 0;
      deptMap['Ban Điều hành'] = 0;
      deptMap['Phòng Tín dụng'] = 0;
      deptMap['Phòng Kế toán - Ngân quỹ'] = 0;
    }

    employees.forEach((emp) => {
      const deptName = emp.department || 'Phòng Kế toán - Ngân quỹ';
      if (deptName && deptName !== 'undefined') {
        deptMap[deptName] = (deptMap[deptName] || 0) + 1;
      }
    });

    return Object.keys(deptMap)
      .filter((deptName) => deptName && deptName !== 'undefined')
      .map((deptName) => ({
        name: deptName,
        count: deptMap[deptName],
        percent: totalEmployees ? Math.round((deptMap[deptName] / totalEmployees) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [employees, departments, totalEmployees]);

  // Trạng thái đang xuất báo cáo
  const [exportingReport, setExportingReport] = useState(false);

  // Xử lý xuất các loại báo cáo quản trị cấp toàn Quỹ
  const handleExportDirectory = async () => {
    try {
      setExportingReport(true);
      await exportEmployeesDirectoryToExcel(employees);
    } catch (err) {
      console.error('Lỗi xuất danh bạ cán bộ:', err);
      alert('Không thể xuất danh bạ cán bộ. Vui lòng thử lại!');
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportCreditRotation = async () => {
    try {
      setExportingReport(true);
      await exportCreditRotationReportToExcel(transferMonitoringList, hrConfig);
    } catch (err) {
      console.error('Lỗi xuất báo cáo giám sát CBTD:', err);
      alert('Không thể xuất báo cáo giám sát CBTD. Vui lòng thử lại!');
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportContracts = async () => {
    try {
      setExportingReport(true);
      await exportContractsReportToExcel(employees, contracts);
    } catch (err) {
      console.error('Lỗi xuất báo cáo HĐLĐ:', err);
      alert('Không thể xuất báo cáo hợp đồng. Vui lòng thử lại!');
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportEducation = async () => {
    try {
      setExportingReport(true);
      await exportEducationReportToExcel(employees, degrees);
    } catch (err) {
      console.error('Lỗi xuất báo cáo học vấn:', err);
      alert('Không thể xuất báo cáo học vấn. Vui lòng thử lại!');
    } finally {
      setExportingReport(false);
    }
  };

  // Kiểm tra cờ hiển thị (Mặc định bật toàn bộ nếu không khai báo)
  const showKpis = overviewDisplayConfig?.showKpis !== false;
  const showContractStructure = overviewDisplayConfig?.showContractStructure !== false;
  const showEducationStructure = overviewDisplayConfig?.showEducationStructure !== false;
  const showCreditRotationMonitoring = overviewDisplayConfig?.showCreditRotationMonitoring !== false;
  const showDepartmentDistribution = overviewDisplayConfig?.showDepartmentDistribution !== false;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header Tổng Quan & Nút Cấu Hình Hiển Thị & Menu Tác Vụ Báo Cáo */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>Tổng Quan Nhân Lực Quỹ Tín Dụng Nhân Dân Yên Thọ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Bức tranh toàn cảnh về đội ngũ cán bộ, hợp đồng lao động, trình độ chuyên môn và giám sát địa bàn tín dụng
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Menu Dropdown Tác vụ Quản trị & Báo cáo */}
          <DropdownMenu
            align="right"
            width="w-64"
            trigger={({ isOpen }) => (
              <button
                type="button"
                aria-label="Tác vụ báo cáo"
                disabled={exportingReport}
                className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50 ${
                  isOpen
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                }`}
                title="Tác vụ quản trị & xuất báo cáo"
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>{exportingReport ? 'Đang xuất...' : 'Tác vụ'}</span>
              </button>
            )}
            items={[
              {
                id: 'exp-directory',
                label: 'Xuất danh bạ toàn Quỹ (Excel)',
                description: 'Toàn bộ hồ sơ cán bộ nhân viên',
                icon: FileSpreadsheet,
                onClick: handleExportDirectory,
              },
              {
                id: 'exp-credit-rotation',
                label: 'Báo cáo giám sát địa bàn CBTD',
                description: 'Chu kỳ luân chuyển & hạn đổi địa bàn',
                icon: ShieldAlert,
                onClick: handleExportCreditRotation,
              },
              {
                id: 'exp-contracts',
                label: 'Báo cáo cơ cấu HĐLĐ & Hạn tái ký',
                description: 'Tình trạng thực hiện hợp đồng lao động',
                icon: FileText,
                onClick: handleExportContracts,
              },
              {
                id: 'exp-education',
                label: 'Báo cáo trình độ & văn bằng',
                description: 'Thống kê học vấn, chuyên ngành đào tạo',
                icon: GraduationCap,
                onClick: handleExportEducation,
              },
              { divider: true },
              {
                id: 'cfg-display',
                label: 'Cấu hình hiển thị Dashboard',
                description: 'Bật/tắt các phân khu widget',
                icon: Sliders,
                onClick: onOpenDisplayConfigModal,
              },
            ]}
          />

          <Button
            type="button"
            variant="outline"
            onClick={onOpenDisplayConfigModal}
            icon={Sliders}
            className="text-xs border-slate-200 hover:border-emerald-300"
          >
            Cấu hình hiển thị
          </Button>
        </div>
      </div>

      {/* 1. KHỐI THẺ CHỈ SỐ NHÂN LỰC KPI */}
      {showKpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase">Tổng nhân sự</span>
              <Users className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-black text-slate-900 tabular-nums">{totalEmployees}</div>
            <div className="text-[11px] text-slate-500 mt-1">Cán bộ chính thức</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase">Tỷ lệ Đảng viên</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-800 tabular-nums">{partyPercent}%</div>
            <div className="text-[11px] text-slate-500 mt-1">{partyMembersCount}/{totalEmployees} cán bộ</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase">Cơ cấu Giới tính</span>
              <PieChart className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">
              Nam: <span className="text-slate-900 font-black">{maleCount}</span> ({malePercent}%)
            </div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">
              Nữ: <span className="text-slate-900 font-black">{femaleCount}</span> ({femalePercent}%)
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase">Hạn đổi địa bàn CBTD</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-700 tabular-nums">{dueCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {nearCount > 0 ? `+ ${nearCount} sắp đến hạn` : 'Toàn bộ an toàn'}
            </div>
          </div>
        </div>
      )}

      {/* 2. KHỐI CƠ CẤU HỢP ĐỒNG LAO ĐỘNG & CẢNH BÁO TÁI KÝ */}
      {showContractStructure && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Cơ Cấu Hợp Đồng Lao Động Toàn Quỹ</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý các loại hợp đồng lao động và theo dõi thời hạn tái ký hợp đồng
              </p>
            </div>

            {contractStats.expiringContracts.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>{contractStats.expiringContracts.length} hợp đồng cần lưu ý tái ký</span>
              </span>
            )}
          </div>

          {/* Biểu đồ phân bổ tỷ lệ các loại HĐLĐ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {contractStats.items.map((item) => (
              <div key={item.key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <span className="font-black text-emerald-800 tabular-nums">
                    {item.count} ({item.percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-700 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Cảnh báo các hợp đồng sắp hết hạn */}
          {contractStats.expiringContracts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Danh sách hợp đồng lao động cần chuẩn bị tái ký (trong vòng 60 ngày hoặc quá hạn):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {contractStats.expiringContracts.map((c, i) => (
                  <div 
                    key={i}
                    onClick={() => onSelectEmployeeForProfile?.(c.employeeId)}
                    className="p-2.5 bg-white rounded-lg border border-amber-200 flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{c.employeeName}</div>
                      <div className="text-[11px] text-slate-500">
                        Số HĐ: {c.contractNumber} • {c.contractType}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        c.isExpired ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.isExpired ? 'Đã hết hạn' : `Hết hạn: ${formatDateVN(c.expirationDate)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. KHỐI BẢNG GIÁM SÁT LUÂN CHUYỂN ĐỊA BÀN CÁN BỘ TÍN DỤNG (CBTD) */}
      {showCreditRotationMonitoring && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-700" />
                <span>Bảng Giám Sát Luân Chuyển Địa Bàn Cán Bộ Tín Dụng (CBTD)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi thời gian phụ trách địa bàn và chu kỳ luân chuyển cán bộ tín dụng (Nhấn vào hàng cán bộ để xem hồ sơ chi tiết)
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
              Hiện không có Cán bộ tín dụng nào thuộc diện luân chuyển địa bàn hoặc toàn bộ CBTD đang trong thời hạn an toàn.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-2.5 px-3 text-center w-12">STT</th>
                    <th className="py-2.5 px-3">Họ và tên</th>
                    <th className="py-2.5 px-3">Chức vụ &amp; Địa bàn quản lý</th>
                    <th className="py-2.5 px-3">Ngày nhận địa bàn</th>
                    <th className="py-2.5 px-3">Thâm niên địa bàn</th>
                    <th className="py-2.5 px-3">Chu kỳ luân chuyển</th>
                    <th className="py-2.5 px-3 text-right">Trạng thái theo dõi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transferMonitoringList.map((row, idx) => (
                    <tr 
                      key={row.id}
                      onClick={() => onSelectEmployeeForProfile?.(row.id)}
                      className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <span>{row.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                        </div>
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
                            Đến hạn đổi địa bàn
                          </span>
                        ) : row.isNear ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            <Clock className="w-3.5 h-3.5" />
                            Sắp đến hạn (&lt; {row.warningMonths} tháng)
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
      )}

      {/* 4. KHỐI CƠ CẤU TRÌNH ĐỘ CHUYÊN MÔN / HỌC VẤN */}
      {showEducationStructure && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span>Cơ Cấu Trình Độ Chuyên Môn &amp; Học Vị Toàn Quỹ</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Văn bằng cao nhất theo quy định NHNN
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {educationStats.map((item) => (
              <div key={item.key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <span className="font-black text-emerald-800 tabular-nums">
                    {item.count} người ({item.percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-700 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. KHỐI CƠ CẤU PHÂN BỔ NHÂN SỰ THEO PHÒNG BAN */}
      {showDepartmentDistribution && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Cơ Cấu Phân Bổ Nhân Sự Theo Bộ Phận / Phòng Ban</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Tỷ lệ cơ cấu phòng ban hoạt động
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departmentStats.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.name}</span>
                  <span className="font-black text-emerald-800 tabular-nums">
                    {item.count} cán bộ ({item.percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-700 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(EmployeeOverviewTab);

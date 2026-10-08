import React from 'react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import EmployeeBadge from '../../../components/common/EmployeeBadge';
import { formatDateTimeVN } from '../../../lib/dateUtils';

const DashboardRecentActivitiesTable = ({
  trustData = [],
  kpiData = [],
  planningData = [],
}) => {
  // Combine top recent records from trust, kpi and planning
  const recentRows = [
    ...trustData.slice(0, 3).map((t) => ({
      type: 'Tín nhiệm (Module A)',
      typeVariant: 'tot',
      person: t.targetEmployeeName,
      code: t.targetEmployeeCode,
      dept: t.targetDepartment,
      result: `${t.totalScore} đ (${t.classification})`,
      author: t.evaluatorName,
      time: t.createdAt,
    })),
    ...kpiData.slice(0, 3).map((k) => ({
      type: 'KPI (Module B)',
      typeVariant: 'completed',
      person: k.employeeName,
      code: k.employeeCode,
      dept: k.department,
      result: k.finalScore ? `${k.finalScore} điểm (Tổng kết)` : `Tự chấm ${k.scoreSelf} đ`,
      author: k.status === 'completed' ? 'Chủ tịch HĐQT' : 'Cán bộ',
      time: k.updatedAt || k.createdAt,
    })),
    ...planningData.slice(0, 2).map((p) => ({
      type: 'Quy hoạch (Module C)',
      typeVariant: 'warning',
      person: p.candidateName,
      code: '',
      dept: p.department,
      result: p.vote,
      author: p.voterName,
      time: p.createdAt,
    })),
  ];

  return (
    <Card
      title="Hoạt Động Đánh Giá Gần Đây Trong Toàn Hệ Thống"
      subtitle="Tổng hợp các giao dịch dữ liệu mới nhất được đồng bộ qua onSnapshot"
    >
      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
            <tr>
              <th className="py-3 px-6">Phân hệ</th>
              <th className="py-3 px-4">Nhân sự liên quan</th>
              <th className="py-3 px-4">Phòng ban</th>
              <th className="py-3 px-4 text-center">Kết quả / Điểm số</th>
              <th className="py-3 px-4">Người ghi nhận</th>
              <th className="py-3 px-6 text-right">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-6">
                  <Badge variant={row.typeVariant} size="sm">
                    {row.type}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <EmployeeBadge
                    employee={{
                      name: row.person,
                      code: row.code,
                      department: row.dept,
                    }}
                    size="xs"
                    showCode={Boolean(row.code)}
                  />
                </td>
                <td className="py-3 px-4 text-slate-600">{row.dept}</td>
                <td className="py-3 px-4 text-center font-bold text-[#0f766e]">
                  {row.result}
                </td>
                <td className="py-3 px-4 text-slate-600">{row.author}</td>
                <td className="py-3 px-6 text-right text-slate-400 text-[11px]">
                  {formatDateTimeVN(row.time)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default React.memo(DashboardRecentActivitiesTable);

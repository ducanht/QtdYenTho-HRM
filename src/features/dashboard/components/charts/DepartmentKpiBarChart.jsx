import React from 'react';
import { BarChart2 } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import Card from '../../../../components/common/Card';
import Spinner from '../../../../components/common/Spinner';

const DepartmentKpiBarChart = ({
  loading = false,
  departmentKpiBarData = [],
}) => {
  return (
    <Card
      title="So Sánh Điểm KPI Trung Bình Giữa Các Phòng Ban"
      subtitle="Thang điểm 100 • Dựa trên tổng hợp điểm tự chấm và các cấp duyệt"
      action={<BarChart2 className="w-4 h-4 text-[#0f766e]" />}
    >
      {loading ? (
        <div className="h-72 flex items-center justify-center">
          <Spinner text="Đang tổng hợp điểm số các phòng ban..." />
        </div>
      ) : departmentKpiBarData.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-xs text-slate-400">
          Chưa có dữ liệu KPI của phòng ban
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={departmentKpiBarData}
              margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="department"
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickCount={6}
              />
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} điểm (${props.payload.soNhanSu} cán bộ)`,
                  'Điểm KPI Trung Bình',
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.fullName;
                  }
                  return label;
                }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar
                dataKey="Điểm KPI"
                fill="#0f766e"
                radius={[6, 6, 0, 0]}
                barSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default React.memo(DepartmentKpiBarChart);

import React from 'react';
import { PieChart as PieIcon } from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from 'recharts';
import Card from '../../../../components/common/Card';
import Spinner from '../../../../components/common/Spinner';

const TrustClassificationPieChart = ({
  loading = false,
  trustDataLength = 0,
  trustPieData = [],
}) => {
  return (
    <Card
      title="Cơ Cấu Phân Loại Tín Nhiệm Cán Bộ"
      subtitle="Tỷ lệ % xếp loại: Xuất sắc, Tốt, Hoàn thành, Không hoàn thành"
      action={<PieIcon className="w-4 h-4 text-[#0f766e]" />}
    >
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spinner text="Đang vẽ biểu đồ phân loại..." />
        </div>
      ) : trustDataLength === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          Chưa có dữ liệu đánh giá tín nhiệm
        </div>
      ) : (
        <div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trustPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {trustPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} lượt đánh giá`, name]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-xs">
            {trustPieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-md shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default React.memo(TrustClassificationPieChart);

import React from 'react';
import { Save } from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';

/**
 * Cấu hình chuyên sâu Phân hệ Đánh giá KPI 3 Cấp (Tỷ Trọng 40-30-30)
 */
const KpiSubsystemSettings = ({ kpiConfig, setKpiConfig, onSaveConfig, isSaving }) => {
  const totalWeight =
    (Number(kpiConfig.weightSelf) || 0) +
    (Number(kpiConfig.weightManager) || 0) +
    (Number(kpiConfig.weightChairman) || 0);

  return (
    <Card
      title="Cấu Hình Chuyên Sâu: Phân Hệ Chấm Điểm KPI 3 Cấp (Tỷ Trọng 40-30-30)"
      headerRight={
        <Button
          variant="primary"
          size="sm"
          icon={Save}
          isLoading={isSaving}
          onClick={() => onSaveConfig(kpiConfig)}
          className="font-bold text-xs"
        >
          Lưu cấu hình KPI
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-2">
            <span className="text-xs font-bold text-blue-900 uppercase block">Cấp 1: Cán Bộ Tự Chấm</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={kpiConfig.weightSelf ?? 40}
                onChange={(e) =>
                  setKpiConfig((prev) => ({ ...prev, weightSelf: Number(e.target.value) }))
                }
                className="w-20 p-2 text-sm font-bold bg-white border border-blue-300 rounded-xl text-center"
              />
              <span className="text-xs font-bold text-blue-900">%</span>
            </div>
            <p className="text-[11px] text-blue-700">Cán bộ tự đánh giá mức độ hoàn thành chỉ tiêu giao trong kỳ.</p>
          </div>

          <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-2">
            <span className="text-xs font-bold text-indigo-900 uppercase block">Cấp 2: Ban Điều Hành (Giám đốc)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={kpiConfig.weightManager ?? 30}
                onChange={(e) =>
                  setKpiConfig((prev) => ({ ...prev, weightManager: Number(e.target.value) }))
                }
                className="w-20 p-2 text-sm font-bold bg-white border border-indigo-300 rounded-xl text-center"
              />
              <span className="text-xs font-bold text-indigo-900">%</span>
            </div>
            <p className="text-[11px] text-indigo-700">Giám đốc trực tiếp thẩm tra hồ sơ và chấm điểm năng suất công tác.</p>
          </div>

          <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50 space-y-2">
            <span className="text-xs font-bold text-purple-900 uppercase block">Cấp 3: Chủ Tịch HĐQT Phê Chuẩn</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={kpiConfig.weightChairman ?? 30}
                onChange={(e) =>
                  setKpiConfig((prev) => ({ ...prev, weightChairman: Number(e.target.value) }))
                }
                className="w-20 p-2 text-sm font-bold bg-white border border-purple-300 rounded-xl text-center"
              />
              <span className="text-xs font-bold text-purple-900">%</span>
            </div>
            <p className="text-[11px] text-purple-700">Chủ tịch HĐQT xem xét toàn diện và phê chuẩn kết quả xếp loại cuối cùng.</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-100 flex items-center justify-between text-xs font-bold">
          <span>Tổng tỷ trọng hiện tại:</span>
          <span
            className={`text-sm ${
              totalWeight === 100 ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'
            }`}
          >
            {totalWeight}% {totalWeight === 100 ? '(Hợp lệ: 100%)' : '(Chưa chuẩn: Phải bằng 100%)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Chu kỳ đánh giá:</label>
            <select
              value={kpiConfig.evaluationPeriod || 'MONTHLY'}
              onChange={(e) =>
                setKpiConfig((prev) => ({ ...prev, evaluationPeriod: e.target.value }))
              }
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              <option value="MONTHLY">Đánh giá hàng tháng (Theo chu kỳ lương kinh doanh)</option>
              <option value="QUARTERLY">Đánh giá hàng quý (3 tháng/lần)</option>
            </select>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Hạn nộp bảng tự chấm hàng tháng:</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Ngày</span>
              <input
                type="number"
                value={kpiConfig.dueDayOfMonth ?? 25}
                onChange={(e) =>
                  setKpiConfig((prev) => ({ ...prev, dueDayOfMonth: Number(e.target.value) }))
                }
                className="w-16 p-2 text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl text-center"
              />
              <span className="text-xs text-slate-500">hàng tháng</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default KpiSubsystemSettings;

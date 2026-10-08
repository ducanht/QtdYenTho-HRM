import React from 'react';
import { Save } from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';

/**
 * Cấu hình chuyên sâu Phân hệ Tiền Lương & Đãi Ngộ Cán Bộ
 */
const PayrollSubsystemSettings = ({
  payrollConfig,
  setPayrollConfig,
  onSaveConfig,
  isSaving
}) => {
  return (
    <Card
      title="Cấu Hình Chuyên Sâu: Phân Hệ Tiền Lương & Đãi Ngộ Cán Bộ (Đang Triển Khai)"
      headerRight={
        <Button
          variant="primary"
          size="sm"
          icon={Save}
          isLoading={isSaving}
          onClick={() => onSaveConfig(payrollConfig)}
          className="font-bold text-xs"
        >
          Lưu cấu hình Tiền Lương
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
          <span className="text-xs font-bold text-slate-800 uppercase block">Tỷ trọng lương KPI:</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={payrollConfig.kpiSalaryWeight ?? 30}
              onChange={(e) =>
                setPayrollConfig((prev) => ({ ...prev, kpiSalaryWeight: Number(e.target.value) }))
              }
              className="w-20 p-2 text-sm font-bold bg-white border border-slate-300 rounded-xl text-center"
            />
            <span className="text-xs font-bold text-slate-700">% lương kinh doanh</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
          <span className="text-xs font-bold text-slate-800 uppercase block">Trích nộp BHXH cá nhân:</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={payrollConfig.socialInsuranceRate ?? 10.5}
              onChange={(e) =>
                setPayrollConfig((prev) => ({
                  ...prev,
                  socialInsuranceRate: Number(e.target.value)
                }))
              }
              className="w-20 p-2 text-sm font-bold bg-white border border-slate-300 rounded-xl text-center"
            />
            <span className="text-xs font-bold text-slate-700">% lương cơ bản</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
          <span className="text-xs font-bold text-slate-800 uppercase block">Ngày chi trả lương:</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Ngày</span>
            <input
              type="number"
              value={payrollConfig.payDayOfMonth ?? 10}
              onChange={(e) =>
                setPayrollConfig((prev) => ({ ...prev, payDayOfMonth: Number(e.target.value) }))
              }
              className="w-16 p-2 text-sm font-bold bg-white border border-slate-300 rounded-xl text-center"
            />
            <span className="text-xs text-slate-500">hàng tháng</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PayrollSubsystemSettings;

import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';

/**
 * Cấu hình chuyên sâu Phân hệ Bỏ Phiếu Quy Hoạch Cán Bộ Nguồn (Nhiệm Kỳ 5 Năm)
 */
const PlanningSubsystemSettings = ({
  planningConfig,
  setPlanningConfig,
  planningPositions,
  onSaveConfig,
  isSaving,
  onAddPlanningPos,
  onRemovePlanningPos
}) => {
  const [newPos, setNewPos] = useState('');

  const handleAdd = () => {
    if (!newPos.trim()) return;
    onAddPlanningPos(newPos.trim());
    setNewPos('');
  };

  return (
    <Card
      title="Cấu Hình Chuyên Sâu: Phân Hệ Bỏ Phiếu Quy Hoạch Cán Bộ Nguồn (Nhiệm Kỳ 5 Năm)"
      headerRight={
        <Button
          variant="primary"
          size="sm"
          icon={Save}
          isLoading={isSaving}
          onClick={() => onSaveConfig(planningConfig)}
          className="font-bold text-xs"
        >
          Lưu cấu hình Quy Hoạch
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Ngưỡng trúng quy hoạch */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-purple-200 bg-purple-50/50">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-purple-950">
              Tỷ lệ phiếu tín nhiệm tối thiểu để trúng quy hoạch bổ nhiệm:
            </h4>
            <p className="text-[11px] text-purple-800">
              Ứng viên phải đạt trên tỷ lệ này mới đủ điều kiện lập hồ sơ trình Ban Thường vụ và NHNN Chi nhánh tỉnh phê chuẩn.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={planningConfig.thresholdPercent ?? 50}
              onChange={(e) =>
                setPlanningConfig((prev) => ({ ...prev, thresholdPercent: Number(e.target.value) }))
              }
              className="w-20 p-2 text-sm font-bold bg-white border border-purple-300 rounded-xl text-center"
            />
            <span className="text-xs font-bold text-purple-900">% số phiếu hợp lệ</span>
          </div>
        </div>

        {/* Danh mục chức danh quy hoạch */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Danh Mục Chức Danh Lấy Phiếu Quy Hoạch:
          </h4>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Nhập tên chức danh quy hoạch mới (VD: Phó Chủ tịch HĐQT, Phó Giám đốc)..."
              value={newPos}
              onChange={(e) => setNewPos(e.target.value)}
              className="flex-1 p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <Button variant="primary" size="sm" icon={Plus} onClick={handleAdd}>
              Thêm chức danh
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {(planningPositions || []).map((pos, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-2xs"
              >
                <span className="text-xs font-bold text-slate-800">{pos}</span>
                <button
                  type="button"
                  onClick={() => onRemovePlanningPos(pos)}
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  title="Xóa chức danh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PlanningSubsystemSettings;

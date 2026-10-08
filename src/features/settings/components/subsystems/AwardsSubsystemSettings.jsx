import React from 'react';
import { Save } from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';

/**
 * Cấu hình chuyên sâu Phân hệ Thi Đua & Khen Thưởng Cuối Năm
 */
const AwardsSubsystemSettings = ({
  awardsConfig,
  onSaveConfig,
  isSaving
}) => {
  return (
    <Card
      title="Cấu Hình Chuyên Sâu: Phân Hệ Thi Đua & Khen Thưởng Cuối Năm (Đang Triển Khai)"
      headerRight={
        <Button
          variant="primary"
          size="sm"
          icon={Save}
          isLoading={isSaving}
          onClick={() => onSaveConfig(awardsConfig)}
          className="font-bold text-xs"
        >
          Lưu cấu hình Thi Đua
        </Button>
      }
    >
      <div className="space-y-3">
        {(awardsConfig.titles || []).map((t) => (
          <div
            key={t.id}
            className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-4 shadow-2xs"
          >
            <div>
              <h4 className="text-xs font-black text-slate-900">{t.name}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Tiêu chuẩn: {t.condition}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block">Định mức thưởng:</span>
              <span className="text-xs font-black text-emerald-700">
                {Number(t.bonus).toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AwardsSubsystemSettings;

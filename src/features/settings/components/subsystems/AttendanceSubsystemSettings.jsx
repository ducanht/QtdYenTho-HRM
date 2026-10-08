import React from 'react';
import { Save } from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';

/**
 * Cấu hình chuyên sâu Phân hệ Chấm Công & Ca Trực Kho Quỹ
 */
const AttendanceSubsystemSettings = ({
  attendanceConfig,
  setAttendanceConfig,
  onSaveConfig,
  isSaving
}) => {
  return (
    <Card
      title="Cấu Hình Chuyên Sâu: Phân Hệ Chấm Công & Ca Trực Kho Quỹ (Đang Triển Khai)"
      headerRight={
        <Button
          variant="primary"
          size="sm"
          icon={Save}
          isLoading={isSaving}
          onClick={() => onSaveConfig(attendanceConfig)}
          className="font-bold text-xs"
        >
          Lưu cấu hình Chấm Công
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase block">Ca sáng tại quầy:</span>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={attendanceConfig.morningShiftStart || '07:30'}
                onChange={(e) =>
                  setAttendanceConfig((prev) => ({ ...prev, morningShiftStart: e.target.value }))
                }
                className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
              />
              <span className="text-xs text-slate-500">đến</span>
              <input
                type="time"
                value={attendanceConfig.morningShiftEnd || '11:30'}
                onChange={(e) =>
                  setAttendanceConfig((prev) => ({ ...prev, morningShiftEnd: e.target.value }))
                }
                className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase block">Ca chiều tại quầy:</span>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={attendanceConfig.afternoonShiftStart || '13:30'}
                onChange={(e) =>
                  setAttendanceConfig((prev) => ({ ...prev, afternoonShiftStart: e.target.value }))
                }
                className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
              />
              <span className="text-xs text-slate-500">đến</span>
              <input
                type="time"
                value={attendanceConfig.afternoonShiftEnd || '17:00'}
                onChange={(e) =>
                  setAttendanceConfig((prev) => ({ ...prev, afternoonShiftEnd: e.target.value }))
                }
                className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2">
          <span className="text-xs font-bold text-amber-950 uppercase block">
            Trực bảo vệ & Kho quỹ ban đêm:
          </span>
          <p className="text-xs text-amber-800">
            Khung giờ trực két sắt ngoài giờ hành chính: <strong>17:00</strong> chiều đến{' '}
            <strong>07:30</strong> sáng hôm sau.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AttendanceSubsystemSettings;

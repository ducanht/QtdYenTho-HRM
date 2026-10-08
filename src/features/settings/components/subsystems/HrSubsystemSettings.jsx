import React from 'react';
import { Save } from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';

/**
 * Cấu hình chuyên sâu Phân hệ Nhân Sự & Luân Chuyển Cán Bộ (Quy chế NHNN)
 */
const HrSubsystemSettings = ({ hrConfig, setHrConfig, onSaveConfig, isSaving }) => {
  return (
    <Card
      title="Cấu Hình Chuyên Sâu: Phân Hệ Nhân Sự & Luân Chuyển Cán Bộ (Quy chế NHNN)"
      headerRight={
        <Button
          variant="primary"
          size="sm"
          icon={Save}
          isLoading={isSaving}
          onClick={() => onSaveConfig(hrConfig)}
          className="font-bold text-xs"
        >
          Lưu cấu hình Nhân Sự
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 space-y-3">
            <span className="text-xs font-bold text-teal-950 uppercase tracking-wider block">
              Chu Kỳ Luân Chuyển Bắt Buộc Địa Bàn Tín Dụng
            </span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={hrConfig.transferCycleMonths ?? 36}
                onChange={(e) =>
                  setHrConfig((prev) => ({ ...prev, transferCycleMonths: Number(e.target.value) }))
                }
                className="w-20 p-2 text-sm font-bold bg-white border border-teal-300 rounded-xl text-center"
              />
              <span className="text-xs font-bold text-teal-900">
                tháng (tương đương 3 năm theo chỉ đạo NHNN)
              </span>
            </div>
            <p className="text-[11px] text-teal-700">
              Cán bộ phụ trách địa bàn sau thời hạn này bắt buộc phải điều chuyển sang cụm thôn/xã khác để phòng ngừa rủi ro đạo đức.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
              Thời Gian Cảnh Báo Sắp Đến Hạn Luân Chuyển
            </span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={hrConfig.warningDaysBefore ?? 90}
                onChange={(e) =>
                  setHrConfig((prev) => ({ ...prev, warningDaysBefore: Number(e.target.value) }))
                }
                className="w-20 p-2 text-sm font-bold bg-white border border-amber-300 rounded-xl text-center"
              />
              <span className="text-xs font-bold text-amber-900">ngày trước khi hết chu kỳ</span>
            </div>
            <p className="text-[11px] text-amber-700">
              Hệ thống tự động phát cảnh báo màu vàng tại trang Nhân sự để Ban Lãnh đạo chủ động xây dựng phương án nhân sự.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Quy Định Biên Bản Bàn Giao Nợ & Hồ Sơ Thế Chấp
          </span>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
            <input
              type="checkbox"
              checked={hrConfig.requireDebtHandover ?? true}
              onChange={(e) =>
                setHrConfig((prev) => ({ ...prev, requireDebtHandover: e.target.checked }))
              }
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span>Bắt buộc có biên bản bàn giao dư nợ đầy đủ trước khi cấp quyền trên địa bàn mới</span>
          </label>
          <p className="text-[11px] text-slate-500">
            Đảm bảo không phát sinh tranh chấp hoặc thất thoát hồ sơ vay vốn giữa cán bộ cũ và cán bộ mới tiếp nhận.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default HrSubsystemSettings;

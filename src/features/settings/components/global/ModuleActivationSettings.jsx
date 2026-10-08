import React from 'react';
import { CheckCircle2, Lock, Power } from 'lucide-react';
import Card from '../../../../components/common/Card';

/**
 * Tab 3: Quản lý kích hoạt các phân hệ trên Cổng Portal (Registry & Feature Flags)
 */
const ModuleActivationSettings = ({
  modulesList,
  onToggleStatus,
  canToggleModules
}) => {
  return (
    <Card title="Quản Lý Kích Hoạt Các Phân Hệ Trên Cổng Portal (Registry & Feature Flags)">
      {/* Thông báo phân quyền */}
      {canToggleModules ? (
        <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Đặc quyền SuperAdmin (qtdyentho@gmail.com):</strong> Đồng chí có toàn quyền kích hoạt hoặc tạm ẩn các phân hệ webapp theo tiến độ vận hành.
          </span>
        </div>
      ) : (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Phân định quyền hạn:</strong> Chỉ tài khoản Quản trị Cấp cao duy nhất (<strong>qtdyentho@gmail.com</strong>) mới có quyền bật/tắt các phân hệ webapp. Ban Quản trị & Điều hành đang ở chế độ xem trạng thái vận hành.
          </span>
        </div>
      )}

      <p className="text-xs text-slate-500 mb-4">
        Kích hoạt đưa vào sử dụng ngay lập tức hoặc tạm ẩn các phân hệ webapp khi đang bảo trì hoặc đang trong giai đoạn triển khai.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modulesList.map((mod) => {
          const isCoreModule = mod.code === 'MODULE_SETTINGS' || mod.isCore || mod.isSystemCore;
          const isActive = isCoreModule ? true : mod.status === 'ACTIVE';

          return (
            <div
              key={mod.code}
              className={`p-4 rounded-2xl border transition-all ${
                isCoreModule
                  ? 'border-teal-400 bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/40 shadow-xs ring-1 ring-teal-300/40'
                  : isActive
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isCoreModule
                          ? 'bg-teal-600 animate-pulse'
                          : isActive
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                    />
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      {mod.name}
                      {isCoreModule && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                          Core
                        </span>
                      )}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {isCoreModule
                      ? 'Module Cốt lõi Quản trị Hệ thống & Tham số toàn Quỹ. Nền tảng vận hành bắt buộc 24/7 và không thể bật/tắt.'
                      : mod.description}
                  </p>
                </div>

                {/* Điều khiển Bật/Tắt hoặc Huy hiệu Cốt lõi */}
                <div className="shrink-0 flex items-center">
                  {isCoreModule ? (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-teal-700 text-white uppercase tracking-wider shadow-2xs">
                      Cốt lõi 24/7
                    </span>
                  ) : canToggleModules ? (
                    <button
                      type="button"
                      onClick={() => onToggleStatus(mod.code, mod.status)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                      title={isActive ? 'Bấm để chuyển sang Kế hoạch triển khai' : 'Bấm để kích hoạt Vận hành'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Đang bật' : 'Đang tắt'}</span>
                    </button>
                  ) : (
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isActive ? 'Vận hành' : 'Kế hoạch'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ModuleActivationSettings;

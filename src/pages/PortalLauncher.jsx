import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  Vote, 
  LayoutDashboard, 
  Clock, 
  Coins, 
  Award, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Database,
  Calendar,
  Layers,
  Info,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SYSTEM_MODULES, canAccessModule } from '../lib/permissions';
import { ROLE_LABELS } from '../lib/constants';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import AutoInitDbModal from '../components/common/AutoInitDbModal';

// Map icon component từ tên chuỗi
const ICON_MAP = {
  ShieldCheck,
  Users,
  TrendingUp,
  Vote,
  LayoutDashboard,
  Clock,
  Coins,
  Award,
  Settings,
};

const PortalLauncher = () => {
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();
  const toast = useToast();
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // Danh sách các phân hệ (Data-Driven: chuyển đổi từ object SYSTEM_MODULES)
  const modulesList = Object.values(SYSTEM_MODULES);

  const activeModulesCount = modulesList.filter((m) => m.status === 'ACTIVE').length;
  const plannedModulesCount = modulesList.filter((m) => m.status === 'PLANNED').length;

  const handleModuleClick = (mod) => {
    if (mod.status !== 'ACTIVE') {
      toast.info(
        `Phân hệ [${mod.name}] đang trong kế hoạch nâng cấp giai đoạn 2. Cơ sở dữ liệu đã sẵn sàng kết nối!`
      );
      return;
    }

    if (!canAccessModule(role, mod.code)) {
      toast.error(`Đồng chí không có quyền truy cập vào phân hệ [${mod.name}]. Vui lòng liên hệ Lãnh đạo Quỹ!`);
      return;
    }

    if (mod.route) {
      navigate(mod.route);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl border border-amber-400/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 rounded-full bg-emerald-400/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white p-1.5 shadow-xl border-2 border-amber-400/80 shrink-0 flex items-center justify-center">
              <img src="/logo.png" alt="Logo Quỹ TDND Yên Thọ" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/20 border border-amber-400/30">
                  Hệ Thống Quản Trị Nhân Sự & Đánh Giá Tín Nhiệm
                </span>
                <span className="text-emerald-200 text-xs hidden sm:inline">•</span>
                <span className="text-xs text-emerald-100 hidden sm:inline">QTDND Yên Thọ</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Xin chào, đồng chí {currentUser?.name || 'Cán bộ Quỹ'}!
              </h2>

              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                Đồng chí đang đăng nhập với chức danh: <strong className="text-amber-300">{currentUser?.position}</strong> ({currentUser?.department}) • Vai trò hệ thống: <strong className="text-white">{ROLE_LABELS[role] || role}</strong>.
              </p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center min-w-[110px]">
              <span className="block text-2xl font-black text-amber-300">{activeModulesCount}</span>
              <span className="text-[10px] uppercase font-bold text-emerald-100 tracking-wider">
                Phân hệ vận hành
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center min-w-[110px]">
              <span className="block text-2xl font-black text-white">{plannedModulesCount}</span>
              <span className="text-[10px] uppercase font-bold text-emerald-100 tracking-wider">
                Sẵn sàng CSDL
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsDbModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-4 py-3 rounded-2xl text-xs transition-colors shadow-lg cursor-pointer flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
            >
              <Database className="w-4 h-4" />
              <span>Tự động CSDL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#059669]" />
            <span>Danh Mục Phân Hệ Nghiệp Vụ (Application Hub)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Lựa chọn phân hệ cần tác nghiệp • Hệ thống tự động cập nhật khi có module mới
          </p>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Tổng số: <strong className="text-slate-800">{modulesList.length}</strong> phân hệ
        </div>
      </div>

      {/* DYNAMIC GRID LAUNCHER: Tự động render toàn bộ modules dưới dạng ô lưới */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modulesList.map((mod) => {
          const IconComponent = ICON_MAP[mod.icon] || ShieldCheck;
          const isActive = mod.status === 'ACTIVE';
          const hasAccess = canAccessModule(role, mod.code);

          return (
            <div
              key={mod.code}
              onClick={() => handleModuleClick(mod)}
              className={`group relative rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                isActive
                  ? hasAccess
                    ? 'bg-white hover:bg-emerald-50/40 border-slate-200/90 hover:border-[#059669] shadow-xs hover:shadow-xl hover:-translate-y-1.5'
                    : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 opacity-90'
                  : 'bg-slate-50/60 border-dashed border-slate-300 hover:border-amber-300 hover:bg-amber-50/30'
              }`}
            >
              <div>
                {/* Header Card: Icon + Status Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105 ${
                      isActive
                        ? mod.color === 'emerald'
                          ? 'bg-emerald-100 text-[#047857] border border-emerald-300 group-hover:bg-[#047857] group-hover:text-white'
                          : mod.color === 'blue'
                          ? 'bg-blue-100 text-blue-700 border border-blue-300 group-hover:bg-blue-600 group-hover:text-white'
                          : mod.color === 'purple'
                          ? 'bg-purple-100 text-purple-700 border border-purple-300 group-hover:bg-purple-600 group-hover:text-white'
                          : mod.color === 'amber'
                          ? 'bg-amber-100 text-amber-700 border border-amber-300 group-hover:bg-amber-600 group-hover:text-white'
                          : 'bg-teal-100 text-teal-700 border border-teal-300 group-hover:bg-teal-700 group-hover:text-white'
                        : 'bg-slate-200 text-slate-600 border border-slate-300'
                    }`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        mod.code === 'MODULE_SETTINGS' || mod.isCore
                          ? 'bg-teal-100 text-teal-900 border border-teal-300'
                          : isActive
                          ? 'bg-emerald-100 text-[#047857] border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {mod.code === 'MODULE_SETTINGS' || mod.isCore ? 'Hệ thống Cốt lõi' : isActive ? 'Đang vận hành' : 'Sẵn sàng CSDL'}
                    </span>
                    {mod.badge && (
                      <span className="text-[10px] font-semibold text-slate-400">
                        {mod.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Module Title & Description */}
                <div className="space-y-2">
                  <h4 className="text-base font-black text-slate-900 group-hover:text-[#047857] transition-colors line-clamp-1">
                    {mod.name}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {mod.description}
                  </p>
                </div>

                {/* Features Pills */}
                {mod.features && mod.features.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {mod.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-white group-hover:border group-hover:border-slate-200 transition-colors"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Card: Access Status & Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {!isActive ? (
                    <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Quy hoạch GĐ2
                    </span>
                  ) : !hasAccess ? (
                    <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      Quyền Lãnh đạo
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Được phép truy cập
                    </span>
                  )}
                </div>

                <div
                  className={`text-xs font-bold inline-flex items-center gap-1 transition-transform group-hover:translate-x-1 ${
                    isActive && hasAccess
                      ? 'text-[#047857]'
                      : 'text-slate-400'
                  }`}
                >
                  <span>{isActive && hasAccess ? 'Truy cập' : 'Chi tiết'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Thông tin hỗ trợ & CSDL Module */}
      <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#047857] shrink-0" />
          <span>
            Hệ thống thiết kế theo kiến trúc <strong>Data-Driven Modular</strong>. Khi Ban Quản trị phê duyệt bổ sung phân hệ mới, ô lưới truy cập sẽ tự động hiển thị và kết nối CSDL ngay lập tức.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsDbModalOpen(true)}
          className="text-xs font-bold text-[#047857] hover:underline shrink-0"
        >
          Xem cấu trúc CSDL 9 bảng →
        </button>
      </div>

      {/* Modal Tự Động CSDL */}
      <AutoInitDbModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} />
    </div>
  );
};

export default PortalLauncher;

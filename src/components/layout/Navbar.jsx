import { 
  Menu, 
  Bell, 
  UserCheck, 
  ChevronDown, 
  Shield, 
  Building, 
  Award,
  RefreshCw,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, ROLES } from '../../lib/mockData';
import Badge from '../common/Badge';
import AutoInitDbModal from '../common/AutoInitDbModal';

const Navbar = ({ onToggleSidebar }) => {
  const { currentUser, role, isDemoMode, switchDemoAccount } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Hamburger & Header Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#0f766e] uppercase tracking-wider hidden sm:inline">
                Quỹ Tín Dụng Nhân Dân Yên Thọ
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-xs text-slate-500 font-medium">Hệ Thống HRM 2026</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              Cổng Đánh Giá Tín Nhiệm & Quản Trị Nhân Sự
            </h1>
          </div>
        </div>

        {/* Right: Tự động CSDL + Quick Switch Role + User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Nút Khởi tạo & Cập nhật CSDL Tự Động */}
          <button
            type="button"
            onClick={() => setIsDbModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50/60 text-slate-700 hover:text-[#0f766e] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Khởi tạo & Cập nhật toàn bộ 9 bảng CSDL tự động"
          >
            <Database className="w-3.5 h-3.5 text-[#0f766e]" />
            <span className="hidden sm:inline">Tự động CSDL</span>
          </button>

          {/* Quick Role Switcher Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 text-[#0f766e] text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Nhấn để đổi vai trò thử nghiệm"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#0f766e]" />
              <span className="hidden md:inline">Đổi vai trò:</span>
              <span className="underline decoration-teal-400 font-bold">
                {ROLE_LABELS[role] || role}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {/* Dropdown Menu to switch test account */}
            {showRoleMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-40 text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">
                      Chuyển đổi phân quyền thử nghiệm
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Trải nghiệm góc nhìn của từng cấp độ
                    </p>
                  </div>

                  <div className="py-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoAccount('canbo@qtdyentho.vn');
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        role === ROLES.STAFF
                          ? 'bg-teal-50 text-[#0f766e] font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">Cán bộ (Staff)</div>
                        <div className="text-[10px] text-slate-400">
                          Nguyễn Văn An • Tín dụng
                        </div>
                      </div>
                      <Badge variant="default" size="sm">
                        Staff
                      </Badge>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        switchDemoAccount('quanly@qtdyentho.vn');
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        role === ROLES.MANAGER
                          ? 'bg-teal-50 text-[#0f766e] font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">Ban điều hành (Manager)</div>
                        <div className="text-[10px] text-slate-400">
                          Trần Thị Mai • Giám đốc
                        </div>
                      </div>
                      <Badge variant="primary" size="sm">
                        Manager
                      </Badge>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        switchDemoAccount('chutich@qtdyentho.vn');
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        role === ROLES.CHAIRMAN
                          ? 'bg-teal-50 text-[#0f766e] font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">Chủ tịch HĐQT (Chairman)</div>
                        <div className="text-[10px] text-slate-400">
                          Lê Đình Hải • HĐQT
                        </div>
                      </div>
                      <Badge variant="danger" size="sm">
                        Chairman
                      </Badge>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Avatar Circle */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#0f766e] text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentUser.name?.charAt(0) || 'U'
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  {currentUser.department}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tự động Khởi tạo & Cập nhật CSDL */}
      <AutoInitDbModal 
        isOpen={isDbModalOpen} 
        onClose={() => setIsDbModalOpen(false)} 
      />
    </header>
  );
};

export default Navbar;

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  Users,
  Briefcase,
  Shield,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isDemoMode, role } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = location.state?.from?.pathname || '/portal';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ Email.');
      return;
    }
    if (!password.trim() && !isDemoMode) {
      setErrorMsg('Vui lòng nhập Mật khẩu bảo mật.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await login(email, password);
      toast.success(`Đăng nhập thành công! Kính chào đồng chí ${res.user.name}`);
      
      // Sau khi đăng nhập luôn điều hướng về Cổng Phân Hệ Ô Lưới (/portal)
      navigate('/portal', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập không thành công.');
    } finally {
      setLoading(false);
    }
  };

  // Đăng nhập nhanh theo các vai trò chuẩn nội bộ Quỹ
  const handleQuickLogin = async (quickEmail, defaultRole) => {
    setEmail(quickEmail);
    setPassword('123456');
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await login(quickEmail, '123456');
      toast.success(`Đăng nhập phân quyền: ${res.user.position} (${res.user.role?.toUpperCase()})`);
      navigate('/portal', { replace: true });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#064e3b] via-[#022c22] to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Brand Light Effects (Emerald & Amber Gold) */}
      <div className="absolute top-0 -left-32 w-96 h-96 bg-[#059669]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-[#f59e0b]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-[#047857]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Unit Branding - Chuẩn phong cách QTDND Yên Thọ */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#047857] via-[#059669] to-[#10b981] text-amber-300 shadow-2xl shadow-emerald-950/80 mb-4 border-2 border-amber-400/50">
            <Building2 className="w-10 h-10 drop-shadow-md" />
          </div>

          <div className="text-[11px] font-bold text-amber-300 tracking-wider uppercase mb-1">
            Hội Đồng Quản Trị & Ban Điều Hành
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ
          </h2>
          <p className="mt-2 text-xs text-emerald-200/90 font-medium italic max-w-sm mx-auto leading-relaxed">
            "Điểm tựa tài chính tin cậy — Đồng hành cùng sự phát triển bền vững của cộng đồng"
          </p>
        </div>

        {/* Login Box - Glassmorphism Viền Ánh Vàng */}
        <Card className="shadow-2xl border border-amber-400/30 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Đăng nhập hệ thống
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Bảo mật SSL
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sử dụng tài khoản nội bộ do Quỹ TDND cấp để truy cập các phân hệ nghiệp vụ.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="font-medium leading-snug">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Địa chỉ Email Cán bộ"
              type="email"
              icon={Mail}
              placeholder="VD: canbo@qtdyentho.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Mật khẩu bảo mật"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full font-bold shadow-lg shadow-[#059669]/40 mt-3 py-3 border border-amber-400/50 bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065f46]"
            >
              Đăng nhập ngay
            </Button>
          </form>

          {/* Quick Login Section - Phân quyền mẫu nội bộ */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Truy cập nhanh theo phân quyền
              </span>
              <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-bold border border-amber-200">
                Phân quyền nội bộ
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('canbo@qtdyentho.vn', 'staff')}
                className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-[#059669] group-hover:text-white flex items-center justify-center text-slate-600 transition-colors shadow-2xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Cán bộ (Staff)</div>
                    <div className="text-[10px] text-slate-500">Nguyễn Văn An • Tín dụng</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-[#059669]">
                  Truy cập →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('quanly@qtdyentho.vn', 'manager')}
                className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 group-hover:bg-[#059669] group-hover:text-white flex items-center justify-center text-[#059669] transition-colors shadow-2xs">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Ban điều hành (Manager)</div>
                    <div className="text-[10px] text-slate-500">Trần Thị Mai • Giám đốc</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 group-hover:text-[#059669]">
                  Truy cập →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('chutich@qtdyentho.vn', 'chairman')}
                className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all text-left text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center text-amber-600 transition-colors shadow-2xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Chủ tịch HĐQT (Chairman)</div>
                    <div className="text-[10px] text-slate-500">Lê Đình Hải • HĐQT</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-700 group-hover:text-amber-600">
                  Truy cập →
                </span>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer Address & Accreditation */}
        <div className="mt-8 text-center text-xs text-emerald-200/80 space-y-1">
          <p className="font-semibold text-white">Quỹ Tín Dụng Nhân Dân Yên Thọ</p>
          <p className="text-[11px] text-emerald-200/70">
            Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa • Giấy phép NHNN Chi nhánh Thanh Hóa
          </p>
          <p className="text-[10px] text-emerald-300/50 pt-1">
            Hệ thống Quản trị & Đánh giá Tín nhiệm Nội bộ v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

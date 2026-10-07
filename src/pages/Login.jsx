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
  const { login, loginWithGoogle, isDemoMode, role } = useAuth();
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await loginWithGoogle();
      toast.success(`Đăng nhập Google thành công! Kính chào ${res.user.name}`);
      navigate('/portal', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập Google không thành công.');
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

          {/* Ngăn cách hoặc đăng nhập bằng Google */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white/95 px-2.5 text-slate-500 font-bold tracking-wider">
                Hoặc
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-xs hover:border-slate-400 transition-all cursor-pointer disabled:opacity-50 group"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="group-hover:text-slate-900 transition-colors">
              Đăng nhập với tài khoản Google
            </span>
          </button>

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
                onClick={() => handleQuickLogin('Sinhtdyt@gmail.com', 'staff')}
                className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-[#059669] group-hover:text-white flex items-center justify-center text-slate-600 transition-colors shadow-2xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Cán bộ chuyên môn (Staff)</div>
                    <div className="text-[10px] text-slate-500">Nguyễn Thị Sinh • Thẩm định tài sản</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-[#059669]">
                  Đăng nhập →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('nguyenvansontdyt@gmail.com', 'manager')}
                className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 group-hover:bg-[#059669] group-hover:text-white flex items-center justify-center text-[#059669] transition-colors shadow-2xs">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Ban Điều hành (Manager)</div>
                    <div className="text-[10px] text-slate-500">Nguyễn Văn Sơn • Giám đốc điều hành</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 group-hover:text-[#059669]">
                  Đăng nhập →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ducanht@gmail.com', 'chairman')}
                className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all text-left text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center text-amber-600 transition-colors shadow-2xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Chủ tịch HĐQT (Chairman)</div>
                    <div className="text-[10px] text-slate-500">Trịnh Đức Anh • Chủ tịch HĐQT</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-700 group-hover:text-amber-600">
                  Đăng nhập →
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

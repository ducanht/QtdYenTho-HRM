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
  Briefcase
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

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ Email.');
      return;
    }
    if (!password.trim() && !isDemoMode) {
      setErrorMsg('Vui lòng nhập Mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await login(email, password);
      toast.success(`Đăng nhập thành công! Xin chào ${res.user.name}`);
      
      // Chuyển hướng: nếu là staff thì vào /trust-evaluation, manager/chairman vào /dashboard
      if (res.user.role === 'staff' && from === '/dashboard') {
        navigate('/trust-evaluation', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập không thành công.');
    } finally {
      setLoading(false);
    }
  };

  // Nút đăng nhập nhanh cho các vai trò mẫu
  const handleQuickLogin = async (quickEmail, defaultRole) => {
    setEmail(quickEmail);
    setPassword('123456');
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await login(quickEmail, '123456');
      toast.success(`Đăng nhập với vai trò: ${res.user.role?.toUpperCase()}`);
      if (res.user.role === 'staff') {
        navigate('/trust-evaluation', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient blur background */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-[#0f766e]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Unit Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0f766e] to-[#2dd4bf] text-white shadow-xl shadow-[#0f766e]/40 mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ
          </h2>
          <p className="mt-1.5 text-xs text-teal-300 font-semibold tracking-wide uppercase">
            Cổng Thông Tin & Quản Trị Nhân Sự (HRM Portal)
          </p>
        </div>

        {/* Login Box */}
        <Card className="shadow-2xl border-slate-700/60 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              Đăng nhập hệ thống
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sử dụng tài khoản nội bộ do Quỹ TDND cấp để truy cập các phân hệ.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="font-medium leading-snug">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Địa chỉ Email"
              type="email"
              icon={Mail}
              placeholder="VD: canbo@qtdyentho.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Mật khẩu"
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
              className="w-full font-bold shadow-md shadow-[#0f766e]/30 mt-2"
            >
              Đăng nhập ngay
            </Button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Đăng nhập nhanh theo phân quyền
              </span>
              <span className="text-[10px] bg-teal-50 text-[#0f766e] px-2 py-0.5 rounded font-semibold border border-teal-200">
                Phân quyền nội bộ
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('canbo@qtdyentho.vn', 'staff')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all text-left text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#0f766e] group-hover:text-white flex items-center justify-center text-slate-600 transition-colors">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Cán bộ (Staff)</div>
                    <div className="text-[10px] text-slate-400">canbo@qtdyentho.vn</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#0f766e]">
                  Truy cập →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('quanly@qtdyentho.vn', 'manager')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all text-left text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 group-hover:bg-[#0f766e] group-hover:text-white flex items-center justify-center text-[#0f766e] transition-colors">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Ban điều hành (Manager)</div>
                    <div className="text-[10px] text-slate-400">quanly@qtdyentho.vn</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-teal-600 group-hover:text-[#0f766e]">
                  Truy cập →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('chutich@qtdyentho.vn', 'chairman')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 transition-all text-left text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center text-rose-600 transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Chủ tịch HĐQT (Chairman)</div>
                    <div className="text-[10px] text-slate-400">chutich@qtdyentho.vn</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-rose-600">
                  Truy cập →
                </span>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer address */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p className="font-medium text-slate-300">Quỹ Tín Dụng Nhân Dân Yên Thọ</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa • Hotline: 0237.387.xxxx
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { 
  KeyRound, 
  ShieldAlert, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';

const ForceChangePasswordModal = () => {
  const { currentUser, changeUserPassword, logout } = useAuth();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dismissed, setDismissed] = useState(false);

  // Chỉ hiển thị khi đã đăng nhập, có cờ bắt buộc đổi mật khẩu và chưa tạm ẩn trong phiên
  if (!currentUser || !currentUser.mustChangePassword || dismissed) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword === 'Qtd@2003') {
      setErrorMsg('Mật khẩu mới không được trùng với mật khẩu mặc định (Qtd@2003). Vui lòng chọn mật khẩu riêng của đồng chí.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Xác nhận mật khẩu mới không trùng khớp. Vui lòng kiểm tra lại.');
      return;
    }

    setLoading(true);
    try {
      await changeUserPassword(newPassword);
      toast.success('Thiết lập mật khẩu mới thành công! Chúc đồng chí một ngày làm việc hiệu quả.');
    } catch (err) {
      setErrorMsg(err.message || 'Không thể cập nhật mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-400/40 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Quy Chuẩn Bảo Mật An Toàn
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Yêu Cầu Đổi Mật Khẩu Lần Đầu
            </h3>
          </div>
        </div>

        {/* Thông báo chính sách bảo mật nội bộ */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 space-y-2 mb-6">
          <p className="leading-relaxed">
            Kính gửi đồng chí <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.position || 'Cán bộ'} - {currentUser.department}).
          </p>
          <p className="leading-relaxed text-slate-600">
            Hệ thống Quỹ Tín Dụng Nhân Dân Yên Thọ ghi nhận tài khoản của đồng chí đang sử dụng mật khẩu mặc định khởi tạo ban đầu (<strong className="text-amber-800 font-mono">Qtd@2003</strong>).
          </p>
          <p className="leading-relaxed font-semibold text-emerald-800">
            ✓ Để bảo vệ dữ liệu nội bộ và quyền lợi của cán bộ, đồng chí vui lòng thiết lập mật khẩu bảo mật mới trước khi thực hiện tác nghiệp.
          </p>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Form Đổi Mật Khẩu */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập tối thiểu 6 ký tự..."
                className="w-full text-xs sm:text-sm pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Khuyến nghị kết hợp cả chữ và số để tăng cường độ an toàn.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại chính xác mật khẩu mới..."
                className="w-full text-xs sm:text-sm pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={logout}
                disabled={loading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>

              <button
                type="button"
                onClick={() => setDismissed(true)}
                disabled={loading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <span>Nhắc tôi sau</span>
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full sm:w-auto font-bold px-6 shadow-md shadow-[#047857]/30 bg-gradient-to-r from-[#059669] to-[#047857]"
            >
              Xác nhận đổi mật khẩu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePasswordModal;

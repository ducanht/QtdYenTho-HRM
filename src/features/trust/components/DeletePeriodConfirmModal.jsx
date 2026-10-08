import React, { useState } from 'react';
import { AlertTriangle, Lock, ShieldAlert, KeyRound } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { verifyAdminPassword } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';

/**
 * DeletePeriodConfirmModal: Modal bảo mật xác nhận xóa đợt đánh giá
 * Yêu cầu bắt buộc nhập mật khẩu quản trị để chống xóa nhầm dữ liệu nghiệp vụ
 */
const DeletePeriodConfirmModal = ({
  isOpen,
  onClose,
  period,
  onConfirmDelete,
  currentUser,
}) => {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !period) return null;

  const handleClose = () => {
    setPassword('');
    setErrorMessage('');
    onClose();
  };

  const handleConfirm = async (e) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu quản trị để tiếp tục');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const isValid = await verifyAdminPassword(currentUser?.email, password.trim());
      if (!isValid) {
        setErrorMessage('Mật khẩu quản trị không chính xác. Vui lòng kiểm tra lại!');
        toast.error('Mật khẩu quản trị không đúng!');
        return;
      }

      // Mật khẩu đúng -> Thực hiện xóa
      await onConfirmDelete(period.id, period.name);
      handleClose();
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi khi xác thực quyền quản trị');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Xác Nhận Xóa Đợt Đánh Giá"
      subtitle="Thao tác có tính chất hủy dữ liệu vĩnh viễn"
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="outline" onClick={handleClose} disabled={isVerifying}>
            Hủy bỏ
          </Button>
          <Button
            variant="danger"
            isLoading={isVerifying}
            onClick={handleConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
          >
            Xác nhận xóa đợt
          </Button>
        </div>
      }
    >
      <form onSubmit={handleConfirm} className="space-y-4">
        {/* Khối cảnh báo nguy hiểm */}
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 leading-relaxed">
            <span className="font-bold block text-rose-950 mb-0.5">Cảnh báo nghiêm trọng:</span>
            Đồng chí đang chuẩn bị xóa vĩnh viễn đợt đánh giá:{' '}
            <strong className="text-rose-950 font-black">"{period.name}"</strong> (Mã: {period.id}).
            Toàn bộ cấu hình và dữ liệu liên kết của đợt này sẽ bị xóa khỏi cơ sở dữ liệu và không thể hoàn tác!
          </div>
        </div>

        {/* Ô nhập mật khẩu quản trị */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-rose-600" />
            <span>Mật khẩu quản trị viên:</span>
          </label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Nhập mật khẩu để xác nhận..."
              className="w-full text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 shadow-2xs"
              autoFocus
            />
          </div>
          {errorMessage && (
            <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          )}
          <p className="text-[11px] text-slate-500 italic mt-1">
            Yêu cầu nhập mật khẩu của tài khoản quản trị hiện tại ({currentUser?.email || 'Admin'}) để phê chuẩn thao tác.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default React.memo(DeletePeriodConfirmModal);

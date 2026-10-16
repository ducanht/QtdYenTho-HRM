import React, { useState } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  ExternalLink, 
  Share2, 
  Link as LinkIcon
} from 'lucide-react';
import { saveEmployeeSocial, deleteEmployeeSocial } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';

export const SOCIAL_PLATFORMS = [
  { value: 'Zalo', label: 'Zalo', prefix: 'https://zalo.me/', color: 'bg-blue-600 text-white' },
  { value: 'Facebook', label: 'Facebook', prefix: 'https://facebook.com/', color: 'bg-blue-700 text-white' },
  { value: 'Telegram', label: 'Telegram', prefix: 'https://t.me/', color: 'bg-sky-500 text-white' },
  { value: 'LinkedIn', label: 'LinkedIn', prefix: 'https://linkedin.com/in/', color: 'bg-sky-700 text-white' },
  { value: 'Viber', label: 'Viber', prefix: '', color: 'bg-purple-600 text-white' },
  { value: 'Khác', label: 'Khác (Website / Blog)', prefix: '', color: 'bg-slate-700 text-white' },
];

/**
 * ManageSocialsModal: Quản lý danh sách các kênh mạng xã hội & liên lạc số của cán bộ
 */
const ManageSocialsModal = ({
  isOpen,
  onClose,
  emp,
  socials = [],
  onSuccess,
}) => {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [platform, setPlatform] = useState('Zalo');
  const [accountName, setAccountName] = useState('');
  const [url, setUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [notes, setNotes] = useState('');

  const currentEmpSocials = socials.filter(
    (s) => s.employeeId === emp?.id || s.employeeUuid === emp?.id
  );

  const resetForm = () => {
    setEditingId(null);
    setPlatform('Zalo');
    setAccountName('');
    setUrl('');
    setIsPublic(true);
    setNotes('');
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setPlatform(item.platform || 'Zalo');
    setAccountName(item.accountName || item.username || '');
    setUrl(item.url || '');
    setIsPublic(item.isPublic !== undefined ? Boolean(item.isPublic) : true);
    setNotes(item.notes || '');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kênh liên lạc này?')) return;
    try {
      await deleteEmployeeSocial(id);
      toast?.showSuccess?.('Đã xóa kênh mạng xã hội thành công!');
      if (editingId === id) resetForm();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xóa kênh mạng xã hội');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emp?.id) {
      toast?.showError?.('Không tìm thấy thông tin cán bộ');
      return;
    }

    if (!accountName.trim() && !url.trim()) {
      toast?.showError?.('Vui lòng nhập tên tài khoản hoặc đường dẫn URL');
      return;
    }

    try {
      setSubmitting(true);

      let finalUrl = url.trim();
      const currentPlatform = SOCIAL_PLATFORMS.find((p) => p.value === platform);
      if (currentPlatform?.prefix && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        if (platform === 'Zalo') {
          // Nếu nhập số điện thoại cho Zalo
          const cleanPhone = accountName.replace(/\D/g, '');
          if (cleanPhone) {
            finalUrl = `https://zalo.me/${cleanPhone}`;
          }
        }
      }

      const payload = {
        id: editingId || undefined,
        employeeId: emp.id,
        employeeUuid: emp.id,
        platform,
        accountName: accountName.trim() || platform,
        username: accountName.trim() || platform,
        url: finalUrl,
        isPublic: Boolean(isPublic),
        notes: notes.trim(),
      };

      await saveEmployeeSocial(payload);
      toast?.showSuccess?.(
        editingId
          ? 'Đã cập nhật kênh mạng xã hội!'
          : 'Đã thêm mới kênh mạng xã hội thành công!'
      );

      resetForm();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Lỗi lưu mạng xã hội:', err);
      toast?.showError?.(err.message || 'Lỗi khi lưu kênh mạng xã hội');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !submitting && onClose()}
      title="Quản Lý Mạng Xã Hội & Kênh Liên Lạc Số"
      subtitle={`Cán bộ: ${emp?.name || ''} • ${emp?.position || ''}`}
      maxWidth="max-w-2xl"
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Danh sách các kênh hiện có */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Các kênh liên lạc đã thiết lập ({currentEmpSocials.length})</span>
            </h4>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Hủy chế độ sửa & Thêm mới
              </button>
            )}
          </div>

          {currentEmpSocials.length === 0 ? (
            <div className="p-4 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
              Cán bộ chưa thiết lập kênh mạng xã hội nào. Hãy thêm kênh mới bên dưới.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentEmpSocials.map((item) => {
                const platMeta = SOCIAL_PLATFORMS.find((p) => p.value === item.platform) || {
                  color: 'bg-slate-700 text-white',
                  label: item.platform,
                };
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                      editingId === item.id
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${platMeta.color}`}
                      >
                        {item.platform}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {item.accountName || item.username || item.platform}
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 truncate"
                          >
                            <span className="truncate">{item.url}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa kênh"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa kênh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form Thêm / Chỉnh Sửa Kênh Mạng Xã Hội */}
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3.5 text-xs"
        >
          <div className="font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>{editingId ? 'Cập Nhật Kênh Mạng Xã Hội' : 'Thêm Kênh Mạng Xã Hội Mới'}</span>
            </span>
            <span className="text-[11px] font-normal text-slate-500">
              Hỗ trợ Zalo, Facebook, Telegram, LinkedIn...
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nền tảng */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Nền tảng / Mạng xã hội <span className="text-rose-500">*</span>
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-xs font-semibold text-slate-900 cursor-pointer shadow-2xs"
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tên tài khoản / SĐT / Nickname */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Tên hiển thị / SĐT / Tài khoản <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={platform === 'Zalo' ? 'Số điện thoại Zalo hoặc Tên' : 'Tên tài khoản hoặc Nickname'}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-xs font-medium text-slate-900 shadow-2xs"
              />
            </div>

            {/* Đường dẫn URL */}
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-700" />
                  <span>Đường dẫn liên kết trực tiếp (URL)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {platform === 'Zalo' ? 'Tự sinh nếu đã nhập SĐT' : 'https://...'}
                </span>
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  platform === 'Facebook'
                    ? 'https://facebook.com/username'
                    : platform === 'LinkedIn'
                    ? 'https://linkedin.com/in/username'
                    : 'https://...'
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-xs font-medium text-slate-900 shadow-2xs"
              />
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Ghi chú (tùy chọn)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Kênh trao đổi công việc, Liên hệ khẩn cấp..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-xs text-slate-900 shadow-2xs"
              />
            </div>

            {/* Cờ công khai */}
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded text-emerald-800 focus:ring-emerald-700 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Hiển thị công khai với toàn thể CBNV Quỹ
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={submitting}
              >
                Hủy sửa
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
            >
              {submitting ? 'Đang lưu...' : editingId ? 'Lưu Thay Đổi' : 'Thêm Kênh'}
            </Button>
          </div>
        </form>

        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ManageSocialsModal;

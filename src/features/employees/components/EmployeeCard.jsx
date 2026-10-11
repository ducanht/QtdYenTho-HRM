import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  History,
  Clock,
  Camera,
  Check,
  X,
  GraduationCap
} from 'lucide-react';
import Badge from '../../../components/common/Badge';
import { ROLE_LABELS } from '../../../lib/constants';
import { formatDateVN } from '../../../lib/dateUtils';
import { calculatePositionTenure } from '../../../lib/evaluationUtils';
import { compressImage } from '../../../lib/imageUtils';
import { updateEmployeeProfile } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';

const EmployeeCard = ({
  emp,
  onOpenHistory,
  onOpenTraining,
}) => {
  const toast = useToast();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditingTenure, setIsEditingTenure] = useState(false);
  const [startDateInput, setStartDateInput] = useState(emp.positionStartDate || emp.joinDate || '');
  const [savingTenure, setSavingTenure] = useState(false);

  // Tính thâm niên chức vụ phục vụ tính lương và phân cấp thâm niên
  const effectiveStartDate = emp.positionStartDate || emp.joinDate;
  const tenureDisplay = calculatePositionTenure(effectiveStartDate);

  // Xử lý nén ảnh qua Canvas và cập nhật Firestore avatar < 50 KB
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const compressed = await compressImage(file, 400, 400, 0.75);
      await updateEmployeeProfile(emp.id, {
        avatar: compressed.dataUrl,
      });

      toast?.showSuccess?.(
        `Đã nén và cập nhật ảnh đại diện: ${compressed.sizeInKb} KB (bảo toàn dung lượng Firestore Free)!`
      );
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi cập nhật ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Lưu ngày bắt đầu đảm nhiệm chức vụ
  const handleSaveTenure = async () => {
    if (!startDateInput) return;
    try {
      setSavingTenure(true);
      await updateEmployeeProfile(emp.id, {
        positionStartDate: startDateInput,
      });
      toast?.showSuccess?.('Đã cập nhật ngày đảm nhiệm chức vụ thành công');
      setIsEditingTenure(false);
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi cập nhật thâm niên chức vụ');
    } finally {
      setSavingTenure(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-300 hover:shadow-md p-5 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Avatar có nút upload & nén ảnh */}
          <div className="relative group">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-[#0f766e] font-bold text-base flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {emp.avatar ? (
                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
              ) : (
                emp.name.charAt(0)
              )}
            </div>

            <label 
              className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
              title="Đổi ảnh chân dung (Tự động nén qua Canvas)"
            >
              <Camera className="w-4 h-4 mb-0.5" />
              <span>{uploadingAvatar ? '...' : 'Đổi ảnh'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>
          </div>

          <Badge
            variant={
              emp.role === 'chairman'
                ? 'danger'
                : emp.role === 'manager'
                ? 'primary'
                : 'default'
            }
            size="sm"
          >
            {ROLE_LABELS[emp.role] || emp.role}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
            {emp.gender && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                {emp.gender}
              </span>
            )}
          </div>
          <div className="text-[11px] font-bold text-[#0f766e] uppercase tracking-wider">
            {emp.code} • {emp.position}
          </div>
          <div className="text-xs text-slate-500">{emp.department}</div>

          {/* Thâm niên chức vụ */}
          {isEditingTenure ? (
            <div className="p-2 bg-teal-50 rounded-xl border border-teal-200 space-y-1.5 mt-1.5">
              <label className="text-[10px] font-bold text-teal-900 block">Ngày bắt đầu đảm nhiệm chức vụ:</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="px-2 py-1 text-xs border border-teal-300 rounded-lg bg-white flex-1 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveTenure}
                  disabled={savingTenure}
                  className="p-1 bg-[#0f766e] text-white rounded-lg hover:bg-teal-800 transition-colors cursor-pointer"
                  title="Lưu ngày"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTenure(false)}
                  className="p-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors cursor-pointer"
                  title="Hủy"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-teal-900 bg-teal-50/90 border border-teal-200 px-2 py-1 rounded-lg flex items-center justify-between gap-1 font-medium mt-1">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <Clock className="w-3.5 h-3.5 text-[#0f766e] shrink-0" />
                <span className="truncate">
                  Thâm niên chức vụ: <strong className="text-teal-950 font-bold">{tenureDisplay}</strong>
                  {effectiveStartDate && (
                    <span className="text-slate-500 font-normal ml-1">({formatDateVN(effectiveStartDate)})</span>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingTenure(true)}
                className="text-[10px] text-[#0f766e] hover:underline font-bold shrink-0 cursor-pointer"
                title="Thay đổi ngày đảm nhiệm"
              >
                Sửa
              </button>
            </div>
          )}

          {emp.cccd && (
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 pt-0.5">
              <span className="text-slate-400">CCCD:</span>
              <span className="font-semibold text-slate-700">{emp.cccd}</span>
            </div>
          )}
          {emp.partyDate && (
            <div className="text-[10px] text-amber-900 bg-amber-50/90 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-medium mt-1">
              <Award className="w-3 h-3 text-amber-600 shrink-0" />
              <span>
                Đảng viên (Vào: {formatDateVN(emp.partyDate)}
                {emp.partyOfficialDate ? ` • CT: ${formatDateVN(emp.partyOfficialDate)}` : ''})
              </span>
            </div>
          )}
          {emp.assignedArea && (
            <div className="text-[11px] text-slate-600 flex items-center gap-1 pt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{emp.assignedArea}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">{emp.email}</span>
        </div>
        {emp.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{emp.phone}</span>
          </div>
        )}

        {/* 2 Nút Hành Động Nghiệp Vụ */}
        <div className="pt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onOpenTraining?.(emp)}
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-[#0f766e] font-semibold text-xs transition-colors cursor-pointer"
            title="Xem hồ sơ đào tạo và chứng chỉ"
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#0f766e]" />
            <span className="truncate">Đào tạo & CC</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenHistory?.(emp)}
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            title="Xem quá trình luân chuyển công tác"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate">Luân chuyển</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EmployeeCard);

import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { 
  Sliders, 
  Users, 
  FileText, 
  GraduationCap, 
  ShieldAlert, 
  Building2, 
  RotateCcw, 
  CheckCircle2 
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const DEFAULT_OVERVIEW_DISPLAY_CONFIG = {
  showKpis: true,
  showContractStructure: true,
  showEducationStructure: true,
  showCreditRotationMonitoring: true,
  showDepartmentDistribution: true,
};

const OverviewDisplayConfigModal = ({
  isOpen,
  onClose,
  config = {},
  onSaveConfig,
}) => {
  const toast = useToast();
  const [localConfig, setLocalConfig] = useState(DEFAULT_OVERVIEW_DISPLAY_CONFIG);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig({
        showKpis: config.showKpis !== false,
        showContractStructure: config.showContractStructure !== false,
        showEducationStructure: config.showEducationStructure !== false,
        showCreditRotationMonitoring: config.showCreditRotationMonitoring !== false,
        showDepartmentDistribution: config.showDepartmentDistribution !== false,
      });
    }
  }, [isOpen, config]);

  const handleToggle = (key) => {
    setLocalConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleResetDefault = () => {
    setLocalConfig(DEFAULT_OVERVIEW_DISPLAY_CONFIG);
    const msg = 'Đã khôi phục cài đặt hiển thị mặc định (bật toàn bộ)';
    if (toast?.info) toast.info(msg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSaveConfig?.(localConfig);
      const msg = 'Đã lưu cấu hình hiển thị Tổng quan nhân lực!';
      if (toast?.success) toast.success(msg);
      else if (toast?.showSuccess) toast.showSuccess(msg);
      onClose();
    } catch (err) {
      console.error('Lỗi lưu cấu hình hiển thị:', err);
      const errorMsg = err.message || 'Lỗi khi lưu cấu hình';
      if (toast?.error) toast.error(errorMsg);
      else if (toast?.showError) toast.showError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const options = [
    {
      key: 'showKpis',
      icon: Users,
      title: 'Thẻ chỉ số nhân lực KPI tổng quan',
      desc: 'Hiển thị 4 thẻ: Tổng CBNV, Tỷ lệ Đảng viên, Cơ cấu Giới tính và Cảnh báo hạn luân chuyển địa bàn CBTD.',
    },
    {
      key: 'showContractStructure',
      icon: FileText,
      title: 'Khối cơ cấu Hợp đồng lao động',
      desc: 'Hiển thị tỷ lệ các loại HĐLĐ (Không xác định thời hạn, Có thời hạn, Thử việc) và danh sách hợp đồng sắp hết hạn.',
    },
    {
      key: 'showEducationStructure',
      icon: GraduationCap,
      title: 'Khối cơ cấu Trình độ chuyên môn & Học vị',
      desc: 'Hiển thị tỷ lệ % văn bằng chuyên môn cao nhất của CBNV (Tiến sĩ, Thạc sĩ, Đại học, Cao đẳng...).',
    },
    {
      key: 'showCreditRotationMonitoring',
      icon: ShieldAlert,
      title: 'Bảng giám sát luân chuyển địa bàn Cán bộ tín dụng (CBTD)',
      desc: 'Bảng theo dõi thời gian phụ trách địa bàn, chu kỳ định kỳ theo quy định NHNN và cảnh báo đến hạn.',
    },
    {
      key: 'showDepartmentDistribution',
      icon: Building2,
      title: 'Khối cơ cấu Phân bổ nhân sự theo Bộ phận',
      desc: 'Biểu đồ phân bổ CBNV theo HĐQT, BKS, Ban Điều hành, Phòng Tín dụng và Bộ phận Kế toán - Ngân quỹ.',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cấu Hình Hiển Thị Tổng Quan Nhân Lực"
      subtitle="Tùy chỉnh bật / tắt các khối widget báo cáo trên màn hình Tổng quan"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-600 flex items-start gap-2.5">
          <Sliders className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>
            Lựa chọn các khối thông tin cần hiển thị trên trang <strong>Tổng quan</strong>. Cài đặt sẽ được áp dụng tức thì cho phiên làm việc của bạn và lưu vào hệ thống cho toàn đơn vị.
          </span>
        </div>

        <div className="space-y-2.5">
          {options.map((item) => {
            const Icon = item.icon;
            const isChecked = localConfig[item.key];
            return (
              <label
                key={item.key}
                onClick={() => handleToggle(item.key)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="mt-1 w-4 h-4 text-emerald-700 rounded-md border-slate-300 focus:ring-emerald-700"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <Icon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{item.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Nút hành động */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleResetDefault}
            disabled={submitting}
            icon={RotateCcw}
            className="text-slate-500 hover:text-slate-700 text-xs"
          >
            Khôi phục mặc định
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              icon={CheckCircle2}
            >
              Lưu cấu hình
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default React.memo(OverviewDisplayConfigModal);

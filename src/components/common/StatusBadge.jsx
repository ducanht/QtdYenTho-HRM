import React from 'react';
import { 
  getPeriodStatusInfo, 
  getClassificationBadgeVariant, 
  getKpiStatusInfo, 
  getVotingModeInfo 
} from '../../lib/evaluationUtils';

/**
 * Linh kiện Huy Hiệu Trạng Thái Dùng Chung (StatusBadge)
 * Tự động ánh xạ màu sắc và nhãn theo quy chuẩn nghiệp vụ Quỹ
 *
 * @param {string} type 'trust_classification' | 'period_status' | 'kpi_status' | 'voting_mode'
 * @param {string} value Giá trị trạng thái cần hiển thị
 * @param {string} size 'sm' | 'md'
 */
const StatusBadge = ({ type, value, size = 'sm', className = '' }) => {
  if (!value) return <span className="text-slate-400 text-xs">—</span>;

  let label = value;
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'trust_classification') {
    label = value;
    colorClasses = getClassificationBadgeVariant(value);
  } else if (type === 'period_status') {
    const info = getPeriodStatusInfo(value);
    label = info.label;
    colorClasses = info.color;
  } else if (type === 'kpi_status') {
    const info = getKpiStatusInfo(value);
    label = info.label;
    colorClasses = info.color;
  } else if (type === 'voting_mode') {
    const info = getVotingModeInfo(value);
    label = info.label;
    colorClasses = info.badgeColor;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border shadow-2xs ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;

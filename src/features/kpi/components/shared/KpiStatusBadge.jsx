import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle 
} from 'lucide-react';

/**
 * Badge trạng thái quy trình đánh giá KPI 3 cấp
 * @param {string} status - 'draft' | 'pending_manager' | 'pending_chairman' | 'completed' | 'appealed'
 */
const KpiStatusBadge = ({ status, className = '' }) => {
  switch (status) {
    case 'completed':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Đã hoàn tất</span>
        </span>
      );

    case 'pending_chairman':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs ${className}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>Chờ HĐQT phê duyệt</span>
        </span>
      );

    case 'pending_manager':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs ${className}`}>
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Chờ BĐH thẩm định</span>
        </span>
      );

    case 'appealed':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs ${className}`}>
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
          <span>Đang khiếu nại</span>
        </span>
      );

    case 'draft':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-xs ${className}`}>
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>Chưa tự chấm</span>
        </span>
      );
  }
};

export default KpiStatusBadge;

import React from 'react';
import { Award, CheckCircle, MinusCircle, AlertTriangle } from 'lucide-react';

/**
 * Badge xếp loại thi đua KPI
 * @param {string} classification - 'Xuất sắc' | 'Tốt' | 'Đạt yêu cầu' | 'Không đạt'
 */
const KpiClassificationBadge = ({ classification, score = null, className = '' }) => {
  if (!classification) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 ${className}`}>
        Chưa xếp loại
      </span>
    );
  }

  const cleanClass = classification.trim();

  if (cleanClass.includes('Xuất sắc')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs ${className}`}>
        <Award className="w-3.5 h-3.5 text-emerald-600" />
        <span>Xuất sắc</span>
        {typeof score === 'number' && <span className="font-numeric font-normal opacity-80">({score})</span>}
      </span>
    );
  }

  if (cleanClass.includes('Tốt')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300 shadow-xs ${className}`}>
        <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
        <span>Tốt</span>
        {typeof score === 'number' && <span className="font-numeric font-normal opacity-80">({score})</span>}
      </span>
    );
  }

  if (cleanClass.includes('Đạt')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs ${className}`}>
        <MinusCircle className="w-3.5 h-3.5 text-amber-600" />
        <span>Đạt yêu cầu</span>
        {typeof score === 'number' && <span className="font-numeric font-normal opacity-80">({score})</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-xs ${className}`}>
      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
      <span>Không đạt</span>
      {typeof score === 'number' && <span className="font-numeric font-normal opacity-80">({score})</span>}
    </span>
  );
};

export default KpiClassificationBadge;

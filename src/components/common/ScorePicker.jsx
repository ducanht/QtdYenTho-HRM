import React from 'react';

/**
 * ScorePicker: Bộ chọn điểm số nguyên từ 1 đến 10 (Chuẩn nghiệp vụ QTDND)
 * - Tuyệt đối không có điểm lẻ
 * - Bấm 1 chạm chọn ngay
 * - Tối ưu Touch target cho cả Desktop và Mobile
 */
const ScorePicker = ({
  value,
  onChange,
  min = 1,
  max = 10,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const scores = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm',
    lg: 'w-10 h-10 sm:w-11 sm:h-11 text-sm sm:text-base',
  }[size] || 'w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm';

  return (
    <div className={`inline-flex flex-wrap items-center gap-1 sm:gap-1.5 ${className}`}>
      {scores.map((num) => {
        const isSelected = Number(value) === num;

        return (
          <button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange && onChange(num)}
            className={`
              ${sizeClasses}
              rounded-xl font-bold transition-all duration-150 flex items-center justify-center shrink-0
              cursor-pointer select-none touch-manipulation active:scale-95 disabled:cursor-not-allowed disabled:opacity-50
              ${
                isSelected
                  ? 'bg-[#0f766e] text-white shadow-md shadow-[#0f766e]/25 ring-2 ring-[#0f766e] scale-105 z-10'
                  : 'bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200/80 active:bg-teal-100'
              }
            `}
            title={`Chọn mức điểm ${num}`}
            aria-label={`Mức điểm ${num}`}
          >
            {num}
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(ScorePicker);

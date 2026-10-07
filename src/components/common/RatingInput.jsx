import React from 'react';
import { Minus, Plus } from 'lucide-react';

const RatingInput = ({
  value = 5,
  onChange,
  label,
  description,
  min = 0,
  max = 10,
  disabled = false,
  error = null,
}) => {
  const currentVal = Number(value) || 0;

  const handleManualChange = (e) => {
    let val = e.target.value;
    if (val === '') {
      onChange(0);
      return;
    }
    let num = Number(val);
    if (isNaN(num)) return;
    if (num < min) num = min;
    if (num > max) num = max;
    onChange(num);
  };

  const handleIncrement = () => {
    if (currentVal < max && !disabled) {
      onChange(currentVal + 1);
    }
  };

  const handleDecrement = () => {
    if (currentVal > min && !disabled) {
      onChange(currentVal - 1);
    }
  };

  const getScoreColor = (val) => {
    if (val >= 9) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (val >= 7) return 'text-teal-700 bg-teal-50 border-teal-300';
    if (val >= 5) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-rose-700 bg-rose-50 border-rose-300';
  };

  return (
    <div className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all duration-150">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          {label && (
            <h4 className="text-sm font-semibold text-slate-900 leading-snug">
              {label}
            </h4>
          )}
          {description && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Display Score Badge */}
        <div className="flex items-center gap-2 self-start shrink-0">
          <div
            className={`px-3 py-1 rounded-lg border font-bold text-sm tracking-tight ${getScoreColor(
              currentVal
            )}`}
          >
            {currentVal} <span className="text-xs font-normal opacity-70">/ 10</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
        {/* Stepper buttons & direct input */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            disabled={disabled || currentVal <= min}
            onClick={handleDecrement}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 transition-colors"
            title="Giảm 1 điểm"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <input
            type="number"
            min={min}
            max={max}
            step="1"
            value={currentVal}
            onChange={handleManualChange}
            disabled={disabled}
            className="w-14 text-center py-1 px-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
          />

          <button
            type="button"
            disabled={disabled || currentVal >= max}
            onClick={handleIncrement}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 transition-colors"
            title="Tăng 1 điểm"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick select score pills (0 to 10) */}
        <div className="flex items-center gap-1 overflow-x-auto w-full py-1 scrollbar-thin">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
            const isSelected = currentVal === score;
            return (
              <button
                key={score}
                type="button"
                disabled={disabled}
                onClick={() => onChange(score)}
                className={`flex-1 min-w-[28px] h-7 rounded-md text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#0f766e] text-white shadow-xs scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {score}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};

export default RatingInput;

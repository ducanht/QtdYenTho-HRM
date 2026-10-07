import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(
  (
    {
      label,
      options = [],
      value,
      onChange,
      error,
      helperText,
      placeholder = 'Chọn một mục...',
      className = '',
      id,
      required = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full appearance-none rounded-xl border bg-white text-slate-900 text-sm transition-all duration-200 pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer ${
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-300 hover:border-slate-400 focus:border-[#0f766e] focus:ring-[#0f766e]/20'
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => {
              const optVal = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={optVal} value={optVal}>
                  {optLabel}
                </option>
              );
            })}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;

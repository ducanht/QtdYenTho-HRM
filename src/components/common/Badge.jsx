import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-teal-50 text-[#0f766e] border-teal-200 font-medium',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    
    // Semantic classifications for HRM Trust evaluation
    'xuat-sac': 'bg-emerald-100/80 text-emerald-800 border-emerald-300 font-semibold',
    'tot': 'bg-teal-100/80 text-teal-800 border-teal-300 font-semibold',
    'hoan-thanh': 'bg-amber-100/80 text-amber-800 border-amber-300 font-semibold',
    'khong-hoan-thanh': 'bg-rose-100/80 text-rose-800 border-rose-300 font-semibold',
    
    // Status for KPI Workflow
    'pending_manager': 'bg-amber-50 text-amber-700 border-amber-200',
    'pending_chairman': 'bg-sky-50 text-sky-700 border-sky-200',
    'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-[#0f766e]',
    success: 'bg-emerald-500',
    info: 'bg-sky-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    purple: 'bg-purple-500',
    'xuat-sac': 'bg-emerald-500',
    'tot': 'bg-teal-500',
    'hoan-thanh': 'bg-amber-500',
    'khong-hoan-thanh': 'bg-rose-500',
    'pending_manager': 'bg-amber-500',
    'pending_chairman': 'bg-sky-500',
    'completed': 'bg-emerald-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border leading-none transition-colors ${
        variants[variant] || variants.default
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            dotColors[variant] || dotColors.default
          }`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;

import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const variants = {
    // Primary is tailored to #0f766e (Teal 700)
    primary: 'bg-[#0f766e] text-white hover:bg-[#115e59] active:bg-[#134e4a] focus:ring-[#0f766e]/40 shadow-sm hover:shadow',
    secondary: 'bg-emerald-50 text-[#0f766e] hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 focus:ring-emerald-500/30',
    outline: 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 focus:ring-slate-400',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-300',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500/40 shadow-sm',
    accent: 'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 focus:ring-amber-500/40 shadow-sm',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;

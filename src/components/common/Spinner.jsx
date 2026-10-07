import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({ size = 'md', className = '', text = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`${sizes[size] || sizes.md} animate-spin text-[#0f766e]`} />
      {text && <p className="text-xs font-medium text-slate-500 animate-pulse">{text}</p>}
    </div>
  );
};

export default Spinner;

import React from 'react';

const Card = ({
  children,
  className = '',
  header = null,
  footer = null,
  title = '',
  subtitle = '',
  action = null,
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden ${
        hoverEffect ? 'hover:shadow-md hover:border-slate-300 transition-all duration-200' : ''
      } ${className}`}
      {...props}
    >
      {(header || title) && (
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between gap-4">
          {header ? (
            header
          ) : (
            <div>
              {title && <h3 className="font-semibold text-slate-800 text-base">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className="p-6">{children}</div>

      {footer && (
        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 text-sm">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

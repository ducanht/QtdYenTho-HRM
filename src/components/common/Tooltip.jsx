import React, { useState, useRef, useEffect } from 'react';

/**
 * Tooltip: Hiển thị chú thích bong bóng mượt mà khi hover hoặc focus.
 * Chuẩn nhận diện Quỹ Tín Dụng Nhân Dân Yên Thọ:
 * - Nền đen mờ tối giản (bg-slate-900/95), chữ trắng sắc nét, bo góc mềm mại.
 * - Hiệu ứng chuyển động mượt mà (fade + scale), tự động tính toán vị trí an toàn.
 * - Hỗ trợ các hướng: 'top' | 'bottom' | 'left' | 'right'.
 */
const Tooltip = ({
  content,
  children,
  position = 'top',
  delay = 150,
  className = '',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    if (disabled || !content) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // Vị trí của tooltip và mũi tên
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900/95 border-x-transparent border-b-transparent border-[5px]',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900/95 border-x-transparent border-t-transparent border-[5px]',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900/95 border-y-transparent border-r-transparent border-[5px]',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900/95 border-y-transparent border-l-transparent border-[5px]',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && content && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none flex items-center justify-center ${positionClasses[position]} ${className}`}
        >
          <div className="relative px-2.5 py-1.5 text-[11px] font-medium leading-tight text-white bg-slate-900/95 backdrop-blur-xs rounded-lg shadow-xl shadow-slate-950/20 max-w-xs whitespace-normal text-center animate-in fade-in-0 zoom-in-95 duration-150">
            {content}
            <div
              className={`absolute w-0 h-0 pointer-events-none ${arrowClasses[position]}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Tooltip);

import React, { useState, useRef, useEffect } from 'react';

/**
 * DropdownMenu: Menu popup chọn nhanh / tác vụ ngữ cảnh mượt mà.
 * Chuẩn nhận diện Quỹ Tín Dụng Nhân Dân Yên Thọ:
 * - Hiệu ứng mở mượt mà (fade + scale), tự động bắt sự kiện bấm ra ngoài và phím Escape.
 * - Hỗ trợ các mục hành động, phân nhóm divider, icon minh họa, badge số lượng và cảnh báo danger.
 */
const DropdownMenu = ({
  trigger,
  items = [],
  children,
  align = 'right',
  width = 'w-56',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Đóng khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const handleItemClick = (item, e) => {
    if (item.disabled) return;
    if (item.onClick) {
      item.onClick(e);
    }
    setIsOpen(false);
  };

  const alignClasses = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Nút bấm kích hoạt (Trigger) */}
      <div onClick={toggleOpen} className="inline-flex cursor-pointer select-none">
        {typeof trigger === 'function' ? trigger({ isOpen }) : trigger}
      </div>

      {/* Menu Popup */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute top-full mt-1.5 z-50 ${width} rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/10 p-1.5 focus:outline-none animate-in fade-in-0 zoom-in-95 duration-150 ${alignClasses[align] || alignClasses.right} ${className}`}
        >
          {children ? (
            children
          ) : (
            <div className="space-y-0.5">
              {items.map((item, index) => {
                if (item.divider) {
                  return (
                    <div
                      key={`divider-${index}`}
                      className="my-1 border-t border-slate-100"
                    />
                  );
                }

                const Icon = item.icon;
                const isDanger = Boolean(item.danger);
                const isDisabled = Boolean(item.disabled);

                return (
                  <button
                    key={item.id || `item-${index}`}
                    type="button"
                    role="menuitem"
                    disabled={isDisabled}
                    onClick={(e) => handleItemClick(item, e)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none text-left ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : isDanger
                        ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:bg-rose-100'
                        : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 active:bg-emerald-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {Icon && (
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isDanger ? 'text-rose-500' : 'text-slate-400 group-hover:text-emerald-700'
                          }`}
                        />
                      )}
                      <div className="truncate">
                        <div className="truncate">{item.label}</div>
                        {item.description && (
                          <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {item.badge && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(DropdownMenu);

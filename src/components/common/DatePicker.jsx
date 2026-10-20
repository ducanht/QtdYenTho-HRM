import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { parseToDate, formatDateVN } from '../../lib/dateUtils';

const VIETNAMESE_MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const VIETNAMESE_WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/**
 * Helper: Chuyển Date object thành chuỗi ISO 'YYYY-MM-DD' an toàn
 */
const toISODate = (d) => {
  if (!d || isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * DatePicker: Bộ chọn ngày lịch chuyên nghiệp chuẩn Việt Nam (dd/mm/yyyy).
 * Tone màu nhận diện Quỹ Tín Dụng Nhân Dân Yên Thọ (Emerald).
 * Hỗ trợ chọn nhanh Tháng, Năm (1950 - 2040), nút Hôm nay, nút Xóa, và tự động đóng.
 */
const DatePicker = ({
  value,
  onChange,
  label,
  placeholder = 'Chọn ngày (dd/mm/yyyy)',
  required = false,
  error = '',
  helperText = '',
  disabled = false,
  minDate = null,
  maxDate = null,
  allowClear = true,
  className = '',
  id,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse ngày hiện tại từ props
  const selectedDate = useMemo(() => parseToDate(value), [value]);

  // Tháng và năm đang xem trong lịch (mặc định lấy tháng của selectedDate hoặc tháng hiện tại)
  const [viewDate, setViewDate] = useState(() => {
    return selectedDate || new Date();
  });

  // Đồng bộ viewDate khi selectedDate thay đổi từ bên ngoài
  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  // Xử lý click ra ngoài để đóng lịch
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

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Chuyển tháng trước / sau
  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    setViewDate(new Date(viewYear, newMonth, 1));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    setViewDate(new Date(newYear, viewMonth, 1));
  };

  // Chọn một ngày cụ thể
  const handleSelectDate = (d) => {
    if (disabled) return;
    const iso = toISODate(d);
    // Hỗ trợ cả 2 kiểu callback: onChange(iso) hoặc onChange({ target: { value: iso, name } })
    if (onChange) {
      onChange(iso);
      onChange({ target: { value: iso, name: name || id } });
    }
    setIsOpen(false);
  };

  // Nút Hôm nay
  const handleSelectToday = () => {
    const today = new Date();
    handleSelectDate(today);
  };

  // Nút Xóa
  const handleClear = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (onChange) {
      onChange('');
      onChange({ target: { value: '', name: name || id } });
    }
  };

  // Tạo danh sách các ngày hiển thị trên lưới lịch (42 ô)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    // Thứ của ngày đầu tháng: 0 (Chủ nhật), 1 (Thứ 2), ... 6 (Thứ 7)
    // Chuẩn Việt Nam bắt đầu từ Thứ 2 (index 0: T2, 6: CN)
    let firstDayIndex = firstDayOfMonth.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6; // Chủ nhật đưa về cuối

    const days = [];

    // Các ngày cuối của tháng trước
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(viewYear, viewMonth - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Các ngày của tháng hiện tại
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({
        date: new Date(viewYear, viewMonth, i),
        isCurrentMonth: true,
      });
    }

    // Các ngày đầu của tháng sau để đủ lưới 35 hoặc 42 ô
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(viewYear, viewMonth + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Danh sách năm để chọn nhanh (1950 - 2040)
  const years = useMemo(() => {
    const list = [];
    const currentYear = new Date().getFullYear();
    const start = Math.min(1950, currentYear - 50);
    const end = Math.max(2040, currentYear + 15);
    for (let y = start; y <= end; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const todayStr = toISODate(new Date());
  const selectedStr = selectedDate ? toISODate(selectedDate) : '';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
      )}

      {/* Input hiển thị */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-3 py-2 bg-white border rounded-xl text-slate-900 transition-all select-none cursor-pointer ${
          disabled
            ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            : isOpen
            ? 'border-emerald-700 ring-2 ring-emerald-700/20 shadow-xs'
            : error
            ? 'border-rose-300 hover:border-rose-400'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className={`text-xs font-semibold tabular-nums truncate ${selectedDate ? 'text-slate-900' : 'text-slate-400 font-normal'}`}>
            {selectedDate ? formatDateVN(selectedDate) : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {allowClear && selectedDate && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Xóa ngày đã chọn"
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Lịch Popup */}
      {isOpen && (
        <div className="absolute top-full mt-1.5 left-0 z-50 w-72 sm:w-80 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-900/15 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header: Tháng, Năm & Nút chuyển */}
          <div className="flex items-center justify-between gap-1 pb-3 mb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Tháng trước"
              className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <select
                value={viewMonth}
                onChange={handleMonthChange}
                className="py-1 px-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-emerald-700 cursor-pointer"
              >
                {VIETNAMESE_MONTHS.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={handleYearChange}
                className="py-1 px-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-emerald-700 cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Tháng sau"
              className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Hàng tiêu đề thứ trong tuần */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {VIETNAMESE_WEEKDAYS.map((wd, idx) => (
              <div
                key={wd}
                className={`text-[11px] font-bold py-1 ${
                  idx === 6 ? 'text-rose-500' : 'text-slate-500'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Lưới các ngày */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarDays.map((item, idx) => {
              const itemIso = toISODate(item.date);
              const isSelected = itemIso === selectedStr;
              const isToday = itemIso === todayStr;
              const isCurrentMonth = item.isCurrentMonth;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDate(item.date)}
                  className={`
                    w-full aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer relative tabular-nums
                    ${
                      isSelected
                        ? 'bg-emerald-800 text-white font-bold shadow-xs hover:bg-emerald-900'
                        : isCurrentMonth
                        ? 'text-slate-800 hover:bg-emerald-50 hover:text-emerald-800'
                        : 'text-slate-300 hover:bg-slate-50'
                    }
                    ${isToday && !isSelected ? 'border border-emerald-600 font-bold text-emerald-800' : ''}
                  `}
                >
                  <span>{item.date.getDate()}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-emerald-600 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer: Thao tác nhanh */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px]">
            <button
              type="button"
              onClick={handleSelectToday}
              className="px-2.5 py-1 text-emerald-800 hover:bg-emerald-50 rounded-lg font-bold transition-colors cursor-pointer"
            >
              Hôm nay
            </button>

            {selectedDate && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Xóa ngày
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-lg font-bold transition-colors cursor-pointer ml-auto"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

export default React.memo(DatePicker);

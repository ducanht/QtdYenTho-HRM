import React from 'react';

/**
 * Linh kiện Dùng chung Hiển thị Thông tin Cán bộ Nhân viên (EmployeeBadge)
 * Đảm bảo tính nhất quán toàn bộ WebApp: Khi đổi kích thước, màu viền hoặc cấu trúc nhãn,
 * chỉ cần sửa 1 lần tại component này.
 *
 * @param {object} employee Đối tượng cán bộ ({ id, code, name, avatar, position, department })
 * @param {string} size 'xs' | 'sm' | 'md' | 'lg'
 * @param {boolean} showCode Có hiển thị Mã cán bộ hay không (mặc định: true)
 * @param {boolean} showPosition Có hiển thị Chức vụ hay không (mặc định: false)
 * @param {boolean} showDepartment Có hiển thị Phòng ban hay không (mặc định: false)
 * @param {string} className Lớp CSS tùy chỉnh mở rộng
 */
const EmployeeBadge = ({
  employee,
  size = 'md',
  showCode = true,
  showPosition = false,
  showDepartment = false,
  className = '',
}) => {
  if (!employee) return <span className="text-slate-400 text-xs italic">Chưa xác định</span>;

  const name = employee.name || employee.employeeName || 'Cán bộ';
  const code = employee.code || employee.employeeCode || '';
  const avatar = employee.avatar || null;
  const position = employee.position || employee.currentPosition || '';
  const department = employee.department || '';

  // Kích thước Avatar
  const avatarSizeClasses = {
    xs: 'w-5 h-5 text-[10px] rounded-md',
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-9 h-9 text-xs rounded-xl',
    lg: 'w-12 h-12 text-sm rounded-2xl',
  };

  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Avatar Container */}
      <div
        className={`${avatarSizeClasses[size] || avatarSizeClasses.md} bg-gradient-to-tr from-[#047857] to-[#059669] text-amber-300 font-bold flex items-center justify-center overflow-hidden shrink-0 border border-emerald-300/40 shadow-2xs`}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      {/* Info Container */}
      <div className="min-w-0 text-left leading-tight">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-slate-900 text-xs truncate">
            {name}
          </span>
          {showCode && code && (
            <span className="px-1.5 py-0.2 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-mono font-bold shrink-0">
              {code}
            </span>
          )}
        </div>

        {(showPosition || showDepartment) && (
          <div className="text-[11px] text-slate-500 truncate mt-0.5">
            {showPosition && position}
            {showPosition && showDepartment && department && ' • '}
            {showDepartment && department}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeBadge;

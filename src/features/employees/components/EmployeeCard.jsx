import React from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  History 
} from 'lucide-react';
import Badge from '../../../components/common/Badge';
import { ROLE_LABELS } from '../../../lib/constants';
import { formatDateVN } from '../../../lib/dateUtils';

const EmployeeCard = ({
  emp,
  onOpenHistory,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-300 hover:shadow-md p-5 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#0f766e] font-bold text-base flex items-center justify-center overflow-hidden shrink-0">
            {emp.avatar ? (
              <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
            ) : (
              emp.name.charAt(0)
            )}
          </div>

          <Badge
            variant={
              emp.role === 'chairman'
                ? 'danger'
                : emp.role === 'manager'
                ? 'primary'
                : 'default'
            }
            size="sm"
          >
            {ROLE_LABELS[emp.role] || emp.role}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
            {emp.gender && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                {emp.gender}
              </span>
            )}
          </div>
          <div className="text-[11px] font-bold text-[#0f766e] uppercase tracking-wider">
            {emp.code} • {emp.position}
          </div>
          <div className="text-xs text-slate-500">{emp.department}</div>
          {emp.cccd && (
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
              <span className="text-slate-400">CCCD:</span>
              <span className="font-semibold text-slate-700">{emp.cccd}</span>
            </div>
          )}
          {emp.partyDate && (
            <div className="text-[10px] text-amber-900 bg-amber-50/90 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-medium mt-1">
              <Award className="w-3 h-3 text-amber-600 shrink-0" />
              <span>
                Đảng viên (Vào: {formatDateVN(emp.partyDate)}
                {emp.partyOfficialDate ? ` • CT: ${formatDateVN(emp.partyOfficialDate)}` : ''})
              </span>
            </div>
          )}
          {emp.assignedArea && (
            <div className="text-[11px] text-slate-600 flex items-center gap-1 pt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{emp.assignedArea}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">{emp.email}</span>
        </div>
        {emp.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{emp.phone}</span>
          </div>
        )}

        {/* Nút Xem Quá trình Luân chuyển công tác */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onOpenHistory(emp)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 text-[#0f766e] font-semibold text-xs transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[#0f766e]" />
            <span>Lịch sử luân chuyển công tác</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EmployeeCard);

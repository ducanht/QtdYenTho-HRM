import React, { useState } from 'react';
import { 
  Building2, 
  UserCheck 
} from 'lucide-react';
import KpiFundHistorySection from './KpiFundHistorySection';
import KpiPersonalHistorySection from './KpiPersonalHistorySection';

/**
 * Tab 4: Bộ Điều Phối Lịch Sử Đa Kỳ (SPECIFIC)
 */
const KpiHistoryTab = ({
  historyList = [],
  personalHistory = [],
  currentUser = null,
  isManager = false,
  isChairman = false,
  isAdmin = false,
  periodOptions = [],
  onOpenPrintModal,
}) => {
  const canAccessFundHistory = isChairman || isManager || isAdmin;
  const [subView, setSubView] = useState(canAccessFundHistory ? 'FUND' : 'PERSONAL');

  return (
    <div className="space-y-6">
      {/* Thanh chuyển đổi phân hệ lịch sử nếu có quyền quản trị */}
      {canAccessFundHistory && (
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl max-w-fit border border-slate-200">
          <button
            type="button"
            onClick={() => setSubView('FUND')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === 'FUND'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lịch Sử Toàn Quỹ</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('PERSONAL')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === 'PERSONAL'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Lịch Sử Bản Thân</span>
          </button>
        </div>
      )}

      {/* Render Component tương ứng */}
      {subView === 'FUND' && canAccessFundHistory ? (
        <KpiFundHistorySection
          historyList={historyList}
          periodOptions={periodOptions}
          onOpenPrintModal={onOpenPrintModal}
        />
      ) : (
        <KpiPersonalHistorySection
          personalHistory={personalHistory}
          currentUser={currentUser}
          onOpenPrintModal={onOpenPrintModal}
        />
      )}
    </div>
  );
};

export default KpiHistoryTab;

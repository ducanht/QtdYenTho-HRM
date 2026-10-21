import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Users, 
  UserCheck 
} from 'lucide-react';
import KpiSelfScoringForm from './KpiSelfScoringForm';
import KpiManagerReviewSection from './KpiManagerReviewSection';
import KpiBoardApprovalSection from './KpiBoardApprovalSection';

/**
 * Tab 2: Bộ Điều Phối Chấm Điểm 3 Cấp (SPECIFIC)
 */
const KpiScoringTab = ({
  period = '',
  currentUser = null,
  isManager = false,
  isChairman = false,
  isAdmin = false,
  myCurrentKpi = null,
  criteriaList = [],
  kpiList = [],
  onSubmitStep1,
  onRefresh,
  isSubmitting = false
}) => {
  // Quyền truy cập
  const canReviewManager = isManager || isAdmin;
  const canReviewBoard = isChairman || isAdmin;

  // Chế độ xem mặc định cho từng vai trò
  const defaultSubView = canReviewBoard 
    ? 'BOARD_APPROVAL' 
    : (canReviewManager ? 'MANAGER_REVIEW' : 'SELF_SCORING');

  const [subView, setSubView] = useState(defaultSubView);

  return (
    <div className="space-y-6">
      {/* Phân hệ đa vai trò: Cho phép Lãnh đạo chuyển đổi giữa Duyệt cấp dưới & Tự chấm cá nhân */}
      {(canReviewManager || canReviewBoard) && (
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl max-w-fit border border-slate-200">
          {canReviewBoard && (
            <button
              type="button"
              onClick={() => setSubView('BOARD_APPROVAL')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subView === 'BOARD_APPROVAL'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>HĐQT Phê Duyệt</span>
            </button>
          )}

          {canReviewManager && (
            <button
              type="button"
              onClick={() => setSubView('MANAGER_REVIEW')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subView === 'MANAGER_REVIEW'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Thẩm Định Phòng Ban</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSubView('SELF_SCORING')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === 'SELF_SCORING'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Bản Thân Tự Chấm</span>
          </button>
        </div>
      )}

      {/* Render Component tương ứng */}
      {subView === 'BOARD_APPROVAL' && canReviewBoard && (
        <KpiBoardApprovalSection
          kpiList={kpiList}
          currentUser={currentUser}
          period={period}
          onApprovalCompleted={onRefresh}
        />
      )}

      {subView === 'MANAGER_REVIEW' && canReviewManager && (
        <KpiManagerReviewSection
          kpiList={kpiList}
          currentUser={currentUser}
          period={period}
          onReviewCompleted={onRefresh}
        />
      )}

      {subView === 'SELF_SCORING' && (
        <KpiSelfScoringForm
          period={period}
          currentUser={currentUser}
          myCurrentKpi={myCurrentKpi}
          criteriaList={criteriaList}
          onSubmitStep1={onSubmitStep1}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default KpiScoringTab;

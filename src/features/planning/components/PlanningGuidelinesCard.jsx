import React from 'react';
import { HelpCircle } from 'lucide-react';
import Card from '../../../components/common/Card';

const PlanningGuidelinesCard = () => {
  return (
    <Card className="bg-slate-50 border-slate-200 text-xs text-slate-600 space-y-2">
      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
        <HelpCircle className="w-4 h-4 text-[#0f766e]" />
        Quy chế lấy phiếu tín nhiệm QTDND:
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500">
        Nhân sự đạt trên 50% số phiếu "Tín nhiệm cao" và "Tín nhiệm" sẽ đủ điều kiện hoàn thiện
        hồ sơ trình Ngân hàng Nhà nước Chi nhánh tỉnh thẩm định trước khi bổ nhiệm chính thức.
      </p>
    </Card>
  );
};

export default React.memo(PlanningGuidelinesCard);

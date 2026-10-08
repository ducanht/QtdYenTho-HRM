import React from 'react';

const DashboardLiveHeader = () => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        <span className="font-bold text-slate-800">Dữ liệu điều hành:</span>
        <span>Ban điều hành & Chủ tịch HĐQT</span>
      </div>

      <div className="flex items-center gap-2.5 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="font-bold text-slate-700">Trạng thái kết nối:</span>
        <span className="text-[#0f766e] font-semibold">Đồng bộ trực tuyến</span>
      </div>
    </div>
  );
};

export default React.memo(DashboardLiveHeader);

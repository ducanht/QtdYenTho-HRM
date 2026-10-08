import React from 'react';
import { Search, Edit3, CheckCheck } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import EmployeeBadge from '../../../components/common/EmployeeBadge';
import StatusBadge from '../../../components/common/StatusBadge';
import { formatDateTimeVN } from '../../../lib/dateUtils';

/**
 * Step 2 & 3: Bảng Theo Dõi & Phê Duyệt Điểm KPI Toàn Đơn Vị
 */
const KpiApprovalTable = ({
  kpiList,
  loading,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  isManager,
  isChairman,
  onOpenActionModal
}) => {
  return (
    <Card
      title="Theo Dõi Tiến Trình Đánh Giá KPI Toàn Đơn Vị"
      subtitle="Cập nhật tiến độ 3 cấp chấm điểm và phê duyệt theo thời gian thực"
    >
      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm cán bộ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500">Trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 cursor-pointer"
          >
            <option value="ALL">Tất cả</option>
            <option value="pending_manager">Chờ BĐH chấm</option>
            <option value="pending_chairman">Chờ Chủ tịch chấm</option>
            <option value="completed">Đã hoàn tất</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12">
          <Spinner text="Đang tải dữ liệu KPI..." />
        </div>
      ) : kpiList.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Chưa có dữ liệu KPI nào trong kỳ này.
        </div>
      ) : (
        <div className="space-y-3">
          {kpiList.map((item) => {
            const canManagerScore = isManager && item.status === 'pending_manager';
            const canChairmanScore = isChairman && item.status === 'pending_chairman';

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200/90 hover:border-teal-300 bg-white shadow-xs transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <EmployeeBadge
                      employee={{
                        name: item.employeeName,
                        code: item.employeeCode,
                        position: item.position,
                        department: item.department,
                      }}
                      size="md"
                      showCode={true}
                      showPosition={true}
                      showDepartment={true}
                    />
                    {item.updatedAt && (
                      <div className="text-[10px] text-slate-400 ml-11 mt-0.5">
                        Cập nhật: {formatDateTimeVN(item.updatedAt)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge type="kpi_status" value={item.status} />

                    {/* Action Button for Manager or Chairman */}
                    {canManagerScore && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Edit3}
                        onClick={() => onOpenActionModal(item)}
                      >
                        BĐH Chấm (30%)
                      </Button>
                    )}

                    {canChairmanScore && (
                      <Button
                        variant="danger"
                        size="sm"
                        icon={CheckCheck}
                        onClick={() => onOpenActionModal(item)}
                      >
                        Chủ Tịch Phê Duyệt (30%)
                      </Button>
                    )}
                  </div>
                </div>

                {/* 3 Steps Scoring Progress Display */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                  {/* Step 1 Self (40%) */}
                  <div className="p-2 rounded-lg bg-teal-50/70 border border-teal-100">
                    <div className="text-[10px] text-slate-500 font-semibold">
                      Tự chấm (40%)
                    </div>
                    <div className="text-sm font-black text-[#0f766e]">
                      {item.scoreSelf ?? '--'}
                    </div>
                  </div>

                  {/* Step 2 Manager (30%) */}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-semibold">
                      BĐH chấm (30%)
                    </div>
                    <div className="text-sm font-black text-slate-800">
                      {item.scoreManager ?? (
                        <span className="text-amber-500 text-xs font-normal">Chờ</span>
                      )}
                    </div>
                  </div>

                  {/* Step 3 Chairman (30%) */}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-semibold">
                      Chủ tịch (30%)
                    </div>
                    <div className="text-sm font-black text-slate-800">
                      {item.scoreChairman ?? (
                        <span className="text-slate-400 text-xs font-normal">Chờ</span>
                      )}
                    </div>
                  </div>

                  {/* Final Score */}
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] text-emerald-800 font-bold">
                      Tổng kết
                    </div>
                    <div className="text-sm font-black text-emerald-700">
                      {item.finalScore !== null && item.finalScore !== undefined
                        ? item.finalScore
                        : '--'}
                    </div>
                  </div>
                </div>

                {/* Notes snippet */}
                {item.selfNotes && (
                  <p className="mt-2 text-[11px] text-slate-500 italic truncate">
                    Tự nhận xét: "{item.selfNotes}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default KpiApprovalTable;

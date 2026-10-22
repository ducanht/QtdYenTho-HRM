import React from 'react';
import KpiWeightsConfigCard from './KpiWeightsConfigCard';
import KpiPeriodConfigCard from './KpiPeriodConfigCard';
import KpiCriteriaGroupManager from './KpiCriteriaGroupManager';
import KpiCriteriaManager from './KpiCriteriaManager';

/**
 * Tab 5: Cấu Hình & Tiêu Chí Đánh Giá KPI (SPECIFIC)
 * Bao gồm:
 * 1. Cấu hình Tỷ trọng 3 Cấp (40-30-30) & Ngưỡng xếp loại
 * 2. Cấu hình & Quản trị Kỳ chấm điểm KPI (kpi_periods: Tháng, Quý, CBNV tham gia)
 * 3. Quản trị Danh mục Nhóm tiêu chí KPI động (kpi_criteria_groups)
 * 4. Quản lý Danh mục Tiêu chí chi tiết (kpi_criteria)
 */
const KpiSettingsTab = ({
  criteriaList = [],
  groups = [],
  periods = [],
  employees = [],
  departments = [],
  kpiSettings = { self: 40, manager: 30, chairman: 30 },
  thresholds = { excellent: 90, good: 75, pass: 60 },
  canManage = false,
  onSaveConfig,
  onRefresh,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Cấu hình tỷ trọng 3 cấp & Thang điểm xếp loại */}
      <KpiWeightsConfigCard
        weights={kpiSettings}
        thresholds={thresholds}
        canManage={canManage}
        onSaveConfig={onSaveConfig}
      />

      {/* 2. Cấu hình & Quản trị Kỳ đánh giá KPI (Hàng tháng & Tổng hợp Quý) */}
      <KpiPeriodConfigCard
        periods={periods}
        employees={employees}
        canManage={canManage}
        onRefresh={onRefresh}
      />

      {/* 3. Quản lý Nhóm tiêu chí KPI động (Thêm/Sửa/Xóa nhóm) */}
      <KpiCriteriaGroupManager
        groups={groups}
        criteriaList={criteriaList}
        canManage={canManage}
        onRefresh={onRefresh}
      />

      {/* 4. Quản lý Danh mục tiêu chí chi tiết động */}
      <KpiCriteriaManager
        criteriaList={criteriaList}
        groups={groups}
        departments={departments}
        canManage={canManage}
        onRefresh={onRefresh}
      />
    </div>
  );
};

export default KpiSettingsTab;

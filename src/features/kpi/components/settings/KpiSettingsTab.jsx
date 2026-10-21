import React from 'react';
import KpiWeightsConfigCard from './KpiWeightsConfigCard';
import KpiCriteriaManager from './KpiCriteriaManager';

/**
 * Tab 5: Cấu Hình & Tiêu Chí Đánh Giá KPI (SPECIFIC)
 */
const KpiSettingsTab = ({
  criteriaList = [],
  departments = [],
  kpiSettings = { self: 40, manager: 30, chairman: 30 },
  thresholds = { excellent: 90, good: 75, pass: 60 },
  canManage = false,
  onSaveConfig,
  onRefresh,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Cấu hình tỷ trọng & Thang điểm xếp loại */}
      <KpiWeightsConfigCard
        weights={kpiSettings}
        thresholds={thresholds}
        canManage={canManage}
        onSaveConfig={onSaveConfig}
      />

      {/* 2. Quản lý danh mục tiêu chí động */}
      <KpiCriteriaManager
        criteriaList={criteriaList}
        departments={departments}
        canManage={canManage}
        onRefresh={onRefresh}
      />
    </div>
  );
};

export default KpiSettingsTab;

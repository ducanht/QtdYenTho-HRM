import React, { useState, useMemo } from 'react';
import KpiMetricCards from './KpiMetricCards';
import KpiDepartmentComparisonChart from './KpiDepartmentComparisonChart';
import KpiRatingDistributionChart from './KpiRatingDistributionChart';
import KpiBoardTrackerTable from './KpiBoardTrackerTable';
import KpiBulkApproveModal from './KpiBulkApproveModal';
import { getKpiSummaryStats, bulkApproveKpi, exportKpiSummaryToExcel } from '../../services/kpiService';
import { useToast } from '../../../../context/ToastContext';

/**
 * Tab 1: Tổng Quan Quản Trị HĐQT (SPECIFIC)
 */
const KpiOverviewTab = ({
  kpiList = [],
  loading = false,
  period = '',
  isChairman = false,
  isManager = false,
  isAdmin = false,
  onOpenActionModal,
  onOpenPrintModal,
}) => {
  const toast = useToast();
  const [isBulkApproveOpen, setIsBulkApproveOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Tính toán số liệu thống kê tổng thể
  const summaryStats = useMemo(() => {
    return getKpiSummaryStats(kpiList);
  }, [kpiList]);

  // Danh sách các phiếu chờ HĐQT duyệt
  const pendingChairmanList = useMemo(() => {
    return kpiList.filter((k) => k.status === 'pending_chairman');
  }, [kpiList]);

  // Xử lý phê duyệt hàng loạt
  const handleBulkApprove = async (approverInfo) => {
    setIsProcessingBulk(true);
    try {
      const res = await bulkApproveKpi(pendingChairmanList, approverInfo);
      toast.success(`HĐQT đã phê chuẩn thành công ${res.count} phiếu đánh giá KPI!`);
      setIsBulkApproveOpen(false);
    } catch (err) {
      console.error('Lỗi bulkApproveKpi:', err);
      toast.error('Có lỗi xảy ra khi phê chuẩn hàng loạt.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Xuất Excel tổng hợp
  const handleExportExcel = async () => {
    try {
      await exportKpiSummaryToExcel(kpiList, period);
      toast.success('Đã xuất Bảng tổng hợp KPI ra Excel thành công!');
    } catch (err) {
      console.error('Lỗi exportKpiSummaryToExcel:', err);
      toast.error('Có lỗi xảy ra khi xuất file Excel.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 4 Thẻ KPI Chỉ Số Nòng Cốt */}
      <KpiMetricCards stats={summaryStats} />

      {/* 2. Biểu Đồ So Sánh Phòng Ban & Phân Bổ Xếp Loại */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <KpiDepartmentComparisonChart departmentStats={summaryStats.departmentStats} />
        </div>
        <div className="lg:col-span-5">
          <KpiRatingDistributionChart 
            classifications={summaryStats.classifications}
            totalCompleted={summaryStats.completed}
          />
        </div>
      </div>

      {/* 3. Bảng Theo Dõi Tiến Trình Toàn Đơn Vị */}
      <div>
        <KpiBoardTrackerTable
          kpiList={kpiList}
          loading={loading}
          period={period}
          isChairman={isChairman}
          isManager={isManager}
          isAdmin={isAdmin}
          onOpenActionModal={onOpenActionModal}
          onOpenBulkApprove={() => setIsBulkApproveOpen(true)}
          onExportExcel={handleExportExcel}
          onOpenPrintModal={onOpenPrintModal}
        />
      </div>

      {/* Modal Phê Duyệt Hàng Loạt */}
      <KpiBulkApproveModal
        isOpen={isBulkApproveOpen}
        onClose={() => setIsBulkApproveOpen(false)}
        pendingList={pendingChairmanList}
        period={period}
        onBulkApprove={handleBulkApprove}
        isProcessing={isProcessingBulk}
      />
    </div>
  );
};

export default KpiOverviewTab;

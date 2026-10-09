import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  CheckSquare, 
  Users
} from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';
import Modal from '../../../../components/common/Modal';
import StatusBadge from '../../../../components/common/StatusBadge';
import PeriodMasterSidebar from '../../../trust/components/PeriodMasterSidebar';
import DeletePeriodConfirmModal from '../../../trust/components/DeletePeriodConfirmModal';
import { TRUST_CRITERIA_DEFAULT as DEFAULT_CRITERIA } from '../../../../lib/constants';
import { getEligibleTargetEmployees, isSystemAdminAccount } from '../../../../lib/evaluationUtils';

// Helper phân loại màu sắc badge cho từng nhóm tiêu chí chuẩn mực
const getGroupBadgeStyle = (group) => {
  const g = (group || '').toLowerCase();
  if (g.includes('đạo đức') || g.includes('phẩm chất')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  if (g.includes('kỷ luật') || g.includes('tuân thủ') || g.includes('chấp hành')) {
    return 'bg-blue-50 text-blue-800 border-blue-200';
  }
  if (g.includes('trách nhiệm')) {
    return 'bg-purple-50 text-purple-800 border-purple-200';
  }
  if (g.includes('lãnh đạo') || g.includes('điều hành')) {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  return 'bg-teal-50 text-teal-800 border-teal-200';
};

/**
 * TrustCriteriaSettings: Cấu hình Đợt Đánh Giá 2 cột kiểu iPad (Master - Detail)
 * - Cột trái (Master): Dùng PeriodMasterSidebar kèm nút Tạo đợt, Sửa, Xóa đợt (bảo mật mật khẩu)
 * - Cột phải (Detail): Cấu hình cho đợt được chọn (Quy chế, Ngưỡng điểm, Cán bộ áp dụng, Bộ tiêu chí)
 * - Nút Lưu Cấu Hình hiển thị 100% rõ ràng ở cả Header Card và Sticky Toolbar đáy màn hình
 */
const TrustCriteriaSettings = ({
  periods = [],
  selectedPeriodId = '',
  onSelectPeriod,
  currentPeriod = null,
  periodConfig = null,
  employees = [],
  onSavePeriodConfig,
  isSaving = false,
  canManagePeriods = false,
  onOpenCreatePeriod,
  onOpenEditPeriod,
  onDeletePeriod,
  currentUser,
}) => {
  // Modal xác nhận xóa đợt có nhập mật khẩu quản trị
  const [periodToDelete, setPeriodToDelete] = useState(null);

  // State cấu hình cục bộ của đợt đang chọn (Cột phải)
  // State cấu hình cục bộ của đợt đang chọn (Cột phải)
  const [localConfig, setLocalConfig] = useState({
    excellentThreshold: 90,
    excellentMinCrit: 7,
    goodThreshold: 70,
    goodMinCrit: 5,
    passThreshold: 50,
    weakVotesThresholdPercent: 50,
    votingMode: 'ANONYMOUS',
    allowSelfEvaluation: false,
    voterEmployeeIds: [],
    targetEmployeeIds: [],
    criteria: [...DEFAULT_CRITERIA],
  });

  // Danh sách cán bộ nhân viên nghiệp vụ chính thức (Loại trừ tài khoản kỹ thuật / Quản trị hệ thống)
  const officialStaff = React.useMemo(() => {
    return employees.filter((e) => !isSystemAdminAccount(e));
  }, [employees]);

  // Modal Thêm/Sửa Tiêu chí của riêng đợt này
  const [critModalOpen, setCritModalOpen] = useState(false);
  const [editingCritIndex, setEditingCritIndex] = useState(null);
  const [critForm, setCritForm] = useState({
    code: '',
    title: '',
    group: 'Năng lực chuyên môn',
    description: '',
    maxScore: 10,
    minScore: 0,
    weight: 10,
  });

  // Đồng bộ state cấu hình mỗi khi đợt đánh giá thay đổi
  useEffect(() => {
    if (periodConfig) {
      // Làm sạch targetEmployeeIds: đảm bảo 100% không chứa tài khoản quản trị hệ thống
      const rawTargetIds = periodConfig.targetEmployeeIds || currentPeriod?.targetEmployeeIds;
      const cleanTargetIds = getEligibleTargetEmployees(employees, rawTargetIds).map((e) => e.id);

      setLocalConfig({
        excellentThreshold: periodConfig.excellentThreshold ?? 90,
        excellentMinCrit: periodConfig.excellentMinCrit ?? 7,
        goodThreshold: periodConfig.goodThreshold ?? 70,
        goodMinCrit: periodConfig.goodMinCrit ?? 5,
        passThreshold: periodConfig.passThreshold ?? 50,
        weakVotesThresholdPercent: periodConfig.weakVotesThresholdPercent ?? 50,
        votingMode: periodConfig.votingMode || currentPeriod?.votingMode || 'ANONYMOUS',
        allowSelfEvaluation: periodConfig.allowSelfEvaluation ?? currentPeriod?.allowSelfEvaluation ?? false,
        voterEmployeeIds: (
          periodConfig.voterEmployeeIds ||
          currentPeriod?.voterEmployeeIds ||
          officialStaff.map((e) => e.id)
        ).filter((id) => !isSystemAdminAccount({ id, code: id })),
        targetEmployeeIds: cleanTargetIds,
        criteria:
          periodConfig.criteria && periodConfig.criteria.length > 0
            ? periodConfig.criteria
            : currentPeriod?.customCriteria && currentPeriod.customCriteria.length > 0
            ? currentPeriod.customCriteria
            : [...DEFAULT_CRITERIA],
      });
    } else if (currentPeriod) {
      const cleanTargetIds = getEligibleTargetEmployees(employees, currentPeriod.targetEmployeeIds).map((e) => e.id);

      setLocalConfig({
        excellentThreshold: currentPeriod.thresholds?.excellent ?? currentPeriod.excellentThreshold ?? 90,
        excellentMinCrit: currentPeriod.thresholds?.excellentMinCrit ?? 7,
        goodThreshold: currentPeriod.thresholds?.good ?? currentPeriod.goodThreshold ?? 70,
        goodMinCrit: currentPeriod.thresholds?.goodMinCrit ?? 5,
        passThreshold: currentPeriod.thresholds?.pass ?? currentPeriod.passThreshold ?? 50,
        weakVotesThresholdPercent: currentPeriod.thresholds?.weakVotesThresholdPercent ?? 50,
        votingMode: currentPeriod.votingMode || 'ANONYMOUS',
        allowSelfEvaluation: currentPeriod.allowSelfEvaluation ?? false,
        voterEmployeeIds: (currentPeriod.voterEmployeeIds || officialStaff.map((e) => e.id)).filter((id) => !isSystemAdminAccount({ id, code: id })),
        targetEmployeeIds: cleanTargetIds,
        criteria:
          currentPeriod.customCriteria && currentPeriod.customCriteria.length > 0
            ? currentPeriod.customCriteria
            : [...DEFAULT_CRITERIA],
      });
    }
  }, [periodConfig, currentPeriod, employees, officialStaff]);

  // Handler: Chọn nhanh Người tham gia bỏ phiếu (Cử tri) theo phòng ban (Chỉ cán bộ thực tế officialStaff)
  const handleSelectVotersByDept = (dept) => {
    if (dept === 'ALL') {
      setLocalConfig((prev) => ({
        ...prev,
        voterEmployeeIds: officialStaff.map((e) => e.id),
      }));
    } else if (dept === 'NONE') {
      setLocalConfig((prev) => ({
        ...prev,
        voterEmployeeIds: [],
      }));
    } else if (dept === 'LEADERSHIP') {
      const matchingIds = officialStaff.filter((e) => 
        e.department?.includes('Hội đồng Quản trị') ||
        e.department?.includes('Ban Điều hành') ||
        e.department?.includes('Ban Kiểm soát') ||
        e.position?.includes('Chủ tịch') ||
        e.position?.includes('Giám đốc')
      ).map((e) => e.id);
      setLocalConfig((prev) => ({
        ...prev,
        voterEmployeeIds: Array.from(new Set([...(prev.voterEmployeeIds || []), ...matchingIds])),
      }));
    } else {
      const matchingIds = officialStaff.filter((e) => e.department === dept).map((e) => e.id);
      setLocalConfig((prev) => ({
        ...prev,
        voterEmployeeIds: Array.from(new Set([...(prev.voterEmployeeIds || []), ...matchingIds])),
      }));
    }
  };

  // Handler: Chọn nhanh Cán bộ được lấy phiếu theo phòng ban (Chỉ trong danh sách chuyên môn officialStaff)
  const handleSelectEmployeesByDept = (dept) => {
    if (dept === 'ALL') {
      setLocalConfig((prev) => ({
        ...prev,
        targetEmployeeIds: officialStaff.map((e) => e.id),
      }));
    } else if (dept === 'NONE') {
      setLocalConfig((prev) => ({
        ...prev,
        targetEmployeeIds: [],
      }));
    } else if (dept === 'LEADERSHIP') {
      const matchingIds = officialStaff.filter((e) => 
        e.department?.includes('Hội đồng Quản trị') ||
        e.department?.includes('Ban Điều hành') ||
        e.department?.includes('Ban Kiểm soát') ||
        e.position?.includes('Chủ tịch') ||
        e.position?.includes('Giám đốc')
      ).map((e) => e.id);
      setLocalConfig((prev) => ({
        ...prev,
        targetEmployeeIds: Array.from(new Set([...(prev.targetEmployeeIds || []), ...matchingIds])),
      }));
    } else {
      const matchingIds = officialStaff.filter((e) => e.department === dept).map((e) => e.id);
      setLocalConfig((prev) => ({
        ...prev,
        targetEmployeeIds: Array.from(new Set([...(prev.targetEmployeeIds || []), ...matchingIds])),
      }));
    }
  };


  // Handler: Mở modal thêm/sửa tiêu chí cho riêng đợt này
  const handleOpenCritModal = (crit = null, index = null) => {
    if (crit && index !== null) {
      setEditingCritIndex(index);
      setCritForm({
        code: crit.code || `TC0${index + 1}`,
        title: crit.title || '',
        group: crit.group || 'Năng lực chuyên môn',
        description: crit.description || '',
        maxScore: crit.maxScore || 10,
        minScore: crit.minScore || 0,
        weight: crit.weight || 10,
      });
    } else {
      setEditingCritIndex(null);
      const nextId = (localConfig.criteria || []).length + 1;
      setCritForm({
        code: `TC${String(nextId).padStart(2, '0')}`,
        title: `${nextId}. Tiêu chí đánh giá mới`,
        group: 'Phẩm chất đạo đức',
        description: '',
        maxScore: 10,
        minScore: 0,
        weight: 10,
      });
    }
    setCritModalOpen(true);
  };

  // Handler: Lưu tiêu chí vào đợt này
  const handleSubmitCrit = (e) => {
    e.preventDefault();
    if (!critForm.title.trim()) return;

    setLocalConfig((prev) => {
      const updatedCriteria = [...(prev.criteria || [])];
      if (editingCritIndex !== null && updatedCriteria[editingCritIndex]) {
        updatedCriteria[editingCritIndex] = {
          ...updatedCriteria[editingCritIndex],
          ...critForm,
        };
      } else {
        const nextId = updatedCriteria.length + 1;
        updatedCriteria.push({
          id: nextId,
          ...critForm,
        });
      }
      return { ...prev, criteria: updatedCriteria };
    });

    setCritModalOpen(false);
  };

  // Handler: Xóa tiêu chí khỏi đợt này
  const handleDeleteCritFromPeriod = (idx, title) => {
    if (!window.confirm(`Xác nhận xóa tiêu chí [${title}] khỏi đợt này?`)) return;
    setLocalConfig((prev) => ({
      ...prev,
      criteria: (prev.criteria || []).filter((_, index) => index !== idx),
    }));
  };

  // Handler: Khôi phục cấu hình chuẩn cho đợt này
  const handleResetStandard = () => {
    if (!window.confirm('Khôi phục cấu hình đợt này về chuẩn mặc định 10 tiêu chí và 4 mức xếp loại quy chuẩn (90/70/50, khống chế tiêu chí 7/5, phiếu yếu 50%)?')) return;
    setLocalConfig((prev) => ({
      ...prev,
      excellentThreshold: 90,
      excellentMinCrit: 7,
      goodThreshold: 70,
      goodMinCrit: 5,
      passThreshold: 50,
      weakVotesThresholdPercent: 50,
      votingMode: 'ANONYMOUS',
      allowSelfEvaluation: false,
      voterEmployeeIds: employees.map((e) => e.id),
      targetEmployeeIds: employees.map((e) => e.id),
      criteria: [...DEFAULT_CRITERIA],
    }));
  };

  // Handler: Lưu cấu hình riêng cho đợt này
  const handleSaveCurrentPeriodConfig = () => {
    if (!currentPeriod?.id) return;
    onSavePeriodConfig(currentPeriod.id, {
      ...localConfig,
      periodId: currentPeriod.id,
      periodName: currentPeriod.name,
    });
  };

  // Tính toán số lượng cử tri và đối tượng hợp lệ được tích chọn (trên nền cán bộ thực tế officialStaff)
  const selectedVotersCount = React.useMemo(() => {
    const raw = localConfig.voterEmployeeIds || [];
    return raw.filter((id) => officialStaff.some((e) => e.id === id)).length;
  }, [localConfig.voterEmployeeIds, officialStaff]);

  const selectedTargetsCount = React.useMemo(() => {
    const raw = localConfig.targetEmployeeIds || [];
    return raw.filter((id) => officialStaff.some((e) => e.id === id)).length;
  }, [localConfig.targetEmployeeIds, officialStaff]);

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* LAYOUT 2 CỘT KIỂU IPAD (MASTER - DETAIL)                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ===================================================================== */}
        {/* CỘT TRÁI (MASTER): DANH SÁCH CÁC ĐỢT ĐÁNH GIÁ (4/12 CỘT)              */}
        {/* ===================================================================== */}
        <div className="lg:col-span-4">
          <PeriodMasterSidebar
            periods={periods}
            selectedPeriodId={selectedPeriodId}
            onSelectPeriod={onSelectPeriod}
            showAdminControls={canManagePeriods}
            onOpenCreatePeriod={onOpenCreatePeriod}
            onOpenEditPeriod={onOpenEditPeriod}
            onDeletePeriodClick={(p) => setPeriodToDelete(p)}
            title="Đợt Đánh Giá"
            badgeRenderer={(p) => {
              const count = (p.targetEmployeeIds || []).filter((id) =>
                officialStaff.some((e) => e.id === id)
              ).length || officialStaff.length;
              return (
                <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  {count} đối tượng
                </span>
              );
            }}
          />
        </div>

        {/* ===================================================================== */}
        {/* CỘT PHẢI (DETAIL): CẤU HÌNH CHO ĐỢT ĐANG CHỌN (8/12 CỘT)              */}
        {/* ===================================================================== */}
        <div className="lg:col-span-8 space-y-4">
          {currentPeriod ? (
            <Card
              title={`Cấu hình: ${currentPeriod.name}`}
              subtitle={`Quý ${currentPeriod.quarter || 4} / ${currentPeriod.year || 2026} • Mã đợt: ${currentPeriod.id}`}
              action={
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={RotateCcw}
                    onClick={handleResetStandard}
                    className="text-xs font-bold border-slate-300 text-slate-700"
                  >
                    Chuẩn quy chế
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Save}
                    isLoading={isSaving}
                    onClick={handleSaveCurrentPeriodConfig}
                    className="font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  >
                    Lưu cấu hình
                  </Button>
                </div>
              }
            >
              {/* 1. THAM SỐ XẾP LOẠI TÍN NHIỆM (4 MỨC CHUẨN MỰC) & QUY CHẾ BỎ PHIẾU */}
              <div className="space-y-3.5 mb-5">
                {/* Khung cấu hình 4 mức xếp loại */}
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                      Tiêu Chuẩn Xếp Loại Tín Nhiệm (Thang 100 điểm)
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300">
                      Quy chế xếp loại
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    {/* Mức 1: Hoàn thành xuất sắc nhiệm vụ */}
                    <div className="p-2.5 rounded-lg border border-emerald-200 bg-white space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between font-bold text-emerald-900">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          1. Hoàn thành xuất sắc nhiệm vụ
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-normal text-slate-500">Từ</span>
                          <input
                            type="number"
                            value={localConfig.excellentThreshold ?? 90}
                            onChange={(e) =>
                              setLocalConfig((prev) => ({ ...prev, excellentThreshold: Number(e.target.value) }))
                            }
                            className="w-12 p-0.5 text-center font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded text-xs"
                          />
                          <span className="text-[11px] font-normal text-slate-500">- 100đ</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded">
                        <span>Điều kiện: Không tiêu chí nào &lt;</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={localConfig.excellentMinCrit ?? 7}
                            onChange={(e) =>
                              setLocalConfig((prev) => ({ ...prev, excellentMinCrit: Number(e.target.value) }))
                            }
                            className="w-10 p-0.5 text-center font-bold text-emerald-800 bg-white border border-slate-300 rounded text-xs"
                          />
                          <span>điểm</span>
                        </div>
                      </div>
                    </div>

                    {/* Mức 2: Hoàn thành tốt nhiệm vụ */}
                    <div className="p-2.5 rounded-lg border border-teal-200 bg-white space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between font-bold text-teal-900">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-500" />
                          2. Hoàn thành tốt nhiệm vụ
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-normal text-slate-500">Từ</span>
                          <input
                            type="number"
                            value={localConfig.goodThreshold ?? 70}
                            onChange={(e) =>
                              setLocalConfig((prev) => ({ ...prev, goodThreshold: Number(e.target.value) }))
                            }
                            className="w-12 p-0.5 text-center font-bold text-teal-800 bg-teal-50 border border-teal-300 rounded text-xs"
                          />
                          <span className="text-[11px] font-normal text-slate-500">- &lt;{localConfig.excellentThreshold ?? 90}đ</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded">
                        <span>Điều kiện: Không tiêu chí nào &lt;</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={localConfig.goodMinCrit ?? 5}
                            onChange={(e) =>
                              setLocalConfig((prev) => ({ ...prev, goodMinCrit: Number(e.target.value) }))
                            }
                            className="w-10 p-0.5 text-center font-bold text-teal-800 bg-white border border-slate-300 rounded text-xs"
                          />
                          <span>điểm</span>
                        </div>
                      </div>
                    </div>

                    {/* Mức 3: Hoàn thành nhiệm vụ */}
                    <div className="p-2.5 rounded-lg border border-amber-200 bg-white space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between font-bold text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          3. Hoàn thành nhiệm vụ
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-normal text-slate-500">Từ</span>
                          <input
                            type="number"
                            value={localConfig.passThreshold ?? 50}
                            onChange={(e) =>
                              setLocalConfig((prev) => ({ ...prev, passThreshold: Number(e.target.value) }))
                            }
                            className="w-12 p-0.5 text-center font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded text-xs"
                          />
                          <span className="text-[11px] font-normal text-slate-500">- &lt;{localConfig.goodThreshold ?? 70}đ</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded">
                        <span>Điểm trung bình từ {localConfig.passThreshold ?? 50} đến dưới {localConfig.goodThreshold ?? 70} điểm</span>
                      </div>
                    </div>

                    {/* Mức 4: Không hoàn thành nhiệm vụ */}
                    <div className="p-2.5 rounded-lg border border-rose-200 bg-white space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between font-bold text-rose-900">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          4. Không hoàn thành nhiệm vụ
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-normal text-slate-500">Dưới</span>
                          <span className="font-bold text-rose-700">{localConfig.passThreshold ?? 50}đ</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded">
                        <span>Hoặc có &gt;</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={localConfig.weakVotesThresholdPercent ?? 50}
                            onChange={(e) =>
                              setLocalConfig((prev) => ({ ...prev, weakVotesThresholdPercent: Number(e.target.value) }))
                            }
                            className="w-10 p-0.5 text-center font-bold text-rose-800 bg-white border border-slate-300 rounded text-xs"
                          />
                          <span>% số phiếu xếp Yếu (0-5đ)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hàng 2: Quy chế bỏ phiếu & Thống kê đợt */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Quy chế bỏ phiếu */}
                  <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
                    <span className="text-xs font-bold text-teal-900 uppercase tracking-wider block">
                      Hình Thức & Quy Chế Bỏ Phiếu
                    </span>
                    <div className="space-y-2 text-xs">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-slate-700">Bỏ phiếu kín (Ẩn danh 100%):</span>
                        <input
                          type="checkbox"
                          checked={localConfig.votingMode === 'ANONYMOUS'}
                          onChange={(e) =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              votingMode: e.target.checked ? 'ANONYMOUS' : 'PUBLIC',
                            }))
                          }
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-slate-700">Cho phép tự đánh giá bản thân:</span>
                        <input
                          type="checkbox"
                          checked={Boolean(localConfig.allowSelfEvaluation)}
                          onChange={(e) =>
                            setLocalConfig((prev) => ({ ...prev, allowSelfEvaluation: e.target.checked }))
                          }
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Thống kê đợt */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5 text-xs text-slate-600">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      Thông Tin Tổng Quát Đợt
                    </span>
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <StatusBadge type="period_status" value={currentPeriod.status} />
                    </div>
                    <div className="flex justify-between">
                      <span>Cử tri tham gia bỏ phiếu:</span>
                      <strong className="text-teal-800 font-bold">
                        {selectedVotersCount} / {officialStaff.length} cán bộ
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Đối tượng được lấy phiếu:</span>
                      <strong className="text-teal-800 font-bold">
                        {selectedTargetsCount} / {officialStaff.length} cán bộ
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. CẤU HÌNH CÁN BỘ: 2 PHÂN KHU (CỬ TRI THAM GIA BỎ PHIẾU & ĐỐI TƯỢNG ĐƯỢC LẤY PHIẾU) */}
              <div className="space-y-4 mb-5">
                {/* 2.1. NGƯỜI ĐƯỢC THAM GIA BỎ PHIẾU (CỬ TRI) */}
                <div className="border border-teal-200 bg-teal-50/20 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-700" />
                      <div>
                        <span className="text-xs font-bold text-teal-950 block">
                          Người được tham gia bỏ phiếu (Cử tri) ({selectedVotersCount} / {officialStaff.length})
                        </span>
                        <span className="text-[11px] text-teal-700">
                          Chỉ những cán bộ được tích chọn mới có quyền chấm điểm tín nhiệm trong đợt này
                        </span>
                      </div>
                    </div>

                    {/* Nút chọn nhanh Cử tri */}
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectVotersByDept('ALL')}
                        className="px-2 py-0.5 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 cursor-pointer"
                      >
                        Chọn tất cả ({officialStaff.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectVotersByDept('LEADERSHIP')}
                        className="px-2 py-0.5 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 cursor-pointer"
                      >
                        HĐQT & BĐH
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectVotersByDept('Phòng Tín dụng')}
                        className="px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 cursor-pointer"
                      >
                        Khối Tín dụng
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectVotersByDept('Phòng Kế toán - Ngân quỹ')}
                        className="px-2 py-0.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 cursor-pointer"
                      >
                        Khối Kế toán
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectVotersByDept('NONE')}
                        className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-white rounded-lg border border-teal-100">
                    {officialStaff.map((emp) => {
                      const isChecked = (localConfig.voterEmployeeIds || []).includes(emp.id);
                      return (
                        <label
                          key={`voter-${emp.id}`}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked ? 'bg-teal-50 border-teal-300 text-teal-950 font-bold' : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const cur = localConfig.voterEmployeeIds || [];
                              setLocalConfig((prev) => ({
                                ...prev,
                                voterEmployeeIds: e.target.checked
                                  ? [...cur, emp.id]
                                  : cur.filter((id) => id !== emp.id),
                              }));
                            }}
                            className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span className="truncate">{emp.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 2.2. CÁN BỘ ĐƯỢC LẤY PHIẾU TÍN NHIỆM (ĐỐI TƯỢNG ĐƯỢC ĐÁNH GIÁ) */}
                <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#0f766e]" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Cán bộ được lấy phiếu tín nhiệm ({selectedTargetsCount} / {officialStaff.length})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Danh sách cán bộ chuyên môn được cử tri chấm điểm đánh giá trong đợt
                        </span>
                      </div>
                    </div>

                    {/* Nút chọn nhanh Đối tượng */}
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectEmployeesByDept('ALL')}
                        className="px-2 py-0.5 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 cursor-pointer"
                      >
                        Chọn tất cả ({officialStaff.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectEmployeesByDept('LEADERSHIP')}
                        className="px-2 py-0.5 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 cursor-pointer"
                      >
                        HĐQT & BĐH
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectEmployeesByDept('Phòng Tín dụng')}
                        className="px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 cursor-pointer"
                      >
                        Khối Tín dụng
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectEmployeesByDept('Phòng Kế toán - Ngân quỹ')}
                        className="px-2 py-0.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 cursor-pointer"
                      >
                        Khối Kế toán
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectEmployeesByDept('NONE')}
                        className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50/50 rounded-lg">
                    {officialStaff.map((emp) => {
                      const isChecked = (localConfig.targetEmployeeIds || []).includes(emp.id);
                      return (
                        <label
                          key={`target-${emp.id}`}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked ? 'bg-teal-50 border-teal-300 text-teal-950 font-bold' : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const cur = localConfig.targetEmployeeIds || [];
                              setLocalConfig((prev) => ({
                                ...prev,
                                targetEmployeeIds: e.target.checked
                                  ? [...cur, emp.id]
                                  : cur.filter((id) => id !== emp.id),
                              }));
                            }}
                            className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span className="truncate">{emp.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>


              {/* 3. BỘ TIÊU CHÍ ĐÁNH GIÁ CỦA ĐỢT */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#0f766e]" />
                    <span className="text-xs font-bold text-slate-900">
                      Bộ tiêu chí đánh giá ({(localConfig.criteria || []).length} tiêu chí)
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    onClick={() => handleOpenCritModal()}
                    className="text-xs font-bold border-teal-300 text-teal-800 hover:bg-teal-50"
                  >
                    Thêm tiêu chí
                  </Button>
                </div>

                {/* 1. GIAO DIỆN MOBILE: DANH SÁCH DẠNG THẺ CARD (CHẠM VÀO THẺ ĐỂ SỬA, NHÓM DÙNG BADGE) */}
                <div className="block md:hidden space-y-2.5">
                  {(localConfig.criteria || []).map((crit, idx) => (
                    <div
                      key={crit.id || idx}
                      onClick={() => handleOpenCritModal(crit, idx)}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 hover:shadow-xs active:bg-slate-50 transition-all cursor-pointer space-y-2 group"
                    >
                      {/* Hàng 1: Mã tiêu chí & Badge Nhóm & Nút Xóa */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-teal-50 text-teal-900 border border-teal-200">
                            {crit.code}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getGroupBadgeStyle(crit.group)}`}>
                            {crit.group}
                          </span>
                        </div>

                        {/* Nút Xóa tiêu chí khỏi đợt */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCritFromPeriod(idx, crit.title);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa tiêu chí này khỏi đợt"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Hàng 2: Tên tiêu chí & Mô tả hướng dẫn (Rộng rãi, không bị cột dọc) */}
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-900 transition-colors leading-snug">
                          {crit.title}
                        </h4>
                        {crit.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {crit.description}
                          </p>
                        )}
                      </div>

                      {/* Hàng 3: Điểm tối đa, Trọng số & Nút chạm để sửa */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center gap-3 text-slate-600">
                          <span>Tối đa: <strong className="text-slate-900 font-bold">{crit.maxScore || 10}đ</strong></span>
                          <span>•</span>
                          <span>Trọng số: <strong className="text-teal-800 font-bold">{crit.weight || 10}%</strong></span>
                        </div>

                        <span className="text-[11px] font-bold text-[#0f766e] flex items-center gap-1 group-hover:underline">
                          <Edit3 className="w-3.5 h-3.5" />
                          Sửa
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. GIAO DIỆN DESKTOP / TABLET: BẢNG TABLE TIÊU CHUẨN */}
                <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                          <th className="py-2.5 px-3 w-16 text-center">Mã</th>
                          <th className="py-2.5 px-3">Tên tiêu chí</th>
                          <th className="py-2.5 px-3 min-w-[140px]">Nhóm</th>
                          <th className="py-2.5 px-3 text-center w-20">Điểm tối đa</th>
                          <th className="py-2.5 px-3 text-center w-20">Trọng số</th>
                          <th className="py-2.5 px-3 text-right w-20">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(localConfig.criteria || []).map((crit, idx) => (
                          <tr key={crit.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-800">
                              {crit.code}
                            </td>
                            <td 
                              className="py-2.5 px-3 cursor-pointer"
                              onClick={() => handleOpenCritModal(crit, idx)}
                              title="Bấm để chỉnh sửa tiêu chí"
                            >
                              <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                                {crit.title}
                              </div>
                              {crit.description && (
                                <div className="text-[11px] text-slate-500 line-clamp-1">{crit.description}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getGroupBadgeStyle(crit.group)}`}>
                                {crit.group}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                              {crit.maxScore || 10}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-teal-800">
                              {crit.weight || 10}%
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenCritModal(crit, idx)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                                  title="Sửa tiêu chí"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCritFromPeriod(idx, crit.title)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Xóa tiêu chí"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* THANH ACTION DƯỚI CÙNG (STICKY ACTION BAR - ĐẢM BẢO LUÔN NHÌN THẤY NÚT LƯU) */}
              <div className="sticky bottom-0 z-20 mt-6 pt-3.5 pb-2 border-t border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Đang cấu hình: <strong className="text-teal-900">{currentPeriod.name}</strong>
                </span>
                <div className="flex items-center gap-2.5 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={RotateCcw}
                    onClick={handleResetStandard}
                    className="text-xs font-bold border-slate-300 text-slate-700"
                  >
                    Chuẩn NHNN
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    icon={Save}
                    isLoading={isSaving}
                    onClick={handleSaveCurrentPeriodConfig}
                    className="font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-md px-5"
                  >
                    Lưu Cấu Hình Đợt Này
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-400">
              Vui lòng chọn một đợt đánh giá ở cột bên trái để bắt đầu cấu hình
            </Card>
          )}
        </div>
      </div>

      {/* Modal Thêm/Sửa Tiêu chí của riêng đợt này */}
      <Modal
        isOpen={critModalOpen}
        onClose={() => setCritModalOpen(false)}
        title={editingCritIndex !== null ? 'Chỉnh Sửa Tiêu Chí Đợt Đánh Giá' : 'Thêm Tiêu Chí Mới Cho Đợt'}
        subtitle={`Áp dụng cho đợt: ${currentPeriod?.name || ''}`}
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setCritModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSubmitCrit}>
              {editingCritIndex !== null ? 'Lưu tiêu chí' : 'Thêm vào đợt'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitCrit} className="space-y-3 text-xs">
          <Input
            label="Mã tiêu chí"
            value={critForm.code}
            onChange={(e) => setCritForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="TC01"
            required
          />
          <Input
            label="Tên tiêu chí"
            value={critForm.title}
            onChange={(e) => setCritForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Ví dụ: Năng lực xử lý công việc và tuân thủ quy trình"
            required
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nhóm tiêu chí</label>
            <select
              value={critForm.group}
              onChange={(e) => setCritForm((prev) => ({ ...prev, group: e.target.value }))}
              className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2"
            >
              <option value="Năng lực chuyên môn">Năng lực chuyên môn</option>
              <option value="Phẩm chất đạo đức">Phẩm chất đạo đức</option>
              <option value="Ý thức kỷ luật">Ý thức kỷ luật & Tuân thủ</option>
              <option value="Tinh thần trách nhiệm">Tinh thần trách nhiệm</option>
              <option value="Kỹ năng lãnh đạo">Kỹ năng lãnh đạo & Điều hành</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Điểm tối đa"
              type="number"
              value={critForm.maxScore}
              onChange={(e) => setCritForm((prev) => ({ ...prev, maxScore: Number(e.target.value) }))}
            />
            <Input
              label="Trọng số (%)"
              type="number"
              value={critForm.weight}
              onChange={(e) => setCritForm((prev) => ({ ...prev, weight: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả hướng dẫn</label>
            <textarea
              rows={2}
              value={critForm.description}
              onChange={(e) => setCritForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Hướng dẫn chấm điểm cho cán bộ..."
              className="w-full text-xs text-slate-800 bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </form>
      </Modal>

      {/* Modal bảo mật xác nhận xóa đợt (Bắt buộc nhập mật khẩu quản trị) */}
      <DeletePeriodConfirmModal
        isOpen={Boolean(periodToDelete)}
        onClose={() => setPeriodToDelete(null)}
        period={periodToDelete}
        onConfirmDelete={onDeletePeriod}
        currentUser={currentUser}
      />
    </div>
  );
};

export default React.memo(TrustCriteriaSettings);

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  CheckSquare, 
  Users, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';
import Modal from '../../../../components/common/Modal';
import StatusBadge from '../../../../components/common/StatusBadge';
import PeriodMasterSidebar from '../../../trust/components/PeriodMasterSidebar';
import DeletePeriodConfirmModal from '../../../trust/components/DeletePeriodConfirmModal';
import { TRUST_CRITERIA_DEFAULT as DEFAULT_CRITERIA } from '../../../../lib/constants';

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
  const [localConfig, setLocalConfig] = useState({
    excellentThreshold: 90,
    goodThreshold: 70,
    passThreshold: 50,
    votingMode: 'ANONYMOUS',
    allowSelfEvaluation: false,
    targetEmployeeIds: [],
    criteria: [...DEFAULT_CRITERIA],
  });

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
      setLocalConfig({
        excellentThreshold: periodConfig.excellentThreshold ?? 90,
        goodThreshold: periodConfig.goodThreshold ?? 70,
        passThreshold: periodConfig.passThreshold ?? 50,
        votingMode: periodConfig.votingMode || currentPeriod?.votingMode || 'ANONYMOUS',
        allowSelfEvaluation: periodConfig.allowSelfEvaluation ?? currentPeriod?.allowSelfEvaluation ?? false,
        targetEmployeeIds:
          periodConfig.targetEmployeeIds ||
          currentPeriod?.targetEmployeeIds ||
          employees.map((e) => e.id),
        criteria:
          periodConfig.criteria && periodConfig.criteria.length > 0
            ? periodConfig.criteria
            : currentPeriod?.customCriteria && currentPeriod.customCriteria.length > 0
            ? currentPeriod.customCriteria
            : [...DEFAULT_CRITERIA],
      });
    } else if (currentPeriod) {
      setLocalConfig({
        excellentThreshold: currentPeriod.thresholds?.excellent ?? currentPeriod.excellentThreshold ?? 90,
        goodThreshold: currentPeriod.thresholds?.good ?? currentPeriod.goodThreshold ?? 70,
        passThreshold: currentPeriod.thresholds?.pass ?? currentPeriod.passThreshold ?? 50,
        votingMode: currentPeriod.votingMode || 'ANONYMOUS',
        allowSelfEvaluation: currentPeriod.allowSelfEvaluation ?? false,
        targetEmployeeIds: currentPeriod.targetEmployeeIds || employees.map((e) => e.id),
        criteria:
          currentPeriod.customCriteria && currentPeriod.customCriteria.length > 0
            ? currentPeriod.customCriteria
            : [...DEFAULT_CRITERIA],
      });
    }
  }, [periodConfig, currentPeriod, employees]);

  // Handler: Chọn nhanh cán bộ theo phòng ban
  const handleSelectEmployeesByDept = (dept) => {
    if (dept === 'ALL') {
      setLocalConfig((prev) => ({
        ...prev,
        targetEmployeeIds: employees.map((e) => e.id),
      }));
    } else if (dept === 'NONE') {
      setLocalConfig((prev) => ({
        ...prev,
        targetEmployeeIds: [],
      }));
    } else {
      const matchingIds = employees.filter((e) => e.department === dept).map((e) => e.id);
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

  // Handler: Khôi phục cấu hình chuẩn NHNN cho đợt này
  const handleResetStandard = () => {
    if (!window.confirm('Khôi phục cấu hình đợt này về chuẩn mặc định 10 tiêu chí NHNN và ngưỡng 90/70/50?')) return;
    setLocalConfig((prev) => ({
      ...prev,
      excellentThreshold: 90,
      goodThreshold: 70,
      passThreshold: 50,
      votingMode: 'ANONYMOUS',
      allowSelfEvaluation: false,
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
            badgeRenderer={(p) => (
              <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                {(p.targetEmployeeIds || employees).length} cán bộ
              </span>
            )}
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
                    Chuẩn NHNN
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
              {/* 1. THAM SỐ XẾP LOẠI & QUY CHẾ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5">
                {/* Ngưỡng điểm xếp loại */}
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                    Ngưỡng Điểm (Scale 100)
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Xuất sắc (&ge;):</span>
                      <input
                        type="number"
                        value={localConfig.excellentThreshold ?? 90}
                        onChange={(e) =>
                          setLocalConfig((prev) => ({ ...prev, excellentThreshold: Number(e.target.value) }))
                        }
                        className="w-14 p-1 text-center font-bold bg-white border border-emerald-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Tốt (&ge;):</span>
                      <input
                        type="number"
                        value={localConfig.goodThreshold ?? 70}
                        onChange={(e) =>
                          setLocalConfig((prev) => ({ ...prev, goodThreshold: Number(e.target.value) }))
                        }
                        className="w-14 p-1 text-center font-bold bg-white border border-emerald-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Hoàn thành (&ge;):</span>
                      <input
                        type="number"
                        value={localConfig.passThreshold ?? 50}
                        onChange={(e) =>
                          setLocalConfig((prev) => ({ ...prev, passThreshold: Number(e.target.value) }))
                        }
                        className="w-14 p-1 text-center font-bold bg-white border border-emerald-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Quy chế bỏ phiếu */}
                <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/50 space-y-2">
                  <span className="text-xs font-bold text-[#0f766e] uppercase tracking-wider block">
                    Quy Chế Bỏ Phiếu
                  </span>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-700">Bỏ phiếu kín:</span>
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
                      <span className="text-slate-700">Tự đánh giá:</span>
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
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Thông Tin Đợt
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <StatusBadge type="period_status" value={currentPeriod.status} />
                    </div>
                    <div className="flex justify-between">
                      <span>Cán bộ áp dụng:</span>
                      <strong className="text-teal-800 font-bold">
                        {(localConfig.targetEmployeeIds || []).length} cán bộ
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tiêu chí:</span>
                      <strong className="text-teal-800 font-bold">
                        {(localConfig.criteria || []).length} tiêu chí
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. CÁN BỘ ĐƯỢC LẤY PHIẾU TÍN NHIỆM */}
              <div className="border border-slate-200 rounded-xl p-3.5 mb-5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0f766e]" />
                    <span className="text-xs font-bold text-slate-900">
                      Cán bộ được lấy phiếu ({localConfig.targetEmployeeIds?.length || 0} / {employees.length})
                    </span>
                  </div>

                  {/* Nút chọn nhanh */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectEmployeesByDept('ALL')}
                      className="px-2 py-0.5 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 cursor-pointer"
                    >
                      Chọn tất cả
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

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50/50 rounded-lg">
                  {employees.map((emp) => {
                    const isChecked = (localConfig.targetEmployeeIds || []).includes(emp.id);
                    return (
                      <label
                        key={emp.id}
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
                          className="w-3.5 h-3.5 rounded text-teal-600"
                        />
                        <span className="truncate">{emp.name}</span>
                      </label>
                    );
                  })}
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

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                          <th className="py-2 px-3 w-16 text-center">Mã</th>
                          <th className="py-2 px-3">Tên tiêu chí</th>
                          <th className="py-2 px-3 min-w-[130px]">Nhóm</th>
                          <th className="py-2 px-3 text-center w-20">Điểm tối đa</th>
                          <th className="py-2 px-3 text-center w-20">Trọng số</th>
                          <th className="py-2 px-3 text-right w-20">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(localConfig.criteria || []).map((crit, idx) => (
                          <tr key={crit.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-800">
                              {crit.code}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{crit.title}</div>
                              {crit.description && (
                                <div className="text-[11px] text-slate-500 line-clamp-1">{crit.description}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
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
                                  className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                                  title="Sửa tiêu chí"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCritFromPeriod(idx, crit.title)}
                                  className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

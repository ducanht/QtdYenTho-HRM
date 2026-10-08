import React, { useState, useEffect } from 'react';
import { Save, Plus, Edit3, Trash2, Lock, Calendar, RotateCcw, CheckSquare, Users } from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';
import Modal from '../../../../components/common/Modal';
import StatusBadge from '../../../../components/common/StatusBadge';
import { TRUST_CRITERIA_DEFAULT as DEFAULT_CRITERIA } from '../../../../lib/constants';

/**
 * Cấu hình chuyên sâu Phân hệ Đánh giá Tín nhiệm theo TỪNG ĐỢT ĐÁNH GIÁ (Period-specific Configuration)
 * - Mỗi đợt đánh giá liên kết đến bảng cấu hình riêng biệt trong period_configs
 * - Đảm bảo tính độc lập tuyệt đối giữa các đợt: Ngưỡng điểm, Quy chế, Cán bộ áp dụng, Bộ tiêu chí
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
}) => {
  // State cấu hình cục bộ của đợt đang chọn
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

  // Handler: Chọn nhanh cán bộ theo phòng ban cho đợt này
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
        description: 'Mô tả tiêu chuẩn và hướng dẫn thang điểm...',
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
    if (!window.confirm(`Đồng chí có chắc muốn xóa tiêu chí [${title}] khỏi đợt đánh giá này?`)) return;
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
    <div className="space-y-6">
      <Card
        title="Cấu Hình Chuyên Sâu Theo Từng Đợt Đánh Giá Tín Nhiệm"
        subtitle="Mỗi đợt đánh giá liên kết đến bảng cấu hình độc lập, không dùng chung (Chuẩn mực quản trị QTDND Yên Thọ)"
        headerRight={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={handleResetStandard}
              className="text-xs font-bold border-slate-300 text-slate-700"
            >
              Mẫu chuẩn NHNN
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={isSaving}
              onClick={handleSaveCurrentPeriodConfig}
              className="font-bold text-xs"
            >
              Lưu cấu hình Đợt này
            </Button>
          </div>
        }
      >
        {/* THANH CHỌN ĐỢT ĐÁNH GIÁ CẦN CẤU HÌNH */}
        <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider shrink-0">
              <Calendar className="w-4 h-4 text-[#0f766e] shrink-0" />
              <span>Đợt đánh giá đang cấu hình:</span>
            </span>

            <select
              value={selectedPeriodId}
              onChange={(e) => onSelectPeriod && onSelectPeriod(e.target.value)}
              className="w-full sm:max-w-md text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 shadow-2xs cursor-pointer hover:border-teal-500"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.status === 'CLOSED' ? '(Đã kết thúc)' : p.status === 'UPCOMING' ? '(Sắp diễn ra)' : '(Đang lấy phiếu)'}
                </option>
              ))}
            </select>
          </div>

          {currentPeriod && (
            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 shrink-0">
              <StatusBadge type="period_status" value={currentPeriod.status} />
              <StatusBadge type="voting_mode" value={localConfig.votingMode} />
              <span className="text-[11px] text-slate-600 font-medium">
                Mã đợt: <strong className="font-mono text-teal-800">{currentPeriod.id}</strong>
              </span>
            </div>
          )}
        </div>

        {/* 1. THAM SỐ XẾP LOẠI & QUY CHẾ CỦA ĐỢT ĐANG CHỌN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Ngưỡng điểm xếp loại */}
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3">
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
              Ngưỡng Điểm Xếp Loại Của Đợt (Scale 100)
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Xuất sắc (&ge;):</span>
                <input
                  type="number"
                  value={localConfig.excellentThreshold ?? 90}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({ ...prev, excellentThreshold: Number(e.target.value) }))
                  }
                  className="w-16 p-1 text-center font-bold bg-white border border-emerald-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Tốt (&ge;):</span>
                <input
                  type="number"
                  value={localConfig.goodThreshold ?? 70}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({ ...prev, goodThreshold: Number(e.target.value) }))
                  }
                  className="w-16 p-1 text-center font-bold bg-white border border-emerald-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Hoàn thành (&ge;):</span>
                <input
                  type="number"
                  value={localConfig.passThreshold ?? 50}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({ ...prev, passThreshold: Number(e.target.value) }))
                  }
                  className="w-16 p-1 text-center font-bold bg-white border border-emerald-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Quy chế bỏ phiếu của đợt */}
          <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 space-y-3">
            <span className="text-xs font-bold text-teal-950 uppercase tracking-wider block">
              Hình Thức Bỏ Phiếu Của Đợt Này
            </span>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="periodVotingMode"
                  value="ANONYMOUS"
                  checked={localConfig.votingMode === 'ANONYMOUS'}
                  onChange={() => setLocalConfig((prev) => ({ ...prev, votingMode: 'ANONYMOUS' }))}
                />
                <span>Bỏ phiếu kín 100% (Ẩn danh cử tri)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="periodVotingMode"
                  value="IDENTIFIED"
                  checked={localConfig.votingMode === 'IDENTIFIED'}
                  onChange={() => setLocalConfig((prev) => ({ ...prev, votingMode: 'IDENTIFIED' }))}
                />
                <span>Định danh (Công khai danh tính)</span>
              </label>
            </div>
            <p className="text-[11px] text-teal-700 italic">
              * Khuyến nghị Quỹ: Áp dụng Bỏ phiếu kín để đảm bảo công tâm và khách quan tuyệt đối.
            </p>
          </div>

          {/* Quy chế chống tự chấm bản thân */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
              Quy Chế Chống Tự Chấm Bản Thân
            </span>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold text-slate-800">
                Nghiêm cấm tự đánh giá: {localConfig.allowSelfEvaluation ? 'Bật (Không khuyên dùng)' : 'Khóa 100% (Chuẩn mực)'}
              </span>
            </div>
            <p className="text-[11px] text-amber-800">
              Hệ thống tự động loại trừ chính mình khỏi danh sách thẻ chấm điểm và chặn submit cấp Firestore Rules.
            </p>
          </div>
        </div>

        {/* 2. ĐỐI TƯỢNG CÁN BỘ ĐƯỢC LẤY PHIẾU TRONG ĐỢT NÀY */}
        <div className="space-y-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-700" />
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Đối Tượng Cán Bộ Áp Dụng Cho Đợt Này ({localConfig.targetEmployeeIds?.length || 0}/{employees.length} cán bộ):
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => handleSelectEmployeesByDept('ALL')}
                className="px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Tất cả ({employees.length})
              </button>
              <button
                type="button"
                onClick={() => handleSelectEmployeesByDept('Phòng Tín dụng')}
                className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Khối Tín dụng
              </button>
              <button
                type="button"
                onClick={() => handleSelectEmployeesByDept('Phòng Kế toán - Ngân quỹ')}
                className="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Khối Kế toán
              </button>
              <button
                type="button"
                onClick={() => handleSelectEmployeesByDept('NONE')}
                className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
            {employees.map((emp) => {
              const isSelected = (localConfig.targetEmployeeIds || []).includes(emp.id);
              return (
                <label
                  key={emp.id}
                  className={`flex items-center gap-1.5 text-xs p-1.5 rounded-lg border cursor-pointer transition-colors ${
                    isSelected ? 'bg-teal-50/60 border-teal-200 text-teal-900 font-bold' : 'border-transparent hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setLocalConfig((prev) => ({
                        ...prev,
                        targetEmployeeIds: checked
                          ? [...(prev.targetEmployeeIds || []), emp.id]
                          : (prev.targetEmployeeIds || []).filter((id) => id !== emp.id),
                      }));
                    }}
                  />
                  <span className="truncate">{emp.name} ({emp.code})</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 3. BỘ TIÊU CHÍ ĐÁNH GIÁ ÁP DỤNG RIÊNG CHO ĐỢT NÀY */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Bộ Tiêu Chí Đánh Giá Riêng Của Đợt ({localConfig.criteria?.length || 0} tiêu chí):
              </h4>
              <p className="text-[11px] text-slate-500">
                Mỗi đợt đánh giá có thể sở hữu bộ tiêu chí riêng biệt, tự do tùy biến thang điểm mà không làm thay đổi các đợt khác.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => handleOpenCritModal(null)}
              className="font-bold text-xs"
            >
              Thêm tiêu chí cho đợt này
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-16 text-center">Mã</th>
                  <th className="py-2.5 px-3">Tên tiêu chí</th>
                  <th className="py-2.5 px-3">Nhóm năng lực</th>
                  <th className="py-2.5 px-3">Mô tả chuẩn mực</th>
                  <th className="py-2.5 px-3 text-center w-24">Thang điểm</th>
                  <th className="py-2.5 px-3 text-center w-20">Trọng số</th>
                  <th className="py-2.5 px-3 text-center w-20">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(localConfig.criteria || []).map((c, idx) => (
                  <tr key={c.id || c.code || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-center text-emerald-700">{c.code}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{c.title}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {c.group}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{c.description}</td>
                    <td className="py-2 px-3 text-center font-bold text-slate-800">
                      {c.minScore || 0} - {c.maxScore || 10}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-teal-700">{c.weight || 10}%</td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenCritModal(c, idx)}
                          className="p-1 text-slate-500 hover:text-teal-700 rounded hover:bg-slate-100 cursor-pointer"
                          title="Sửa tiêu chí"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCritFromPeriod(idx, c.title)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                          title="Xóa tiêu chí khỏi đợt này"
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
      </Card>

      {/* Modal Thêm/Sửa Tiêu chí của Đợt */}
      <Modal
        isOpen={critModalOpen}
        onClose={() => setCritModalOpen(false)}
        title={editingCritIndex !== null ? 'Cập Nhật Tiêu Chí Đợt Này' : 'Thêm Tiêu Chí Cho Đợt Này'}
      >
        <form onSubmit={handleSubmitCrit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Mã tiêu chí"
              placeholder="VD: TC11"
              value={critForm.code}
              onChange={(e) => setCritForm((prev) => ({ ...prev, code: e.target.value }))}
              required
            />
            <div className="col-span-2">
              <Input
                label="Nhóm năng lực"
                placeholder="VD: Phẩm chất đạo đức / Chuyên môn..."
                value={critForm.group}
                onChange={(e) => setCritForm((prev) => ({ ...prev, group: e.target.value }))}
                required
              />
            </div>
          </div>

          <Input
            label="Tiêu đề tiêu chí"
            placeholder="VD: 1. Tinh thần trách nhiệm..."
            value={critForm.title}
            onChange={(e) => setCritForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả chi tiết chuẩn mực đánh giá:
            </label>
            <textarea
              rows={3}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Hướng dẫn cho cán bộ khi chấm điểm..."
              value={critForm.description}
              onChange={(e) => setCritForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Điểm tối thiểu"
              type="number"
              value={critForm.minScore}
              onChange={(e) => setCritForm((prev) => ({ ...prev, minScore: Number(e.target.value) }))}
            />
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

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setCritModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Lưu tiêu chí đợt này
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TrustCriteriaSettings;

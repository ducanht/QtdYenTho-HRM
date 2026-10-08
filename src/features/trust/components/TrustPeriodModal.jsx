import React, { useState } from 'react';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';

/**
 * TrustPeriodModal: Quản trị tạo mới / chỉnh sửa đợt đánh giá (Dành cho Lãnh đạo)
 */
const TrustPeriodModal = ({
  isOpen,
  onClose,
  mode = 'CREATE',
  formData,
  setFormData,
  onSave,
  submitting,
  employees = [],
}) => {
  const [newCustomCrit, setNewCustomCrit] = useState({ title: '', description: '', maxScore: 10 });
  const [isAddingCrit, setIsAddingCrit] = useState(false);
  const [editingCritIndex, setEditingCritIndex] = useState(null);
  const [editingCritData, setEditingCritData] = useState({ title: '', description: '', maxScore: 10 });

  const handleSelectEmployeesByDept = (dept) => {
    if (dept === 'ALL') {
      setFormData((prev) => ({
        ...prev,
        targetEmployeeIds: employees.map((e) => e.id),
      }));
    } else if (dept === 'NONE') {
      setFormData((prev) => ({
        ...prev,
        targetEmployeeIds: [],
      }));
    } else {
      const matchingIds = employees.filter((e) => e.department === dept).map((e) => e.id);
      setFormData((prev) => ({
        ...prev,
        targetEmployeeIds: Array.from(new Set([...(prev?.targetEmployeeIds || []), ...matchingIds])),
      }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'CREATE' ? 'Ban Hành Đợt Lấy Phiếu Tín Nhiệm Mới' : 'Cập Nhật Cấu Hình Đợt Đánh Giá'}
      subtitle="Quản trị thời gian, đối tượng được lấy phiếu và bộ tiêu chí áp dụng"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button
            variant="primary"
            isLoading={submitting}
            onClick={onSave}
          >
            {mode === 'CREATE' ? 'Ban hành đợt này' : 'Lưu cập nhật'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Tên đợt */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">Tên đợt đánh giá</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="VD: Lấy phiếu tín nhiệm Cán bộ Quản lý & Nhân viên Quý IV/2026..."
            className="w-full p-2.5 bg-white rounded-xl border border-slate-300 font-bold text-slate-800"
            required
          />
        </div>

        {/* Năm và Quý */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Năm</label>
            <input
              type="number"
              value={formData.year || 2026}
              onChange={(e) => setFormData((prev) => ({ ...prev, year: Number(e.target.value) }))}
              className="w-full p-2 bg-white rounded-xl border border-slate-300 font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Quý / Kỳ</label>
            <select
              value={formData.quarter || 4}
              onChange={(e) => setFormData((prev) => ({ ...prev, quarter: Number(e.target.value) }))}
              className="w-full p-2 bg-white rounded-xl border border-slate-300 font-bold"
            >
              <option value={1}>Quý I</option>
              <option value={2}>Quý II</option>
              <option value={3}>Quý III</option>
              <option value={4}>Quý IV (Cuối năm)</option>
            </select>
          </div>
        </div>

        {/* Thời gian bắt đầu và kết thúc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Thời gian bắt đầu lấy phiếu</label>
            <input
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Thời gian kết thúc (Khóa sổ)</label>
            <input
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
              className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
            />
          </div>
        </div>

        {/* Hình thức bỏ phiếu & Trạng thái */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
            <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Hình thức bỏ phiếu:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="modalVotingMode"
                  value="ANONYMOUS"
                  checked={formData.votingMode === 'ANONYMOUS'}
                  onChange={() => setFormData((prev) => ({ ...prev, votingMode: 'ANONYMOUS' }))}
                />
                <span>Bỏ phiếu kín (Ẩn danh 100%)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="modalVotingMode"
                  value="IDENTIFIED"
                  checked={formData.votingMode === 'IDENTIFIED'}
                  onChange={() => setFormData((prev) => ({ ...prev, votingMode: 'IDENTIFIED' }))}
                />
                <span>Định danh (Công khai)</span>
              </label>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
            <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Trạng thái đợt:
            </label>
            <select
              value={formData.status || 'ACTIVE'}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
            >
              <option value="ACTIVE">Đang diễn ra (ACTIVE)</option>
              <option value="UPCOMING">Sắp diễn ra (UPCOMING)</option>
              <option value="CLOSED">Đã đóng / Khóa sổ (CLOSED)</option>
            </select>
          </div>
        </div>

        {/* Danh sách cán bộ được lấy phiếu tín nhiệm */}
        <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Cán bộ được lấy phiếu tín nhiệm ({formData.targetEmployeeIds?.length || 0}/{employees.length}):
            </label>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => handleSelectEmployeesByDept('ALL')}
                className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]"
              >
                Tất cả ({employees.length})
              </button>
              <button
                type="button"
                onClick={() => handleSelectEmployeesByDept('Phòng Tín dụng')}
                className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]"
              >
                Khối Tín dụng
              </button>
              <button
                type="button"
                onClick={() => handleSelectEmployeesByDept('Phòng Kế toán - Ngân quỹ')}
                className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]"
              >
                Khối Kế toán
              </button>
              <button
                type="button"
                onClick={() => handleSelectEmployeesByDept('NONE')}
                className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px]"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
            {employees.map((emp) => {
              const isSelected = (formData.targetEmployeeIds || []).includes(emp.id);
              return (
                <label key={emp.id} className="flex items-center gap-1.5 text-[11px] p-1 rounded hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({
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

        {/* Tùy biến Tiêu chí Đánh giá */}
        <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Bộ Tiêu Chí Đánh Giá ({formData.customCriteria?.length || 0} tiêu chí):
            </label>
            <Button
              variant="outline"
              size="sm"
              icon={PlusCircle}
              onClick={() => {
                setIsAddingCrit(!isAddingCrit);
                setEditingCritIndex(null);
              }}
              className="text-[10px] py-1 px-2"
            >
              {isAddingCrit ? 'Đóng form thêm' : 'Thêm tiêu chí mới'}
            </Button>
          </div>

          {/* Form thêm mới */}
          {isAddingCrit && (
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
              <input
                type="text"
                placeholder="Tên tiêu chí (VD: Năng lực chuyển đổi số)"
                value={newCustomCrit.title}
                onChange={(e) => setNewCustomCrit((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs font-bold"
              />
              <input
                type="text"
                placeholder="Diễn giải yêu cầu tiêu chuẩn..."
                value={newCustomCrit.description}
                onChange={(e) => setNewCustomCrit((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!newCustomCrit.title.trim()) return;
                    const nextId = (formData.customCriteria || []).length + 1;
                    setFormData((prev) => ({
                      ...prev,
                      customCriteria: [
                        ...(prev.customCriteria || []),
                        {
                          id: nextId,
                          code: `TC${nextId < 10 ? '0' : ''}${nextId}`,
                          title: `${nextId}. ${newCustomCrit.title.trim()}`,
                          description: newCustomCrit.description.trim(),
                          maxScore: 10,
                        },
                      ],
                    }));
                    setNewCustomCrit({ title: '', description: '', maxScore: 10 });
                    setIsAddingCrit(false);
                  }}
                >
                  Lưu tiêu chí
                </Button>
              </div>
            </div>
          )}

          {/* Danh sách tiêu chí */}
          <div className="max-h-40 overflow-y-auto space-y-1.5 p-1">
            {(formData.customCriteria || []).map((crit, cIdx) => (
              <div key={crit.id || cIdx} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 truncate pr-2">{crit.title}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        customCriteria: (prev.customCriteria || []).filter((_, idx) => idx !== cIdx),
                      }));
                    }}
                    className="text-rose-500 hover:text-rose-700 p-1"
                    title="Xóa tiêu chí này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(TrustPeriodModal);

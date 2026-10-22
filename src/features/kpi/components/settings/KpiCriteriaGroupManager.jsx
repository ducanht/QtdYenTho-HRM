import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  X,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { saveKpiCriteriaGroup, deleteKpiCriteriaGroup } from '../../services/kpiService';
import { useToast } from '../../../../context/ToastContext';

const COLOR_BADGES = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
};

/**
 * Quản trị Danh mục Nhóm Tiêu chí KPI Động (kpi_criteria_groups)
 * Cho phép Thêm, Sửa, Xóa nhóm và phân bổ trọng số điểm (Tổng chuẩn 100đ)
 */
const KpiCriteriaGroupManager = ({
  groups = [],
  criteriaList = [],
  canManage = false,
  onRefresh,
}) => {
  const toast = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [maxScore, setMaxScore] = useState(25);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('emerald');
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Delete State
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tổng điểm các nhóm đang kích hoạt
  const totalWeight = useMemo(() => {
    return groups
      .filter((g) => g.isActive !== false)
      .reduce((sum, g) => sum + (Number(g.maxScore) || 0), 0);
  }, [groups]);

  // Đếm số tiêu chí thuộc từng nhóm
  const criteriaCountByGroup = useMemo(() => {
    const map = {};
    criteriaList.forEach((c) => {
      const cat = c.category || '';
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [criteriaList]);

  const openCreateModal = () => {
    setEditingGroup(null);
    setCode(`GR${String(groups.length + 1).padStart(2, '0')}`);
    setName('');
    setMaxScore(20);
    setDescription('');
    setColor('emerald');
    setOrder(groups.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setCode(group.code || '');
    setName(group.name || '');
    setMaxScore(group.maxScore ?? 25);
    setDescription(group.description || '');
    setColor(group.color || 'emerald');
    setOrder(group.order ?? 1);
    setIsActive(group.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên nhóm tiêu chí.');
      return;
    }

    setIsSaving(true);
    try {
      await saveKpiCriteriaGroup({
        id: editingGroup?.id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        maxScore: Number(maxScore) || 0,
        description: description.trim(),
        color,
        order: Number(order) || 1,
        isActive: Boolean(isActive),
      });

      toast.success(editingGroup ? 'Đã cập nhật nhóm tiêu chí!' : 'Đã thêm nhóm tiêu chí mới!');
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lỗi saveKpiCriteriaGroup:', err);
      toast.error('Có lỗi xảy ra khi lưu nhóm tiêu chí.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const target = groups.find((g) => g.id === deletingId);
    const inUseCount = target ? (criteriaCountByGroup[target.name] || 0) : 0;

    setIsDeleting(true);
    try {
      await deleteKpiCriteriaGroup(deletingId);
      if (inUseCount > 0) {
        toast.warning(`Đã xóa nhóm. Có ${inUseCount} tiêu chí đang liên kết nhóm này cần được gán lại!`);
      } else {
        toast.success('Đã xóa nhóm tiêu chí KPI thành công!');
      }
      setDeletingId(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lỗi deleteKpiCriteriaGroup:', err);
      toast.error('Có lỗi xảy ra khi xóa nhóm tiêu chí.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <span>Danh Mục Nhóm Tiêu Chí Đánh Giá KPI ({groups.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình các nhóm lĩnh vực đánh giá và phân bổ tổng trọng số 100 điểm chuẩn mực
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Badge kiểm tra tổng điểm */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold font-numeric shadow-2xs">
            {totalWeight === 100 ? (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tổng: 100/100đ (Chuẩn)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Tổng: {totalWeight}/100đ (Chưa khớp)
              </span>
            )}
          </div>

          {canManage && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Nhóm Tiêu Chí</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Grid Cards View */}
      <div className="p-4 sm:p-5">
        {groups.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Chưa có nhóm tiêu chí nào. Bấm &quot;Thêm Nhóm Tiêu Chí&quot; để thiết lập.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {groups.map((group) => {
              const count = criteriaCountByGroup[group.name] || 0;
              const badgeStyle = COLOR_BADGES[group.color] || COLOR_BADGES.emerald;

              return (
                <div
                  key={group.id}
                  className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                    group.isActive !== false
                      ? 'bg-white border-slate-200 hover:shadow-xs hover:border-emerald-300'
                      : 'bg-slate-50/70 border-slate-200/80 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-numeric border ${badgeStyle}`}>
                        {group.code || 'GR'}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-numeric font-extrabold text-base text-slate-800">
                          {group.maxScore}đ
                        </span>
                        <span className="text-[10px] text-slate-400">tối đa</span>
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1" title={group.name}>
                      {group.name}
                    </h4>

                    {group.description && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
                        {group.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <span className="text-[11px] text-slate-500 font-medium">
                      <strong className="text-emerald-700 font-numeric">{count}</strong> tiêu chí
                    </span>

                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(group)}
                          className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          title="Chỉnh sửa nhóm"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(group.id)}
                          className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Xóa nhóm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Thêm / Chỉnh Sửa Nhóm */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingGroup ? 'Chỉnh Sửa Nhóm Tiêu Chí KPI' : 'Thêm Nhóm Tiêu Chí KPI Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mã Nhóm <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: GR01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 font-numeric uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Điểm Tối Đa (Trọng số) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 font-numeric font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên Nhóm Tiêu Chí <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Kinh doanh & Nghiệp vụ..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Màu Sắc Nhận Diện
                  </label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="emerald">Xanh lục (Emerald)</option>
                    <option value="blue">Xanh dương (Blue)</option>
                    <option value="amber">Vàng cam (Amber)</option>
                    <option value="violet">Tím (Violet)</option>
                    <option value="rose">Hồng đỏ (Rose)</option>
                    <option value="slate">Xám (Slate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Thứ Tự Hiển Thị
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 font-numeric focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mô Tả & Hướng Dẫn
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả phạm vi các tiêu chí đánh giá trong nhóm này..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveGrp"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveGrp" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Kích hoạt áp dụng nhóm tiêu chí này
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingGroup ? 'Cập Nhật' : 'Thêm Nhóm'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Nhóm */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Xác Nhận Xóa Nhóm Tiêu Chí</h3>
              <p className="text-xs text-slate-500 mt-1">
                Đồng chí có chắc chắn muốn xóa nhóm tiêu chí này? Nếu còn tiêu chí thuộc nhóm, hãy gán lại nhóm mới cho các tiêu chí đó.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa Nhóm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KpiCriteriaGroupManager;

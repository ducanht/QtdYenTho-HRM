import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Award, 
  X, 
  Save, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { saveKpiCriteriaItem, deleteKpiCriteriaItem } from '../../services/kpiService';
import { useToast } from '../../../../context/ToastContext';

/**
 * Quản Lý Danh Mục Tiêu Chí Đánh Giá KPI Động (kpi_criteria)
 */
const KpiCriteriaManager = ({
  criteriaList = [],
  groups = [],
  departments = [],
  canManage = false,
  onRefresh
}) => {
  const toast = useToast();
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Kinh doanh & Nghiệp vụ');
  const [department, setDepartment] = useState('Tất cả');
  const [maxScore, setMaxScore] = useState(20);
  const [weight, setWeight] = useState(20);
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Delete State
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Danh mục nhóm tiêu chí động (lấy từ kpi_criteria_groups)
  const CATEGORIES = useMemo(() => {
    if (groups && groups.length > 0) {
      return groups.filter((g) => g.isActive !== false).map((g) => g.name || g);
    }
    return [
      'Kinh doanh & Nghiệp vụ',
      'Quản trị Rủi ro & An toàn',
      'Kỷ luật & Văn hóa',
      'Sáng kiến & Đóng góp'
    ];
  }, [groups]);

  const deptOptions = useMemo(() => {
    const list = departments.length > 0 
      ? departments.map((d) => d.name || d) 
      : ['Phòng Tín dụng', 'Phòng Kế toán - Ngân quỹ', 'Ban Kiểm soát', 'Ban Điều hành'];
    const set = new Set(list);
    return Array.from(set);
  }, [departments]);

  // Lọc danh sách
  const filteredList = useMemo(() => {
    return criteriaList.filter((item) => {
      const matchDept = selectedDeptFilter === 'ALL' || item.department === selectedDeptFilter;
      const matchCat = selectedCatFilter === 'ALL' || item.category === selectedCatFilter;
      return matchDept && matchCat;
    });
  }, [criteriaList, selectedDeptFilter, selectedCatFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setCode(`TC_${String(criteriaList.length + 1).padStart(2, '0')}`);
    setName('');
    setCategory(CATEGORIES[0] || 'Kinh doanh & Nghiệp vụ');
    setDepartment('Tất cả');
    setMaxScore(15);
    setWeight(15);
    setDescription('');
    setOrder(criteriaList.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setCode(item.code || '');
    setName(item.name || '');
    setCategory(item.category || 'Kinh doanh & Nghiệp vụ');
    setDepartment(item.department || 'Tất cả');
    setMaxScore(item.maxScore ?? 15);
    setWeight(item.weight ?? item.maxScore ?? 15);
    setDescription(item.description || '');
    setOrder(item.order ?? 1);
    setIsActive(item.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên tiêu chí đánh giá.');
      return;
    }

    setIsSaving(true);
    try {
      await saveKpiCriteriaItem({
        id: editingItem?.id,
        code: code.trim(),
        name: name.trim(),
        category,
        department,
        maxScore: Number(maxScore) || 10,
        weight: Number(weight) || Number(maxScore) || 10,
        description: description.trim(),
        order: Number(order) || 1,
        isActive: Boolean(isActive)
      });
      toast.success(editingItem ? 'Đã cập nhật tiêu chí thành công!' : 'Đã thêm mới tiêu chí thành công!');
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lỗi saveKpiCriteriaItem:', err);
      toast.error('Có lỗi xảy ra khi lưu tiêu chí.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteKpiCriteriaItem(deletingId);
      toast.success('Đã xóa tiêu chí đánh giá thành công!');
      setDeletingId(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lỗi deleteKpiCriteriaItem:', err);
      toast.error('Có lỗi xảy ra khi xóa tiêu chí.');
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
            <Award className="w-4 h-4 text-emerald-700" />
            <span>Danh Mục Tiêu Chí Đánh Giá KPI ({criteriaList.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị các tiêu chí, điểm số tối đa và phạm vi áp dụng cho từng phòng ban
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Lọc Nhóm */}
          <select
            value={selectedCatFilter}
            onChange={(e) => setSelectedCatFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">Tất cả nhóm</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Lọc Phòng ban */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">Tất cả phòng ban</option>
            <option value="Tất cả">Toàn đơn vị</option>
            {deptOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {canManage && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Tiêu Chí</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-3 w-12 text-center">STT</th>
              <th className="py-3 px-3 w-20">Mã</th>
              <th className="py-3 px-4">Tên Tiêu Chí & Hướng Dẫn Chấm</th>
              <th className="py-3 px-3">Nhóm Tiêu Chí</th>
              <th className="py-3 px-3">Phòng Ban</th>
              <th className="py-3 px-3 text-center">Điểm Tối Đa</th>
              <th className="py-3 px-3 text-center">Trạng Thái</th>
              {canManage && <th className="py-3 px-4 text-right">Thao Tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  Không tìm thấy tiêu chí nào phù hợp với bộ lọc
                </td>
              </tr>
            ) : (
              filteredList.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 text-center font-numeric text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3 font-numeric font-bold text-slate-700">
                    {item.code}
                  </td>
                  <td className="py-3 px-4 max-w-md">
                    <div className="font-semibold text-slate-900 text-sm">{item.name}</div>
                    {item.description && (
                      <div className="text-slate-500 mt-0.5 leading-relaxed">{item.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700">
                    {item.category}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                      {item.department || 'Tất cả'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-numeric font-bold text-emerald-700 text-sm">
                    {item.maxScore}đ
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.isActive !== false ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Áp dụng
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        Tạm dừng
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa tiêu chí"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa tiêu chí"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm / Chỉnh Sửa Tiêu Chí */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingItem ? 'Chỉnh Sửa Tiêu Chí KPI' : 'Thêm Tiêu Chí Đánh Giá Mới'}
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
                    Mã Tiêu Chí <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: TC_TD_01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 font-numeric uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Điểm Tối Đa (maxScore) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={maxScore}
                    onChange={(e) => {
                      setMaxScore(e.target.value);
                      setWeight(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 font-numeric font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên Tiêu Chí <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên tiêu chí đánh giá..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nhóm Tiêu Chí
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phòng Ban Áp Dụng
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Tất cả">Tất cả (Toàn đơn vị)</option>
                    {deptOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mô Tả & Hướng Dẫn Cách Chấm Điểm
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nêu rõ căn cứ chấm, tiêu chuẩn đạt yêu cầu hoặc trừ điểm nếu vi phạm..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCrit"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveCrit" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Kích hoạt áp dụng tiêu chí này trong các kỳ đánh giá
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
                      <span>{editingItem ? 'Cập Nhật' : 'Thêm Tiêu Chí'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Tiêu Chí */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Xác Nhận Xóa Tiêu Chí</h3>
              <p className="text-xs text-slate-500 mt-1">
                Đồng chí có chắc chắn muốn xóa tiêu chí này khỏi danh mục hệ thống? Thao tác này không ảnh hưởng đến các phiếu đã chốt trong quá khứ nhờ cơ chế bảo toàn snapshot.
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
                {isDeleting ? 'Đang xóa...' : 'Xóa Tiêu Chí'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KpiCriteriaManager;

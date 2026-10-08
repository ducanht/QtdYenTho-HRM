import React, { useState } from 'react';
import { Save, Plus, Edit3, Trash2, Lock } from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';
import Modal from '../../../../components/common/Modal';
import TrustPermissionsMatrix from './TrustPermissionsMatrix';
import { DEFAULT_ROLE_PERMISSIONS } from '../../../../lib/permissions';

/**
 * Cấu hình chuyên sâu Phân hệ Đánh giá Tín nhiệm (10 Tiêu chí chuẩn NHNN)
 */
const TrustCriteriaSettings = ({
  trustConfig,
  setTrustConfig,
  trustCriteria,
  onSaveConfig,
  isSaving,
  onSaveCriterion,
  onDeleteCriterion
}) => {
  const [critModalOpen, setCritModalOpen] = useState(false);
  const [editingCrit, setEditingCrit] = useState(null);
  const [critForm, setCritForm] = useState({
    code: '',
    title: '',
    group: '',
    description: '',
    maxScore: 10,
    minScore: 0,
    weight: 10,
  });

  const handleOpenCritModal = (crit = null) => {
    if (crit) {
      setEditingCrit(crit);
      setCritForm({
        code: crit.code,
        title: crit.title,
        group: crit.group || 'Năng lực chuyên môn',
        description: crit.description || '',
        maxScore: crit.maxScore || 10,
        minScore: crit.minScore || 0,
        weight: crit.weight || 10,
      });
    } else {
      setEditingCrit(null);
      const nextId = trustCriteria.length + 1;
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

  const submitCrit = async (e) => {
    e.preventDefault();
    const success = await onSaveCriterion(critForm, editingCrit);
    if (success) setCritModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card
        title="Cấu Hình Chuyên Sâu: Phân Hệ Đánh Giá Tín Nhiệm (10 Tiêu Chí Chuẩn NHNN)"
        headerRight={
          <Button
            variant="primary"
            size="sm"
            icon={Save}
            isLoading={isSaving}
            onClick={() => onSaveConfig(trustConfig)}
            className="font-bold text-xs"
          >
            Lưu cấu hình Tín Nhiệm
          </Button>
        }
      >
        {/* Tham số xếp loại & bỏ phiếu kín */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3">
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
              Ngưỡng Điểm Xếp Loại Tín Nhiệm (Scale 100)
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Xuất sắc (&ge;):</span>
                <input
                  type="number"
                  value={trustConfig.excellentThreshold ?? 90}
                  onChange={(e) =>
                    setTrustConfig((prev) => ({ ...prev, excellentThreshold: Number(e.target.value) }))
                  }
                  className="w-16 p-1 text-center font-bold bg-white border border-emerald-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Tốt (&ge;):</span>
                <input
                  type="number"
                  value={trustConfig.goodThreshold ?? 70}
                  onChange={(e) =>
                    setTrustConfig((prev) => ({ ...prev, goodThreshold: Number(e.target.value) }))
                  }
                  className="w-16 p-1 text-center font-bold bg-white border border-emerald-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Hoàn thành (&ge;):</span>
                <input
                  type="number"
                  value={trustConfig.passThreshold ?? 50}
                  onChange={(e) =>
                    setTrustConfig((prev) => ({ ...prev, passThreshold: Number(e.target.value) }))
                  }
                  className="w-16 p-1 text-center font-bold bg-white border border-emerald-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 space-y-3">
            <span className="text-xs font-bold text-teal-950 uppercase tracking-wider block">
              Quy Chế Bỏ Phiếu Mặc Định
            </span>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="defaultVotingMode"
                  value="ANONYMOUS"
                  checked={trustConfig.defaultVotingMode === 'ANONYMOUS'}
                  onChange={() => setTrustConfig((prev) => ({ ...prev, defaultVotingMode: 'ANONYMOUS' }))}
                />
                <span>Bỏ phiếu kín 100% (Ẩn danh cử tri)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="defaultVotingMode"
                  value="IDENTIFIED"
                  checked={trustConfig.defaultVotingMode === 'IDENTIFIED'}
                  onChange={() => setTrustConfig((prev) => ({ ...prev, defaultVotingMode: 'IDENTIFIED' }))}
                />
                <span>Định danh (Công khai danh tính)</span>
              </label>
            </div>
            <p className="text-[11px] text-teal-700 italic">
              * Khuyến nghị Quỹ: Luôn áp dụng Bỏ phiếu kín để đảm bảo tính công tâm tuyệt đối.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
              Quy Chế Chống Tự Chấm Bản Thân
            </span>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold text-slate-800">
                Nghiêm cấm tự đánh giá: {trustConfig.allowSelfEvaluation ? 'Bật (Không khuyên dùng)' : 'Khóa 100% (Chuẩn mực)'}
              </span>
            </div>
            <p className="text-[11px] text-amber-800">
              Hệ thống tự động loại trừ chính mình khỏi danh sách thẻ chấm điểm và chặn submit cấp Firestore Rules.
            </p>
          </div>
        </div>

        {/* Quản lý 10 Tiêu chí tín nhiệm */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Bộ 10 Tiêu Chí Đánh Giá Tín Nhiệm Chuẩn ({trustCriteria.length} tiêu chí):
            </h4>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => handleOpenCritModal(null)}
              className="font-bold text-xs"
            >
              Thêm tiêu chí mới
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
                {trustCriteria.map((c) => (
                  <tr key={c.id || c.code} className="hover:bg-slate-50 transition-colors">
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
                          onClick={() => handleOpenCritModal(c)}
                          className="p-1 text-slate-500 hover:text-teal-700 rounded hover:bg-slate-100 cursor-pointer"
                          title="Sửa tiêu chí"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCriterion(c.code, c.title)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
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
      </Card>

      {/* Ma trận Phân quyền chuyên biệt Phân hệ Bỏ phiếu tín nhiệm */}
      <TrustPermissionsMatrix
        permissions={trustConfig.permissions || DEFAULT_ROLE_PERMISSIONS.trust}
        onChangePermissions={(newPerms) =>
          setTrustConfig((prev) => ({ ...prev, permissions: newPerms }))
        }
        onResetDefault={() =>
          setTrustConfig((prev) => ({ ...prev, permissions: DEFAULT_ROLE_PERMISSIONS.trust }))
        }
      />

      {/* Modal Thêm/Sửa Tiêu chí */}
      <Modal
        isOpen={critModalOpen}
        onClose={() => setCritModalOpen(false)}
        title={editingCrit ? 'Cập Nhật Tiêu Chí Tín Nhiệm' : 'Thêm Tiêu Chí Tín Nhiệm'}
      >
        <form onSubmit={submitCrit} className="space-y-4">
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
              Lưu tiêu chí
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TrustCriteriaSettings;

import React, { useState } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';
import Modal from '../../../../components/common/Modal';

/**
 * Tab 2: Quản lý Cơ cấu tổ chức dùng chung (Phòng ban & Chức vụ)
 */
const OrganizationSettings = ({
  departments,
  positions,
  onSaveDept,
  onDeleteDept,
  onSavePos,
  onDeletePos
}) => {
  // States Modal Phòng ban
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', order: 1 });

  // States Modal Chức vụ
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  const [posForm, setPosForm] = useState({ name: '', code: '', department: '', order: 1 });

  const handleOpenDeptModal = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({ name: dept.name, code: dept.code || '', order: dept.order || departments.length + 1 });
    } else {
      setEditingDept(null);
      setDeptForm({ name: '', code: '', order: departments.length + 1 });
    }
    setDeptModalOpen(true);
  };

  const submitDept = async (e) => {
    e.preventDefault();
    const success = await onSaveDept(deptForm, editingDept);
    if (success) setDeptModalOpen(false);
  };

  const handleOpenPosModal = (pos = null) => {
    if (pos) {
      setEditingPos(pos);
      setPosForm({
        name: pos.name,
        code: pos.code || '',
        department: pos.department || departments[0]?.name || '',
        order: pos.order || positions.length + 1
      });
    } else {
      setEditingPos(null);
      setPosForm({
        name: '',
        code: '',
        department: departments[0]?.name || 'Phòng Tín dụng',
        order: positions.length + 1
      });
    }
    setPosModalOpen(true);
  };

  const submitPos = async (e) => {
    e.preventDefault();
    const success = await onSavePos(posForm, editingPos);
    if (success) setPosModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Danh Mục Phòng Ban */}
      <Card
        title={`Danh Mục Phòng Ban (${departments.length})`}
        headerRight={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => handleOpenDeptModal(null)}
            className="font-bold text-xs"
          >
            Thêm phòng ban
          </Button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-teal-300 transition-all shadow-2xs flex items-center justify-between gap-3"
            >
              <div>
                <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  {dept.code || 'PB'}
                </span>
                <h4 className="text-xs font-black text-slate-900 mt-1">{dept.name}</h4>
                <span className="text-[10px] text-slate-400">Thứ tự: {dept.order || 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenDeptModal(dept)}
                  className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Sửa phòng ban"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteDept(dept.id, dept.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Xóa phòng ban"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. Danh Mục Chức Vụ & Vị Trí Công Tác */}
      <Card
        title={`Danh Mục Chức Vụ (${positions.length})`}
        headerRight={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => handleOpenPosModal(null)}
            className="font-bold text-xs"
          >
            Thêm chức vụ
          </Button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {positions.map((pos) => (
            <div
              key={pos.id}
              className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-teal-300 transition-all shadow-2xs flex items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                    {pos.code || 'CV'}
                  </span>
                  <span className="text-[10px] text-slate-500">{pos.department}</span>
                </div>
                <h4 className="text-xs font-black text-slate-900 mt-1">{pos.name}</h4>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenPosModal(pos)}
                  className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Sửa chức danh"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeletePos(pos.id, pos.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Xóa chức danh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal Thêm/Sửa Phòng ban */}
      <Modal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title={editingDept ? 'Chỉnh Sửa Phòng Ban' : 'Thêm Phòng Ban Mới'}
      >
        <form onSubmit={submitDept} className="space-y-4">
          <Input
            label="Tên phòng ban"
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
            placeholder="Ví dụ: Phòng Tín dụng, Ban Kiểm soát..."
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mã phòng ban"
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
              placeholder="TD, KT, BKS..."
            />
            <Input
              label="Thứ tự hiển thị"
              type="number"
              value={deptForm.order}
              onChange={(e) => setDeptForm({ ...deptForm, order: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setDeptModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" type="submit">
              Lưu phòng ban
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Thêm/Sửa Chức vụ */}
      <Modal
        isOpen={posModalOpen}
        onClose={() => setPosModalOpen(false)}
        title={editingPos ? 'Chỉnh Sửa Chức Vụ' : 'Thêm Chức Vụ Mới'}
      >
        <form onSubmit={submitPos} className="space-y-4">
          <Input
            label="Tên chức danh / Vị trí"
            value={posForm.name}
            onChange={(e) => setPosForm({ ...posForm, name: e.target.value })}
            placeholder="Ví dụ: Cán bộ Tín dụng, Kế toán viên..."
            required
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phòng ban trực thuộc
            </label>
            <select
              value={posForm.department}
              onChange={(e) => setPosForm({ ...posForm, department: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
              required
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mã chức vụ"
              value={posForm.code}
              onChange={(e) => setPosForm({ ...posForm, code: e.target.value })}
              placeholder="CBTD, KTV, TP..."
            />
            <Input
              label="Thứ tự"
              type="number"
              value={posForm.order}
              onChange={(e) => setPosForm({ ...posForm, order: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setPosModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" type="submit">
              Lưu chức vụ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrganizationSettings;

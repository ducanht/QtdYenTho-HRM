import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  Vote, 
  Building2, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { 
  subscribeDepartments,
  saveDepartment,
  deleteDepartment,
  subscribePositions,
  savePosition,
  deletePosition,
  subscribeTrustCriteria,
  saveTrustCriterion,
  deleteTrustCriterion,
  subscribeSystemSettings,
  saveSystemSettings,
  subscribeSystemModules,
  updateSystemModule
} from '../lib/services';
import { DEFAULT_SYSTEM_SETTINGS } from '../lib/systemDefaults';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

const AdminSettings = () => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('TRUST');

  // Dữ liệu Realtime từ Firestore
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [trustCriteria, setTrustCriteria] = useState([]);
  const [systemSettings, setSystemSettings] = useState(DEFAULT_SYSTEM_SETTINGS);
  const [modulesList, setModulesList] = useState([]);

  // States chỉnh sửa Phòng ban
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', order: 1 });

  // States chỉnh sửa Chức vụ
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  const [posForm, setPosForm] = useState({ name: '', code: '', department: '', order: 1 });

  // States chỉnh sửa Tiêu chí tín nhiệm
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

  // State chỉnh sửa Chức danh quy hoạch
  const [newPlanningPos, setNewPlanningPos] = useState('');

  // 1. Subscribe Realtime Firestore
  useEffect(() => {
    const unsubDept = subscribeDepartments((list) => setDepartments(list));
    const unsubPos = subscribePositions((list) => setPositions(list));
    const unsubCrit = subscribeTrustCriteria((list) => setTrustCriteria(list));
    const unsubMod = subscribeSystemModules((list) => setModulesList(list));
    const unsubSet = subscribeSystemSettings((data) => {
      if (data) {
        setSystemSettings({ ...DEFAULT_SYSTEM_SETTINGS, ...data });
      }
      setLoadingSettings(false);
    });

    return () => {
      unsubDept();
      unsubPos();
      unsubCrit();
      unsubMod();
      unsubSet();
    };
  }, []);

  // Handler: Lưu Cài đặt hệ thống chung
  const handleSaveGeneralSettings = async (e) => {
    e?.preventDefault?.();
    try {
      await saveSystemSettings(systemSettings);
      toast.success('Đã lưu cấu hình tham số hệ thống lên Firestore thành công!');
    } catch (err) {
      toast.error('Lỗi lưu cấu hình: ' + err.message);
    }
  };

  // Handler: Phòng ban
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

  const handleSaveDept = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) {
      toast.error('Tên phòng ban không được để trống.');
      return;
    }
    try {
      await saveDepartment({
        ...(editingDept ? { id: editingDept.id } : {}),
        name: deptForm.name.trim(),
        code: deptForm.code.trim().toUpperCase() || `PB${Date.now()}`,
        order: Number(deptForm.order) || 1,
      });
      toast.success(`${editingDept ? 'Cập nhật' : 'Thêm mới'} phòng ban thành công!`);
      setDeptModalOpen(false);
    } catch (err) {
      toast.error('Lỗi lưu phòng ban: ' + err.message);
    }
  };

  const handleDeleteDept = async (id, name) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa phòng ban [${name}]?`)) return;
    try {
      await deleteDepartment(id);
      toast.success(`Đã xóa phòng ban [${name}].`);
    } catch (err) {
      toast.error('Lỗi khi xóa: ' + err.message);
    }
  };

  // Handler: Chức vụ
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

  const handleSavePos = async (e) => {
    e.preventDefault();
    if (!posForm.name.trim()) {
      toast.error('Tên chức vụ không được để trống.');
      return;
    }
    try {
      await savePosition({
        ...(editingPos ? { id: editingPos.id } : {}),
        name: posForm.name.trim(),
        code: posForm.code.trim().toUpperCase() || `CV${Date.now()}`,
        department: posForm.department,
        order: Number(posForm.order) || 1,
      });
      toast.success(`${editingPos ? 'Cập nhật' : 'Thêm mới'} chức vụ thành công!`);
      setPosModalOpen(false);
    } catch (err) {
      toast.error('Lỗi lưu chức vụ: ' + err.message);
    }
  };

  const handleDeletePos = async (id, name) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa chức vụ [${name}]?`)) return;
    try {
      await deletePosition(id);
      toast.success(`Đã xóa chức danh [${name}].`);
    } catch (err) {
      toast.error('Lỗi khi xóa: ' + err.message);
    }
  };

  // Handler: Tiêu chí tín nhiệm
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

  const handleSaveCrit = async (e) => {
    e.preventDefault();
    if (!critForm.title.trim()) {
      toast.error('Tên tiêu chí không được để trống.');
      return;
    }
    try {
      await saveTrustCriterion({
        ...(editingCrit ? { id: editingCrit.id } : { id: Date.now() }),
        code: critForm.code.trim().toUpperCase(),
        title: critForm.title.trim(),
        group: critForm.group.trim(),
        description: critForm.description.trim(),
        maxScore: Number(critForm.maxScore) || 10,
        minScore: Number(critForm.minScore) || 0,
        weight: Number(critForm.weight) || 10,
      });
      toast.success(`${editingCrit ? 'Cập nhật' : 'Thêm mới'} tiêu chí thành công!`);
      setCritModalOpen(false);
    } catch (err) {
      toast.error('Lỗi lưu tiêu chí: ' + err.message);
    }
  };

  const handleDeleteCrit = async (code, title) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa tiêu chí [${title}] (${code})?`)) return;
    try {
      await deleteTrustCriterion(code);
      toast.success(`Đã xóa tiêu chí [${title}].`);
    } catch (err) {
      toast.error('Lỗi khi xóa tiêu chí: ' + err.message);
    }
  };

  // Handler: Bật/Tắt module
  const handleToggleModuleStatus = async (moduleCode, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PLANNED' : 'ACTIVE';
    try {
      await updateSystemModule(moduleCode, { status: newStatus });
      toast.success(`Đã chuyển trạng thái phân hệ [${moduleCode}] thành: ${newStatus === 'ACTIVE' ? 'Vận hành' : 'Kế hoạch'}!`);
    } catch (err) {
      toast.error('Lỗi cập nhật phân hệ: ' + err.message);
    }
  };

  // Handler: Thêm/Xóa chức danh quy hoạch
  const handleAddPlanningPos = () => {
    if (!newPlanningPos.trim()) return;
    const currentList = systemSettings.planningPositions || [];
    if (currentList.includes(newPlanningPos.trim())) {
      toast.error('Chức danh này đã tồn tại trong danh mục quy hoạch.');
      return;
    }
    const updated = [...currentList, newPlanningPos.trim()];
    setSystemSettings((prev) => ({ ...prev, planningPositions: updated }));
    setNewPlanningPos('');
  };

  const handleRemovePlanningPos = (posName) => {
    const currentList = systemSettings.planningPositions || [];
    const updated = currentList.filter((p) => p !== posName);
    setSystemSettings((prev) => ({ ...prev, planningPositions: updated }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Tiêu đề Phân hệ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#0f766e] uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200">
              Quản Trị Hệ Thống
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">QTDND Yên Thọ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Cấu Hình & Quản Trị Các Phân Hệ Nghiệp Vụ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thiết lập tham số các phân hệ đang vận hành và kích hoạt tính năng các phân hệ đang triển khai.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Save}
          onClick={handleSaveGeneralSettings}
          className="font-bold self-start sm:self-auto shadow-sm"
        >
          Lưu tất cả cấu hình
        </Button>
      </div>

      {/* 2. Thanh Tabs Điều Hướng Cấu Hình */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('TRUST')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'TRUST'
              ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>1. Tín Nhiệm</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HR')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'HR'
              ? 'bg-white text-teal-800 shadow-xs border border-teal-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-teal-700" />
          <span>2. Nhân Sự & PB</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('KPI')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'KPI'
              ? 'bg-white text-blue-800 shadow-xs border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
          <span>3. KPI (40-30-30)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PLANNING')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PLANNING'
              ? 'bg-white text-purple-800 shadow-xs border border-purple-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Vote className="w-3.5 h-3.5 text-purple-700" />
          <span>4. Quy Hoạch</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MODULES')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'MODULES'
              ? 'bg-white text-amber-800 shadow-xs border border-amber-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-700" />
          <span>5. Bật/Tắt Phân Hệ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ORGANIZATION')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ORGANIZATION'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-slate-700" />
          <span>6. Thông Tin Quỹ</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: CẤU HÌNH PHÂN HỆ ĐÁNH GIÁ TÍN NHIỆM                             */}
      {/* ===================================================================== */}
      {activeTab === 'TRUST' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <Card 
            title="Quản Lý Bộ Tiêu Chí Đánh Giá Tín Nhiệm Chuẩn (10 Tiêu Chí)"
            headerRight={
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => handleOpenCritModal(null)}
                className="font-bold text-xs"
              >
                Thêm tiêu chí mới
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-3 w-16 text-center">Mã</th>
                    <th className="py-3 px-3">Tên tiêu chí</th>
                    <th className="py-3 px-3">Nhóm năng lực</th>
                    <th className="py-3 px-3">Mô tả chuẩn mực</th>
                    <th className="py-3 px-3 text-center w-24">Thang điểm</th>
                    <th className="py-3 px-3 text-center w-20">Trọng số</th>
                    <th className="py-3 px-3 text-center w-20">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trustCriteria.map((c) => (
                    <tr key={c.id || c.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-center text-[#047857]">
                        {c.code}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {c.title}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          {c.group}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-md text-[11px] leading-relaxed">
                        {c.description}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {c.minScore || 0} - {c.maxScore || 10}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-teal-800">
                        {c.weight || 10}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenCritModal(c)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                            title="Sửa tiêu chí"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCrit(c.code, c.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
          </Card>

          {/* Ngưỡng Xếp Loại Tín Nhiệm */}
          <Card title="Thang Phân Loại & Ngưỡng Xếp Hạng Tín Nhiệm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                <span className="text-xs font-bold text-emerald-900 uppercase block">
                  1. Tín Nhiệm Xuất Sắc (Thang 100)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-700 font-medium">Từ:</span>
                  <input
                    type="number"
                    value={systemSettings.trustGradeExcellent ?? 90}
                    onChange={(e) => setSystemSettings((prev) => ({ ...prev, trustGradeExcellent: Number(e.target.value) }))}
                    className="w-20 p-2 text-sm font-bold bg-white border border-emerald-300 rounded-lg text-center"
                  />
                  <span className="text-xs text-emerald-700 font-medium">điểm trở lên</span>
                </div>
                <p className="text-[11px] text-emerald-800/80">
                  Gương mẫu, uy tín cao, hoàn thành xuất sắc nhiệm vụ được giao.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-2">
                <span className="text-xs font-bold text-teal-900 uppercase block">
                  2. Tín Nhiệm Tốt
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-teal-700 font-medium">Từ:</span>
                  <input
                    type="number"
                    value={systemSettings.trustGradeGood ?? 70}
                    onChange={(e) => setSystemSettings((prev) => ({ ...prev, trustGradeGood: Number(e.target.value) }))}
                    className="w-20 p-2 text-sm font-bold bg-white border border-teal-300 rounded-lg text-center"
                  />
                  <span className="text-xs text-teal-700 font-medium">điểm trở lên</span>
                </div>
                <p className="text-[11px] text-teal-800/80">
                  Có uy tín tốt, tác phong giao dịch chuẩn mực, hoàn thành tốt kế hoạch.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                <span className="text-xs font-bold text-amber-900 uppercase block">
                  3. Tín Nhiệm Hoàn Thành
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-700 font-medium">Từ:</span>
                  <input
                    type="number"
                    value={systemSettings.trustGradePass ?? 50}
                    onChange={(e) => setSystemSettings((prev) => ({ ...prev, trustGradePass: Number(e.target.value) }))}
                    className="w-20 p-2 text-sm font-bold bg-white border border-amber-300 rounded-lg text-center"
                  />
                  <span className="text-xs text-amber-700 font-medium">điểm trở lên</span>
                </div>
                <p className="text-[11px] text-amber-800/80">
                  Hoàn thành nhiệm vụ ở mức cơ bản, cần tiếp tục nỗ lực rèn luyện.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: CẤU HÌNH NHÂN SỰ & PHÒNG BAN                                    */}
      {/* ===================================================================== */}
      {activeTab === 'HR' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Danh Mục Phòng Ban */}
            <Card
              title="Danh Mục Phòng Ban Hoạt Động"
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
              <div className="divide-y divide-slate-100">
                {departments.map((d, idx) => (
                  <div key={d.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">{d.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Mã: {d.code} • Thứ tự: {d.order}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenDeptModal(d)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDept(d.id, d.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 2. Danh Mục Chức Vụ / Vị Trí */}
            <Card
              title="Danh Mục Chức Danh / Vị Trí Công Tác"
              headerRight={
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => handleOpenPosModal(null)}
                  className="font-bold text-xs"
                >
                  Thêm chức danh
                </Button>
              }
            >
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 pr-1">
                {positions.map((p, idx) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-teal-50 text-[#0f766e] font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.department}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenPosModal(p)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePos(p.id, p.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quy định Luân Chuyển Cán Bộ */}
          <Card title="Quy Định Chu Kỳ Luân Chuyển Cán Bộ Tín Dụng (Quy chế NHNN)">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-teal-200 bg-teal-50/50">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-teal-950">
                  Thời hạn tối đa cán bộ phụ trách một địa bàn tín dụng:
                </h4>
                <p className="text-[11px] text-teal-800">
                  Theo thông tư quy định của NHNN, cán bộ tín dụng phải được luân chuyển địa bàn công tác định kỳ để ngăn ngừa rủi ro đạo đức.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={systemSettings.transferCycleMonths ?? 36}
                  onChange={(e) => setSystemSettings((prev) => ({ ...prev, transferCycleMonths: Number(e.target.value) }))}
                  className="w-20 p-2 text-sm font-bold bg-white border border-teal-300 rounded-lg text-center"
                />
                <span className="text-xs font-bold text-teal-900">tháng (3 năm)</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: CẤU HÌNH PHÂN HỆ KPI 3 CẤP                                     */}
      {/* ===================================================================== */}
      {activeTab === 'KPI' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <Card title="Cấu Hình Tỷ Trọng Điểm Đánh Giá KPI 3 Cấp">
            <p className="text-xs text-slate-500 mb-4">
              Tổng tỷ trọng 3 cấp bắt buộc phải bằng <strong>100%</strong>. Điểm tổng hợp được tính theo công thức trọng số độc lập.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                <span className="text-xs font-bold text-blue-900 uppercase block">
                  Cấp 1: Cán bộ Tự chấm
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={systemSettings.kpiWeightSelf ?? 40}
                    onChange={(e) => setSystemSettings((prev) => ({ ...prev, kpiWeightSelf: Number(e.target.value) }))}
                    className="w-20 p-2 text-sm font-bold bg-white border border-blue-300 rounded-lg text-center"
                  />
                  <span className="text-xs font-bold text-blue-900">%</span>
                </div>
                <p className="text-[11px] text-blue-700">
                  Cán bộ tự đánh giá mức độ hoàn thành chỉ tiêu được giao trong kỳ.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
                <span className="text-xs font-bold text-indigo-900 uppercase block">
                  Cấp 2: Ban Điều Hành (Giám đốc)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={systemSettings.kpiWeightManager ?? 30}
                    onChange={(e) => setSystemSettings((prev) => ({ ...prev, kpiWeightManager: Number(e.target.value) }))}
                    className="w-20 p-2 text-sm font-bold bg-white border border-indigo-300 rounded-lg text-center"
                  />
                  <span className="text-xs font-bold text-indigo-900">%</span>
                </div>
                <p className="text-[11px] text-indigo-700">
                  Giám đốc trực tiếp thẩm tra hồ sơ và chấm điểm năng suất công tác.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
                <span className="text-xs font-bold text-purple-900 uppercase block">
                  Cấp 3: Chủ Tịch HĐQT Phê Chuẩn
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={systemSettings.kpiWeightChairman ?? 30}
                    onChange={(e) => setSystemSettings((prev) => ({ ...prev, kpiWeightChairman: Number(e.target.value) }))}
                    className="w-20 p-2 text-sm font-bold bg-white border border-purple-300 rounded-lg text-center"
                  />
                  <span className="text-xs font-bold text-purple-900">%</span>
                </div>
                <p className="text-[11px] text-purple-700">
                  Chủ tịch HĐQT xem xét toàn diện và phê chuẩn kết quả xếp loại cuối cùng.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-100 flex items-center justify-between text-xs font-bold">
              <span>Tổng tỷ trọng hiện tại:</span>
              <span className={`text-sm ${
                (systemSettings.kpiWeightSelf + systemSettings.kpiWeightManager + systemSettings.kpiWeightChairman) === 100
                  ? 'text-emerald-700 font-black'
                  : 'text-rose-600 font-black'
              }`}>
                {systemSettings.kpiWeightSelf + systemSettings.kpiWeightManager + systemSettings.kpiWeightChairman}%
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: CẤU HÌNH PHÂN HỆ QUY HOẠCH CÁN BỘ                               */}
      {/* ===================================================================== */}
      {activeTab === 'PLANNING' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <Card title="Danh Mục Chức Danh Lấy Phiếu Quy Hoạch Bổ Nhiệm">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Nhập tên chức danh quy hoạch mới (VD: Phó Chủ tịch HĐQT)..."
                value={newPlanningPos}
                onChange={(e) => setNewPlanningPos(e.target.value)}
                className="flex-1 p-2.5 text-xs bg-white border border-slate-300 rounded-xl"
              />
              <Button variant="primary" size="sm" icon={Plus} onClick={handleAddPlanningPos}>
                Thêm chức danh
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {(systemSettings.planningPositions || []).map((pos, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-2xs">
                  <span className="text-xs font-bold text-slate-800">{pos}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePlanningPos(pos)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Xóa chức danh"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Ngưỡng Tín Nhiệm Để Trúng Quy Hoạch">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-purple-200 bg-purple-50/50">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-purple-950">
                  Tỷ lệ phiếu tín nhiệm tối thiểu để xem xét bổ nhiệm quy hoạch:
                </h4>
                <p className="text-[11px] text-purple-800">
                  Ứng viên phải đạt trên tỷ lệ này mới đủ điều kiện lập hồ sơ trình Ban Thường vụ và NHNN phê chuẩn.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={systemSettings.planningThresholdPercent ?? 50}
                  onChange={(e) => setSystemSettings((prev) => ({ ...prev, planningThresholdPercent: Number(e.target.value) }))}
                  className="w-20 p-2 text-sm font-bold bg-white border border-purple-300 rounded-lg text-center"
                />
                <span className="text-xs font-bold text-purple-900">% số phiếu hợp lệ</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: BẬT / TẮT PHÂN HỆ (MODULE FEATURE FLAGS)                        */}
      {/* ===================================================================== */}
      {activeTab === 'MODULES' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <Card title="Quản Lý Kích Hoạt Các Phân Hệ Trên Cổng Portal (Feature Flags)">
            <p className="text-xs text-slate-500 mb-4">
              Cho phép Ban Quản trị kích hoạt đưa vào sử dụng ngay lập tức hoặc tạm ẩn các phân hệ đang trong giai đoạn triển khai.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modulesList.map((mod) => {
                const isActive = mod.status === 'ACTIVE';
                return (
                  <div 
                    key={mod.code} 
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive 
                        ? 'border-emerald-300 bg-emerald-50/30' 
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <h4 className="text-sm font-black text-slate-900">{mod.name}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {mod.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleModuleStatus(mod.code, mod.status)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        {isActive ? 'ĐANG VẬN HÀNH' : 'TẠM KHÓA'}
                      </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Mã: {mod.code}</span>
                      <span>Đường dẫn: {mod.route}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: THÔNG TIN PHÁP NHÂN QUỸ                                        */}
      {/* ===================================================================== */}
      {activeTab === 'ORGANIZATION' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <Card title="Thông Tin Pháp Nhân & Địa Bàn Hoạt Động (QTDND Yên Thọ)">
            <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Tên đầy đủ Quỹ tín dụng"
                  value={systemSettings.unitName || ''}
                  onChange={(e) => setSystemSettings((prev) => ({ ...prev, unitName: e.target.value }))}
                  required
                />
                <Input
                  label="Tên viết tắt"
                  value={systemSettings.shortName || ''}
                  onChange={(e) => setSystemSettings((prev) => ({ ...prev, shortName: e.target.value }))}
                />
              </div>

              <Input
                label="Địa chỉ trụ sở chính"
                value={systemSettings.address || ''}
                onChange={(e) => setSystemSettings((prev) => ({ ...prev, address: e.target.value }))}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Giấy phép thành lập & hoạt động"
                  value={systemSettings.licenseNo || ''}
                  onChange={(e) => setSystemSettings((prev) => ({ ...prev, licenseNo: e.target.value }))}
                />
                <Input
                  label="Số điện thoại liên hệ"
                  value={systemSettings.phone || ''}
                  onChange={(e) => setSystemSettings((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Chủ tịch Hội đồng Quản trị"
                  value={systemSettings.chairmanName || ''}
                  onChange={(e) => setSystemSettings((prev) => ({ ...prev, chairmanName: e.target.value }))}
                />
                <Input
                  label="Giám đốc điều hành"
                  value={systemSettings.directorName || ''}
                  onChange={(e) => setSystemSettings((prev) => ({ ...prev, directorName: e.target.value }))}
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200">
                <Button type="submit" variant="primary" icon={Save} className="font-bold">
                  Lưu thông tin pháp nhân
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: THÊM / SỬA PHÒNG BAN                                           */}
      {/* ===================================================================== */}
      <Modal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title={editingDept ? 'Cập Nhật Phòng Ban' : 'Thêm Phòng Ban Mới'}
      >
        <form onSubmit={handleSaveDept} className="space-y-4">
          <Input
            label="Tên phòng ban"
            placeholder="VD: Ban Kiểm soát..."
            value={deptForm.name}
            onChange={(e) => setDeptForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Mã phòng ban (viết tắt)"
              placeholder="VD: BKS"
              value={deptForm.code}
              onChange={(e) => setDeptForm((prev) => ({ ...prev, code: e.target.value }))}
            />
            <Input
              label="Thứ tự hiển thị"
              type="number"
              value={deptForm.order}
              onChange={(e) => setDeptForm((prev) => ({ ...prev, order: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setDeptModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Lưu phòng ban
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL: THÊM / SỬA CHỨC DANH                                           */}
      {/* ===================================================================== */}
      <Modal
        isOpen={posModalOpen}
        onClose={() => setPosModalOpen(false)}
        title={editingPos ? 'Cập Nhật Chức Danh' : 'Thêm Chức Danh Mới'}
      >
        <form onSubmit={handleSavePos} className="space-y-4">
          <Input
            label="Tên chức danh / Vị trí"
            placeholder="VD: Trưởng ban kiểm soát..."
            value={posForm.name}
            onChange={(e) => setPosForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phòng ban trực thuộc:
            </label>
            <select
              value={posForm.department}
              onChange={(e) => setPosForm((prev) => ({ ...prev, department: e.target.value }))}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Mã chức danh"
              placeholder="VD: TR_BKS"
              value={posForm.code}
              onChange={(e) => setPosForm((prev) => ({ ...prev, code: e.target.value }))}
            />
            <Input
              label="Thứ tự"
              type="number"
              value={posForm.order}
              onChange={(e) => setPosForm((prev) => ({ ...prev, order: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setPosModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Lưu chức danh
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL: THÊM / SỬA TIÊU CHÍ TÍN NHIỆM                                  */}
      {/* ===================================================================== */}
      <Modal
        isOpen={critModalOpen}
        onClose={() => setCritModalOpen(false)}
        title={editingCrit ? 'Cập Nhật Tiêu Chí Tín Nhiệm' : 'Thêm Tiêu Chí Tín Nhiệm'}
      >
        <form onSubmit={handleSaveCrit} className="space-y-4">
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
              Mô tả chi tiết & Hướng dẫn chấm điểm:
            </label>
            <textarea
              rows={3}
              value={critForm.description}
              onChange={(e) => setCritForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Quy định nội dung tiêu chuẩn cần đạt..."
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Điểm tối thiểu"
              type="number"
              value={critForm.minScore}
              onChange={(e) => setCritForm((prev) => ({ ...prev, minScore: e.target.value }))}
            />
            <Input
              label="Điểm tối đa"
              type="number"
              value={critForm.maxScore}
              onChange={(e) => setCritForm((prev) => ({ ...prev, maxScore: e.target.value }))}
            />
            <Input
              label="Trọng số (%)"
              type="number"
              value={critForm.weight}
              onChange={(e) => setCritForm((prev) => ({ ...prev, weight: e.target.value }))}
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

export default AdminSettings;

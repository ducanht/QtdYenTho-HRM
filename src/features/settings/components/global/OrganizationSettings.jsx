import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  UserCheck, 
  Plus, 
  Edit3, 
  Trash2,
  ShieldCheck 
} from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';
import Modal from '../../../../components/common/Modal';
import { isCreditOfficerRole } from '../../../../lib/evaluationUtils';

/**
 * Tab 2: Quản lý Cơ cấu tổ chức & Địa bàn hoạt động dùng chung
 * Bao gồm:
 * 1. Danh mục Phòng ban (departments)
 * 2. Danh mục Chức vụ (positions)
 * 3. Điểm Làm Việc & Trụ Sở Hoạt Động (work_locations)
 * 4. Địa Bàn Quản Lý Tín Dụng CBTD (credit_areas)
 */
const OrganizationSettings = ({
  departments = [],
  positions = [],
  workLocations = [],
  creditAreas = [],
  employees = [],
  onSaveDept,
  onDeleteDept,
  onSavePos,
  onDeletePos,
  onSaveLocation,
  onDeleteLocation,
  onSaveArea,
  onDeleteArea,
}) => {
  // States Modal Phòng ban
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', order: 1 });

  // States Modal Chức vụ
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  const [posForm, setPosForm] = useState({ name: '', code: '', department: '', order: 1 });

  // States Modal Điểm làm việc
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [locForm, setLocForm] = useState({ name: '', code: '', address: '', isHeadquarters: false, order: 1 });

  // States Modal Địa bàn tín dụng
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [areaForm, setAreaForm] = useState({ name: '', code: '', village: '', commune: 'Yên Thọ', order: 1 });

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

  const submitDept = async (e) => {
    e.preventDefault();
    if (onSaveDept) {
      const success = await onSaveDept(deptForm, editingDept);
      if (success !== false) setDeptModalOpen(false);
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

  const submitPos = async (e) => {
    e.preventDefault();
    if (onSavePos) {
      const success = await onSavePos(posForm, editingPos);
      if (success !== false) setPosModalOpen(false);
    }
  };

  // Handler: Điểm làm việc
  const handleOpenLocModal = (loc = null) => {
    if (loc) {
      setEditingLoc(loc);
      setLocForm({
        name: loc.name || '',
        code: loc.code || '',
        address: loc.address || '',
        isHeadquarters: Boolean(loc.isHeadquarters),
        order: loc.order || workLocations.length + 1,
      });
    } else {
      setEditingLoc(null);
      setLocForm({
        name: '',
        code: '',
        address: '',
        isHeadquarters: false,
        order: workLocations.length + 1,
      });
    }
    setLocModalOpen(true);
  };

  const submitLoc = async (e) => {
    e.preventDefault();
    if (!locForm.name.trim()) return;
    if (onSaveLocation) {
      const payload = {
        ...(editingLoc || {}),
        ...locForm,
      };
      const success = await onSaveLocation(payload, editingLoc?.name || null);
      if (success !== false) setLocModalOpen(false);
    }
  };

  // Handler: Địa bàn tín dụng
  const handleOpenAreaModal = (area = null) => {
    if (area) {
      setEditingArea(area);
      setAreaForm({
        name: area.name || '',
        code: area.code || '',
        village: area.village || '',
        commune: area.commune || 'Yên Thọ',
        order: area.order || creditAreas.length + 1,
      });
    } else {
      setEditingArea(null);
      setAreaForm({
        name: '',
        code: '',
        village: '',
        commune: 'Yên Thọ',
        order: creditAreas.length + 1,
      });
    }
    setAreaModalOpen(true);
  };

  const submitArea = async (e) => {
    e.preventDefault();
    if (!areaForm.name.trim()) return;
    if (onSaveArea) {
      const payload = {
        ...(editingArea || {}),
        ...areaForm,
      };
      const success = await onSaveArea(payload, editingArea?.name || null);
      if (success !== false) setAreaModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. DANH MỤC PHÒNG BAN */}
      {/* ========================================================================= */}
      <Card
        title={`1. Danh Mục Phòng Ban (${departments.length})`}
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
                <p className="text-[11px] text-slate-500">Thứ tự hiển thị: {dept.order || 1}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenDeptModal(dept)}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                  title="Chỉnh sửa"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteDept && onDeleteDept(dept.id, dept.name)}
                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  title="Xóa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 2. DANH MỤC CHỨC VỤ / VỊ TRÍ CÔNG TÁC */}
      {/* ========================================================================= */}
      <Card
        title={`2. Danh Mục Chức Vụ / Vị Trí Công Tác (${positions.length})`}
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
                <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  {pos.code || 'CV'}
                </span>
                <h4 className="text-xs font-black text-slate-900 mt-1">{pos.name}</h4>
                <p className="text-[11px] text-teal-700 font-semibold mt-0.5">{pos.department}</p>
                <p className="text-[10px] text-slate-400">Thứ tự: {pos.order || 1}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenPosModal(pos)}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                  title="Chỉnh sửa"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeletePos && onDeletePos(pos.id, pos.name)}
                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  title="Xóa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 3. DANH MỤC ĐIỂM LÀM VIỆC & TRỤ SỞ HOẠT ĐỘNG (work_locations) */}
      {/* ========================================================================= */}
      <Card
        title={`3. Điểm Làm Việc & Trụ Sở Hoạt Động (${workLocations.length})`}
        headerRight={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => handleOpenLocModal(null)}
            className="font-bold text-xs"
          >
            Thêm điểm làm việc
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {workLocations.map((loc, idx) => {
            const assignedEmps = employees.filter(
              (e) => (e.workLocation || '').trim().toLowerCase() === (loc.name || '').trim().toLowerCase()
            );

            return (
              <div
                key={loc.id || idx}
                className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 transition-all shadow-2xs flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      {loc.code || `LOC-${idx + 1}`}
                    </span>
                    {loc.isHeadquarters && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Trụ sở chính
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-slate-900 mt-2 leading-snug">
                    {loc.name}
                  </h4>
                  {loc.address && (
                    <p className="text-[11px] text-slate-500 mt-1 flex items-start gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{loc.address}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {assignedEmps.length > 0 ? (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {assignedEmps.length} cán bộ đang công tác
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Chưa có cán bộ phân công</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenLocModal(loc)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="Chỉnh sửa điểm làm việc"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteLocation && onDeleteLocation(loc.id, loc.name)}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Xóa điểm làm việc"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 4. DANH MỤC ĐỊA BÀN QUẢN LÝ TÍN DỤNG (credit_areas) */}
      {/* ========================================================================= */}
      <Card
        title={`4. Địa Bàn Quản Lý Tín Dụng CBTD (${creditAreas.length})`}
        headerRight={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => handleOpenAreaModal(null)}
            className="font-bold text-xs"
          >
            Thêm địa bàn tín dụng
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {creditAreas.map((area, idx) => {
            const assignedOfficers = employees.filter(
              (e) => isCreditOfficerRole(e.position, e.department) &&
                     (e.assignedArea || '').trim().toLowerCase() === (area.name || '').trim().toLowerCase()
            );

            return (
              <div
                key={area.id || idx}
                className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-teal-300 transition-all shadow-2xs flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold">
                      {area.code || `AREA-${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Thứ tự: {area.order || idx + 1}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 mt-2 leading-snug">
                    {area.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    {assignedOfficers.length > 0 ? (
                      <span 
                        className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200"
                        title={`Thời gian nhận địa bàn: ${assignedOfficers[0].areaStartDate || 'Chưa cập nhật'}`}
                      >
                        Phụ trách: {assignedOfficers.map((o) => o.name).join(', ')}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                        Chưa phân công CBTD
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenAreaModal(area)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="Chỉnh sửa địa bàn tín dụng"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteArea && onDeleteArea(area.id, area.name)}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Xóa địa bàn tín dụng"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL PHÒNG BAN */}
      {/* ========================================================================= */}
      <Modal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title={editingDept ? 'Chỉnh Sửa Phòng Ban' : 'Thêm Phòng Ban Mới'}
      >
        <form onSubmit={submitDept} className="space-y-4">
          <Input
            label="Tên phòng ban / Khối chức năng"
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
              placeholder="TD, KTNQ, BKS..."
            />
            <Input
              label="Thứ tự"
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

      {/* ========================================================================= */}
      {/* MODAL CHỨC VỤ */}
      {/* ========================================================================= */}
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
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f766e]/20"
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

      {/* ========================================================================= */}
      {/* MODAL ĐIỂM LÀM VIỆC & TRỤ SỞ */}
      {/* ========================================================================= */}
      <Modal
        isOpen={locModalOpen}
        onClose={() => setLocModalOpen(false)}
        title={editingLoc ? 'Chỉnh Sửa Điểm Làm Việc / Trụ Sở' : 'Thêm Điểm Làm Việc / Trụ Sở Mới'}
      >
        <form onSubmit={submitLoc} className="space-y-4">
          <Input
            label="Tên điểm làm việc / Trụ sở"
            value={locForm.name}
            onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
            placeholder="Ví dụ: Trụ sở chính - Quỹ TDND Yên Thọ..."
            required
          />
          <Input
            label="Địa chỉ cụ thể"
            value={locForm.address}
            onChange={(e) => setLocForm({ ...locForm, address: e.target.value })}
            placeholder="Ví dụ: Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mã định danh"
              value={locForm.code}
              onChange={(e) => setLocForm({ ...locForm, code: e.target.value })}
              placeholder="TS_CHINH, PGD_01..."
            />
            <Input
              label="Thứ tự"
              type="number"
              value={locForm.order}
              onChange={(e) => setLocForm({ ...locForm, order: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isHeadquarters"
              checked={locForm.isHeadquarters}
              onChange={(e) => setLocForm({ ...locForm, isHeadquarters: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700"
            />
            <label htmlFor="isHeadquarters" className="text-xs font-bold text-slate-700 cursor-pointer">
              Đặt làm Trụ sở chính của Quỹ
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setLocModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" type="submit">
              Lưu điểm làm việc
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL ĐỊA BÀN QUẢN LÝ TÍN DỤNG */}
      {/* ========================================================================= */}
      <Modal
        isOpen={areaModalOpen}
        onClose={() => setAreaModalOpen(false)}
        title={editingArea ? 'Chỉnh Sửa Địa Bàn Tín Dụng' : 'Thêm Địa Bàn Tín Dụng Mới'}
      >
        <form onSubmit={submitArea} className="space-y-4">
          <Input
            label="Tên địa bàn quản lý tín dụng"
            value={areaForm.name}
            onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
            placeholder="Ví dụ: Thôn Tân Lộc (xã Yên Thọ)..."
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Thôn / Cụm thôn"
              value={areaForm.village}
              onChange={(e) => setAreaForm({ ...areaForm, village: e.target.value })}
              placeholder="Tân Lộc, Cụm 1-2-3..."
            />
            <Input
              label="Xã / Thị trấn"
              value={areaForm.commune}
              onChange={(e) => setAreaForm({ ...areaForm, commune: e.target.value })}
              placeholder="Yên Thọ, Quý Lộc..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mã địa bàn"
              value={areaForm.code}
              onChange={(e) => setAreaForm({ ...areaForm, code: e.target.value })}
              placeholder="DB_TAN_LOC..."
            />
            <Input
              label="Thứ tự"
              type="number"
              value={areaForm.order}
              onChange={(e) => setAreaForm({ ...areaForm, order: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setAreaModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" type="submit">
              Lưu địa bàn
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrganizationSettings;

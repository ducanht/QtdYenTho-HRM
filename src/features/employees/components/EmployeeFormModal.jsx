import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { generateUUID } from '../../../lib/evaluationUtils';
import { createEmployeeProfile, updateEmployeeProfile } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';

/**
 * EmployeeFormModal: Modal Thêm mới hoặc Chỉnh sửa hồ sơ cán bộ
 * Tuân thủ: Ẩn UUID, ẩn mã CB, ẩn phân quyền hệ thống khỏi giao diện. Không dùng font mono.
 */
const EmployeeFormModal = ({
  isOpen,
  onClose,
  initialData = null,
  departments = [],
  positions = [],
  existingEmployees = [],
  onSuccess,
}) => {
  const toast = useToast();
  const isEdit = Boolean(initialData?.id);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [uuid, setUuid] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Nam');
  const [birthDate, setBirthDate] = useState('');
  const [cccd, setCccd] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Phòng Tín dụng');
  const [position, setPosition] = useState('Cán bộ tín dụng');
  const [positionStartDate, setPositionStartDate] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [contractType, setContractType] = useState('Không xác định thời hạn');
  const [assignedArea, setAssignedArea] = useState('');
  const [areaStartDate, setAreaStartDate] = useState('');
  const [partyMember, setPartyMember] = useState(false);
  const [partyDate, setPartyDate] = useState('');
  const [partyOfficialDate, setPartyOfficialDate] = useState('');
  const [politicalRole, setPoliticalRole] = useState('Đảng viên');
  const [education, setEducation] = useState('Đại học chuyên ngành Tài chính - Ngân hàng');
  const [itLevel, setItLevel] = useState('Ứng dụng CNTT cơ bản');
  const [foreignLanguage, setForeignLanguage] = useState('Tiếng Anh');
  const [role, setRole] = useState('staff');

  useEffect(() => {
    if (initialData) {
      setUuid(initialData.uuid || generateUUID());
      setCode(initialData.code || '');
      setName(initialData.name || '');
      setGender(initialData.gender || 'Nam');
      setBirthDate(initialData.birthDate || '');
      setCccd(initialData.cccd || '');
      setPhone(initialData.phone || '');
      setSecondaryPhone(initialData.secondaryPhone || initialData.phone2 || '');
      setEmail(initialData.email || '');
      setDepartment(initialData.department || 'Phòng Tín dụng');
      setPosition(initialData.position || 'Cán bộ tín dụng');
      setPositionStartDate(initialData.positionStartDate || initialData.joinDate || '');
      setJoinDate(initialData.joinDate || '');
      setContractType(initialData.contractType || 'Không xác định thời hạn');
      setAssignedArea(initialData.assignedArea || '');
      setAreaStartDate(initialData.areaStartDate || '');
      setPartyMember(Boolean(initialData.partyMember));
      setPartyDate(initialData.partyDate || '');
      setPartyOfficialDate(initialData.partyOfficialDate || '');
      setPoliticalRole(initialData.politicalRole || 'Đảng viên');
      setEducation(initialData.education || '');
      setItLevel(initialData.itLevel || 'Ứng dụng CNTT cơ bản');
      setForeignLanguage(initialData.foreignLanguage || 'Tiếng Anh');
      setRole(initialData.role || 'staff');
    } else {
      const newUuid = generateUUID();
      setUuid(newUuid);

      // Gợi ý mã CB tự động ngầm định
      const maxCodeNum = existingEmployees.reduce((max, e) => {
        const match = (e.code || '').match(/CB(\d+)/i);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      const nextCode = `CB${String(maxCodeNum + 1).padStart(2, '0')}`;
      setCode(nextCode);

      setName('');
      setGender('Nam');
      setBirthDate('');
      setCccd('');
      setPhone('');
      setSecondaryPhone('');
      setEmail('');
      setDepartment(departments[0] || 'Phòng Tín dụng');
      setPosition('Cán bộ tín dụng');
      const today = new Date().toISOString().slice(0, 10);
      setPositionStartDate(today);
      setJoinDate(today);
      setContractType('Không xác định thời hạn');
      setAssignedArea('');
      setAreaStartDate(today);
      setPartyMember(false);
      setPartyDate('');
      setPartyOfficialDate('');
      setPoliticalRole('Đảng viên');
      setEducation('Đại học chuyên ngành');
      setItLevel('Ứng dụng CNTT cơ bản');
      setForeignLanguage('Tiếng Anh');
      setRole('staff');
    }
  }, [initialData, isOpen, departments, existingEmployees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast?.showError?.('Vui lòng nhập họ và tên cán bộ');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        uuid: uuid || generateUUID(),
        code: (code || `CB${String(existingEmployees.length + 1).padStart(2, '0')}`).trim().toUpperCase(),
        name: name.trim(),
        gender,
        birthDate,
        cccd: cccd.trim(),
        phone: phone.trim(),
        secondaryPhone: secondaryPhone.trim(),
        email: email.trim().toLowerCase(),
        department,
        position: position.trim(),
        positionStartDate,
        joinDate,
        contractType,
        assignedArea: assignedArea.trim(),
        areaStartDate: areaStartDate || '',
        partyMember,
        partyDate: partyMember ? partyDate : '',
        partyOfficialDate: partyMember ? partyOfficialDate : '',
        politicalRole: partyMember ? politicalRole : '',
        education: education.trim(),
        itLevel: itLevel.trim() || 'Ứng dụng CNTT cơ bản',
        foreignLanguage: foreignLanguage.trim() || 'Tiếng Anh',
        role: role || 'staff',
        status: initialData?.status || 'ACTIVE',
      };

      if (isEdit) {
        await updateEmployeeProfile(initialData.id, payload);
        toast?.showSuccess?.(`Đã cập nhật hồ sơ cán bộ ${name} thành công!`);
      } else {
        const customId = `emp-${payload.code.toLowerCase()}`;
        await createEmployeeProfile({ ...payload, id: customId });
        toast?.showSuccess?.(`Đã thêm mới cán bộ ${name} thành công!`);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi lưu hồ sơ cán bộ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh Sửa Hồ Sơ Cán Bộ' : 'Thêm Mới Cán Bộ Nhân Viên'}
      subtitle="Quỹ Tín Dụng Nhân Dân Yên Thọ • Hồ sơ cán bộ"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Khối 1: Thông tin cá nhân */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-emerald-800">
            1. Thông tin cá nhân &amp; Liên hệ
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Họ và tên đầy đủ:</label>
              <input
                type="text"
                placeholder="VD: Trịnh Đức Anh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Giới tính:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Số Thẻ CCCD:</label>
              <input
                type="text"
                placeholder="0380..."
                value={cccd}
                onChange={(e) => setCccd(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Ngày sinh:</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Số điện thoại chính:</label>
              <input
                type="text"
                placeholder="0988..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Số điện thoại 2 (Số phụ):</label>
              <input
                type="text"
                placeholder="0912... (Tùy chọn)"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Hộp thư điện tử (Email):</label>
              <input
                type="email"
                placeholder="ducanht@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
          </div>
        </div>

        {/* Khối 2: Công tác & Chức vụ */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-emerald-800">
            2. Công tác &amp; Vị trí đảm nhiệm
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Phòng ban:</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Chức vụ chính quyền:</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="VD: Cán bộ tín dụng / Kế toán trưởng"
                required
                list="positions-list"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
              <datalist id="positions-list">
                {positions.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Ngày bắt đầu chức vụ:</label>
              <input
                type="date"
                value={positionStartDate}
                onChange={(e) => setPositionStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Ngày tuyển dụng vào Quỹ:</label>
              <input
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Loại hợp đồng lao động:</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              >
                <option value="Không xác định thời hạn">Không xác định thời hạn</option>
                <option value="Theo nhiệm kỳ">Theo nhiệm kỳ bầu cử</option>
                <option value="Xác định thời hạn 36 tháng">Xác định thời hạn 36 tháng</option>
                <option value="Thử việc / Học việc">Thử việc / Tập sự</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Địa bàn phụ trách tín dụng:</label>
              <input
                type="text"
                placeholder="VD: Phụ trách thành viên vay vốn xã Quý Lộc / Cụm 3 thôn xã Yên Thọ"
                value={assignedArea}
                onChange={(e) => setAssignedArea(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Ngày bắt đầu nhận địa bàn:</label>
              <input
                type="date"
                value={areaStartDate}
                onChange={(e) => setAreaStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
          </div>
        </div>

        {/* Khối 3: Chính trị & Đảng viên */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-emerald-800">
              3. Chính trị &amp; Đảng - Đoàn thể
            </h4>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={partyMember}
                onChange={(e) => setPartyMember(e.target.checked)}
                className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-700"
              />
              <span className="font-bold text-slate-800">Là Đảng viên ĐCSVN</span>
            </label>
          </div>

          {partyMember && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Ngày vào Đảng dự bị:</label>
                <input
                  type="date"
                  value={partyDate}
                  onChange={(e) => setPartyDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Ngày công nhận chính thức:</label>
                <input
                  type="date"
                  value={partyOfficialDate}
                  onChange={(e) => setPartyOfficialDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Chức vụ Chi bộ:</label>
                <input
                  type="text"
                  placeholder="VD: Bí thư Chi bộ / Đảng viên"
                  value={politicalRole}
                  onChange={(e) => setPoliticalRole(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Khối 4: Trình độ đào tạo */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-emerald-800">
            4. Trình độ học vấn &amp; Chuyên môn đào tạo
          </h4>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Văn bằng / Học vị chính:</label>
            <input
              type="text"
              placeholder="VD: Đại học chuyên ngành Tài chính - Ngân hàng (Học viện Ngân hàng)"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Trình độ Tin học:</label>
              <input
                type="text"
                placeholder="VD: Ứng dụng CNTT cơ bản / Nâng cao"
                value={itLevel}
                onChange={(e) => setItLevel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Trình độ Ngoại ngữ:</label>
              <input
                type="text"
                placeholder="VD: Tiếng Anh / B1 / Giao tiếp"
                value={foreignLanguage}
                onChange={(e) => setForeignLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
          </div>
        </div>

        {/* Nút thao tác */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Đang lưu hồ sơ...' : isEdit ? 'Cập nhật hồ sơ' : 'Thêm cán bộ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default React.memo(EmployeeFormModal);

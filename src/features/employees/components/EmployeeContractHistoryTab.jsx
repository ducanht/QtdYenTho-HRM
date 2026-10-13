import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar, 
  MapPin, 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Tag, 
  UserCheck, 
  DollarSign, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { calculatePositionTenure, calculateAreaTenureAndDueDate, isCreditOfficerRole } from '../../../lib/evaluationUtils';
import { formatDateVN } from '../../../lib/dateUtils';
import { deleteEmployeeContract, deleteContractAnnex, deleteWorkHistory } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/common/Button';
import ContractFormModal from './ContractFormModal';
import ContractAnnexModal from './ContractAnnexModal';
import WorkHistoryPeriodModal from './WorkHistoryPeriodModal';

/**
 * EmployeeContractHistoryTab: Phân khu 3 - Hợp đồng lao động & Luân chuyển vị trí
 * Hợp nhất quản trị pháp lý lao động (HĐLĐ chính thức, Phụ lục sửa đổi bổ sung, Lịch sử HĐ)
 * và Quá trình công tác / Luân chuyển địa bàn CBTD (Timeline work_history)
 */
const EmployeeContractHistoryTab = ({
  emp,
  contracts = [],
  contractAnnexes = [],
  workHistory = [],
  hrConfig = null,
  canManage = false,
  departments = [],
  positions = [],
}) => {
  const toast = useToast();

  // State điều khiển Modals
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const [isAnnexModalOpen, setIsAnnexModalOpen] = useState(false);
  const [editingAnnex, setEditingAnnex] = useState(null);

  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);

  // 1. Phân loại hợp đồng của cán bộ đang chọn
  const { currentContract, pastContracts } = useMemo(() => {
    if (!emp) return { currentContract: null, pastContracts: [] };
    const empContracts = contracts.filter(
      (c) => c.employeeId === emp.id || (c.employeeCode && c.employeeCode === emp.code)
    );

    const current = empContracts.find((c) => c.isCurrent) || empContracts[0] || null;
    const past = empContracts.filter((c) => c.id !== current?.id);

    return {
      currentContract: current,
      pastContracts: past.sort((a, b) => (b.signDate || '').localeCompare(a.signDate || '')),
    };
  }, [contracts, emp]);

  // Phụ lục hợp đồng của hợp đồng hiện hành
  const currentContractAnnexes = useMemo(() => {
    if (!currentContract) return [];
    return contractAnnexes
      .filter((a) => a.contractId === currentContract.id || a.employeeId === emp?.id)
      .sort((a, b) => (b.signDate || '').localeCompare(a.signDate || ''));
  }, [contractAnnexes, currentContract, emp?.id]);

  // 2. Phân tích quá trình công tác & Luân chuyển địa bàn CBTD
  const isCreditOfficer = isCreditOfficerRole(emp?.position, emp?.department);
  const maxMonths = Number(hrConfig?.creditRotationMonths || hrConfig?.transferMaxMonths || hrConfig?.transferCycleMonths || 36);
  const warningMonths = Number(hrConfig?.creditWarningMonths || hrConfig?.transferWarningMonths || hrConfig?.warningMonths || 6);

  const effectiveStart = emp ? (emp.positionStartDate || emp.joinDate) : null;
  const tenureText = calculatePositionTenure(effectiveStart);

  const tenureMonths = useMemo(() => {
    if (!effectiveStart) return 0;
    try {
      const start = new Date(effectiveStart);
      const now = new Date();
      if (isNaN(start.getTime())) return 0;
      return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    } catch {
      return 0;
    }
  }, [effectiveStart]);

  const isDue = isCreditOfficer && tenureMonths >= maxMonths;
  const isNear = isCreditOfficer && tenureMonths >= (maxMonths - warningMonths) && tenureMonths < maxMonths;

  const areaInfo = isCreditOfficer 
    ? calculateAreaTenureAndDueDate(emp?.areaStartDate || effectiveStart, maxMonths, warningMonths) 
    : null;
  const areaPercent = areaInfo ? Math.min(100, Math.round((areaInfo.tenureMonths / maxMonths) * 100)) : 0;

  // Sắp xếp timeline mốc công tác
  const empHistory = useMemo(() => {
    if (!emp) return [];
    const list = workHistory.filter(
      (rec) => rec.employeeId === emp.id || (rec.employeeCode && rec.employeeCode === emp.code)
    );
    return list.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      const dateA = a.startDate || a.effectiveDate || '';
      const dateB = b.startDate || b.effectiveDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [workHistory, emp?.id, emp?.code]);

  if (!emp) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
        Vui lòng chọn cán bộ từ danh bạ bên trái để xem hồ sơ hợp đồng và quá trình luân chuyển công tác.
      </div>
    );
  }

  // Xóa HĐLĐ an toàn
  const handleDeleteContract = async (contractId, contractNo) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa hợp đồng số "${contractNo}" không?`)) {
      return;
    }
    try {
      await deleteEmployeeContract(contractId);
      const msg = `Đã xóa hợp đồng số ${contractNo} thành công`;
      if (toast?.success) toast.success(msg);
      else if (toast?.showSuccess) toast.showSuccess(msg);
    } catch (err) {
      const errorMsg = err.message || 'Lỗi khi xóa hợp đồng';
      if (toast?.error) toast.error(errorMsg);
      else if (toast?.showError) toast.showError(errorMsg);
    }
  };

  // Xóa Phụ lục HĐLĐ an toàn
  const handleDeleteAnnex = async (annexId, annexNo) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa phụ lục số "${annexNo}" không?`)) {
      return;
    }
    try {
      await deleteContractAnnex(annexId);
      const msg = `Đã xóa phụ lục số ${annexNo} thành công`;
      if (toast?.success) toast.success(msg);
      else if (toast?.showSuccess) toast.showSuccess(msg);
    } catch (err) {
      const errorMsg = err.message || 'Lỗi khi xóa phụ lục';
      if (toast?.error) toast.error(errorMsg);
      else if (toast?.showError) toast.showError(errorMsg);
    }
  };

  // Xóa mốc công tác an toàn
  const handleDeletePeriod = async (recordId, decNo, posName) => {
    const label = decNo ? `số "${decNo}"` : (posName ? `vị trí "${posName}"` : 'công tác này');
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa mốc ${label} không?`)) {
      return;
    }
    try {
      await deleteWorkHistory(recordId);
      const msg = 'Đã xóa mốc quá trình công tác thành công';
      if (toast?.success) toast.success(msg);
      else if (toast?.showSuccess) toast.showSuccess(msg);
    } catch (err) {
      const errorMsg = err.message || 'Lỗi khi xóa mốc công tác';
      if (toast?.error) toast.error(errorMsg);
      else if (toast?.showError) toast.showError(errorMsg);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* KHỐI 1: HỢP ĐỒNG LAO ĐỘNG HIỆN HÀNH & CÁC PHỤ LỤC SỬA ĐỔI BỔ SUNG */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Hợp Đồng Lao Động Hiện Hành &amp; Các Phụ Lục Sửa Đổi</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cán bộ: <span className="font-bold text-slate-800">{emp.name}</span> • Mã số: <span className="font-bold text-slate-800">{emp.code}</span>
            </p>
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingContract(null);
                  setIsContractModalOpen(true);
                }}
                icon={Plus}
                className="text-xs border-slate-200 hover:border-emerald-300"
              >
                Tạo HĐLĐ mới
              </Button>

              {currentContract && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setEditingAnnex(null);
                    setIsAnnexModalOpen(true);
                  }}
                  icon={Plus}
                  className="text-xs"
                >
                  Thêm Phụ lục HĐLĐ
                </Button>
              )}
            </div>
          )}
        </div>

        {/* THẺ HỢP ĐỒNG HIỆN HÀNH */}
        {currentContract ? (
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-black text-xs tracking-wide">
                  Số: {currentContract.contractNumber}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300">
                  {currentContract.contractType}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white text-emerald-800 font-semibold text-[11px] border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Đang hiệu lực
                </span>
              </div>

              {canManage && (
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingContract(currentContract);
                      setIsContractModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-slate-700 hover:text-emerald-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 font-bold text-xs flex items-center gap-1 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Sửa HĐ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteContract(currentContract.id, currentContract.contractNumber)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Xóa hợp đồng"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Chi tiết điều khoản hợp đồng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200/70">
                <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">Thời hạn hợp đồng</span>
                <div className="font-bold text-slate-800">
                  Từ {formatDateVN(currentContract.effectiveDate || currentContract.signDate)}
                  {currentContract.expirationDate ? ` đến ${formatDateVN(currentContract.expirationDate)}` : ' (Không thời hạn)'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Ngày ký: {formatDateVN(currentContract.signDate)}</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200/70">
                <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">Vị trí &amp; Phòng ban</span>
                <div className="font-bold text-slate-800">{currentContract.jobTitle || emp.position}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{currentContract.department || emp.department}</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200/70">
                <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">Tiền lương &amp; Đại diện ký</span>
                <div className="font-bold text-slate-800">
                  {currentContract.baseSalary || currentContract.wageType || 'Theo quy chế Quỹ'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Đại diện Quỹ ký: {currentContract.signerName || 'Ban Lãnh đạo'} ({currentContract.signerPosition || 'Chủ tịch HĐQT'})
                </div>
              </div>
            </div>

            {/* Nơi làm việc theo HĐ */}
            {currentContract.workLocation && (
              <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1 px-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Nơi làm việc theo hợp đồng: <strong>{currentContract.workLocation}</strong></span>
              </div>
            )}

            {currentContract.notes && (
              <div className="text-[11px] text-slate-500 italic px-1">
                Ghi chú: {currentContract.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Chưa thiết lập hồ sơ hợp đồng lao động điện tử cho cán bộ này.
              (Loại HĐ theo hồ sơ gốc: <strong>{emp.contractType || 'Không xác định thời hạn'}</strong>).
            </p>
            {canManage && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingContract(null);
                  setIsContractModalOpen(true);
                }}
                icon={Plus}
                className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              >
                Khởi tạo hợp đồng lao động điện tử ngay
              </Button>
            )}
          </div>
        )}

        {/* DANH SÁCH PHỤ LỤC HỢP ĐỒNG SỬA ĐỔI BỔ SUNG */}
        {currentContract && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-700" />
                <span>Các Phụ Lục Sửa Đổi, Bổ Sung Hợp Đồng Lao Động</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                {currentContractAnnexes.length} phụ lục đã ban hành
              </span>
            </div>

            {currentContractAnnexes.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs italic">
                Chưa phát sinh phụ lục sửa đổi, bổ sung đối với hợp đồng lao động này.
              </div>
            ) : (
              <div className="space-y-2.5">
                {currentContractAnnexes.map((annex) => (
                  <div 
                    key={annex.id}
                    className="p-3 bg-white rounded-xl border border-slate-200/90 hover:border-emerald-300 transition-colors space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{annex.annexNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {annex.annexTypeLabel || annex.annexType}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Ngày ký: {formatDateVN(annex.signDate)} • Hiệu lực: {formatDateVN(annex.effectiveDate)}
                        </span>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-1 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAnnex(annex);
                              setIsAnnexModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-800 hover:bg-slate-50 rounded"
                            title="Chỉnh sửa phụ lục"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnex(annex.id, annex.annexNumber)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Xóa phụ lục"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {annex.content}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                      <span>Người ký: <strong>{annex.signerName || 'Ban Lãnh đạo'}</strong> ({annex.signerPosition || 'Giám đốc'})</span>
                      {annex.notes && <span className="italic">Ghi chú: {annex.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 2: LỊCH SỬ CÁC HỢP ĐỒNG LAO ĐỘNG ĐÃ KÝ TRƯỚC ĐÂY */}
      {/* ========================================================================= */}
      {pastContracts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Lịch Sử Các Hợp Đồng Lao Động Đã Ký Trong Quá Khứ</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              {pastContracts.length} hợp đồng trước đây
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Số HĐLĐ</th>
                  <th className="py-2.5 px-3">Loại hợp đồng</th>
                  <th className="py-2.5 px-3">Ngày ký</th>
                  <th className="py-2.5 px-3">Thời hạn áp dụng</th>
                  <th className="py-2.5 px-3">Chức danh ký</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  {canManage && <th className="py-2.5 px-3 text-right">Tác vụ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{c.contractNumber}</td>
                    <td className="py-2.5 px-3 text-slate-700">{c.contractType}</td>
                    <td className="py-2.5 px-3 text-slate-600">{formatDateVN(c.signDate)}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      Từ {formatDateVN(c.effectiveDate || c.signDate)} 
                      {c.expirationDate ? ` đến ${formatDateVN(c.expirationDate)}` : ''}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{c.jobTitle || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">
                        {c.status === 'RENEWED' ? 'Đã tái ký HĐ mới' : (c.status === 'EXPIRED' ? 'Đã hết hạn' : 'Lịch sử')}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingContract(c);
                              setIsContractModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-800"
                            title="Sửa hợp đồng"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteContract(c.id, c.contractNumber)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Xóa hợp đồng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KHỐI 3: QUÁ TRÌNH CÔNG TÁC & LUÂN CHUYỂN VỊ TRÍ (WORK HISTORY TIMELINE) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        {/* TIÊU ĐỀ KHỐI LUÂN CHUYỂN */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-700" />
              <span>Quá Trình Công Tác &amp; Luân Chuyển Vị Trí</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi chu kỳ địa bàn tín dụng NHNN và các quyết định điều động, bổ nhiệm
            </p>
          </div>

          {canManage && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingPeriod(null);
                setIsPeriodModalOpen(true);
              }}
              icon={Plus}
              className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            >
              + Thêm mốc công tác
            </Button>
          )}
        </div>

        {/* TIẾN ĐỘ LUÂN CHUYỂN ĐỊA BÀN CỦA CBTD */}
        {isCreditOfficer ? (
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Tiến độ phụ trách địa bàn: <strong>{emp.assignedArea || 'Chưa phân công địa bàn'}</strong></span>
              </span>
              <span className="font-bold text-slate-700 tabular-nums">
                {areaInfo ? areaInfo.tenureText : tenureText} / {maxMonths} tháng
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isDue ? 'bg-rose-600' : isNear ? 'bg-amber-500' : 'bg-emerald-700'
                }`}
                style={{ width: `${areaPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                Ngày nhận địa bàn: <strong>{formatDateVN(emp.areaStartDate || effectiveStart)}</strong>
              </span>
              {isDue ? (
                <span className="font-bold text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <ShieldAlert className="w-3 h-3" />
                  Đến hạn luân chuyển địa bàn theo quy định NHNN
                </span>
              ) : isNear ? (
                <span className="font-bold text-amber-700 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Clock className="w-3 h-3" />
                  Sắp đến hạn luân chuyển (&lt; {warningMonths} tháng)
                </span>
              ) : (
                <span className="font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" />
                  Trong thời hạn an toàn
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Chức danh thuộc diện công tác theo nhiệm kỳ / phân công nội bộ của Quỹ.</span>
            </div>
            <span className="font-bold text-slate-800">Thâm niên vị trí: {tenureText}</span>
          </div>
        )}

        {/* TIMELINE MỐC QUÁ TRÌNH CÔNG TÁC CHI TIẾT */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Timeline Mốc Quá Trình Công Tác &amp; Quyết Định Điều Động
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              {empHistory.length} mốc quá trình
            </span>
          </div>

          {empHistory.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              Chưa có dữ liệu mốc quá trình công tác. Bấm nút "+ Thêm mốc công tác" để thiết lập lịch sử.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {empHistory.map((item) => (
                <div 
                  key={item.id} 
                  className={`relative p-3.5 rounded-xl border transition-all ${
                    item.isCurrent
                      ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-600/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Dot timeline */}
                  <div className={`absolute -left-6 top-4 w-2.5 h-2.5 rounded-full border-2 bg-white ${
                    item.isCurrent ? 'border-emerald-700 ring-2 ring-emerald-200' : 'border-slate-400'
                  }`} />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-xs">
                        {item.position || emp.position}
                      </span>
                      {item.isCurrent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white">
                          Hiện tại
                        </span>
                      )}
                      {item.transferType && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {item.transferType === 'LUAN_CHUYEN_DINH_KY' ? 'Luân chuyển định kỳ' : item.transferType}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-600 tabular-nums">
                        {formatDateVN(item.startDate || item.effectiveDate)} - {item.isCurrent ? 'Đến nay' : formatDateVN(item.endDate)}
                      </span>
                      {canManage && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPeriod(item);
                              setIsPeriodModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-800 rounded"
                            title="Sửa mốc"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePeriod(item.id, item.decisionNumber, item.position)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Xóa mốc"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 mt-1">
                    <div>
                      Phòng ban: <strong className="text-slate-800">{item.department || emp.department}</strong>
                    </div>
                    {item.workLocation && (
                      <div>
                        Nơi làm việc: <strong className="text-slate-800">{item.workLocation}</strong>
                      </div>
                    )}
                    {item.assignedArea && (
                      <div className="text-emerald-800 flex items-center gap-1 font-semibold">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Địa bàn: <strong>{item.assignedArea}</strong></span>
                      </div>
                    )}
                    {item.decisionNumber && (
                      <div>
                        Quyết định số: <strong className="text-slate-800">{item.decisionNumber}</strong>
                        {item.decisionDate && ` (Ký ngày ${formatDateVN(item.decisionDate)})`}
                      </div>
                    )}
                  </div>

                  {item.notes && (
                    <div className="text-[11px] text-slate-500 italic mt-1.5 pt-1.5 border-t border-slate-100">
                      Ghi chú: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CÁC MODAL THAO TÁC */}
      {/* ========================================================================= */}
      {isContractModalOpen && (
        <ContractFormModal
          isOpen={isContractModalOpen}
          onClose={() => {
            setIsContractModalOpen(false);
            setEditingContract(null);
          }}
          emp={emp}
          contract={editingContract}
        />
      )}

      {isAnnexModalOpen && (
        <ContractAnnexModal
          isOpen={isAnnexModalOpen}
          onClose={() => {
            setIsAnnexModalOpen(false);
            setEditingAnnex(null);
          }}
          emp={emp}
          contract={currentContract}
          annex={editingAnnex}
        />
      )}

      {isPeriodModalOpen && (
        <WorkHistoryPeriodModal
          isOpen={isPeriodModalOpen}
          onClose={() => {
            setIsPeriodModalOpen(false);
            setEditingPeriod(null);
          }}
          selectedEmp={emp}
          editingRecord={editingPeriod}
          emp={emp}
          record={editingPeriod}
          departments={departments}
          positions={positions}
          hrConfig={hrConfig}
        />
      )}
    </div>
  );
};

export default React.memo(EmployeeContractHistoryTab);

import React, { useRef, useState } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { Printer, FileSpreadsheet, FileText } from 'lucide-react';
import { formatDateVN } from '../../../lib/dateUtils';
import { calculatePositionTenure } from '../../../lib/evaluationUtils';
import { exportEmployeeProfileToDocx, exportEmployeeProfileToExcel } from '../../../lib/exportUtils';
import { useToast } from '../../../context/ToastContext';

/**
 * EmployeeA4PrintModal: Xem trước và In ấn Sơ yếu lý lịch trích ngang cán bộ chuẩn khổ A4
 * Hỗ trợ xuất trực tiếp sang file Microsoft Word (.docx) và Excel (.xlsx)
 * Tuân thủ nghiêm ngặt: Không hiển thị UUID, không lộ mã kỹ thuật, không dùng font mono.
 */
const EmployeeA4PrintModal = ({
  isOpen,
  onClose,
  emp,
  workHistory = [],
  trainings = [],
  degrees = [],
  socials = [],
}) => {
  const toast = useToast();
  const printRef = useRef(null);
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  if (!emp) return null;

  const effectiveStart = emp.positionStartDate || emp.joinDate;
  const tenureText = calculatePositionTenure(effectiveStart);
  const totalTenureText = calculatePositionTenure(emp.joinDate);

  const empHistory = workHistory
    .filter((h) => h.employeeId === emp.id || h.employeeCode === emp.code)
    .sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      const dateA = a.startDate || a.effectiveDate || '';
      const dateB = b.startDate || b.effectiveDate || '';
      return dateB.localeCompare(dateA);
    });

  const empDegrees = degrees
    .filter((d) => d.employeeId === emp.id || d.employeeUuid === emp.id)
    .sort((a, b) => {
      if (a.isHighest && !b.isHighest) return -1;
      if (!a.isHighest && b.isHighest) return 1;
      const yearA = Number(a.graduationYear) || 0;
      const yearB = Number(b.graduationYear) || 0;
      return yearB - yearA;
    });

  const empSocials = socials.filter(
    (s) => s.employeeId === emp.id || s.employeeUuid === emp.id
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = async () => {
    try {
      setExportingWord(true);
      await exportEmployeeProfileToDocx(emp, workHistory, trainings, degrees, socials);
      toast?.showSuccess?.('Đã xuất file Word (.docx) thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xuất file Word');
    } finally {
      setExportingWord(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await exportEmployeeProfileToExcel(emp, workHistory, trainings, degrees, socials);
      toast?.showSuccess?.('Đã xuất file Excel (.xlsx) thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xuất file Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trích Ngang Sơ Yếu Lý Lịch (Khổ A4)"
      subtitle={`Cán bộ: ${emp.name} • Mẫu 2C/TCTD`}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2 w-full">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <button
            type="button"
            onClick={handleExportWord}
            disabled={exportingWord}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-blue-700" />
            <span>{exportingWord ? 'Đang tạo Word...' : 'Xuất Word (.docx)'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>{exportingExcel ? 'Đang tạo Excel...' : 'Xuất Excel (.xlsx)'}</span>
          </button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            <span>In ấn / Xuất PDF</span>
          </Button>
        </div>
      }
    >
      <div 
        ref={printRef}
        className="p-6 sm:p-10 bg-white border border-slate-200 rounded-xl text-slate-900 space-y-6 text-sm print:border-0 print:p-0 print:m-0"
      >
        {/* Quốc hiệu & Tiêu ngữ */}
        <div className="grid grid-cols-2 text-center pb-4 border-b-2 border-slate-900">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider">
              QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5">Số: ....../TCTD-YT</p>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </h4>
            <p className="text-xs font-bold underline decoration-slate-800 underline-offset-4 mt-0.5">
              Độc lập - Tự do - Hạnh phúc
            </p>
          </div>
        </div>

        {/* Tiêu đề văn bản */}
        <div className="text-center space-y-1">
          <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">
            SƠ YẾU LÝ LỊCH TRÍCH NGANG CÁN BỘ
          </h2>
          <p className="text-xs italic text-slate-600">
            (Mẫu 2C/TCTD - Quỹ Tín Dụng Nhân Dân)
          </p>
        </div>

        {/* Khung Thông tin chi tiết */}
        <div className="space-y-4 text-xs leading-relaxed">
          {/* 1. Thông tin cá nhân */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[11px] bg-slate-100 p-1.5 rounded-sm">
              I. THÔNG TIN CÁ NHÂN &amp; ĐỊA BÀN CƯ TRÚ
            </h3>
            <div className="grid grid-cols-2 gap-y-2 pt-2 px-2">
              <p>1. Họ và tên khai sinh: <span className="font-bold uppercase">{emp.name}</span></p>
              <p>2. Giới tính: <span>{emp.gender || 'Nam'}</span></p>
              <p>3. Ngày sinh: <span>{emp.birthDate ? formatDateVN(emp.birthDate) : '—'}</span></p>
              <p>4. Số CCCD: <span className="font-bold tabular-nums">{emp.cccd || '—'}</span></p>
              <p>5. Số điện thoại: <span className="font-bold tabular-nums">{emp.phone || '—'}{emp.secondaryPhone ? ` • ${emp.secondaryPhone}` : ''}</span></p>
              <p>6. Hộp thư điện tử (Email): <span>{emp.email || '—'}</span></p>
              <p className="col-span-2">
                7. Kênh mạng xã hội / Liên hệ số: <span>{empSocials.length > 0 ? empSocials.map(s => `${s.platform}: ${s.accountName || s.username}`).join(' • ') : 'Chưa cập nhật'}</span>
              </p>
            </div>
          </div>

          {/* 2. Công tác & Vị trí đảm nhiệm */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[11px] bg-slate-100 p-1.5 rounded-sm">
              II. QUÁ TRÌNH CÔNG TÁC &amp; VỊ TRÍ ĐẢM NHIỆM
            </h3>
            <div className="grid grid-cols-2 gap-y-2 pt-2 px-2">
              <p>1. Phòng ban công tác: <span className="font-bold">{emp.department}</span></p>
              <p>2. Chức danh hiện tại: <span className="font-bold">{emp.position}</span></p>
              <p>3. Ngày đảm nhiệm chức vụ: <span>{effectiveStart ? formatDateVN(effectiveStart) : '—'}</span></p>
              <p>4. Thâm niên chức vụ: <span className="font-bold">{tenureText}</span></p>
              <p>5. Ngày vào Quỹ: <span>{emp.joinDate ? formatDateVN(emp.joinDate) : '—'}</span></p>
              <p>6. Tổng thâm niên: <span>{totalTenureText}</span></p>
              <p>7. Loại hợp đồng: <span>{emp.contractType || 'Không xác định thời hạn'}</span></p>
              <p>8. Trạng thái: <span>{emp.status === 'ACTIVE' ? 'Đang công tác' : 'Nghỉ việc'}</span></p>
              <p className="col-span-2">9. Địa bàn phụ trách tín dụng: <span>{emp.assignedArea || 'Chưa phân công địa bàn'}</span></p>
            </div>

            {empHistory.length > 0 && (
              <div className="mt-2.5 px-2">
                <p className="font-bold text-[11px] text-slate-800 mb-1">Bảng chi tiết các mốc quá trình công tác (Timeline):</p>
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="border border-slate-300 p-1 text-center w-7">STT</th>
                      <th className="border border-slate-300 p-1 text-center w-28">Thời gian</th>
                      <th className="border border-slate-300 p-1 text-left">Chức danh đảm nhiệm</th>
                      <th className="border border-slate-300 p-1 text-left">Phòng ban</th>
                      <th className="border border-slate-300 p-1 text-left">Địa bàn quản lý</th>
                      <th className="border border-slate-300 p-1 text-center w-20">Số QĐ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empHistory.map((item, idx) => {
                      const startText = item.startDate ? formatDateVN(item.startDate) : (item.effectiveDate ? formatDateVN(item.effectiveDate) : '—');
                      const endText = item.isCurrent ? 'Đến nay' : (item.endDate ? formatDateVN(item.endDate) : '—');
                      return (
                        <tr key={item.id || idx}>
                          <td className="border border-slate-300 p-1 text-center tabular-nums">{idx + 1}</td>
                          <td className="border border-slate-300 p-1 text-center tabular-nums">{startText} - {endText}</td>
                          <td className="border border-slate-300 p-1 font-semibold">{item.position || item.toPosition || emp.position}</td>
                          <td className="border border-slate-300 p-1">{item.department || item.toDepartment || emp.department}</td>
                          <td className="border border-slate-300 p-1">{item.assignedArea || item.toAssignedArea || '—'}</td>
                          <td className="border border-slate-300 p-1 text-center">{item.decisionNumber || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. Chính trị & Đảng viên */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[11px] bg-slate-100 p-1.5 rounded-sm">
              III. THÔNG TIN CHÍNH TRỊ &amp; ĐẢNG - ĐOÀN THỂ
            </h3>
            <div className="grid grid-cols-2 gap-y-2 pt-2 px-2">
              <p>1. Đảng viên ĐCSVN: <span className="font-bold">{emp.partyMember ? 'Đảng viên chính thức' : 'Chưa kết nạp'}</span></p>
              <p>2. Chức vụ Chi bộ: <span>{emp.politicalRole || '—'}</span></p>
              <p>3. Ngày vào Đảng dự bị: <span>{emp.partyDate ? formatDateVN(emp.partyDate) : '—'}</span></p>
              <p>4. Ngày chính thức: <span>{emp.partyOfficialDate ? formatDateVN(emp.partyOfficialDate) : '—'}</span></p>
            </div>
          </div>

          {/* 4. Trình độ chuyên môn */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[11px] bg-slate-100 p-1.5 rounded-sm">
              IV. TRÌNH ĐỘ HỌC VẤN &amp; VĂN BẰNG CHUYÊN MÔN
            </h3>
            <div className="grid grid-cols-2 gap-y-2 pt-2 px-2">
              <p className="col-span-2">1. Trình độ chuyên môn / Học vị: <span className="font-bold">{emp.education || 'Chờ bổ sung'}</span></p>
              <p>2. Trình độ Tin học: <span>{emp.itLevel || 'Ứng dụng CNTT cơ bản'}</span></p>
              <p>3. Trình độ Ngoại ngữ: <span>{emp.foreignLanguage || 'Tiếng Anh'}</span></p>
              <p>4. Lý luận chính trị: <span>Sơ cấp / Trung cấp</span></p>
              <p>5. Quản lý nhà nước: <span>Đã hoàn thành bồi dưỡng</span></p>
            </div>

            {empDegrees.length > 0 && (
              <div className="mt-2.5 px-2">
                <p className="font-bold text-[11px] text-slate-800 mb-1">Bảng chi tiết các văn bằng chuyên môn:</p>
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="border border-slate-300 p-1 text-center w-7">STT</th>
                      <th className="border border-slate-300 p-1 text-center w-20">Cấp bậc</th>
                      <th className="border border-slate-300 p-1 text-left">Chuyên ngành đào tạo</th>
                      <th className="border border-slate-300 p-1 text-left">Cơ sở / Trường đào tạo</th>
                      <th className="border border-slate-300 p-1 text-center w-20">Hình thức</th>
                      <th className="border border-slate-300 p-1 text-center w-14">Năm TN</th>
                      <th className="border border-slate-300 p-1 text-center w-16">Xếp loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empDegrees.map((deg, idx) => (
                      <tr key={deg.id || idx}>
                        <td className="border border-slate-300 p-1 text-center tabular-nums">{idx + 1}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold">{deg.degreeLevel || 'Đại học'}</td>
                        <td className="border border-slate-300 p-1 font-semibold">{deg.major}</td>
                        <td className="border border-slate-300 p-1">{deg.institution}</td>
                        <td className="border border-slate-300 p-1 text-center">{deg.trainingType || 'Chính quy'}</td>
                        <td className="border border-slate-300 p-1 text-center tabular-nums">{deg.graduationYear || '—'}</td>
                        <td className="border border-slate-300 p-1 text-center">{deg.classification || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Khối Ký tên xác nhận */}
        <div className="grid grid-cols-3 text-center pt-8 text-xs gap-4">
          <div>
            <p className="font-bold uppercase">NGƯỜI KHAI</p>
            <p className="text-[11px] italic text-slate-500">(Ký và ghi rõ họ tên)</p>
            <div className="h-16" />
            <p className="font-bold">{emp.name}</p>
          </div>
          <div>
            <p className="font-bold uppercase">TRƯỞNG BAN KIỂM SOÁT</p>
            <p className="text-[11px] italic text-slate-500">(Xác nhận thẩm tra)</p>
            <div className="h-16" />
            <p className="font-bold">Bùi Thị Thảo</p>
          </div>
          <div>
            <p className="font-bold uppercase">CHỦ TỊCH HỘI ĐỒNG QUẢN TRỊ</p>
            <p className="text-[11px] italic text-slate-500">(Ký tên và đóng dấu)</p>
            <div className="h-16" />
            <p className="font-bold">Trịnh Đức Anh</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(EmployeeA4PrintModal);

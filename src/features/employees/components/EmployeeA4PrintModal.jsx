import React, { useRef } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { Printer, Download } from 'lucide-react';
import { formatDateVN } from '../../../lib/dateUtils';
import { calculatePositionTenure } from '../../../lib/evaluationUtils';

/**
 * EmployeeA4PrintModal: Xem trước và In ấn Sơ yếu lý lịch trích ngang cán bộ chuẩn khổ A4
 * Phù hợp mẫu 2C/TCTD và biểu mẫu báo cáo Ngân hàng Nhà nước
 */
const EmployeeA4PrintModal = ({
  isOpen,
  onClose,
  emp,
}) => {
  const printRef = useRef(null);

  if (!emp) return null;

  const effectiveStart = emp.positionStartDate || emp.joinDate;
  const tenureText = calculatePositionTenure(effectiveStart);
  const totalTenureText = calculatePositionTenure(emp.joinDate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bản In Trích Ngang Sơ Yếu Lý Lịch (Khổ A4)"
      subtitle={`Cán bộ: ${emp.name} (${emp.code}) • Mẫu 2C/TCTD Ngân hàng Nhà nước`}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            <span>In ấn / Xuất PDF</span>
          </Button>
        </div>
      }
    >
      <div 
        ref={printRef}
        className="p-6 sm:p-10 bg-white border border-slate-200 rounded-xl font-serif text-slate-900 space-y-6 text-sm print:border-0 print:p-0 print:m-0"
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
            (Lưu hành nội bộ &amp; Báo cáo cơ quan Quản lý Nhà nước)
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
              <p>1. Họ và tên: <span className="font-bold uppercase">{emp.name}</span></p>
              <p>2. Mã cán bộ: <span className="font-bold font-mono">{emp.code}</span></p>
              <p>3. Giới tính: <span>{emp.gender || 'Nam'}</span></p>
              <p>4. Ngày sinh: <span>{emp.birthDate ? formatDateVN(emp.birthDate) : '—'}</span></p>
              <p>5. Số CCCD: <span className="font-mono font-bold">{emp.cccd || '—'}</span></p>
              <p>6. Số điện thoại: <span className="font-mono">{emp.phone || '—'}</span></p>
              <p className="col-span-2">7. Hộp thư điện tử (Email): <span>{emp.email || '—'}</span></p>
              <p className="col-span-2">8. Mã định danh UUID: <span className="font-mono text-[11px]">{emp.uuid || emp.id}</span></p>
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
          </div>

          {/* 3. Chính trị & Đảng viên */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[11px] bg-slate-100 p-1.5 rounded-sm">
              III. THÔNG TIN CHÍNH TRỊ &amp; ĐẢNG - ĐOÀN THỂ
            </h3>
            <div className="grid grid-cols-2 gap-y-2 pt-2 px-2">
              <p>1. Đảng viên ĐCSVN: <span className="font-bold">{emp.partyMember ? 'Đảng viên chính thức' : 'Chưa kết nạp'}</span></p>
              <p>2. Chức vụ Chi bộ: <span>{emp.politicalRole || '—'}</span></p>
              <p>3. Ngày vào Đảng: <span>{emp.partyDate ? formatDateVN(emp.partyDate) : '—'}</span></p>
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
              <p>2. Lý luận chính trị: <span>Sơ cấp / Trung cấp</span></p>
              <p>3. Quản lý nhà nước: <span>Đã hoàn thành</span></p>
            </div>
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

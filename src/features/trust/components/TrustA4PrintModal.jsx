import React, { useState } from 'react';
import { 
  Printer, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Download,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { 
  exportToExcel, 
  exportToWord, 
  exportToPdfFromElement, 
  exportToPng 
} from '../../../lib/exportUtils';

/**
 * TrustA4PrintModal: Mẫu in & xuất biên bản tổng hợp lấy phiếu tín nhiệm chuẩn A4
 * - Đầy đủ 4 định dạng: In trực tiếp, Xuất PDF (chống vỡ font tiếng Việt), Xuất Word (.docx), Xuất Excel (.xlsx), Tải ảnh (.png)
 * - Đúng chuẩn văn bản hành chính Quỹ tín dụng nhân dân Yên Thọ
 * - Khối 3 chữ ký: Trưởng Ban Kiểm Soát, Giám Đốc Điều Hành, Chủ Tịch HĐQT
 */
const TrustA4PrintModal = ({
  isOpen,
  onClose,
  currentPeriod,
  leaderboard = [],
}) => {
  const [exportingType, setExportingType] = useState(null); // 'pdf' | 'word' | 'excel' | 'png' | null
  const [successMsg, setSuccessMsg] = useState('');

  const isAnonymous = currentPeriod?.votingMode === 'ANONYMOUS' || currentPeriod?.votingMode === 'ANONYMOUS_ONLY';
  const periodNameClean = currentPeriod?.name?.replace(/\s+/g, '_') || 'Ky';

  const notifySuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // 1. Xuất PDF chuẩn A4 (100% không bao giờ lỗi font tiếng Việt)
  const handleExportPdf = async () => {
    setExportingType('pdf');
    try {
      await exportToPdfFromElement('trust-a4-document-container', {
        filename: `Bien_Ban_Tin_Nhiem_${periodNameClean}.pdf`,
        orientation: 'portrait',
        scale: 2,
      });
      notifySuccess('Đã xuất file PDF thành công!');
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      alert('Có lỗi khi tạo file PDF: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  // 2. Xuất Microsoft Word (.docx) chuẩn thể thức hành chính
  const handleExportWord = async () => {
    setExportingType('word');
    try {
      const headers = ['STT', 'Họ và tên cán bộ', 'Chức vụ', 'Phòng ban', 'Điểm TB (10)', 'Điểm (100)', 'Xếp loại'];
      const rows = leaderboard.map((item, idx) => [
        idx + 1,
        item.name || '',
        item.position || 'Cán bộ',
        item.department || '',
        item.avgScore10 || item.avgScore || 0,
        `${item.avgScore100 || (Number(item.avgScore || 0) * 10).toFixed(0)} đ`,
        item.classification?.label || item.classification || 'Hoàn thành',
      ]);

      await exportToWord({
        filename: `Bien_Ban_Tin_Nhiem_${periodNameClean}.docx`,
        title: 'BIÊN BẢN TỔNG HỢP KẾT QUẢ LẤY PHIẾU TÍN NHIỆM',
        subtitle: `Kỳ: ${currentPeriod?.name || ''} (Hình thức: ${isAnonymous ? 'Bỏ phiếu kín 100%' : 'Công khai'})`,
        docCode: 'Số: ..... /BB-QTDYT',
        headers,
        rows,
        signatures: [
          { title: 'TRƯỞNG BAN KIỂM SOÁT', subtitle: '(Ký và ghi rõ họ tên)' },
          { title: 'GIÁM ĐỐC ĐIỀU HÀNH', subtitle: '(Ký và ghi rõ họ tên)' },
          { title: 'CHỦ TỊCH HĐQT', subtitle: '(Ký, đóng dấu, ghi rõ họ tên)' },
        ],
      });
      notifySuccess('Đã xuất file Word (.docx) thành công!');
    } catch (err) {
      console.error('Lỗi xuất Word:', err);
      alert('Có lỗi khi tạo file Word: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  // 3. Xuất Microsoft Excel (.xlsx) thực thụ
  const handleExportExcel = async () => {
    setExportingType('excel');
    try {
      const headers = ['STT', 'Họ và tên cán bộ', 'Chức danh', 'Phòng ban', 'Số phiếu nhận', 'Điểm TB (10)', 'Điểm (100)', 'Xếp loại', 'Ghi chú khống chế'];
      const rows = leaderboard.map((item, idx) => [
        idx + 1,
        item.name || '',
        item.position || 'Cán bộ',
        item.department || '',
        item.evaluationsCount || 0,
        item.avgScore10 || item.avgScore || 0,
        item.avgScore100 || 0,
        item.classification?.label || item.classification || 'Hoàn thành',
        item.classification?.downgradeReason || '',
      ]);

      await exportToExcel({
        filename: `Ket_Qua_Tin_Nhiem_${periodNameClean}.xlsx`,
        sheetName: 'Kết quả tín nhiệm',
        title: 'BIÊN BẢN TỔNG HỢP KẾT QUẢ LẤY PHIẾU TÍN NHIỆM',
        subtitle: `Kỳ: ${currentPeriod?.name || ''} - Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`,
        headers,
        rows,
      });
      notifySuccess('Đã xuất file Excel (.xlsx) thành công!');
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      alert('Có lỗi khi tạo file Excel: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  // 4. Xuất ảnh PNG độ nét cao
  const handleExportPng = async () => {
    setExportingType('png');
    try {
      await exportToPng('trust-a4-document-container', {
        filename: `Bien_Ban_Tin_Nhiem_${periodNameClean}.png`,
        scale: 2,
      });
      notifySuccess('Đã xuất ảnh PNG thành công!');
    } catch (err) {
      console.error('Lỗi xuất ảnh PNG:', err);
      alert('Có lỗi khi tạo ảnh PNG: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Biên Bản Tổng Hợp Lấy Phiếu Tín Nhiệm (Khổ A4)"
      subtitle="Định dạng văn bản hành chính Quỹ Tín Dụng Nhân Dân Yên Thọ"
      maxWidth="max-w-5xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
            {successMsg && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{successMsg}</span>
              </span>
            )}
          </div>

          {/* Thanh công cụ xuất đa định dạng */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Xuất Excel (.xlsx) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={exportingType === 'excel' ? Loader2 : FileSpreadsheet}
              isLoading={exportingType === 'excel'}
              onClick={handleExportExcel}
              className="text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              title="Xuất bảng tính Microsoft Excel (.xlsx)"
            >
              Excel (.xlsx)
            </Button>

            {/* Xuất Word (.docx) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={exportingType === 'word' ? Loader2 : FileText}
              isLoading={exportingType === 'word'}
              onClick={handleExportWord}
              className="text-xs font-bold border-blue-300 text-blue-800 hover:bg-blue-50"
              title="Xuất văn bản Microsoft Word (.docx)"
            >
              Word (.docx)
            </Button>

            {/* Xuất PDF (.pdf) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={exportingType === 'pdf' ? Loader2 : Download}
              isLoading={exportingType === 'pdf'}
              onClick={handleExportPdf}
              className="text-xs font-bold border-rose-300 text-rose-800 hover:bg-rose-50"
              title="Xuất tài liệu PDF chuẩn in A4 không vỡ font tiếng Việt"
            >
              PDF (.pdf)
            </Button>

            {/* Tải ảnh PNG */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={exportingType === 'png' ? Loader2 : ImageIcon}
              isLoading={exportingType === 'png'}
              onClick={handleExportPng}
              className="text-xs font-bold border-purple-300 text-purple-800 hover:bg-purple-50"
              title="Tải ảnh PNG sắc nét phục vụ chia sẻ"
            >
              Ảnh PNG
            </Button>

            {/* In trực tiếp */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Printer}
              onClick={() => window.print()}
              className="text-xs font-bold bg-[#0f766e] hover:bg-[#0d625b] text-white shadow-sm"
              title="In trực tiếp qua máy in hoặc hộp thoại trình duyệt"
            >
              In ngay (Ctrl+P)
            </Button>
          </div>
        </div>
      }
    >
      {/* Vùng in A4 có ID phục vụ xuất PDF & PNG chuẩn xác 100% */}
      <div 
        id="trust-a4-document-container"
        className="p-8 sm:p-10 bg-white text-slate-900 space-y-6 font-serif border border-slate-200 rounded-xl shadow-xs print:m-0 print:border-none print:shadow-none print:p-0"
      >
        {/* Header Quốc hiệu & Đơn vị chuẩn thể thức văn bản hành chính */}
        <div className="flex justify-between text-center pb-4 border-b border-slate-300">
          <div className="text-left sm:text-center">
            <div className="text-xs uppercase font-bold text-slate-900">QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</div>
            <div className="text-[10px] text-slate-600">Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa</div>
            <div className="text-[10px] font-bold mt-1 text-slate-800">Số: ..... /BB-QTDYT</div>
          </div>
          <div className="text-right sm:text-center">
            <div className="text-xs font-bold uppercase text-slate-900">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="text-[10px] font-bold italic underline text-slate-800">Độc lập - Tự do - Hạnh phúc</div>
            <div className="text-[10px] text-slate-600 italic mt-1">
              Quý Lộc, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
            </div>
          </div>
        </div>

        {/* Tiêu đề biên bản */}
        <div className="text-center space-y-1.5 pt-2">
          <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-950">
            BIÊN BẢN TỔNG HỢP KẾT QUẢ LẤY PHIẾU TÍN NHIỆM
          </h3>
          <p className="text-xs italic text-slate-600">
            Kỳ: <strong>{currentPeriod?.name}</strong> (Hình thức: {isAnonymous ? 'Bỏ phiếu kín 100%' : 'Công khai'})
          </p>
        </div>

        {/* Bảng điểm khổ A4 kẻ ô chuẩn mực */}
        <table className="w-full text-left text-[11px] border-collapse border border-slate-400">
          <thead>
            <tr className="bg-slate-100 text-center font-bold text-slate-800">
              <th className="border border-slate-400 p-2 w-10">STT</th>
              <th className="border border-slate-400 p-2">Họ và tên cán bộ</th>
              <th className="border border-slate-400 p-2">Chức vụ</th>
              <th className="border border-slate-400 p-2">Phòng ban</th>
              <th className="border border-slate-400 p-2 w-20">Điểm TB (10)</th>
              <th className="border border-slate-400 p-2 w-20">Điểm (100)</th>
              <th className="border border-slate-400 p-2 w-28">Xếp loại</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-slate-400 p-4 text-center text-slate-400">
                  Chưa có dữ liệu tổng hợp
                </td>
              </tr>
            ) : (
              leaderboard.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="border border-slate-400 p-2 text-center font-semibold">{idx + 1}</td>
                  <td className="border border-slate-400 p-2 font-bold text-slate-900">{item.name}</td>
                  <td className="border border-slate-400 p-2 text-slate-700">{item.position || 'Cán bộ'}</td>
                  <td className="border border-slate-400 p-2 text-slate-700">{item.department || ''}</td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-[#0f766e]">
                    {item.avgScore10 || item.avgScore || 0}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-slate-900">
                    {item.avgScore100 || (Number(item.avgScore || 0) * 10).toFixed(0)} đ
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-medium">
                    <div>{item.classification?.label || item.classification}</div>
                    {item.classification?.downgradeReason && (
                      <div className="text-[9px] text-amber-800 italic">
                        ({item.classification.downgradeReason})
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Khối chữ ký 3 bên chuẩn hành chính QTDND */}
        <div className="grid grid-cols-3 text-center pt-8 text-xs font-bold gap-4 text-slate-900">
          <div>
            <span>TRƯỞNG BAN KIỂM SOÁT</span>
            <div className="h-16"></div>
            <span className="italic font-normal text-slate-600 text-[11px]">(Ký và ghi rõ họ tên)</span>
          </div>
          <div>
            <span>GIÁM ĐỐC ĐIỀU HÀNH</span>
            <div className="h-16"></div>
            <span className="italic font-normal text-slate-600 text-[11px]">(Ký và ghi rõ họ tên)</span>
          </div>
          <div>
            <span>CHỦ TỊCH HỘI ĐỒNG QUẢN TRỊ</span>
            <div className="h-16"></div>
            <span className="italic font-normal text-slate-600 text-[11px]">(Ký, đóng dấu, ghi rõ họ tên)</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(TrustA4PrintModal);

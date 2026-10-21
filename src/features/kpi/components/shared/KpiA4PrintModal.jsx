import React, { useState } from 'react';
import { 
  Printer, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Download,
  Loader2,
  CheckCircle2,
  User,
  Users
} from 'lucide-react';
import Modal from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { 
  exportToExcel, 
  exportToWord, 
  exportToPdfFromElement, 
  exportToPng 
} from '../../../../lib/exportUtils';
import { getKpiClassification } from '../../services/kpiService';

/**
 * KpiA4PrintModal: Mẫu in & xuất phiếu đánh giá KPI chuẩn A4
 * - Mẫu 1: Phiếu Đánh Giá Cá Nhân (CBNV, bảng điểm từng tiêu chí, nhận xét, 3 chữ ký)
 * - Mẫu 2: Bảng Tổng Hợp Kết Quả Thi Đua Toàn Quỹ
 * - Đầy đủ 5 tùy chọn: In trực tiếp, Xuất PDF (chống vỡ font), Xuất Word (.docx), Xuất Excel (.xlsx), Tải ảnh (.png)
 */
const KpiA4PrintModal = ({
  isOpen,
  onClose,
  mode = 'PERSONAL', // 'PERSONAL' | 'FUND_SUMMARY'
  personalData = null,
  fundList = [],
  period = '',
  criteriaList = []
}) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [exportingType, setExportingType] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Cập nhật chế độ khi props thay đổi
  React.useEffect(() => {
    if (mode) setCurrentMode(mode);
  }, [mode]);

  const notifySuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const periodNameClean = period?.replace(/[\s/]+/g, '_') || 'Ky';

  // 1. Xuất PDF khổ A4
  const handleExportPdf = async () => {
    setExportingType('pdf');
    try {
      const elementId = currentMode === 'PERSONAL' ? 'kpi-a4-personal-document' : 'kpi-a4-fund-document';
      const filename = currentMode === 'PERSONAL'
        ? `Phieu_Danh_Gia_KPI_${personalData?.employeeName?.replace(/\s+/g, '_') || 'CBNV'}_${periodNameClean}.pdf`
        : `Bang_Tong_Hop_KPI_${periodNameClean}.pdf`;

      await exportToPdfFromElement(elementId, {
        filename,
        orientation: currentMode === 'PERSONAL' ? 'portrait' : 'landscape',
        scale: 2,
      });
      notifySuccess('Đã xuất file PDF chuẩn A4 thành công!');
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      alert('Có lỗi khi tạo file PDF: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  // 2. Xuất Microsoft Word (.docx)
  const handleExportWord = async () => {
    setExportingType('word');
    try {
      if (currentMode === 'PERSONAL') {
        const headers = ['STT', 'Tiêu chí đánh giá', 'Tối đa', 'Cán bộ chấm', 'Thẩm định', 'HĐQT duyệt', 'Ghi chú'];
        const snapshotCriteria = personalData?.criteriaSnapshot || criteriaList || [];
        const rows = snapshotCriteria.map((crit, idx) => {
          const selfScore = personalData?.selfCriteriaScores?.[crit.id]?.score ?? '—';
          const managerScore = personalData?.managerCriteriaScores?.[crit.id]?.score ?? '—';
          const chairmanScore = personalData?.chairmanCriteriaScores?.[crit.id]?.score ?? '—';
          const note = personalData?.selfCriteriaScores?.[crit.id]?.note || '';
          return [
            idx + 1,
            crit.name,
            crit.maxScore || 10,
            selfScore,
            managerScore,
            chairmanScore,
            note
          ];
        });

        await exportToWord({
          filename: `Phieu_Danh_Gia_KPI_${personalData?.employeeName?.replace(/\s+/g, '_') || 'CBNV'}_${periodNameClean}.docx`,
          title: 'PHIẾU ĐÁNH GIÁ KẾT QUẢ CÔNG TÁC & KPI CÁ NHÂN',
          subtitle: `Họ tên: ${personalData?.employeeName || 'CBNV'} | Chức vụ: ${personalData?.position || ''} | Phòng ban: ${personalData?.department || ''} | Kỳ: ${period}`,
          docCode: 'Số: ..... /PĐG-KPI',
          headers,
          rows,
          signatures: [
            { title: 'CÁN BỘ TỰ CHẤM', subtitle: '(Ký và ghi rõ họ tên)' },
            { title: 'TRƯỞNG BỘ PHẬN THẨM ĐỊNH', subtitle: '(Ký và ghi rõ họ tên)' },
            { title: 'CHỦ TỊCH HĐQT PHÊ CHUẨN', subtitle: '(Ký, đóng dấu, ghi rõ họ tên)' },
          ],
        });
      } else {
        const headers = ['STT', 'Họ và tên cán bộ', 'Chức vụ', 'Phòng ban', 'Tự chấm (40%)', 'Thẩm định (30%)', 'HĐQT (30%)', 'Tổng điểm', 'Xếp loại'];
        const rows = fundList.map((item, idx) => {
          const cls = item.classification || getKpiClassification(item.finalScore || 0);
          return [
            idx + 1,
            item.employeeName || '',
            item.position || '',
            item.department || '',
            item.scoreSelf !== undefined ? `${item.scoreSelf} đ` : '—',
            item.scoreManager !== undefined ? `${item.scoreManager} đ` : '—',
            item.scoreChairman !== undefined ? `${item.scoreChairman} đ` : '—',
            item.finalScore !== undefined ? `${item.finalScore} đ` : '—',
            cls?.label || 'Chưa hoàn thành',
          ];
        });

        await exportToWord({
          filename: `Bang_Tong_Hop_KPI_${periodNameClean}.docx`,
          title: 'BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ THI ĐUA KPI TOÀN QUỸ',
          subtitle: `Kỳ đánh giá: ${period}`,
          docCode: 'Số: ..... /BB-QTDYT',
          headers,
          rows,
          signatures: [
            { title: 'NGƯỜI LẬP BIỂU', subtitle: '(Ký và ghi rõ họ tên)' },
            { title: 'GIÁM ĐỐC ĐIỀU HÀNH', subtitle: '(Ký và ghi rõ họ tên)' },
            { title: 'CHỦ TỊCH HĐQT', subtitle: '(Ký, đóng dấu, ghi rõ họ tên)' },
          ],
        });
      }
      notifySuccess('Đã xuất file Word (.docx) thành công!');
    } catch (err) {
      console.error('Lỗi xuất Word:', err);
      alert('Có lỗi khi tạo file Word: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  // 3. Xuất Microsoft Excel (.xlsx)
  const handleExportExcel = async () => {
    setExportingType('excel');
    try {
      if (currentMode === 'PERSONAL') {
        const headers = ['STT', 'Tiêu chí đánh giá', 'Nhóm tiêu chí', 'Điểm tối đa', 'Cán bộ chấm', 'Thẩm định', 'HĐQT duyệt', 'Ghi chú / Giải trình'];
        const snapshotCriteria = personalData?.criteriaSnapshot || criteriaList || [];
        const rows = snapshotCriteria.map((crit, idx) => [
          idx + 1,
          crit.name,
          crit.groupName || crit.group || '',
          crit.maxScore || 10,
          personalData?.selfCriteriaScores?.[crit.id]?.score ?? '',
          personalData?.managerCriteriaScores?.[crit.id]?.score ?? '',
          personalData?.chairmanCriteriaScores?.[crit.id]?.score ?? '',
          personalData?.selfCriteriaScores?.[crit.id]?.note || '',
        ]);

        await exportToExcel({
          filename: `Phieu_Danh_Gia_KPI_${personalData?.employeeName?.replace(/\s+/g, '_') || 'CBNV'}_${periodNameClean}.xlsx`,
          sheetName: 'Phieu_KPI_Ca_Nhan',
          headers,
          rows,
        });
      } else {
        const headers = ['STT', 'Họ và tên cán bộ', 'Chức vụ', 'Phòng ban', 'Tự chấm (40%)', 'Thẩm định (30%)', 'HĐQT (30%)', 'Tổng điểm KPI', 'Xếp loại', 'Trạng thái'];
        const rows = fundList.map((item, idx) => {
          const cls = item.classification || getKpiClassification(item.finalScore || 0);
          return [
            idx + 1,
            item.employeeName || '',
            item.position || '',
            item.department || '',
            item.scoreSelf ?? '',
            item.scoreManager ?? '',
            item.scoreChairman ?? '',
            item.finalScore ?? '',
            cls?.label || 'Chưa hoàn thành',
            item.status || '',
          ];
        });

        await exportToExcel({
          filename: `Bang_Tong_Hop_KPI_${periodNameClean}.xlsx`,
          sheetName: 'Tong_Hop_KPI_Toan_Quy',
          headers,
          rows,
        });
      }
      notifySuccess('Đã xuất file Excel (.xlsx) thành công!');
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      alert('Có lỗi khi tạo file Excel: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  // 4. Tải ảnh PNG
  const handleExportPng = async () => {
    setExportingType('png');
    try {
      const elementId = currentMode === 'PERSONAL' ? 'kpi-a4-personal-document' : 'kpi-a4-fund-document';
      const filename = currentMode === 'PERSONAL'
        ? `Phieu_KPI_${personalData?.employeeName?.replace(/\s+/g, '_') || 'CBNV'}_${periodNameClean}.png`
        : `Bang_KPI_${periodNameClean}.png`;

      await exportToPng(elementId, {
        filename,
        scale: 2,
      });
      notifySuccess('Đã xuất ảnh PNG sắc nét thành công!');
    } catch (err) {
      console.error('Lỗi xuất PNG:', err);
      alert('Có lỗi khi tạo ảnh PNG: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  // Tiêu chí áp dụng cho phiếu cá nhân
  const activeCriteria = personalData?.criteriaSnapshot || criteriaList || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mẫu In & Xuất Đánh Giá KPI (Khổ A4)"
      subtitle="Định dạng thể thức văn bản hành chính Quỹ Tín Dụng Nhân Dân Yên Thọ"
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

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Printer}
              onClick={() => window.print()}
              className="text-xs font-bold bg-[#0f766e] hover:bg-[#0d625b] text-white shadow-xs"
              title="In trực tiếp qua máy in hoặc hộp thoại trình duyệt"
            >
              In ngay (Ctrl+P)
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Nút chuyển đổi Mẫu biểu in nếu có cả 2 dữ liệu */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg max-w-fit border border-slate-200 print:hidden">
          <button
            type="button"
            onClick={() => setCurrentMode('PERSONAL')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              currentMode === 'PERSONAL'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mẫu 1: Phiếu Đánh Giá Cá Nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentMode('FUND_SUMMARY')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              currentMode === 'FUND_SUMMARY'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mẫu 2: Bảng Tổng Hợp Toàn Quỹ</span>
          </button>
        </div>

        {/* ----------------- MẪU 1: PHIẾU ĐÁNH GIÁ CÁ NHÂN ----------------- */}
        {currentMode === 'PERSONAL' && (
          <div className="overflow-x-auto -mx-4 sm:mx-0 p-1 sm:p-0">
            <div 
              id="kpi-a4-personal-document"
              style={{ fontFamily: '"Times New Roman", "Be Vietnam Pro", serif' }}
              className="min-w-[700px] p-8 sm:p-10 bg-white text-slate-900 space-y-5 font-serif border border-slate-200 rounded-xl shadow-xs print:min-w-0 print:m-0 print:border-none print:shadow-none print:p-0"
            >
              {/* Header Quốc hiệu & Đơn vị */}
              <div className="flex justify-between text-center pb-3 border-b border-slate-300">
                <div className="text-left sm:text-center">
                  <div className="text-xs uppercase font-bold text-slate-900">QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</div>
                  <div className="text-[10px] text-slate-600">Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa</div>
                  <div className="text-[10px] font-bold mt-1 text-slate-800">Số: ..... /PĐG-KPI</div>
                </div>
                <div className="text-right sm:text-center">
                  <div className="text-xs font-bold uppercase text-slate-900">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="text-[10px] font-bold italic underline text-slate-800">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-[10px] text-slate-600 italic mt-1">
                    Quý Lộc, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </div>
                </div>
              </div>

              {/* Tiêu đề phiếu */}
              <div className="text-center space-y-1 pt-1">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-950">
                  PHIẾU ĐÁNH GIÁ HIỆU QUẢ CÔNG TÁC & KPI CÁ NHÂN
                </h3>
                <p className="text-xs italic text-slate-600">
                  Kỳ đánh giá: <strong>{personalData?.period || period}</strong> (Quy chế đánh giá KPI 3 cấp 40% - 30% - 30%)
                </p>
              </div>

              {/* Thông tin Cán bộ */}
              <div className="text-xs grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-300 rounded-lg">
                <div>
                  <span className="font-bold text-slate-700">Họ và tên cán bộ: </span>
                  <span className="font-bold text-slate-950 uppercase">{personalData?.employeeName || '...........................................'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Chức vụ: </span>
                  <span className="text-slate-900">{personalData?.position || '...........................................'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Phòng ban công tác: </span>
                  <span className="text-slate-900">{personalData?.department || '...........................................'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Thời gian đánh giá: </span>
                  <span className="text-slate-900">{personalData?.period || period}</span>
                </div>
              </div>

              {/* Bảng chi tiết từng tiêu chí */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-800 mb-1.5">
                  I. BẢNG ĐIỂM CHI TIẾT THEO TIÊU CHÍ ĐÁNH GIÁ
                </h4>
                <table className="w-full text-left text-[11px] border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 text-center font-bold text-slate-800">
                      <th className="border border-slate-400 p-1.5 w-8">STT</th>
                      <th className="border border-slate-400 p-1.5">Nội dung tiêu chí đánh giá</th>
                      <th className="border border-slate-400 p-1.5 w-16">Tối đa</th>
                      <th className="border border-slate-400 p-1.5 w-20">Cán bộ tự chấm</th>
                      <th className="border border-slate-400 p-1.5 w-20">Thẩm định</th>
                      <th className="border border-slate-400 p-1.5 w-20">HĐQT duyệt</th>
                      <th className="border border-slate-400 p-1.5">Giải trình / Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCriteria.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-slate-400 p-3 text-center text-slate-400 italic">
                          Chưa có danh mục tiêu chí chi tiết cho chức danh này
                        </td>
                      </tr>
                    ) : (
                      activeCriteria.map((crit, idx) => {
                        const self = personalData?.selfCriteriaScores?.[crit.id]?.score ?? '—';
                        const mgr = personalData?.managerCriteriaScores?.[crit.id]?.score ?? '—';
                        const chm = personalData?.chairmanCriteriaScores?.[crit.id]?.score ?? '—';
                        const note = personalData?.selfCriteriaScores?.[crit.id]?.note || '';
                        return (
                          <tr key={crit.id || idx}>
                            <td className="border border-slate-400 p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-slate-400 p-1.5 font-medium">{crit.name}</td>
                            <td className="border border-slate-400 p-1.5 text-center font-semibold">{crit.maxScore || 10} đ</td>
                            <td className="border border-slate-400 p-1.5 text-center font-bold text-emerald-800">{self}</td>
                            <td className="border border-slate-400 p-1.5 text-center font-bold text-blue-800">{mgr}</td>
                            <td className="border border-slate-400 p-1.5 text-center font-bold text-purple-800">{chm}</td>
                            <td className="border border-slate-400 p-1.5 italic text-slate-600">{note}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bảng tổng kết 3 cấp */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-800 mb-1.5">
                  II. TỔNG HỢP ĐIỂM SỐ 3 CẤP & XẾP LOẠI THI ĐUA
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 border border-slate-300 rounded bg-slate-50">
                    <div className="text-[10px] text-slate-600 font-bold">1. TỰ CHẤM (40%)</div>
                    <div className="text-sm font-black text-emerald-800 mt-0.5">
                      {personalData?.scoreSelf ?? '—'} <span className="text-[10px] font-normal">điểm</span>
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Quy đổi: {personalData?.scoreSelf !== undefined ? (personalData.scoreSelf * 0.4).toFixed(1) : '—'}
                    </div>
                  </div>

                  <div className="p-2 border border-slate-300 rounded bg-slate-50">
                    <div className="text-[10px] text-slate-600 font-bold">2. THẨM ĐỊNH (30%)</div>
                    <div className="text-sm font-black text-blue-800 mt-0.5">
                      {personalData?.scoreManager ?? '—'} <span className="text-[10px] font-normal">điểm</span>
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Quy đổi: {personalData?.scoreManager !== undefined ? (personalData.scoreManager * 0.3).toFixed(1) : '—'}
                    </div>
                  </div>

                  <div className="p-2 border border-slate-300 rounded bg-slate-50">
                    <div className="text-[10px] text-slate-600 font-bold">3. PHÊ CHUẨN (30%)</div>
                    <div className="text-sm font-black text-purple-800 mt-0.5">
                      {personalData?.scoreChairman ?? '—'} <span className="text-[10px] font-normal">điểm</span>
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Quy đổi: {personalData?.scoreChairman !== undefined ? (personalData.scoreChairman * 0.3).toFixed(1) : '—'}
                    </div>
                  </div>

                  <div className="p-2 border-2 border-emerald-600 rounded bg-emerald-50">
                    <div className="text-[10px] text-emerald-800 font-black">TỔNG ĐIỂM KPI CHỐT</div>
                    <div className="text-base font-black text-emerald-950 mt-0.5">
                      {personalData?.finalScore ?? '—'} <span className="text-[10px] font-bold">/ 100</span>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-800">
                      {personalData?.classification?.label || getKpiClassification(personalData?.finalScore || 0).label}
                    </div>
                  </div>
                </div>
              </div>

              {/* Nhận xét & Đóng góp ý kiến */}
              <div className="text-xs space-y-2 pt-1">
                <div className="p-2.5 border border-slate-300 rounded bg-white">
                  <div className="font-bold text-slate-800 mb-0.5">Ý kiến nhận xét của Cấp thẩm định (Trưởng bộ phận):</div>
                  <div className="italic text-slate-700 min-h-[28px]">
                    {personalData?.managerNotes || 'Đồng ý với các tiêu chí tự chấm của cán bộ.'}
                  </div>
                </div>

                <div className="p-2.5 border border-slate-300 rounded bg-white">
                  <div className="font-bold text-slate-800 mb-0.5">Ý kiến chỉ đạo & Phê duyệt của Hội đồng Quản trị:</div>
                  <div className="italic text-slate-700 min-h-[28px]">
                    {personalData?.chairmanNotes || 'Phê chuẩn kết quả đánh giá theo đúng quy chế thi đua khen thưởng của Quỹ.'}
                  </div>
                </div>
              </div>

              {/* Khối 3 Chữ Ký */}
              <div className="grid grid-cols-3 text-center text-xs pt-4">
                <div>
                  <div className="font-bold uppercase text-slate-900">CÁN BỘ TỰ CHẤM</div>
                  <div className="text-[10px] italic text-slate-500">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-slate-950">{personalData?.employeeName || '................................'}</div>
                </div>
                <div>
                  <div className="font-bold uppercase text-slate-900">TRƯỞNG BỘ PHẬN</div>
                  <div className="text-[10px] italic text-slate-500">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-slate-950">{personalData?.managerName || '................................'}</div>
                </div>
                <div>
                  <div className="font-bold uppercase text-slate-900">CHỦ TỊCH HĐQT</div>
                  <div className="text-[10px] italic text-slate-500">(Ký, đóng dấu, ghi rõ họ tên)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-slate-950">{personalData?.chairmanName || 'Lê Bá Cường'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- MẪU 2: BẢNG TỔNG HỢP TOÀN QUỸ ----------------- */}
        {currentMode === 'FUND_SUMMARY' && (
          <div className="overflow-x-auto -mx-4 sm:mx-0 p-1 sm:p-0">
            <div 
              id="kpi-a4-fund-document"
              style={{ fontFamily: '"Times New Roman", "Be Vietnam Pro", serif' }}
              className="min-w-[800px] p-8 sm:p-10 bg-white text-slate-900 space-y-5 font-serif border border-slate-200 rounded-xl shadow-xs print:min-w-0 print:m-0 print:border-none print:shadow-none print:p-0"
            >
              {/* Header Quốc hiệu & Đơn vị */}
              <div className="flex justify-between text-center pb-3 border-b border-slate-300">
                <div className="text-left sm:text-center">
                  <div className="text-xs uppercase font-bold text-slate-900">QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</div>
                  <div className="text-[10px] text-slate-600">Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa</div>
                  <div className="text-[10px] font-bold mt-1 text-slate-800">Số: ..... /BC-KPI-QTDYT</div>
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
              <div className="text-center space-y-1 pt-1">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-950">
                  BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ THI ĐUA KPI TOÀN ĐƠN VỊ
                </h3>
                <p className="text-xs italic text-slate-600">
                  Kỳ đánh giá: <strong>{period}</strong> (Tổng hợp theo quy trình 3 cấp thẩm quyền)
                </p>
              </div>

              {/* Bảng dữ liệu toàn đơn vị */}
              <table className="w-full text-left text-[11px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-center font-bold text-slate-800">
                    <th className="border border-slate-400 p-1.5 w-8">STT</th>
                    <th className="border border-slate-400 p-1.5">Họ và tên cán bộ</th>
                    <th className="border border-slate-400 p-1.5">Chức vụ</th>
                    <th className="border border-slate-400 p-1.5">Phòng ban</th>
                    <th className="border border-slate-400 p-1.5 w-20">Tự chấm (40%)</th>
                    <th className="border border-slate-400 p-1.5 w-20">Thẩm định (30%)</th>
                    <th className="border border-slate-400 p-1.5 w-20">HĐQT (30%)</th>
                    <th className="border border-slate-400 p-1.5 w-24">Tổng điểm</th>
                    <th className="border border-slate-400 p-1.5 w-28">Xếp loại</th>
                  </tr>
                </thead>
                <tbody>
                  {fundList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="border border-slate-400 p-4 text-center text-slate-400 italic">
                        Chưa có dữ liệu đánh giá trong kỳ {period}
                      </td>
                    </tr>
                  ) : (
                    fundList.map((item, idx) => {
                      const cls = item.classification || getKpiClassification(item.finalScore || 0);
                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50">
                          <td className="border border-slate-400 p-1.5 text-center font-semibold">{idx + 1}</td>
                          <td className="border border-slate-400 p-1.5 font-bold text-slate-900">{item.employeeName}</td>
                          <td className="border border-slate-400 p-1.5 text-slate-700">{item.position || 'Cán bộ'}</td>
                          <td className="border border-slate-400 p-1.5 text-slate-700">{item.department || ''}</td>
                          <td className="border border-slate-400 p-1.5 text-center font-medium text-emerald-800">
                            {item.scoreSelf !== undefined ? `${item.scoreSelf} đ` : '—'}
                          </td>
                          <td className="border border-slate-400 p-1.5 text-center font-medium text-blue-800">
                            {item.scoreManager !== undefined ? `${item.scoreManager} đ` : '—'}
                          </td>
                          <td className="border border-slate-400 p-1.5 text-center font-medium text-purple-800">
                            {item.scoreChairman !== undefined ? `${item.scoreChairman} đ` : '—'}
                          </td>
                          <td className="border border-slate-400 p-1.5 text-center font-black text-slate-950">
                            {item.finalScore !== undefined ? `${item.finalScore} đ` : '—'}
                          </td>
                          <td className="border border-slate-400 p-1.5 text-center font-bold">
                            {cls?.label || 'Chưa hoàn thành'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Khối 3 Chữ Ký */}
              <div className="grid grid-cols-3 text-center text-xs pt-4">
                <div>
                  <div className="font-bold uppercase text-slate-900">NGƯỜI LẬP BIỂU</div>
                  <div className="text-[10px] italic text-slate-500">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-slate-950">Vũ Thị Quỳnh Nga</div>
                </div>
                <div>
                  <div className="font-bold uppercase text-slate-900">GIÁM ĐỐC ĐIỀU HÀNH</div>
                  <div className="text-[10px] italic text-slate-500">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-slate-950">Hoàng Thị Thơm</div>
                </div>
                <div>
                  <div className="font-bold uppercase text-slate-900">CHỦ TỊCH HĐQT</div>
                  <div className="text-[10px] italic text-slate-500">(Ký, đóng dấu, ghi rõ họ tên)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-slate-950">Lê Bá Cường</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default KpiA4PrintModal;

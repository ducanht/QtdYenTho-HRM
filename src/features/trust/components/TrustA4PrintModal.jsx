import React from 'react';
import { Printer } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';

/**
 * TrustA4PrintModal: Mẫu in biên bản tổng hợp lấy phiếu tín nhiệm chuẩn văn bản A4
 * - Đúng chuẩn văn bản hành chính Quỹ tín dụng nhân dân
 * - Khối 3 chữ ký: BKS, Giám đốc, Chủ tịch HĐQT
 */
const TrustA4PrintModal = ({
  isOpen,
  onClose,
  currentPeriod,
  leaderboard = [],
}) => {
  const isAnonymous = currentPeriod?.votingMode === 'ANONYMOUS' || currentPeriod?.votingMode === 'ANONYMOUS_ONLY';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Biên Bản Tổng Hợp Lấy Phiếu Tín Nhiệm (Khổ A4)"
      subtitle="Mẫu in văn bản hành chính Quỹ Tín Dụng Nhân Dân Yên Thọ"
      maxWidth="max-w-4xl"
      footer={
        <div className="flex justify-between w-full">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          <Button
            variant="primary"
            icon={Printer}
            onClick={() => window.print()}
          >
            In văn bản ngay (Ctrl + P)
          </Button>
        </div>
      }
    >
      <div className="p-6 bg-white text-slate-900 space-y-6 font-serif border border-slate-200 rounded-xl shadow-xs print:m-0 print:border-none">
        {/* Header Quốc hiệu & Đơn vị */}
        <div className="flex justify-between text-center pb-4 border-b border-slate-300">
          <div>
            <div className="text-xs uppercase font-bold">QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</div>
            <div className="text-[10px] text-slate-600">Thôn Tân Lộc, xã Quý Lộc, Thanh Hóa</div>
            <div className="text-[10px] font-bold mt-1">Số: ..... /BB-QTDYT</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="text-[10px] font-bold italic underline">Độc lập - Tự do - Hạnh phúc</div>
            <div className="text-[10px] text-slate-500 italic mt-1">Quý Lộc, ngày ... tháng ... năm 2026</div>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-base font-black uppercase tracking-wide">
            BIÊN BẢN TỔNG HỢP KẾT QUẢ LẤY PHIẾU TÍN NHIỆM
          </h3>
          <p className="text-xs italic text-slate-600">
            Kỳ: {currentPeriod?.name} (Hình thức: {isAnonymous ? 'Bỏ phiếu kín 100%' : 'Công khai'})
          </p>
        </div>

        {/* Bảng điểm A4 */}
        <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-center font-bold">
              <th className="border border-slate-300 p-2 w-10">STT</th>
              <th className="border border-slate-300 p-2">Họ và tên cán bộ</th>
              <th className="border border-slate-300 p-2">Chức vụ</th>
              <th className="border border-slate-300 p-2">Phòng ban</th>
              <th className="border border-slate-300 p-2 w-20">Điểm TB (10)</th>
              <th className="border border-slate-300 p-2 w-20">Điểm (100)</th>
              <th className="border border-slate-300 p-2 w-24">Xếp loại</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-slate-300 p-4 text-center text-slate-400">
                  Chưa có dữ liệu tổng hợp
                </td>
              </tr>
            ) : (
              leaderboard.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                  <td className="border border-slate-300 p-2 font-bold">{item.name}</td>
                  <td className="border border-slate-300 p-2">{item.position}</td>
                  <td className="border border-slate-300 p-2">{item.department}</td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-[#0f766e]">
                    {item.avgScore10 || item.avgScore}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-slate-800">
                    {item.avgScore100 || (Number(item.avgScore || 0) * 10).toFixed(0)} đ
                  </td>
                  <td className="border border-slate-300 p-2 text-center">
                    {item.classification?.label || item.classification}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Chữ ký 3 bên */}
        <div className="grid grid-cols-3 text-center pt-8 text-xs font-bold gap-4">
          <div>
            <span>TRƯỞNG BAN KIỂM SOÁT</span>
            <div className="h-16"></div>
            <span className="italic font-normal">(Ký và ghi rõ họ tên)</span>
          </div>
          <div>
            <span>GIÁM ĐỐC ĐIỀU HÀNH</span>
            <div className="h-16"></div>
            <span className="italic font-normal">(Ký và ghi rõ họ tên)</span>
          </div>
          <div>
            <span>CHỦ TỊCH HỘI ĐỒNG QUẢN TRỊ</span>
            <div className="h-16"></div>
            <span className="italic font-normal">(Ký và ghi rõ họ tên)</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(TrustA4PrintModal);

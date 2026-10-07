import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Server, 
  Layers, 
  Users, 
  ShieldCheck, 
  FileCheck,
  TrendingUp,
  FolderTree,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import { isFirebaseConfigured } from '../../lib/firebase';
import { autoInitializeFirebaseDatabase } from '../../lib/autoInitDb';
import { useToast } from '../../context/ToastContext';

const AutoInitDbModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [running, setRunning] = useState(false);
  const [currentStepText, setCurrentStepText] = useState('');
  const [logs, setLogs] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [resultSummary, setResultSummary] = useState(null);

  const handleStartAutoInit = async () => {
    setRunning(true);
    setLogs([]);
    setProgressPercent(5);
    setCurrentStepText('Đang kiểm tra kết nối CSDL...');
    setResultSummary(null);

    try {
      const res = await autoInitializeFirebaseDatabase((stepMsg) => {
        setCurrentStepText(stepMsg);
        setLogs((prev) => [...prev, stepMsg]);
        setProgressPercent((prev) => Math.min(prev + 10, 95));
      });

      setProgressPercent(100);
      setCurrentStepText('Đã hoàn tất khởi tạo toàn bộ CSDL!');
      setResultSummary(res);
      toast.success('Khởi tạo và cập nhật CSDL thành công!');
    } catch (err) {
      console.error('Lỗi khi tự động khởi tạo CSDL:', err);
      setCurrentStepText(`Lỗi: ${err.message || 'Không thể đồng bộ'}`);
      toast.error('Có lỗi xảy ra khi tự động khởi tạo CSDL.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={running ? () => {} : onClose}
      title="Trung Tâm Khởi Tạo & Cập Nhật CSDL Tự Động"
      subtitle="Triển khai cấu trúc bảng, phân quyền và dữ liệu chuẩn mực hoàn toàn tự động"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-slate-500">
            Hệ thống tự động thực thi • Không cần tạo bảng thủ công trên Firebase Console
          </div>
          <Button variant="outline" onClick={onClose} disabled={running}>
            Đóng cửa sổ
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-xs">
        {/* Status Connection Card */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#0f766e]" />
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Trạng thái kết nối Cơ sở Dữ liệu
              </span>
            </div>
            {isFirebaseConfigured ? (
              <Badge variant="success" dot size="sm">
                Đã kết nối Firebase Cloud Firestore
              </Badge>
            ) : (
              <Badge variant="warning" dot size="sm">
                Đang chạy Chế độ Dữ liệu Nội bộ (Local Engine)
              </Badge>
            )}
          </div>

          <p className="text-slate-600 leading-relaxed text-[11px]">
            {isFirebaseConfigured
              ? 'Tài khoản Firebase của đơn vị đã sẵn sàng. Khi bạn bấm nút khởi tạo dưới đây, toàn bộ 9 bộ sưu tập (Collections) và dữ liệu chuẩn mực của Quỹ TDND Yên Thọ sẽ được tạo và đồng bộ tự động lên Cloud Firestore.'
              : 'Hiện tại thông tin firebaseConfig chưa được điền. Khi bấm khởi tạo, hệ thống sẽ thiết lập và đồng bộ toàn bộ 9 bảng vào bộ nhớ nội bộ an toàn. Khi bạn dán thông tin kết nối Firebase vào tệp src/lib/firebase.js, chỉ cần bấm nút này một lần nữa để đẩy toàn bộ dữ liệu lên Firebase!'}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-semibold">
              9 Collections CSDL
            </span>
            <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-semibold">
              8 Phân hệ Modular
            </span>
            <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-semibold">
              4 Cấp phân quyền
            </span>
            <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-semibold">
              Quy chuẩn NHNN Việt Nam
            </span>
          </div>
        </div>

        {/* Action Button & Progress */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="primary"
            size="lg"
            isLoading={running}
            icon={Database}
            onClick={handleStartAutoInit}
            className="w-full font-bold shadow-md shadow-[#0f766e]/30 py-3"
          >
            {running
              ? 'Đang tự động khởi tạo & cập nhật CSDL...'
              : 'Tiến hành Khởi tạo & Cập nhật 9 Bảng CSDL Tự Động'}
          </Button>

          {/* Progress Bar */}
          {progressPercent > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-700">{currentStepText}</span>
                <span className="text-[#0f766e]">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-[#0f766e] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Logs Terminal */}
        {logs.length > 0 && (
          <div className="space-y-1.5">
            <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center justify-between">
              <span>Nhật ký tiến trình thực thi tự động:</span>
              <span className="text-slate-400 font-normal">({logs.length} bước đã chạy)</span>
            </div>
            <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] max-h-40 overflow-y-auto space-y-1 border border-slate-800">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                  <span className="text-slate-300">{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result Summary Table */}
        {resultSummary && (
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Kết quả khởi tạo cấu trúc dữ liệu thành công:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-white border border-emerald-100 flex items-center justify-between">
                <span className="text-slate-600">system_modules:</span>
                <span className="font-black text-[#0f766e]">
                  {resultSummary.details?.system_modules || 8} danh mục
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-emerald-100 flex items-center justify-between">
                <span className="text-slate-600">roles_permissions:</span>
                <span className="font-black text-[#0f766e]">
                  {resultSummary.details?.roles_permissions || 4} vai trò
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-emerald-100 flex items-center justify-between">
                <span className="text-slate-600">trust_criteria:</span>
                <span className="font-black text-[#0f766e]">
                  {resultSummary.details?.trust_criteria || 10} tiêu chí
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-emerald-100 flex items-center justify-between">
                <span className="text-slate-600">evaluation_periods:</span>
                <span className="font-black text-[#0f766e]">
                  {resultSummary.details?.evaluation_periods || 2} đợt
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-emerald-100 flex items-center justify-between">
                <span className="text-slate-600">users:</span>
                <span className="font-black text-[#0f766e]">
                  {resultSummary.details?.users || 9} hồ sơ
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-emerald-100 flex items-center justify-between">
                <span className="text-slate-600">work_history:</span>
                <span className="font-black text-[#0f766e]">
                  {resultSummary.details?.work_history || 3} quyết định
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-emerald-100 flex items-center justify-between">
                <span className="text-slate-600">evaluations_trust:</span>
                <span className="font-black text-[#0f766e]">
                  {resultSummary.details?.evaluations_trust || 3} phiếu
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-emerald-100 flex items-center justify-between">
                <span className="text-slate-600">evaluations_kpi:</span>
                <span className="font-black text-[#0f766e]">
                  {resultSummary.details?.evaluations_kpi || 3} chỉ tiêu
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-emerald-100 flex items-center justify-between">
                <span className="text-slate-600">evaluations_planning:</span>
                <span className="font-black text-[#0f766e]">
                  {resultSummary.details?.evaluations_planning || 2} hồ sơ
                </span>
              </div>
            </div>

            <p className="text-emerald-800 text-[11px] italic">
              {resultSummary.message}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AutoInitDbModal;

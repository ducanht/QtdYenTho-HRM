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
import { autoInitializeFirebaseDatabase, CORE_COLLECTIONS } from '../../lib/autoInitDb';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const COLLECTION_DISPLAY_NAMES = {
  accounts: 'Tài khoản đăng nhập',
  employees: 'Danh bạ CBNV chính thức',
  system_metadata: 'Siêu dữ liệu CSDL',
  system_modules: 'Danh mục 8 phân hệ',
  system_settings: 'Tham số cấu hình hệ thống',
  roles_permissions: 'Ma trận 4 cấp phân quyền',
  departments: 'Danh mục phòng ban',
  positions: 'Danh mục chức vụ',
  trust_criteria: '10 tiêu chí tín nhiệm NHNN',
  evaluation_periods: 'Đợt đánh giá tín nhiệm',
  period_configs: 'Cấu hình riêng từng đợt',
  users: 'Hồ sơ người dùng (users)',
  work_history: 'Lịch sử luân chuyển công tác',
  evaluations_trust: 'Phiếu đánh giá tín nhiệm',
  evaluations_kpi: 'Đánh giá chỉ số KPI',
  evaluations_planning: 'Hồ sơ quy hoạch cán bộ',
};

const AutoInitDbModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const { isAdmin, isSuperAdmin } = useAuth();
  const [running, setRunning] = useState(false);
  const [currentStepText, setCurrentStepText] = useState('');
  const [logs, setLogs] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [resultSummary, setResultSummary] = useState(null);

  if (!isOpen) return null;

  // BẢO MẬT: Chặn hoàn toàn nếu tài khoản không có quyền Quản trị
  if (!isAdmin && !isSuperAdmin) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Từ Chối Truy Cập"
        subtitle="Quyền hạn không đủ để thực hiện thao tác"
        maxWidth="max-w-md"
      >
        <div className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">Không Có Quyền Cập Nhật CSDL</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Thao tác khởi tạo và đồng bộ Cơ sở Dữ liệu chỉ dành riêng cho Quản trị viên cấp cao (SuperAdmin) và Ban Lãnh đạo Quỹ.
          </p>
          <Button variant="outline" onClick={onClose} className="mt-4">
            Đóng cửa sổ
          </Button>
        </div>
      </Modal>
    );
  }

  const handleStartAutoInit = async () => {
    if (!isAdmin && !isSuperAdmin) {
      toast.error('Chỉ Quản trị viên mới có quyền cập nhật CSDL!');
      return;
    }
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
      title="Khởi Tạo & Đồng Bộ CSDL"
      subtitle="Khởi tạo bảng dữ liệu và danh mục chuẩn của hệ thống"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-slate-500">
            Tự động thiết lập cấu trúc trên Cloud Firestore
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
                Trạng thái kết nối CSDL
              </span>
            </div>
            {isFirebaseConfigured ? (
              <Badge variant="success" dot size="sm">
                Đã kết nối Cloud Firestore
              </Badge>
            ) : (
              <Badge variant="warning" dot size="sm">
                Đang lưu trữ dữ liệu cục bộ
              </Badge>
            )}
          </div>

          <p className="text-slate-600 leading-relaxed text-[11px]">
            {isFirebaseConfigured
              ? 'Kết nối CSDL đã sẵn sàng. Khi bấm khởi tạo, toàn bộ 16 bảng dữ liệu chuẩn của Quỹ sẽ được tạo và đồng bộ lên Cloud Firestore.'
              : 'Chưa có cấu hình Firebase. Dữ liệu sẽ được lưu trữ trong bộ nhớ cục bộ.'}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-semibold">
              16 Bảng dữ liệu
            </span>
            <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-semibold">
              8 Phân hệ nghiệp vụ
            </span>
            <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-semibold">
              4 Nhóm vai trò
            </span>
            <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-semibold">
              Quy định QTDND
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
              ? 'Đang khởi tạo & đồng bộ CSDL...'
              : 'Khởi Tạo & Đồng Bộ 16 Bảng CSDL'}
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
              <span>Nhật ký tiến trình thực hiện:</span>
              <span className="text-slate-400 font-normal">({logs.length} bước)</span>
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
              <span>Khởi tạo dữ liệu thành công (16 bảng):</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CORE_COLLECTIONS.map((colName) => {
                const count = resultSummary.details?.[colName] ?? 0;
                const label = COLLECTION_DISPLAY_NAMES[colName] || colName;
                return (
                  <div key={colName} className="p-2.5 rounded-xl bg-white border border-emerald-100 flex flex-col justify-between space-y-1 shadow-2xs">
                    <span className="text-[10px] font-mono text-slate-500 truncate" title={colName}>{colName}</span>
                    <span className="text-[11px] font-semibold text-slate-800 truncate" title={label}>{label}</span>
                    <span className="font-black text-[#0f766e] text-xs">
                      {count} bản ghi
                    </span>
                  </div>
                );
              })}
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

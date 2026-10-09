import React, { useState } from 'react';
import { 
  Database, 
  Server, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Layers,
  Sparkles,
  Lock
} from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import Badge from '../../../../components/common/Badge';
import AutoInitDbModal from '../../../../components/common/AutoInitDbModal';
import { isFirebaseConfigured } from '../../../../lib/firebase';
import { 
  CURRENT_SCHEMA_VERSION, 
  CORE_COLLECTIONS, 
  checkDatabaseHealth 
} from '../../../../lib/autoInitDb';
import { useToast } from '../../../../context/ToastContext';

/**
 * Tab 5: Quản trị Cơ Sở Dữ Liệu & Khởi Tạo Bảng Firestore
 * Dành riêng cho SuperAdmin và Ban Lãnh đạo Quỹ
 */
const DatabaseManagementSettings = ({
  canManageDatabase = false,
  isSuperAdmin = false,
}) => {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthResult, setHealthResult] = useState(null);

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await checkDatabaseHealth();
      setHealthResult(res);
      if (res.connected) {
        toast.success(`CSDL kết nối hoàn hảo: ${res.totalDocs} tài liệu trên ${CORE_COLLECTIONS.length} bảng.`);
      } else {
        toast.warning('Không kết nối được Firestore, đang chạy chế độ Offline.');
      }
    } catch (err) {
      toast.error('Lỗi khi kiểm tra tình trạng CSDL: ' + err.message);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Quản Trị Cơ Sở Dữ Liệu Firestore & Khởi Tạo Bảng Tự Động">
        {/* Banner phân quyền */}
        <div className="mb-5 p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#047857] shrink-0" />
            <div>
              <strong className="text-slate-900 block font-bold">Khu Vực Quản Trị CSDL Cấp Cao (Database Engine):</strong>
              <span className="text-slate-600 text-[11px]">
                Toàn bộ thao tác ghi/cập nhật cấu trúc bảng được kiểm soát bởi Cloud Firestore Security Rules và quyền hạn tài khoản.
              </span>
            </div>
          </div>
          <Badge variant="success" size="sm">
            {isSuperAdmin ? 'SuperAdmin' : 'Admin'}
          </Badge>
        </div>

        {/* Thông số kỹ thuật CSDL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Trạng thái kết nối
            </span>
            <div className="flex items-center gap-2 mt-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <span className="font-black text-slate-900 text-sm">
                {isFirebaseConfigured ? 'Cloud Firestore' : 'Local Engine'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
              {isFirebaseConfigured ? '🟢 Live Production' : '🟡 Offline Storage'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Phiên bản Schema
            </span>
            <div className="flex items-center gap-2 mt-2">
              <Database className="w-4 h-4 text-[#0f766e]" />
              <span className="font-mono font-bold text-slate-900 text-xs truncate" title={CURRENT_SCHEMA_VERSION}>
                {CURRENT_SCHEMA_VERSION.split('_')[0]}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block truncate">
              {CURRENT_SCHEMA_VERSION.replace(/^\d+\.\d+\.\d+_/, '')}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Bảng CSDL nòng cốt
            </span>
            <div className="flex items-center gap-2 mt-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span className="font-black text-slate-900 text-base">
                {CORE_COLLECTIONS.length}
              </span>
              <span className="text-xs text-slate-500 font-semibold">Collections</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              100% Chuẩn hóa v3.8
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Bảo mật Firestore
            </span>
            <div className="flex items-center gap-2 mt-2">
              <Lock className="w-4 h-4 text-teal-700" />
              <span className="font-bold text-teal-900 text-xs">
                Firestore Rules v3.8
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
              Khóa chặt Write/Delete
            </span>
          </div>
        </div>

        {/* Danh sách 16 Collections nòng cốt */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0f766e]" />
            <span>Danh mục 16 Bộ Sưu Tập (Collections) Hoạt Động</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {CORE_COLLECTIONS.map((colName) => (
              <div
                key={colName}
                className="px-3 py-2 rounded-xl bg-slate-100/70 border border-slate-200 text-xs font-mono font-semibold text-slate-800 flex items-center justify-between"
              >
                <span className="truncate">{colName}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Các nút thao tác Quản trị */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={handleCheckHealth}
            disabled={isCheckingHealth}
          >
            {isCheckingHealth ? 'Đang kiểm tra CSDL...' : 'Kiểm Tra Tình Trạng CSDL (Health Check)'}
          </Button>

          {canManageDatabase && (
            <Button
              variant="primary"
              icon={Sparkles}
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              Mở Trung Tâm Khởi Tạo & Cập Nhật CSDL Tự Động
            </Button>
          )}
        </div>

        {/* Kết quả Health Check */}
        {healthResult && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Kết Quả Kiểm Tra Tình Trạng:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>Kết nối: <strong className="text-emerald-700">{healthResult.connected ? 'Thành công' : 'Thất bại'}</strong></div>
              <div>Tổng tài liệu: <strong className="text-slate-800">{healthResult.totalDocs}</strong></div>
              <div>Bảng hoạt động: <strong className="text-slate-800">{healthResult.healthyCollections}/{CORE_COLLECTIONS.length}</strong></div>
              <div>Trạng thái: <strong className="text-teal-700">{healthResult.status || 'OK'}</strong></div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Tự Động CSDL */}
      <AutoInitDbModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default DatabaseManagementSettings;

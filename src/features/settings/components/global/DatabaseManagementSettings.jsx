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
      <Card title="Quản Trị Cơ Sở Dữ Liệu">
        {/* Banner phân quyền */}
        <div className="mb-5 p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#047857] shrink-0" />
            <div>
              <strong className="text-slate-900 block font-bold">Quản trị cơ sở dữ liệu:</strong>
              <span className="text-slate-600 text-[11px]">
                Chỉ Quản trị viên và Ban Lãnh đạo mới có quyền cập nhật cấu trúc dữ liệu.
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
              Kết nối
            </span>
            <div className="flex items-center gap-2 mt-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <span className="font-black text-slate-900 text-sm">
                {isFirebaseConfigured ? 'Cloud Firestore' : 'Bộ nhớ cục bộ'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
              {isFirebaseConfigured ? '🟢 Trực tuyến' : '🟡 Cục bộ'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Phiên bản CSDL
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
              Bảng dữ liệu
            </span>
            <div className="flex items-center gap-2 mt-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span className="font-black text-slate-900 text-base">
                {CORE_COLLECTIONS.length}
              </span>
              <span className="text-xs text-slate-500 font-semibold">Bảng</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              16 Bảng dữ liệu chuẩn
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Bảo mật dữ liệu
            </span>
            <div className="flex items-center gap-2 mt-2">
              <Lock className="w-4 h-4 text-teal-700" />
              <span className="font-bold text-teal-900 text-xs">
                Quy tắc Firestore
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
              Kiểm soát quyền ghi
            </span>
          </div>
        </div>

        {/* Danh sách 16 Collections nòng cốt */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0f766e]" />
            <span>Danh mục 16 Bảng dữ liệu hệ thống</span>
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
            {isCheckingHealth ? 'Đang kiểm tra kết nối...' : 'Kiểm tra kết nối CSDL'}
          </Button>

          {canManageDatabase && (
            <Button
              variant="primary"
              icon={Sparkles}
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              Khởi Tạo & Đồng Bộ CSDL
            </Button>
          )}
        </div>

        {/* Kết quả Health Check */}
        {healthResult && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${healthResult.connected ? 'text-emerald-600' : 'text-rose-600'}`} />
                <span>Kết quả kiểm tra kết nối:</span>
              </span>
              <span className="text-[10px] font-normal text-slate-500">
                Kiểm tra lúc: {new Date(healthResult.checkedAt).toLocaleTimeString('vi-VN')}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>Kết nối: <strong className={healthResult.connected ? 'text-emerald-700' : 'text-rose-600'}>{healthResult.connected ? 'Thành công (Trực tuyến)' : 'Thất bại (Cục bộ)'}</strong></div>
              <div>Tổng bản ghi: <strong className="text-slate-800">{healthResult.totalDocs}</strong></div>
              <div>Số bảng sẵn sàng: <strong className="text-slate-800">{healthResult.healthyCollections}/{CORE_COLLECTIONS.length}</strong></div>
              <div>Trạng thái: <strong className="text-teal-700">{healthResult.status || 'Hoạt động tốt'}</strong></div>
            </div>

            {healthResult.collections && Object.keys(healthResult.collections).length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Số lượng bản ghi theo từng bảng:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                  {Object.entries(healthResult.collections).map(([col, cnt]) => (
                    <div key={col} className="flex items-center justify-between px-2 py-1 bg-white rounded border border-slate-200 font-mono">
                      <span className="text-slate-600 truncate">{col}:</span>
                      <span className={`font-bold ${cnt > 0 ? 'text-[#0f766e]' : 'text-slate-400'}`}>
                        {cnt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

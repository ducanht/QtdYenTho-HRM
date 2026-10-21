import React, { useState } from 'react';
import { 
  Sliders, 
  Save, 
  Loader2 
} from 'lucide-react';
import { useToast } from '../../../../context/ToastContext';

/**
 * Thẻ Cấu Hình Tỷ Trọng 3 Cấp & Thang Điểm Xếp Loại Thi Đua
 */
const KpiWeightsConfigCard = ({
  weights = { self: 40, manager: 30, chairman: 30 },
  thresholds = { excellent: 90, good: 75, pass: 60 },
  onSaveConfig,
  canManage = false
}) => {
  const toast = useToast();
  const [selfW, setSelfW] = useState(weights.self ?? 40);
  const [managerW, setManagerW] = useState(weights.manager ?? 30);
  const [chairmanW, setChairmanW] = useState(weights.chairman ?? 30);

  const [excT, setExcT] = useState(thresholds.excellent ?? 90);
  const [goodT, setGoodT] = useState(thresholds.good ?? 75);
  const [passT, setPassT] = useState(thresholds.pass ?? 60);

  const [isSaving, setIsSaving] = useState(false);

  const totalW = Number(selfW) + Number(managerW) + Number(chairmanW);
  const isValid = totalW === 100;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isValid) {
      toast.error('Tổng tỷ trọng 3 cấp phải bằng chính xác 100%.');
      return;
    }

    setIsSaving(true);
    try {
      if (onSaveConfig) {
        await onSaveConfig({
          weights: { self: Number(selfW), manager: Number(managerW), chairman: Number(chairmanW) },
          thresholds: { excellent: Number(excT), good: Number(goodT), pass: Number(passT) }
        });
      }
      toast.success('Đã lưu cấu hình tỷ trọng & thang xếp loại KPI thành công!');
    } catch (err) {
      console.error('Lỗi lưu cấu hình:', err);
      toast.error('Có lỗi xảy ra khi lưu cấu hình.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
            Cấu Hình Tỷ Trọng 3 Cấp & Thang Xếp Loại
          </h3>
        </div>
        <div className="flex items-center gap-1.5 font-numeric text-xs">
          <span>Tổng tỷ trọng:</span>
          <span className={`font-bold px-2 py-0.5 rounded ${isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {totalW}%
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-5 space-y-5">
        {/* 1. Tỷ trọng 3 cấp */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Tỷ Trọng Phân Bổ Điểm Số 3 Cấp (Bắt buộc tổng = 100%)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-numeric">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <label className="text-xs text-slate-600 block mb-1 font-sans">
                Cấp 1: Cán bộ tự chấm (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!canManage}
                value={selfW}
                onChange={(e) => setSelfW(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/30">
              <label className="text-xs text-blue-900 block mb-1 font-sans">
                Cấp 2: BĐH thẩm định (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!canManage}
                value={managerW}
                onChange={(e) => setManagerW(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/30">
              <label className="text-xs text-amber-900 block mb-1 font-sans">
                Cấp 3: HĐQT phê chuẩn (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!canManage}
                value={chairmanW}
                onChange={(e) => setChairmanW(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-sm font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Thang điểm xếp loại thi đua */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            2. Ngưỡng Điểm Phân Loại Thi Đua
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-numeric text-xs">
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/30">
              <label className="text-emerald-900 block mb-1 font-sans font-semibold">
                Xuất sắc (≥ Điểm)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!canManage}
                value={excT}
                onChange={(e) => setExcT(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/30">
              <label className="text-teal-900 block mb-1 font-sans font-semibold">
                Tốt (≥ Điểm)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!canManage}
                value={goodT}
                onChange={(e) => setGoodT(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg text-sm font-bold text-teal-900 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/30">
              <label className="text-amber-900 block mb-1 font-sans font-semibold">
                Đạt yêu cầu (≥ Điểm)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!canManage}
                value={passT}
                onChange={(e) => setPassT(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-sm font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 italic">
            * Cán bộ có điểm tổng kết dưới ngưỡng &quot;Đạt yêu cầu&quot; sẽ tự động xếp loại &quot;Không đạt&quot;.
          </p>
        </div>

        {canManage && (
          <div className="pt-2 flex items-center justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving || !isValid}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu Cấu Hình Tỷ Trọng</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default KpiWeightsConfigCard;

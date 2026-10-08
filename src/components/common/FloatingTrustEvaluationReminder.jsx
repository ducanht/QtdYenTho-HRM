import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, ArrowRight, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeEvaluationPeriods, subscribeTrustEvaluations, subscribeEmployees } from '../../lib/services';
import { formatDateRangeVN } from '../../lib/dateUtils';

const FloatingTrustEvaluationReminder = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [periods, setPeriods] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dismissedPeriodId, setDismissedPeriodId] = useState(null);

  // Subscribe danh sách đợt đánh giá
  useEffect(() => {
    const unsub = subscribeEvaluationPeriods((list) => {
      setPeriods(list || []);
    });
    return () => unsub();
  }, []);

  // Subscribe danh sách phiếu đánh giá
  useEffect(() => {
    const unsub = subscribeTrustEvaluations((list) => {
      setEvaluations(list || []);
    });
    return () => unsub();
  }, []);

  // Subscribe danh sách nhân sự
  useEffect(() => {
    const unsub = subscribeEmployees((list) => {
      setEmployees(list || []);
    });
    return () => unsub();
  }, []);

  // Tìm đợt đánh giá ACTIVE hiện tại
  const activePeriod = useMemo(() => {
    return periods.find((p) => p.status === 'ACTIVE');
  }, [periods]);

  // Danh sách các cán bộ thuộc diện lấy phiếu tín nhiệm trong đợt này (loại trừ chính bản thân)
  const targetEmployees = useMemo(() => {
    if (!activePeriod || !employees.length || !currentUser) return [];

    let pool = employees;
    // Nếu đợt có cấu hình targetEmployeeIds cụ thể
    if (Array.isArray(activePeriod.targetEmployeeIds) && activePeriod.targetEmployeeIds.length > 0) {
      pool = employees.filter((e) => activePeriod.targetEmployeeIds.includes(e.id));
    }

    // Luôn loại trừ bản thân người dùng đăng nhập
    return pool.filter((e) => e.id !== currentUser.id && e.id !== currentUser.uid && e.email !== currentUser.email);
  }, [activePeriod, employees, currentUser]);

  // Đếm số lượng cán bộ mà người dùng HIỆN TẠI ĐÃ ĐÁNH GIÁ trong đợt này
  const myEvaluatedCount = useMemo(() => {
    if (!activePeriod || !currentUser || !targetEmployees.length) return 0;
    const myEvaluations = evaluations.filter(
      (ev) =>
        ev.periodId === activePeriod.id &&
        (ev.evaluatorId === currentUser.uid || ev.evaluatorId === currentUser.id) &&
        !ev.isDraft
    );

    const evaluatedTargetIds = new Set(myEvaluations.map((ev) => ev.targetEmployeeId));
    return targetEmployees.filter((emp) => evaluatedTargetIds.has(emp.id)).length;
  }, [activePeriod, currentUser, targetEmployees, evaluations]);

  const totalRequired = targetEmployees.length;
  const remainingCount = Math.max(0, totalRequired - myEvaluatedCount);
  const isCompleted = totalRequired > 0 && remainingCount === 0;

  // Nếu đang ở trang /trust-evaluation hoặc đã tắt thông báo cho đợt này thì không hiện
  const isOnTrustPage = location.pathname === '/trust-evaluation';
  const isDismissed = dismissedPeriodId === activePeriod?.id;

  if (!currentUser || !activePeriod || totalRequired === 0 || isCompleted || isOnTrustPage || isDismissed) {
    return null;
  }

  const percent = Math.round((myEvaluatedCount / totalRequired) * 100);

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-amber-400/60 ring-4 ring-emerald-500/20 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-md font-bold relative mt-0.5">
              <ShieldAlert className="w-5 h-5 text-emerald-950" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Nhắc nhở công tác tín nhiệm
                </span>
                <span className="text-[11px] text-teal-300 font-semibold">{percent}%</span>
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-white mt-1 leading-snug">
                Đồng chí còn <span className="text-amber-300 font-black text-sm">{remainingCount}</span> cán bộ chưa lấy phiếu tín nhiệm
              </h4>

              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                Kỳ: <strong className="text-teal-200">{activePeriod.name}</strong>
              </p>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-teal-400 to-amber-300 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => navigate('/trust-evaluation')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <span>Truy cập đánh giá ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setDismissedPeriodId(activePeriod.id)}
                  className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium hover:bg-white/10 transition-colors"
                >
                  Để sau
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDismissedPeriodId(activePeriod.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingTrustEvaluationReminder;

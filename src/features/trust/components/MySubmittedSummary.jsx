import React, { useMemo } from 'react';
import { CheckCircle2, UserCheck, ShieldCheck, Calendar, Search } from 'lucide-react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import { formatDateTimeVN } from '../../../lib/dateUtils';

/**
 * MySubmittedSummary: Xem lại kết quả đánh giá của CHÍNH MÌNH đối với các đồng nghiệp khác
 * - Chỉ hiển thị phiếu do chính người dùng hiện tại thực hiện
 * - Tôn trọng quyền cá nhân và bảo mật nội bộ
 */
const MySubmittedSummary = ({
  evaluations = [],
  currentUser,
  currentPeriod,
  criteria = [],
}) => {
  // Lọc chỉ lấy các phiếu do CHÍNH NGƯỜI ĐĂNG NHẬP chấm trong kỳ này
  const mySubmissions = useMemo(() => {
    if (!currentUser || !currentPeriod) return [];
    return evaluations.filter(
      (ev) =>
        ev.periodId === currentPeriod.id &&
        (ev.evaluatorId === currentUser.uid ||
          ev.evaluatorId === currentUser.id ||
          ev.evaluatorEmail === currentUser.email) &&
        !ev.isDraft
    );
  }, [evaluations, currentUser, currentPeriod]);

  return (
    <div className="space-y-6">
      {/* Banner thông tin */}
      <Card className="border-teal-200 bg-gradient-to-r from-teal-50/60 via-white to-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">
              Kết Quả Phiếu Đánh Giá Đồng Nghiệp Của Đồng Chí
            </h3>
            <p className="text-xs text-slate-600">
              Kỳ: <strong className="text-teal-800">{currentPeriod?.name}</strong> • Tổng số phiếu đã nộp chính thức:{' '}
              <strong className="text-teal-900 font-bold">{mySubmissions.length} cán bộ</strong>
            </p>
          </div>

          <div className="bg-white px-3 py-1.5 rounded-xl border border-teal-200 text-xs font-bold text-teal-800 self-start sm:self-auto">
            {mySubmissions.length > 0 ? 'Đã hoàn tất nộp phiếu' : 'Chưa có phiếu nộp'}
          </div>
        </div>
      </Card>

      {/* Danh sách các phiếu đã chấm */}
      {mySubmissions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 space-y-2">
          <UserCheck className="w-10 h-10 mx-auto text-slate-300" />
          <div className="text-sm font-bold text-slate-600">
            Đồng chí chưa nộp phiếu chính thức cho kỳ này
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Vui lòng chuyển sang Tab "1. Lấy Phiếu Tín Nhiệm Theo Tiêu Chí" để thực hiện chấm điểm cho các đồng nghiệp.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">TT</th>
                  <th className="py-3 px-4 min-w-[180px]">Cán bộ được đánh giá</th>
                  <th className="py-3 px-4 min-w-[140px]">Chức vụ / Bộ phận</th>
                  <th className="py-3 px-4 text-center min-w-[100px]">Điểm trung bình đã cho</th>
                  <th className="py-3 px-4 min-w-[160px]">Thời gian nộp phiếu</th>
                  <th className="py-3 px-4 min-w-[200px]">Ghi chú đã gửi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mySubmissions.map((sub, idx) => {
                  // Tính trung bình điểm người dùng đã cho cán bộ này
                  const scoreVals = Object.values(sub.scores || {}).map(Number).filter((s) => !isNaN(s));
                  const avg = scoreVals.length > 0 ? (scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length).toFixed(1) : 0;

                  return (
                    <tr key={sub.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-xs sm:text-sm">
                        {sub.targetEmployeeName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-semibold text-slate-800">{sub.targetPosition || 'Cán bộ'}</div>
                        <div className="text-[11px] text-slate-400">{sub.targetDepartment}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                          {avg} / 10
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {formatDateTimeVN(sub.submittedAt || sub.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 italic">
                        {sub.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MySubmittedSummary);

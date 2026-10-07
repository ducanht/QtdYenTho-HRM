import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  TrendingUp, 
  Vote, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Award,
  BarChart2,
  PieChart as PieIcon,
  RefreshCw,
  Building2,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeTrustEvaluations, 
  subscribeKpiEvaluations, 
  subscribePlanningVotes,
  subscribeEmployees
} from '../lib/services';
import { DEPARTMENTS, INITIAL_EMPLOYEES } from '../lib/mockData';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';

const Dashboard = () => {
  const { currentUser, role } = useAuth();

  const [trustData, setTrustData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [planningData, setPlanningData] = useState([]);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [loading, setLoading] = useState(true);

  // Subscribe real-time onSnapshot to all three collections
  useEffect(() => {
    setLoading(true);
    let countLoaded = 0;
    const checkLoaded = () => {
      countLoaded += 1;
      if (countLoaded >= 3) setLoading(false);
    };

    const unsubTrust = subscribeTrustEvaluations((data) => {
      setTrustData(data || []);
      checkLoaded();
    });

    const unsubKpi = subscribeKpiEvaluations((data) => {
      setKpiData(data || []);
      checkLoaded();
    });

    const unsubPlanning = subscribePlanningVotes((data) => {
      setPlanningData(data || []);
      checkLoaded();
    });

    const unsubEmp = subscribeEmployees((data) => {
      if (data) setEmployees(data);
    });

    return () => {
      unsubTrust();
      unsubKpi();
      unsubPlanning();
      unsubEmp();
    };
  }, []);

  // 1. Metrics: Tổng số lượt đánh giá tín nhiệm
  const totalTrustEvaluations = trustData.length;

  // 2. Metrics: Điểm KPI trung bình toàn hệ thống
  const avgKpiScore = useMemo(() => {
    const scores = kpiData
      .map((k) => k.finalScore ?? k.scoreSelf)
      .filter((s) => s !== null && s !== undefined && !isNaN(s));
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + Number(b), 0);
    return Number((sum / scores.length).toFixed(1));
  }, [kpiData]);

  // 3. Metrics: Tỷ lệ hoàn tất đánh giá KPI
  const kpiCompletionRate = useMemo(() => {
    if (kpiData.length === 0) return 0;
    const completed = kpiData.filter((k) => k.status === 'completed').length;
    return Math.round((completed / kpiData.length) * 100);
  }, [kpiData]);

  // 4. Metrics: Tổng số phiếu quy hoạch
  const totalPlanningVotes = planningData.length;

  // ============================================================================
  // CHART 1: PIE CHART - PHÂN BỔ XẾP LOẠI TÍN NHIỆM
  // Xuất sắc (>=90), Tốt (>=70), Hoàn thành (>=50), Không hoàn thành (<50)
  // ============================================================================
  const trustPieData = useMemo(() => {
    const counts = {
      'Xuất sắc': 0,
      'Tốt': 0,
      'Hoàn thành': 0,
      'Không hoàn thành': 0,
    };

    trustData.forEach((item) => {
      const cls = item.classification || (
        item.totalScore >= 90 ? 'Xuất sắc' :
        item.totalScore >= 70 ? 'Tốt' :
        item.totalScore >= 50 ? 'Hoàn thành' : 'Không hoàn thành'
      );
      if (counts[cls] !== undefined) {
        counts[cls] += 1;
      } else {
        counts['Tốt'] += 1;
      }
    });

    return [
      { name: 'Xuất sắc', value: counts['Xuất sắc'], color: '#10b981' },
      { name: 'Tốt', value: counts['Tốt'], color: '#0f766e' },
      { name: 'Hoàn thành', value: counts['Hoàn thành'], color: '#f59e0b' },
      { name: 'Không hoàn thành', value: counts['Không hoàn thành'], color: '#ef4444' },
    ];
  }, [trustData]);

  // ============================================================================
  // CHART 2: BAR CHART - SO SÁNH ĐIỂM KPI TRUNG BÌNH THEO PHÒNG BAN
  // ============================================================================
  const departmentKpiBarData = useMemo(() => {
    const deptScores = {};

    DEPARTMENTS.forEach((dept) => {
      deptScores[dept] = { total: 0, count: 0 };
    });

    kpiData.forEach((k) => {
      const dept = k.department || 'Khác';
      const score = k.finalScore ?? k.scoreSelf;
      if (score !== null && score !== undefined && !isNaN(score)) {
        if (!deptScores[dept]) {
          deptScores[dept] = { total: 0, count: 0 };
        }
        deptScores[dept].total += Number(score);
        deptScores[dept].count += 1;
      }
    });

    return Object.keys(deptScores)
      .map((dept) => {
        const item = deptScores[dept];
        const avg = item.count > 0 ? Number((item.total / item.count).toFixed(1)) : 0;
        // Rút gọn tên phòng ban cho nhãn trục X
        const shortName = dept
          .replace('Ban Quản trị (HĐQT)', 'HĐQT')
          .replace('Phòng Kế toán - Ngân quỹ', 'Kế toán - Quỹ')
          .replace('Phòng Tín dụng', 'Tín dụng')
          .replace('Ban Kiểm soát', 'BKS')
          .replace('Ban Điều hành', 'BĐH');

        return {
          department: shortName,
          fullName: dept,
          'Điểm KPI': avg,
          soNhanSu: item.count,
        };
      })
      .filter((d) => d['Điểm KPI'] > 0);
  }, [kpiData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0f766e] uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-4 h-4" />
            <span>Phân Hệ Báo Cáo Thời Gian Thực (onSnapshot)</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Báo Cáo & Điều Hành Nhân Sự QTDND
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dành riêng cho Ban điều hành & Chủ tịch HĐQT • Cập nhật trực tiếp từ Firestore
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-xs self-start md:self-auto text-xs">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-700">Firebase Real-time:</span>
          <span className="text-[#0f766e] font-semibold">Đang đồng bộ</span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Trust Evaluations */}
        <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đánh giá tín nhiệm
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#0f766e] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {totalTrustEvaluations}
            </span>
            <span className="text-xs text-slate-500 font-medium">lượt hoàn thành</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-700 font-semibold flex items-center gap-1">
            <span>Đã đánh giá 10 tiêu chí</span>
          </div>
        </Card>

        {/* Metric 2: Average KPI Score */}
        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Điểm KPI trung bình
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">
              {avgKpiScore}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ 100</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
            <span>Trọng số chuẩn 40% - 30% - 30%</span>
          </div>
        </Card>

        {/* Metric 3: KPI Completion Rate */}
        <Card className="border-sky-100 bg-gradient-to-br from-white to-sky-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tiến độ duyệt KPI
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {kpiCompletionRate}%
            </span>
            <span className="text-xs text-slate-500 font-medium">đã xong 3 cấp</span>
          </div>
          <div className="mt-2 text-[11px] text-sky-700 font-semibold flex items-center gap-1">
            <span>{kpiData.filter((k) => k.status !== 'completed').length} hồ sơ đang xử lý</span>
          </div>
        </Card>

        {/* Metric 4: Planning Votes */}
        <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Phiếu quy hoạch
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Vote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {totalPlanningVotes}
            </span>
            <span className="text-xs text-slate-500 font-medium">phiếu biểu quyết</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-800 font-semibold flex items-center gap-1">
            <span>Đã ghi nhận ý kiến cán bộ</span>
          </div>
        </Card>
      </div>

      {/* 2 Main Visual Charts using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Chart 1: Pie Chart - Trust Classification (5 cols) */}
        <div className="lg:col-span-5">
          <Card
            title="Cơ Cấu Phân Loại Tín Nhiệm Cán Bộ"
            subtitle="Tỷ lệ % xếp loại: Xuất sắc, Tốt, Hoàn thành, Không hoàn thành"
            action={<PieIcon className="w-4 h-4 text-[#0f766e]" />}
          >
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Spinner text="Đang vẽ biểu đồ phân loại..." />
              </div>
            ) : trustData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                Chưa có dữ liệu đánh giá tín nhiệm
              </div>
            ) : (
              <div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trustPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {trustPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name) => [`${val} lượt đánh giá`, name]}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-xs">
                  {trustPieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-md shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-600 truncate">{item.name}:</span>
                      <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Chart 2: Bar Chart - Average KPI across Departments (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            title="So Sánh Điểm KPI Trung Bình Giữa Các Phòng Ban"
            subtitle="Thang điểm 100 • Dựa trên tổng hợp điểm tự chấm và các cấp duyệt"
            action={<BarChart2 className="w-4 h-4 text-[#0f766e]" />}
          >
            {loading ? (
              <div className="h-72 flex items-center justify-center">
                <Spinner text="Đang tổng hợp điểm số các phòng ban..." />
              </div>
            ) : departmentKpiBarData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-xs text-slate-400">
                Chưa có dữ liệu KPI của phòng ban
              </div>
            ) : (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentKpiBarData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="department"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickCount={6}
                    />
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value} điểm (${props.payload.soNhanSu} cán bộ)`,
                        'Điểm KPI Trung Bình',
                      ]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                          return payload[0].payload.fullName;
                        }
                        return label;
                      }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar
                      dataKey="Điểm KPI"
                      fill="#0f766e"
                      radius={[6, 6, 0, 0]}
                      barSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Real-time Submissions Stream Table */}
      <Card
        title="Hoạt Động Đánh Giá Gần Đây Trong Toàn Hệ Thống"
        subtitle="Tổng hợp các giao dịch dữ liệu mới nhất được đồng bộ qua onSnapshot"
      >
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
              <tr>
                <th className="py-3 px-6">Phân hệ</th>
                <th className="py-3 px-4">Nhân sự liên quan</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4 text-center">Kết quả / Điểm số</th>
                <th className="py-3 px-4">Người ghi nhận</th>
                <th className="py-3 px-6 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Combine top recent records from trust and kpi */}
              {[
                ...trustData.slice(0, 3).map((t) => ({
                  type: 'Tín nhiệm (Module A)',
                  typeVariant: 'tot',
                  person: t.targetEmployeeName,
                  dept: t.targetDepartment,
                  result: `${t.totalScore} đ (${t.classification})`,
                  author: t.evaluatorName,
                  time: t.createdAt,
                })),
                ...kpiData.slice(0, 3).map((k) => ({
                  type: 'KPI (Module B)',
                  typeVariant: 'completed',
                  person: k.employeeName,
                  dept: k.department,
                  result: k.finalScore ? `${k.finalScore} điểm (Tổng kết)` : `Tự chấm ${k.scoreSelf} đ`,
                  author: k.status === 'completed' ? 'Chủ tịch HĐQT' : 'Cán bộ',
                  time: k.updatedAt || k.createdAt,
                })),
                ...planningData.slice(0, 2).map((p) => ({
                  type: 'Quy hoạch (Module C)',
                  typeVariant: 'warning',
                  person: p.candidateName,
                  dept: p.department,
                  result: p.vote,
                  author: p.voterName,
                  time: p.createdAt,
                })),
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-6">
                    <Badge variant={row.typeVariant} size="sm">
                      {row.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{row.person}</td>
                  <td className="py-3 px-4 text-slate-600">{row.dept}</td>
                  <td className="py-3 px-4 text-center font-bold text-[#0f766e]">
                    {row.result}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{row.author}</td>
                  <td className="py-3 px-6 text-right text-slate-400">
                    {row.time ? new Date(row.time).toLocaleDateString('vi-VN') : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;

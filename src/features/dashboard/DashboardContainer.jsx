import React, { useState, useEffect, useMemo } from 'react';
import { 
  subscribeTrustEvaluations, 
  subscribeKpiEvaluations, 
  subscribePlanningVotes,
  subscribeEmployees,
  subscribeDepartments
} from '../../lib/services';
import { DEPARTMENTS as FALLBACK_DEPARTMENTS } from '../../lib/constants';
import DashboardLiveHeader from './components/DashboardLiveHeader';
import DashboardKpiSummaryCards from './components/DashboardKpiSummaryCards';
import TrustClassificationPieChart from './components/charts/TrustClassificationPieChart';
import DepartmentKpiBarChart from './components/charts/DepartmentKpiBarChart';
import DashboardRecentActivitiesTable from './components/DashboardRecentActivitiesTable';

const DashboardContainer = () => {
  const [trustData, setTrustData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [planningData, setPlanningData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe real-time onSnapshot to all Firestore collections
  useEffect(() => {
    setLoading(true);
    let countLoaded = 0;
    const checkLoaded = () => {
      countLoaded += 1;
      if (countLoaded >= 5) setLoading(false);
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

    const unsubEmp = subscribeEmployees(() => {
      checkLoaded();
    });

    const unsubDept = subscribeDepartments((list) => {
      if (list && list.length > 0) {
        setDepartments(list.map((d) => d.name));
      } else {
        setDepartments(FALLBACK_DEPARTMENTS);
      }
      checkLoaded();
    });

    return () => {
      unsubTrust();
      unsubKpi();
      unsubPlanning();
      unsubEmp();
      unsubDept();
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

  const kpiPendingCount = useMemo(() => {
    return kpiData.filter((k) => k.status !== 'completed').length;
  }, [kpiData]);

  // 4. Metrics: Tổng số phiếu quy hoạch
  const totalPlanningVotes = planningData.length;

  // Phân bổ xếp loại tín nhiệm (Pie chart dataset)
  const trustPieData = useMemo(() => {
    const counts = {
      'Xuất sắc': 0,
      'Tốt': 0,
      'Hoàn thành': 0,
      'Không hoàn thành': 0,
    };

    trustData.forEach((item) => {
      const raw = String(item.classification || '').toLowerCase();
      let key = 'Tốt';
      if (raw.includes('xuất sắc')) {
        key = 'Xuất sắc';
      } else if (raw.includes('không hoàn thành') || raw.includes('yếu')) {
        key = 'Không hoàn thành';
      } else if (raw.includes('hoàn thành')) {
        key = 'Hoàn thành';
      } else if (raw.includes('tốt')) {
        key = 'Tốt';
      } else {
        const score = Number(item.totalScore || 0);
        key = score >= 90 ? 'Xuất sắc' : score >= 70 ? 'Tốt' : score >= 50 ? 'Hoàn thành' : 'Không hoàn thành';
      }
      counts[key] += 1;
    });


    return [
      { name: 'Xuất sắc', value: counts['Xuất sắc'], color: '#10b981' },
      { name: 'Tốt', value: counts['Tốt'], color: '#0f766e' },
      { name: 'Hoàn thành', value: counts['Hoàn thành'], color: '#f59e0b' },
      { name: 'Không hoàn thành', value: counts['Không hoàn thành'], color: '#ef4444' },
    ];
  }, [trustData]);

  // So sánh điểm KPI trung bình theo phòng ban (Bar chart dataset)
  const departmentKpiBarData = useMemo(() => {
    const deptScores = {};

    const targetDepts = departments.length > 0 ? departments : FALLBACK_DEPARTMENTS;
    targetDepts.forEach((dept) => {
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
  }, [kpiData, departments]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Action Bar & Live Status Indicator */}
      <DashboardLiveHeader />

      {/* 4 Summary Metric Cards */}
      <DashboardKpiSummaryCards
        totalTrustEvaluations={totalTrustEvaluations}
        avgKpiScore={avgKpiScore}
        kpiCompletionRate={kpiCompletionRate}
        kpiPendingCount={kpiPendingCount}
        totalPlanningVotes={totalPlanningVotes}
      />

      {/* 2 Main Visual Charts using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <TrustClassificationPieChart
            loading={loading}
            trustDataLength={trustData.length}
            trustPieData={trustPieData}
          />
        </div>

        <div className="lg:col-span-7">
          <DepartmentKpiBarChart
            loading={loading}
            departmentKpiBarData={departmentKpiBarData}
          />
        </div>
      </div>

      {/* Real-time Submissions Stream Table */}
      <DashboardRecentActivitiesTable
        trustData={trustData}
        kpiData={kpiData}
        planningData={planningData}
      />
    </div>
  );
};

export default DashboardContainer;

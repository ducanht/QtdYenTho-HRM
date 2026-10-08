import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PLANNING_POSITIONS as FALLBACK_PLANNING_POSITIONS } from '../../lib/constants';
import { 
  savePlanningVote, 
  subscribePlanningVotes, 
  subscribeEmployees,
  subscribeSystemSettings,
  subscribeEvaluationPeriods
} from '../../lib/services';
import PlanningActionBar from './components/PlanningActionBar';
import PlanningVoteForm from './components/PlanningVoteForm';
import PlanningTallyCard from './components/PlanningTallyCard';
import PlanningGuidelinesCard from './components/PlanningGuidelinesCard';

const PlanningVoteContainer = () => {
  const { currentUser, role } = useAuth();
  const toast = useToast();

  const [employees, setEmployees] = useState([]);
  const [votes, setVotes] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [planningPositions, setPlanningPositions] = useState(FALLBACK_PLANNING_POSITIONS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [candidateId, setCandidateId] = useState('');
  const [proposedRole, setProposedRole] = useState('Phó Giám đốc phụ trách Tín dụng');
  const [voteChoice, setVoteChoice] = useState('Tín nhiệm cao');
  const [comments, setComments] = useState('');

  // Search in Vote Tally
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubEmp = subscribeEmployees((list) => {
      if (list) setEmployees(list);
    });
    const unsubSettings = subscribeSystemSettings((settings) => {
      if (settings?.planningPositions && settings.planningPositions.length > 0) {
        setPlanningPositions(settings.planningPositions);
      } else {
        setPlanningPositions(FALLBACK_PLANNING_POSITIONS);
      }
    });
    const unsubPeriods = subscribeEvaluationPeriods((list) => {
      if (list && list.length > 0) {
        setPeriods(list);
        const active = list.find((p) => p.status === 'ACTIVE') || list[0];
        if (active) setSelectedPeriodId((prev) => prev || active.id);
      }
    });
    return () => {
      unsubEmp();
      unsubSettings();
      unsubPeriods();
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribePlanningVotes((data) => {
      setVotes(data || []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Đợt quy hoạch đang chọn
  const currentPeriod = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId) || null;
  }, [periods, selectedPeriodId]);

  // Ứng viên được chọn
  const selectedCandidate = useMemo(() => {
    return employees.find((e) => e.id === candidateId);
  }, [employees, candidateId]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!candidateId) {
      toast.error('Vui lòng chọn nhân sự trong danh sách quy hoạch!');
      return;
    }
    if (!proposedRole.trim()) {
      toast.error('Vui lòng nhập chức danh quy hoạch bổ nhiệm.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        voterId: currentUser?.uid || currentUser?.id,
        voterName: currentUser?.name,
        voterRole: role,
        candidateId,
        candidateName: selectedCandidate?.name,
        currentPosition: selectedCandidate?.position,
        department: selectedCandidate?.department,
        proposedRole: proposedRole.trim(),
        vote: voteChoice, // 'Tín nhiệm cao' | 'Tín nhiệm' | 'Tín nhiệm thấp'
        comments: comments.trim(),
        periodId: selectedPeriodId || 'PERIOD-PLANNING',
        periodName: currentPeriod?.name || 'Kỳ Quy hoạch cán bộ nguồn',
      };

      await savePlanningVote(payload);
      toast.success(
        `Đã ghi nhận phiếu biểu quyết tín nhiệm cho đ/c ${selectedCandidate?.name} chức danh "${proposedRole}"!`
      );

      // Reset
      setCandidateId('');
      setComments('');
    } catch {
      toast.error('Có lỗi xảy ra khi lưu phiếu biểu quyết.');
    } finally {
      setSubmitting(false);
    }
  }, [candidateId, proposedRole, currentUser, role, selectedCandidate, voteChoice, comments, selectedPeriodId, currentPeriod, toast]);

  // Tổng hợp thống kê phiếu biểu quyết theo từng ứng viên
  const candidateStats = useMemo(() => {
    const map = {};
    const filteredVotes = votes.filter((v) => {
      if (!selectedPeriodId || selectedPeriodId === 'ALL') return true;
      return !v.periodId || v.periodId === selectedPeriodId;
    });

    filteredVotes.forEach((v) => {
      const cId = v.candidateId;
      if (!map[cId]) {
        map[cId] = {
          candidateName: v.candidateName,
          proposedRole: v.proposedRole,
          department: v.department,
          totalVotes: 0,
          high: 0,
          medium: 0,
          low: 0,
        };
      }
      map[cId].totalVotes += 1;
      if (v.vote === 'Tín nhiệm cao') map[cId].high += 1;
      else if (v.vote === 'Tín nhiệm') map[cId].medium += 1;
      else if (v.vote === 'Tín nhiệm thấp') map[cId].low += 1;
    });

    return Object.values(map).filter((stat) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        stat.candidateName?.toLowerCase().includes(term) ||
        stat.proposedRole?.toLowerCase().includes(term) ||
        stat.department?.toLowerCase().includes(term)
      );
    });
  }, [votes, selectedPeriodId, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Action Bar & Filter */}
      <PlanningActionBar
        periods={periods}
        selectedPeriodId={selectedPeriodId}
        setSelectedPeriodId={setSelectedPeriodId}
        totalVotes={votes.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Voting Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <PlanningVoteForm
            currentUser={currentUser}
            role={role}
            candidateId={candidateId}
            setCandidateId={setCandidateId}
            proposedRole={proposedRole}
            setProposedRole={setProposedRole}
            voteChoice={voteChoice}
            setVoteChoice={setVoteChoice}
            comments={comments}
            setComments={setComments}
            employees={employees}
            selectedCandidate={selectedCandidate}
            planningPositions={planningPositions}
            handleSubmit={handleSubmit}
            submitting={submitting}
          />
        </div>

        {/* Right Summary & Tally (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <PlanningTallyCard
            loading={loading}
            candidateStats={candidateStats}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          <PlanningGuidelinesCard />
        </div>
      </div>
    </div>
  );
};

export default PlanningVoteContainer;

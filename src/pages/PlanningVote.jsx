import React, { useState, useEffect, useMemo } from 'react';
import { 
  Vote, 
  UserCheck, 
  Send, 
  CheckCircle2, 
  ThumbsUp, 
  MinusCircle, 
  ThumbsDown, 
  Briefcase, 
  Award,
  Search,
  Filter,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PLANNING_POSITIONS as FALLBACK_PLANNING_POSITIONS } from '../lib/constants';
import { 
  savePlanningVote, 
  subscribePlanningVotes, 
  subscribeEmployees,
  subscribeSystemSettings
} from '../lib/services';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';

const PlanningVote = () => {
  const { currentUser, role } = useAuth();
  const toast = useToast();

  const [employees, setEmployees] = useState([]);
  const [votes, setVotes] = useState([]);
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
    return () => {
      unsubEmp();
      unsubSettings();
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

  // Ứng viên được chọn
  const selectedCandidate = useMemo(() => {
    return employees.find((e) => e.id === candidateId);
  }, [employees, candidateId]);

  const handleSubmit = async (e) => {
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
        voterId: currentUser.uid || currentUser.id,
        voterName: currentUser.name,
        voterRole: role,
        candidateId,
        candidateName: selectedCandidate.name,
        currentPosition: selectedCandidate.position,
        department: selectedCandidate.department,
        proposedRole: proposedRole.trim(),
        vote: voteChoice, // 'Tín nhiệm cao' | 'Tín nhiệm' | 'Tín nhiệm thấp'
        comments: comments.trim(),
      };

      await savePlanningVote(payload);
      toast.success(
        `Đã ghi nhận phiếu biểu quyết tín nhiệm cho đ/c ${selectedCandidate.name} chức danh "${proposedRole}"!`
      );

      // Reset
      setCandidateId('');
      setComments('');
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu phiếu biểu quyết.');
    } finally {
      setSubmitting(false);
    }
  };

  // Tổng hợp thống kê phiếu biểu quyết theo từng ứng viên
  const candidateStats = useMemo(() => {
    const map = {};
    votes.forEach((v) => {
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
    return Object.values(map);
  }, [votes]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0f766e] uppercase tracking-wider mb-1">
            <Vote className="w-4 h-4" />
            <span>Phân hệ Nghiệp vụ C</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Bỏ Phiếu Quy Hoạch Cán Bộ Nguồn
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Lấy ý kiến tín nhiệm bổ nhiệm và quy hoạch nhân sự cấp ủy, HĐQT, BKS và Ban điều hành
          </p>
        </div>

        <div className="bg-white px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2 text-xs self-start md:self-auto">
          <Award className="w-4 h-4 text-[#0f766e]" />
          <span className="font-bold text-slate-700">Tổng phiếu đã phát:</span>
          <span className="font-black text-[#0f766e] text-sm">{votes.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Voting Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card
            title="Phiếu Bỏ Phiếu Giới Thiệu Nhân Sự"
            subtitle="Chọn ứng viên, chức danh quy hoạch và bày tỏ mức độ tín nhiệm"
            className="border-teal-100 shadow-md"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Voter identity notice */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px]">Đại biểu biểu quyết:</span>
                  <span className="font-bold text-slate-800">{currentUser?.name}</span>
                </div>
                <Badge variant="primary" size="sm">
                  {currentUser?.position || role}
                </Badge>
              </div>

              {/* 1. Candidate Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  1. Chọn nhân sự quy hoạch <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                  placeholder="-- Chọn cán bộ đưa vào danh sách quy hoạch --"
                  options={employees.map((emp) => ({
                    value: emp.id,
                    label: `${emp.name} (${emp.code}) - ${emp.position} [${emp.department}]`,
                  }))}
                  required
                />
              </div>

              {/* Candidate Info Badge if selected */}
              {selectedCandidate && (
                <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 border border-teal-300 text-[#0f766e] font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                    {selectedCandidate.avatar ? (
                      <img
                        src={selectedCandidate.avatar}
                        alt={selectedCandidate.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedCandidate.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      {selectedCandidate.name} (Mã: {selectedCandidate.code})
                    </div>
                    <div className="text-[11px] text-teal-800">
                      Chức vụ hiện tại: {selectedCandidate.position} • {selectedCandidate.department}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Proposed Role */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  2. Chức danh quy hoạch / Đề xuất bổ nhiệm <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={proposedRole}
                    onChange={(e) => setProposedRole(e.target.value)}
                    placeholder="VD: Phó Giám đốc phụ trách Tín dụng"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
                    required
                  />

                  {/* Quick Pill options */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {planningPositions.slice(0, 6).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setProposedRole(pos)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                          proposedRole === pos
                            ? 'bg-[#0f766e] text-white border-[#0f766e]'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Radio Buttons for Voting: Tín nhiệm cao, Tín nhiệm, Tín nhiệm thấp */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  3. Ý kiến biểu quyết tín nhiệm <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: Tín nhiệm cao */}
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      voteChoice === 'Tín nhiệm cao'
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="voteOption"
                      value="Tín nhiệm cao"
                      checked={voteChoice === 'Tín nhiệm cao'}
                      onChange={() => setVoteChoice('Tín nhiệm cao')}
                      className="accent-emerald-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                        Tín nhiệm cao
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Rất ủng hộ
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Tín nhiệm */}
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      voteChoice === 'Tín nhiệm'
                        ? 'border-teal-500 bg-teal-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="voteOption"
                      value="Tín nhiệm"
                      checked={voteChoice === 'Tín nhiệm'}
                      onChange={() => setVoteChoice('Tín nhiệm')}
                      className="accent-teal-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <MinusCircle className="w-3.5 h-3.5 text-teal-600" />
                        Tín nhiệm
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Đồng ý đề xuất
                      </div>
                    </div>
                  </label>

                  {/* Option 3: Tín nhiệm thấp */}
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      voteChoice === 'Tín nhiệm thấp'
                        ? 'border-rose-500 bg-rose-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="voteOption"
                      value="Tín nhiệm thấp"
                      checked={voteChoice === 'Tín nhiệm thấp'}
                      onChange={() => setVoteChoice('Tín nhiệm thấp')}
                      className="accent-rose-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                        Tín nhiệm thấp
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Chưa phù hợp
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 4. Comments */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ý kiến nhận xét & Kiến nghị (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Ghi nhận phẩm chất chính trị, uy tín nội bộ và năng lực quy tụ của nhân sự..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={submitting}
                  icon={Send}
                  iconPosition="right"
                  className="w-full sm:w-auto font-bold px-8 shadow-md shadow-[#0f766e]/20"
                >
                  Gửi phiếu biểu quyết
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Summary & Tally (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card
            title="Kết Quả Bỏ Phiếu Quy Hoạch (Tổng Hợp)"
            subtitle="Tỷ lệ tín nhiệm theo từng nhân sự dự kiến"
          >
            {loading ? (
              <div className="py-12">
                <Spinner text="Đang cập nhật kết quả..." />
              </div>
            ) : candidateStats.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Chưa có phiếu biểu quyết nào được ghi nhận.
              </div>
            ) : (
              <div className="space-y-4">
                {candidateStats.map((stat, idx) => {
                  const highPercent = Math.round((stat.high / stat.totalVotes) * 100);
                  const medPercent = Math.round((stat.medium / stat.totalVotes) * 100);
                  const lowPercent = Math.round((stat.low / stat.totalVotes) * 100);

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {stat.candidateName}
                          </div>
                          <div className="text-[11px] text-[#0f766e] font-semibold">
                            Quy hoạch: {stat.proposedRole}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {stat.department}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {stat.totalVotes} phiếu
                        </span>
                      </div>

                      {/* Vote Progress Multi-Bar */}
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
                        <div
                          style={{ width: `${highPercent}%` }}
                          className="bg-emerald-500"
                          title={`Tín nhiệm cao: ${highPercent}%`}
                        />
                        <div
                          style={{ width: `${medPercent}%` }}
                          className="bg-teal-500"
                          title={`Tín nhiệm: ${medPercent}%`}
                        />
                        <div
                          style={{ width: `${lowPercent}%` }}
                          className="bg-rose-400"
                          title={`Tín nhiệm thấp: ${lowPercent}%`}
                        />
                      </div>

                      {/* Stats numbers */}
                      <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                        <span className="text-emerald-700 font-semibold">
                          Cao: {stat.high} ({highPercent}%)
                        </span>
                        <span className="text-teal-700 font-semibold">
                          Đạt: {stat.medium} ({medPercent}%)
                        </span>
                        <span className="text-rose-700 font-semibold">
                          Thấp: {stat.low} ({lowPercent}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Guidelines Note */}
          <Card className="bg-slate-50 border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-[#0f766e]" />
              Quy chế lấy phiếu tín nhiệm QTDND:
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Nhân sự đạt trên 50% số phiếu "Tín nhiệm cao" và "Tín nhiệm" sẽ đủ điều kiện hoàn thiện
              hồ sơ trình Ngân hàng Nhà nước Chi nhánh tỉnh thẩm định trước khi bổ nhiệm chính thức.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlanningVote;

import React from 'react';
import { 
  Send, 
  ThumbsUp, 
  MinusCircle, 
  ThumbsDown 
} from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Select from '../../../components/common/Select';
import Badge from '../../../components/common/Badge';

const PlanningVoteForm = ({
  currentUser,
  role,
  candidateId,
  setCandidateId,
  proposedRole,
  setProposedRole,
  voteChoice,
  setVoteChoice,
  comments,
  setComments,
  employees = [],
  selectedCandidate,
  planningPositions = [],
  handleSubmit,
  submitting = false,
}) => {
  return (
    <Card
      title="Phiếu Bỏ Phiếu Giới Thiệu Nhân Sự"
      subtitle="Chọn ứng viên, chức danh quy hoạch và bày tỏ mức độ tín nhiệm"
      className="border-teal-100 shadow-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Thông tin đại biểu */}
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
  );
};

export default React.memo(PlanningVoteForm);

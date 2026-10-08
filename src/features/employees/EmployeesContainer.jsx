import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DEPARTMENTS as FALLBACK_DEPARTMENTS } from '../../lib/constants';
import { subscribeEmployees, subscribeWorkHistory, subscribeDepartments } from '../../lib/services';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import EmployeeFilterToolbar from './components/EmployeeFilterToolbar';
import EmployeeCard from './components/EmployeeCard';
import WorkHistoryModal from './components/WorkHistoryModal';

const EmployeesContainer = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Quản lý Modal xem Lịch sử luân chuyển công tác
  const [selectedEmpHistory, setSelectedEmpHistory] = useState(null);
  const [empWorkHistory, setEmpWorkHistory] = useState([]);

  useEffect(() => {
    const unsubEmp = subscribeEmployees((list) => {
      setEmployees(list || []);
      setLoading(false);
    });
    const unsubDept = subscribeDepartments((list) => {
      if (list && list.length > 0) {
        setDepartments(list.map((d) => d.name));
      } else {
        setDepartments(FALLBACK_DEPARTMENTS);
      }
    });
    return () => {
      unsubEmp();
      unsubDept();
    };
  }, []);

  // Lắng nghe lịch sử luân chuyển khi mở modal cho 1 cán bộ
  useEffect(() => {
    if (!selectedEmpHistory) return;
    const unsub = subscribeWorkHistory(selectedEmpHistory.id, (list) => {
      setEmpWorkHistory(list || []);
    });
    return () => unsub();
  }, [selectedEmpHistory]);

  const handleOpenHistory = useCallback((emp) => {
    setSelectedEmpHistory(emp);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setSelectedEmpHistory(null);
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchDept = selectedDept === 'ALL' || emp.department === selectedDept;
      const matchSearch =
        !searchTerm.trim() ||
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [employees, selectedDept, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Filter toolbar */}
      <EmployeeFilterToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedDept={selectedDept}
        setSelectedDept={setSelectedDept}
        departments={departments}
        totalEmployees={employees.length}
      />

      {/* Loading & Grid of Employee Cards */}
      {loading && employees.length === 0 ? (
        <div className="py-20 flex justify-center items-center">
          <Spinner text="Đang đồng bộ hồ sơ cán bộ từ cơ sở dữ liệu..." />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-slate-500 text-sm">Không tìm thấy cán bộ nào phù hợp với điều kiện tìm kiếm.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              onOpenHistory={handleOpenHistory}
            />
          ))}
        </div>
      )}

      {/* Modal Xem Quá trình Luân chuyển công tác */}
      <WorkHistoryModal
        selectedEmp={selectedEmpHistory}
        onClose={handleCloseHistory}
        workHistory={empWorkHistory}
      />
    </div>
  );
};

export default EmployeesContainer;

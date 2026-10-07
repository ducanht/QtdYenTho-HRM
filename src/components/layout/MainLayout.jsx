import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { Database, Server } from 'lucide-react';
import AutoInitDbModal from '../common/AutoInitDbModal';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dbModalOpen, setDbModalOpen] = useState(false);
  const { isDemoMode } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Thông báo chế độ dữ liệu nội bộ ban đầu */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-amber-50 border-b border-teal-200/80 px-4 py-2 text-xs text-teal-950">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0f766e]"></span>
                </span>
                <span className="font-bold text-teal-950">
                  Chế độ Dữ Liệu Nội Bộ Ban Đầu (Local Engine):
                </span>
                <span className="text-teal-800 hidden md:inline">
                  Đã nạp đầy đủ danh bạ cán bộ, quá trình luân chuyển & 10 tiêu chí tín nhiệm Quỹ TDND Yên Thọ. Để kết nối Firebase thực tế, chỉ cần dán thông tin vào{' '}
                  <code className="bg-white/80 px-1.5 py-0.5 rounded border border-teal-300 font-mono text-[11px] text-[#0f766e] font-bold">
                    src/lib/firebase.js
                  </code>
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setDbModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0f766e] hover:bg-teal-800 text-white font-bold text-[11px] shadow-xs cursor-pointer transition-colors"
                >
                  <Database className="w-3 h-3" />
                  <span>Khởi tạo CSDL tự động</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Modal Tự động khởi tạo CSDL */}
      <AutoInitDbModal isOpen={dbModalOpen} onClose={() => setDbModalOpen(false)} />
    </div>
  );
};

export default MainLayout;

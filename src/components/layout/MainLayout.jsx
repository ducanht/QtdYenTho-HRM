import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { Info, KeyRound, ExternalLink, Sparkles } from 'lucide-react';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDemoMode } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Demo Mode Notification Banner (if firebaseConfig is empty) */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-amber-50 via-teal-50 to-emerald-50 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="font-semibold text-amber-900">
                  Chế độ trải nghiệm mô phỏng (Demo / Preview Mode):
                </span>
                <span className="text-amber-800 hidden md:inline">
                  Dữ liệu đã sẵn sàng để thử nghiệm đầy đủ 3 phân quyền. Để kết nối Firebase thực tế, hãy dán cấu hình vào{' '}
                  <code className="bg-white/80 px-1.5 py-0.5 rounded border border-amber-300 font-mono text-[11px] text-teal-800">
                    src/lib/firebase.js
                  </code>
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto text-[11px] font-semibold text-[#0f766e]">
                <span>QTDND Yên Thọ</span>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

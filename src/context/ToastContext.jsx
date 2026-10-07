import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast('success', msg, dur),
    error: (msg, dur) => addToast('error', msg, dur),
    info: (msg, dur) => addToast('info', msg, dur),
    warning: (msg, dur) => addToast('warning', msg, dur),
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-sky-500 shrink-0" />;
    }
  };

  const getToastStyle = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-100';
      case 'error':
        return 'border-rose-200 bg-rose-50 text-rose-900 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-100';
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:border-amber-800 dark:text-amber-100';
      default:
        return 'border-sky-200 bg-sky-50 text-sky-900 dark:bg-sky-950/80 dark:border-sky-800 dark:text-sky-100';
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Container Toast Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-top-2 ${getToastStyle(
              t.type
            )}`}
          >
            {getToastIcon(t.type)}
            <div className="flex-1 text-sm font-medium leading-snug">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

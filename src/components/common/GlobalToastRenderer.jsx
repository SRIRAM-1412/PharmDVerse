import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export const GlobalToastRenderer = () => {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleShow = (e) => {
      if (!e.detail) {
        setToast(null);
        return;
      }
      const id = Date.now();
      setToast({ ...e.detail, id });
      setTimeout(() => {
        setToast(prev => (prev?.id === id ? null : prev));
      }, e.detail.duration || 4000);
    };
    window.addEventListener('pharmdverse_global_toast', handleShow);
    return () => window.removeEventListener('pharmdverse_global_toast', handleShow);
  }, []);

  if (!toast) return null;

  const { type, message, x, y } = toast;

  let bg = 'bg-slate-900 border-slate-700 text-white';
  let Icon = Info;
  let iconColor = 'text-indigo-400';

  if (type === 'success') {
    bg = 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 shadow-emerald-500/20';
    Icon = CheckCircle2;
    iconColor = 'text-emerald-600 dark:text-emerald-400';
  } else if (type === 'error') {
    bg = 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-rose-500/20';
    Icon = XCircle;
    iconColor = 'text-rose-600 dark:text-rose-400';
  } else if (type === 'warning') {
    bg = 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100 shadow-amber-500/20';
    Icon = AlertTriangle;
    iconColor = 'text-amber-600 dark:text-amber-400';
  }
  
  // Smart Positioning
  const isRightSide = x > window.innerWidth / 2;
  const isBottomSide = y > window.innerHeight / 2;

  const style = {
    position: 'fixed',
    zIndex: 999999,
    maxWidth: '350px',
  };

  if (isBottomSide) {
    style.bottom = `${Math.max(10, window.innerHeight - y + 15)}px`;
  } else {
    style.top = `${Math.max(10, y + 15)}px`;
  }

  if (isRightSide) {
    style.right = `${Math.max(10, window.innerWidth - x + 15)}px`;
  } else {
    style.left = `${Math.max(10, x + 15)}px`;
  }

  return (
    <div 
      style={style}
      className={`p-3 rounded-2xl border shadow-xl flex items-start gap-2.5 text-xs font-extrabold animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 pointer-events-none ${bg}`}
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
      <span className="whitespace-pre-wrap break-words leading-relaxed">{message}</span>
    </div>
  );
};

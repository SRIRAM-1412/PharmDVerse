import React from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const LoginHeader = ({
  college,
  portalTitle,
  portalSubtitle,
  onClose,
  isSuperAdmin = false
}) => {
  const { platformSettings } = usePlatform();
  const collegeLogoUrl = college?.logoUrl || college?.college_logo_url;
  const collegeName = college?.name || college?.college_name || 'Pharmacy College';
  const collegeInitials = college?.initials || (collegeName ? collegeName.substring(0, 3).toUpperCase() : 'CLG');
  const platformName = platformSettings?.platform_name || 'PharmDVerse';

  return (
    <div className="flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 transition-colors">
      <div className="flex items-center gap-3 pr-2 min-w-0">
        {isSuperAdmin ? (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
        ) : collegeLogoUrl ? (
          <img
            src={collegeLogoUrl}
            alt={collegeName}
            className="w-10 h-10 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-0.5 shrink-0 shadow-xs transition-all hover:scale-105"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs border border-white/20">
            {collegeInitials}
          </div>
        )}

        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug truncate uppercase">
            {isSuperAdmin ? `${platformName} Master System` : collegeName}{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold capitalize">| {portalTitle}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
            {portalSubtitle}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0"
        aria-label="Close dialog"
        title="Close"
      >
        <X className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
};

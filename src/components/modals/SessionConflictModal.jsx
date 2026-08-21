import React from 'react';
import { ModalWrapper } from './ModalWrapper';
import { AlertTriangle, LogOut, X } from 'lucide-react';

export const SessionConflictModal = ({
  isOpen,
  onCancel,
  onForceContinue,
  loading = false,
  userRole = 'user'
}) => {
  if (!isOpen) return null;

  const roleTitle = userRole === 'student' ? 'Student' : userRole === 'preceptor' ? 'Preceptor' : 'College Admin';

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="max-w-md"
      title={`${roleTitle} Account Session Conflict`}
    >
      <div className="space-y-5 p-1 text-center">
        {/* WARNING ICON */}
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* PRIMARY CONFLICT MESSAGE */}
        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Your account is already logged in on another device.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            PharmDVerse allows only one active device session per account. Continuing will end the active session on your previous device.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onForceContinue}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>Log out previous device & Continue</span>
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

import React, { useState } from 'react';
import { User, Phone, Mail, Award, Briefcase, Building2, ShieldCheck } from 'lucide-react';
import { ChangePasswordSection } from '../common/ChangePasswordSection';
import { saveActiveSession } from '../../services/authService';

export const PreceptorProfileView = ({ preceptor, onLogout, forcePasswordReset = false }) => {
  const [preceptorState, setPreceptorState] = useState(preceptor);
  if (!preceptorState) return null;

  return (
    <div className="space-y-6 animate-fadeIn w-full min-w-0">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <span>My Preceptor Profile</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Read-only clinical preceptor profile and department credentials.
        </p>
      </div>

      <div className="space-y-6">
        {/* PROFILE HEADER CARD */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-6">
          {preceptorState.profile_photo_url ? (
            <img
              src={preceptorState.profile_photo_url}
              alt={preceptorState.full_name}
              className="w-24 h-24 rounded-3xl object-cover border-2 border-cyan-500 shadow-md shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-md shrink-0">
              {preceptorState.full_name ? preceptorState.full_name.substring(0, 2).toUpperCase() : 'PR'}
            </div>
          )}

          <div className="text-center sm:text-left space-y-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
              Clinical Preceptor
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-1">{preceptorState.full_name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{preceptorState.designation}</p>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-bold">
              <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Department
            </span>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{preceptorState.department}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-bold">
              <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Qualification
            </span>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{preceptorState.qualification}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-bold">
              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Mobile Contact
            </span>
            <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">{preceptorState.mobile_number}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-bold">
              <Mail className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              Registered Email (User ID)
            </span>
            <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">{preceptorState.email}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>🔒 Read-only profile view. To request changes, contact College Admin.</span>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          {forcePasswordReset && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-1">Password Reset Required</strong>
                Your college administrator has reset your password. You must set a new secure password before you can access the portal.
              </div>
            </div>
          )}
          <ChangePasswordSection
            user={preceptorState}
            userType="Preceptor"
            isForceReset={forcePasswordReset}
            onLogout={onLogout}
            onSuccess={(updatedPreceptor) => {
              setPreceptorState(updatedPreceptor);
              saveActiveSession({ viewMode: 'preceptor_portal', college: updatedPreceptor.colleges || preceptorState.colleges, user: updatedPreceptor });
            }}
          />
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Stethoscope, User, Phone, Mail, Award, Briefcase, Building2, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchStudentAssignedPreceptorFromSupabase } from '../../services/supabaseService';

export const StudentMyPreceptorView = ({ student }) => {
  const [assignedPreceptor, setAssignedPreceptor] = useState(null);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreceptor = async () => {
      if (!student) return;
      setLoading(true);
      const res = await fetchStudentAssignedPreceptorFromSupabase(student.id);
      if (res.success && res.data) {
        setAssignedPreceptor(res.data);
        setAssignmentDetails(res.assignment);
      }
      setLoading(false);
    };

    loadPreceptor();
  }, [student]);

  if (loading) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading Assigned Preceptor Details...</p>
      </div>
    );
  }

  if (!assignedPreceptor) {
    return (
      <div className="space-y-6 animate-fadeIn w-full min-w-0">
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>My Assigned Preceptor</span>
          </h2>
        </div>

        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <Stethoscope className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Active Preceptor Assigned
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            You do not have an active clinical preceptor assigned to your profile. Please contact your College Admin for allocation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn w-full min-w-0">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>My Assigned Preceptor</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
          Clinical preceptor assigned to review your student case logbook & ward rounds.
        </p>
      </div>

      {/* PRECEPTOR CARD */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100 dark:border-slate-800 text-center sm:text-left">
          {assignedPreceptor.profile_photo_url ? (
            <img
              src={assignedPreceptor.profile_photo_url}
              alt={assignedPreceptor.full_name}
              className="w-24 h-24 rounded-3xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-md shrink-0">
              {assignedPreceptor.full_name ? assignedPreceptor.full_name.substring(0, 2).toUpperCase() : 'PR'}
            </div>
          )}

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Assigned Preceptor
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                ● {assignedPreceptor.status}
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {assignedPreceptor.full_name}
            </h3>

            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {assignedPreceptor.designation} • {assignedPreceptor.department}
            </p>

            {assignmentDetails?.assignment_date && (
              <p className="text-[11px] text-slate-400 font-mono">
                Assigned Date: {assignmentDetails.assignment_date}
              </p>
            )}
          </div>
        </div>

        {/* PRECEPTOR DETAILS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Full Name</span>
            <strong className="text-slate-900 dark:text-white font-bold">{assignedPreceptor.full_name}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Qualification</span>
            <strong className="text-slate-900 dark:text-white font-bold">{assignedPreceptor.qualification}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Designation</span>
            <strong className="text-slate-900 dark:text-white font-bold">{assignedPreceptor.designation}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Department</span>
            <strong className="text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400">{assignedPreceptor.department}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Mobile Number</span>
            <strong className="text-slate-900 dark:text-white font-mono font-bold">{assignedPreceptor.mobile_number}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Email Address</span>
            <strong className="text-slate-900 dark:text-white font-mono font-bold">{assignedPreceptor.email}</strong>
          </div>
        </div>

      </div>
    </div>
  );
};

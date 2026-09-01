import React, { useState, useEffect } from 'react';
import { UserCheck, Stethoscope, GraduationCap, Building2, ShieldCheck, ArrowRight, FolderKanban, Send, FileSearch, RotateCcw, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { fetchPreceptorAssignedStudentsFromSupabase, fetchAllPreceptorCasesFromSupabase } from '../../services/supabaseService';
import { WorkflowReferencePanel } from '../common/WorkflowReferencePanel';

export const PharmacologyPreceptorDashboardView = ({ preceptor, onNavigate }) => {
  const [assignedCount, setAssignedCount] = useState(0);
  const [loadingAssigned, setLoadingAssigned] = useState(true);

  const [records, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!preceptor?.id) return;

      setLoadingAssigned(true);
      const res = await fetchPreceptorAssignedStudentsFromSupabase(preceptor.id);
      if (res.success) {
        setAssignedCount((res.data || []).length);
      }
      setLoadingAssigned(false);

      setLoadingCases(true);
      const caseRes = await fetchAllPreceptorCasesFromSupabase(preceptor.id);
      if (caseRes.success) {
        setCases(caseRes.data || []);
      }
      setLoadingCases(false);
    };

    loadStats();
  }, [preceptor?.id]);

  // Compute real-time case status counts
  const getEffectiveCaseStatus = (c) => c?.status || c?.overall_case_status || 'Draft';
  const totalCasesCount = records.length;
  const submittedCount = records.filter(c => getEffectiveCaseStatus(c) === 'Submitted').length;
  const underReviewCount = records.filter(c => getEffectiveCaseStatus(c) === 'Under Review').length;
  const returnedCount = records.filter(c => getEffectiveCaseStatus(c) === 'Returned').length;
  const approvedCount = records.filter(c => getEffectiveCaseStatus(c) === 'Approved').length;

  const summaryCards = [
    {
      id: 'total_records',
      title: 'Total Practical Records',
      count: totalCasesCount,
      filter: 'All',
      target: 'evaluate-practicals',
      icon: FolderKanban,
      iconColor: 'text-slate-700 dark:text-slate-300',
      badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      borderLeft: 'border-l-slate-600',
      description: 'Total practical records submitted across all assigned candidates',
      loading: loadingCases
    },
    {
      id: 'submitted',
      title: 'Submitted Records',
      count: submittedCount,
      filter: 'Submitted',
      target: 'evaluate-practicals',
      icon: Send,
      iconColor: 'text-blue-600 dark:text-blue-400',
      badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      borderLeft: 'border-l-blue-500',
      description: 'Submitted records awaiting preceptor review',
      loading: loadingCases
    },
    {
      id: 'under_review',
      title: 'Under Review Records',
      count: underReviewCount,
      filter: 'Under Review',
      target: 'evaluate-practicals',
      icon: FileSearch,
      iconColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      borderLeft: 'border-l-amber-500',
      description: 'Cases currently open in evaluation workspace',
      loading: loadingCases
    },
    {
      id: 'returned',
      title: 'Returned Records',
      count: returnedCount,
      filter: 'Returned',
      target: 'evaluate-practicals',
      icon: RotateCcw,
      iconColor: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      borderLeft: 'border-l-rose-500',
      description: 'Returned to student for corrections',
      loading: loadingCases
    },
    {
      id: 'approved',
      title: 'Approved Records',
      count: approvedCount,
      filter: 'Approved',
      target: 'evaluate-practicals',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      borderLeft: 'border-l-emerald-500',
      description: 'Verified and signed off practical records',
      loading: loadingCases
    }
  ];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 animate-fadeIn w-full">
      {/* WELCOME CARD WITH TOP-RIGHT WORKFLOW PANEL */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-50 via-slate-50 to-purple-50/50 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-purple-950/30 text-slate-900 dark:text-white relative overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start gap-6 flex-1 min-w-0">
            {preceptor?.profile_photo_url ? (
              <img
                src={preceptor.profile_photo_url}
                alt={preceptor.full_name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-purple-400/60 shadow-md p-0.5 bg-white dark:bg-slate-800 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-md border-2 border-purple-400/60 shrink-0">
                {preceptor?.full_name ? preceptor.full_name.substring(0, 2).toUpperCase() : 'PR'}
              </div>
            )}

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <Stethoscope className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Preceptor Portal
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{preceptor?.colleges?.college_name || 'Pharmacy College'}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Welcome, {preceptor?.full_name}
              </h1>

              <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Designation: </span>
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">{preceptor?.designation || 'Faculty Preceptor'}</strong>
                </div>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Department: </span>
                  <strong className="text-purple-700 dark:text-purple-400 font-bold">{preceptor?.department || 'Pharmacy Practice'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* TOP RIGHT WORKFLOW PANEL */}
          <WorkflowReferencePanel role="preceptor" />
        </div>
      </div>

      {/* TOP STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div
          onClick={() => onNavigate('assigned-students')}
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group border-l-4 border-l-cyan-500"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center shadow-xs">
              <GraduationCap className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="mt-5">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {loadingAssigned ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : assignedCount}
            </span>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">
              Total Assigned Students
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pharmacy students currently allocated under your preceptorship.
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('profile')}
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group border-l-4 border-l-indigo-500"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="mt-5">
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              ● Active Account
            </span>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">
              My Evaluator Profile
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              View your read-only profile & academic department credentials.
            </p>
          </div>
        </div>
      </div>

      {/* CLINICAL CASE REVIEW SUMMARY CARDS */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Practical Record Review Workflow</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Click card to review records</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {summaryCards.map((card) => {
            const IconComp = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigate(card.target || 'evaluate-practicals', card.filter)}
                className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group border-l-4 ${card.borderLeft}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-xs">
                      <IconComp className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${card.badgeBg}`}>
                      {card.filter}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {card.loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : card.count}
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-normal">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  <span>Review Records</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TIER 2: SUBJECT-WISE QUEUE (To-Do List) */}
      <div className="space-y-4 pt-6 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Subject-Wise Grading Queue</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Select a subject to begin grading</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* General Pharma */}
          <div
            onClick={() => onNavigate('evaluate-practicals', 'general-pharma')}
            className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">Queue</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2 leading-tight">
                General Pharmacology Practicals
              </h3>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">0</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pending Evaluation</span>
            </div>
          </div>

          {/* Systemic Pharma 1 */}
          <div
            onClick={() => onNavigate('evaluate-practicals', 'systemic-pharma-1')}
            className="p-6 rounded-3xl bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-slate-900 border border-purple-100 dark:border-purple-900/50 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400">Queue</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2 leading-tight">
                Systemic Pharmacology-I Practicals
              </h3>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-600 dark:text-purple-400">0</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pending Evaluation</span>
            </div>
          </div>

          {/* Systemic Pharma 2 */}
          <div
            onClick={() => onNavigate('evaluate-practicals', 'systemic-pharma-2')}
            className="p-6 rounded-3xl bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-slate-900 border border-blue-100 dark:border-blue-900/50 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">Queue</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2 leading-tight">
                Systemic Pharmacology-II Practicals
              </h3>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">0</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pending Evaluation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

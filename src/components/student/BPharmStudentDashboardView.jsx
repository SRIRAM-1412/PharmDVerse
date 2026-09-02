import React, { useState, useEffect } from 'react';
import { UserCheck, Stethoscope, ArrowRight, ShieldCheck, FolderKanban, FileEdit, Send, FileSearch, RotateCcw, CheckCircle2, Loader2 } from 'lucide-react';
import { fetchStudentAssignedPreceptorFromSupabase, fetchStudentCasesFromSupabase } from '../../services/supabaseService';
import { WorkflowReferencePanel } from '../common/WorkflowReferencePanel';

export const BPharmStudentDashboardView = ({ student, onNavigate, isExpired }) => {
  const [assignedPreceptor, setAssignedPreceptor] = useState(null);
  const [loadingPreceptor, setLoadingPreceptor] = useState(true);

  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!student?.id) return;
      
      setLoadingPreceptor(true);
      const precRes = await fetchStudentAssignedPreceptorFromSupabase(student.id);
      if (precRes.success && precRes.data) {
        setAssignedPreceptor(precRes.data);
      }
      setLoadingPreceptor(false);

      setLoadingCases(true);
      const caseRes = await fetchStudentCasesFromSupabase(student.id);
      if (caseRes.success) {
        setCases(caseRes.data || []);
      }
      setLoadingCases(false);
    };

    loadData();
  }, [student?.id]);

  // Compute real-time case status counts
  const getEffectiveCaseStatus = (c) => c?.status || c?.overall_case_status || 'Draft';
  const totalCount = cases.length;
  const draftCount = cases.filter(c => getEffectiveCaseStatus(c) === 'Draft').length;
  const submittedCount = cases.filter(c => getEffectiveCaseStatus(c) === 'Submitted').length;
  const underReviewCount = cases.filter(c => getEffectiveCaseStatus(c) === 'Under Review').length;
  const returnedCount = cases.filter(c => getEffectiveCaseStatus(c) === 'Returned').length;
  const approvedCount = cases.filter(c => getEffectiveCaseStatus(c) === 'Approved').length;

  const summaryCards = [
    {
      id: 'all',
      title: 'Total Practical Records',
      count: totalCount,
      filter: 'All',
      icon: FolderKanban,
      iconColor: 'text-slate-700 dark:text-slate-300',
      badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      borderLeft: 'border-l-slate-600',
      description: 'All logged practical records across laboratory sessions'
    },
    {
      id: 'draft',
      title: 'Draft Records',
      count: draftCount,
      filter: 'Draft',
      icon: FileEdit,
      iconColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      borderLeft: 'border-l-amber-500',
      description: 'Saved drafts — not yet submitted to evaluator'
    },
    {
      id: 'submitted',
      title: 'Submitted / Under Review',
      count: submittedCount + underReviewCount,
      filter: 'Submitted',
      icon: Send,
      iconColor: 'text-blue-600 dark:text-blue-400',
      badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      borderLeft: 'border-l-blue-500',
      description: 'Awaiting evaluator evaluation and approval'
    },
    {
      id: 'returned',
      title: 'Returned for Changes',
      count: returnedCount,
      filter: 'Returned',
      icon: RotateCcw,
      iconColor: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      borderLeft: 'border-l-rose-500',
      description: 'Requires student modifications & resubmission'
    },
    {
      id: 'approved',
      title: 'Approved Records',
      count: approvedCount,
      filter: 'Approved',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      borderLeft: 'border-l-emerald-500',
      description: 'Verified and signed off by evaluator'
    }
  ];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 animate-fadeIn w-full">
      {/* WELCOME CARD WITH TOP-RIGHT WORKFLOW PANEL */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-50 via-slate-50 to-emerald-50/50 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-emerald-950/30 text-slate-900 dark:text-white relative overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start gap-6 flex-1 min-w-0">
            {student?.profile_photo_url ? (
              <img
                src={student.profile_photo_url}
                alt={student.full_name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400/60 shadow-md p-0.5 bg-white dark:bg-slate-800 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md border-2 border-emerald-400/60 shrink-0">
                {student?.full_name ? student.full_name.substring(0, 2).toUpperCase() : 'ST'}
              </div>
            )}

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Student Logbook Portal
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">Roll: {student?.roll_number}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Welcome, {student?.full_name}
              </h1>

              <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Course: </span>
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">{student?.course} ({student?.year})</strong>
                </div>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Batch: </span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">{student?.batch}</strong>
                </div>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">College: </span>
                  <strong className="text-slate-900 dark:text-slate-100">{student?.colleges?.college_name || 'Pharmacy College'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* TOP RIGHT WORKFLOW PANEL */}
          <WorkflowReferencePanel role="student" />
        </div>
      </div>

      {/* TOP ACADEMIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* ASSIGNED PRECEPTOR CARD */}
        <div
          onClick={() => onNavigate('my-preceptor')}
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group border-l-4 border-l-emerald-500"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shadow-xs">
              <Stethoscope className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="mt-5">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Assigned Evaluator:</span>
            {loadingPreceptor ? (
              <p className="text-base font-bold text-slate-400 mt-1">Loading preceptor...</p>
            ) : assignedPreceptor ? (
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {assignedPreceptor.full_name}
                </h3>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {assignedPreceptor.designation} • {assignedPreceptor.department}
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  No Active Preceptor Assigned
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Contact College Admin to get assigned to a lab evaluator.</p>
              </div>
            )}
          </div>
        </div>

        {/* MY PROFILE CARD */}
        <div
          onClick={() => onNavigate('profile')}
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group border-l-4 border-l-teal-500"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="mt-5">
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              ● Active Candidate
            </span>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">
              My Student Profile
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              View your enrolled academic year, roll number, and contact details.
            </p>
          </div>
        </div>
      </div>

      {/* CLINICAL WORKFLOW SUMMARY CARDS */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Practical Record Workflow Overview</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Click card to filter records</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {summaryCards.map((card) => {
            const IconComp = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigate('my-cases', card.filter)}
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
                      {loadingCases ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : card.count}
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-normal">
                      {card.description}
                    </p>
                  </div>
                </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  <span>View Records</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TIER 2: SUBJECT-WISE PROGRESS CARDS */}
      <div className="space-y-4 pt-6 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Subject-Wise Progress</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Select a subject to begin logging</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* General Pharma */}
          <div
            onClick={() => !isExpired && onNavigate('general-pharma')}
            className={`p-6 rounded-3xl bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 shadow-sm flex flex-col justify-between group ${isExpired ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-lg transition-all duration-300 cursor-pointer'}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">Subject</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2 leading-tight">
                General Pharmacology Practicals
              </h3>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">0</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Records Logged</span>
            </div>
          </div>

          {/* Systemic Pharma 1 */}
          <div
            onClick={() => !isExpired && onNavigate('systemic-pharma-1')}
            className={`p-6 rounded-3xl bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-slate-900 border border-purple-100 dark:border-purple-900/50 shadow-sm flex flex-col justify-between group ${isExpired ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-lg transition-all duration-300 cursor-pointer'}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400">Subject</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2 leading-tight">
                Systemic Pharmacology-I Practicals
              </h3>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-600 dark:text-purple-400">0</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Records Logged</span>
            </div>
          </div>

          {/* Systemic Pharma 2 */}
          <div
            onClick={() => !isExpired && onNavigate('systemic-pharma-2')}
            className={`p-6 rounded-3xl bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-slate-900 border border-blue-100 dark:border-blue-900/50 shadow-sm flex flex-col justify-between group ${isExpired ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-lg transition-all duration-300 cursor-pointer'}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">Subject</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2 leading-tight">
                Systemic Pharmacology-II Practicals
              </h3>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">0</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Records Logged</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

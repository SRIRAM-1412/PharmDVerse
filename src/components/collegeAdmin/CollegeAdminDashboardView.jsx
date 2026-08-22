import React, { useState, useEffect } from 'react';
import { User, UserCheck, GraduationCap, Building2, Plus, ArrowRight, ShieldCheck, CheckCircle2, MapPin, Award, Sparkles, FolderKanban, FileEdit, Send, FileSearch, RotateCcw, Loader2 } from 'lucide-react';
import { fetchPreceptorsFromSupabase, fetchStudentsFromSupabase, fetchAllCollegeClinicalCasesFromSupabase } from '../../services/supabaseService';
import { WorkflowReferencePanel } from '../common/WorkflowReferencePanel';

export const CollegeAdminDashboardView = ({ college, onNavigate }) => {
  const [preceptorsCount, setPreceptorsCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!college?.id) return;

      setLoadingUsers(true);
      const [precRes, studRes] = await Promise.all([
        fetchPreceptorsFromSupabase(college.id),
        fetchStudentsFromSupabase(college.id)
      ]);

      if (precRes.success) setPreceptorsCount((precRes.data || []).length);
      if (studRes.success) setStudentsCount((studRes.data || []).length);
      setLoadingUsers(false);

      setLoadingCases(true);
      const caseRes = await fetchAllCollegeClinicalCasesFromSupabase(college.id);
      if (caseRes.success) {
        setCases(caseRes.data || []);
      }
      setLoadingCases(false);
    };

    loadStats();
  }, [college?.id]);

  // Compute real-time case status counts
  const totalCount = cases.length;
  const draftCount = cases.filter(c => (c.status === 'Draft' || c.overall_case_status === 'Draft')).length;
  const submittedCount = cases.filter(c => (c.status === 'Submitted' || c.overall_case_status === 'Submitted')).length;
  const underReviewCount = cases.filter(c => (c.status === 'Under Review' || c.overall_case_status === 'Under Review')).length;
  const returnedCount = cases.filter(c => (c.status === 'Returned' || c.overall_case_status === 'Returned')).length;
  const approvedCount = cases.filter(c => (c.status === 'Approved' || c.overall_case_status === 'Approved')).length;

  const userStats = [
    {
      title: 'Total Preceptors',
      value: loadingUsers ? <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> : preceptorsCount,
      subtitle: 'Clinical Evaluators & Doctors',
      icon: User,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900',
      target: 'preceptors-list'
    },
    {
      title: 'Total Students',
      value: loadingUsers ? <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> : studentsCount,
      subtitle: 'Enrolled Pharm.D Candidates',
      icon: GraduationCap,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
      target: 'students-list'
    }
  ];

  const summaryCards = [
    {
      id: 'approved_cases',
      title: 'Approved Cases',
      count: approvedCount,
      filter: 'Approved',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      borderLeft: 'border-l-emerald-500',
      description: 'Officially approved clinical case logbook entries across all departments'
    }
  ];

  const collegeObj = {
    name: college?.college_name || college?.name || 'Pharmacy College',
    code: college?.college_code || college?.code || 'CLG-001',
    city: college?.city || '',
    state: college?.state || '',
    district: college?.district || '',
    pciApprovalNo: college?.pci_approval_number || college?.pciApprovalNo || 'Verified',
    logoUrl: college?.college_logo_url || college?.logoUrl || college?.logo_url,
    initials: college?.college_name ? college.college_name.split(' ').map(n => n[0]).join('').substring(0, 3) : 'CLG',
    description: college?.description || ''
  };

  return (
    <div className="space-y-8 animate-fadeIn w-full">
      
      {/* COLLEGE BRANDING BANNER WITH TOP-RIGHT WORKFLOW PANEL */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/70 dark:from-[#0f172a] dark:via-slate-900 dark:to-emerald-950/40 text-slate-900 dark:text-white relative overflow-hidden shadow-md border border-slate-200/80 dark:border-slate-800">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start gap-6 flex-1 min-w-0">
            {collegeObj?.logoUrl ? (
              <img
                src={collegeObj.logoUrl}
                alt={collegeObj.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-contain bg-white p-2 border-2 border-emerald-400/60 shadow-md shrink-0"
              />
            ) : (
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${collegeObj?.logoBg || 'from-emerald-500 to-teal-600'} flex items-center justify-center text-white font-extrabold text-xl shadow-md border-2 border-emerald-400/60 shrink-0`}>
                {collegeObj?.initials || 'CLG'}
              </div>
            )}

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  College Admin Dashboard
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold">Code: {collegeObj?.code}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {collegeObj?.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {collegeObj?.description ? collegeObj.description : 'No college description provided.'}
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{[collegeObj?.city, collegeObj?.district, collegeObj?.state].filter(Boolean).join(', ')}</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>PCI: {collegeObj?.pciApprovalNo || 'Verified'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TOP RIGHT WORKFLOW PANEL */}
          <WorkflowReferencePanel role="college_admin" />
        </div>
      </div>

      {/* TOP USER ACADEMIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {userStats.map((st, i) => {
          const IconComponent = st.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigate(st.target)}
              className={`p-6 rounded-3xl border shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group ${st.bg}`}
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-xs">
                  <IconComponent className={`w-6 h-6 ${st.color}`} />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="mt-5">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {st.value}
                </span>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                  {st.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {st.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CLINICAL CASE MANAGEMENT SUMMARY CARDS */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Institutional Clinical Case Workflow</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Click card to manage cases</span>
        </div>

        <div className="grid grid-cols-1 max-w-xl gap-6">
          {summaryCards.map((card) => {
            const IconComp = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigate('clinical-cases', card.filter)}
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
                  <span>Manage Cases</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK ACTIONS SECTION */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Quick Admin Workflows</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('add-preceptor')}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 text-left transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-xs">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <strong className="block text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              Add New Preceptor
            </strong>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Register hospital evaluator
            </span>
          </button>

          <button
            onClick={() => onNavigate('preceptors-list')}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 text-left transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <strong className="block text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Preceptor Directory
            </strong>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Manage clinical faculty
            </span>
          </button>

          <button
            onClick={() => onNavigate('add-student')}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-800 text-left transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center mb-3 shadow-xs">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <strong className="block text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
              Add New Student
            </strong>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Enroll Pharm.D candidate
            </span>
          </button>

          <button
            onClick={() => onNavigate('students-list')}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-800 text-left transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-3 shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <strong className="block text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
              Student Directory
            </strong>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Manage candidate logbooks
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

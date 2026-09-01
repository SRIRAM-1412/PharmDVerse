import React, { useState } from 'react';
import { 
  Building2, ShieldCheck, Users, LogIn, PlusCircle, FolderKanban, 
  FileText, ClipboardCheck, Sparkles, RotateCcw, Send, Eye, 
  CheckCircle2, FileDown, Stethoscope, Lock, Database, ArrowRight,
  FlaskConical, FileSearch, Pill, Landmark, Check, Layers
} from 'lucide-react';

export const PlatformWorkflowSection = () => {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <section id="workflow" className="py-16 md:py-24 bg-slate-100/70 dark:bg-[#070b15] border-y border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-emerald-500/5 via-indigo-500/5 to-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full px-4 sm:px-8 lg:px-12 relative z-10 space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300/70 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold tracking-wide shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>End-to-End Clinical ERP Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            How <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 dark:from-emerald-400 dark:via-teal-300 dark:to-sky-400">PharmDVerse</span> Works
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            One connected workflow from institutional onboarding to clinical case documentation, AI analysis, preceptor review, approval, and final certified PDF & PPT document generation.
          </p>
        </div>

        {/* 4 CONNECTED PLATFORM PHASES */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Complete 4-Phase Platform Lifecycle</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              100% Implemented Application Workflow
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* PHASE 1 */}
            <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-md backdrop-blur-sm flex flex-col justify-between space-y-4 group hover:border-indigo-500/50 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Phase 1
                  </span>
                  <Building2 className="w-5 h-5 text-indigo-500" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Institutional Foundation
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-normal">
                  Onboarding and governance of pharmacy colleges, faculty, and student rosters.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs font-semibold">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                    <span>College Registration</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                    <span>Super Admin Approval</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                    <span>College Admin Setup</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                    <span>Preceptor & Student Management</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">5</span>
                    <span>Student–Preceptor Assignment</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PHASE 2 */}
            <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-md backdrop-blur-sm flex flex-col justify-between space-y-4 group hover:border-emerald-500/50 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Phase 2
                  </span>
                  <FileText className="w-5 h-5 text-emerald-500" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Student Clinical Workflow
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-normal">
                  Comprehensive patient documentation, AI clinical analysis, and pre-submission review.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs font-semibold">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                    <span>Student Login & Add Case</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                    <span>Clinical Documentation & Save</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                    <span>AI Clinical Case Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                    <span>Pre-Submission Review & Modify</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0">5</span>
                    <span>Submit & Track Status</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PHASE 3 */}
            <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-md backdrop-blur-sm flex flex-col justify-between space-y-4 group hover:border-amber-500/50 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Phase 3
                  </span>
                  <Stethoscope className="w-5 h-5 text-amber-500" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Preceptor Review
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-normal">
                  Faculty preceptor evaluation, revision request feedback, or case locking.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs font-semibold">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                    <span>Preceptor Login</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                    <span>Assigned Students & Cases</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                    <span>Review Clinical Documentation</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                    <span>Approve / Return for Revision</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">5</span>
                    <span>Approved & Locked</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PHASE 4 */}
            <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-md backdrop-blur-sm flex flex-col justify-between space-y-4 group hover:border-purple-500/50 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Phase 4
                  </span>
                  <FileDown className="w-5 h-5 text-purple-500" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Final Documentation
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-normal">
                  Export of official institutional clinical case portfolios and presentation slides.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs font-semibold">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                    <span>Verified Approved Case</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                    <span>Official PDF Case Record</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                    <span>PPT Presentation Generation</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                    <span>Institutional Archival</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SUPPORTING SYSTEMS & MASTER KNOWLEDGE VISUAL */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-sky-500/15 dark:from-slate-900 dark:via-slate-800/90 dark:to-teal-950/60 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white shadow-xl relative overflow-hidden border border-emerald-200/80 dark:border-slate-700/60 space-y-6">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-200/60 dark:border-slate-700/80 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 text-xs font-semibold mb-2">
                <Database className="w-3.5 h-3.5" />
                <span>Super Admin Foundation & Knowledge Architecture</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Powered by PharmDVerse Master Knowledge Systems
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md font-normal leading-relaxed">
              Super Admin maintains centralized, authoritative master knowledge repositories that ground AI synthesis and clinical learning across all pharmacy colleges.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700/80 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                <Pill className="w-4 h-4 shrink-0" />
                <span>Drug Knowledge Master</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                683+ verified drug monographs powering Section 4A & 4B pharmacology, dosing, contraindications, and interactions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700/80 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-extrabold text-xs">
                <FlaskConical className="w-4 h-4 shrink-0" />
                <span>Lab Parameter Master</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                62+ laboratory parameters with reference ranges, evaluation types, and clinical significance powering Section 3 analysis.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700/80 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-extrabold text-xs">
                <FileSearch className="w-4 h-4 shrink-0" />
                <span>Other Investigation Master</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Controlled diagnostic & radiological knowledge (ECG, ECHO, USG, CT, MRI, Endoscopy) for Section 4B context synthesis.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700/80 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-extrabold text-xs">
                <Layers className="w-4 h-4 shrink-0" />
                <span>Drug Interaction Master</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Authoritative Section 5A Drug–Drug & Section 5B Drug–Food interaction repositories with severity & management controls.
              </p>
            </div>

          </div>
        </div>

        {/* ROLE-BASED SUMMARY CARDS */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Role-Based Governance & Execution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Four distinct roles working in complete synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Student Card */}
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold text-sm">
                <Users className="w-4 h-4" />
                <span>STUDENT</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Create, document, analyze, review and submit clinical cases and practicals for faculty evaluation.
              </p>
            </div>

            {/* Preceptor Card */}
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                <Stethoscope className="w-4 h-4" />
                <span>PRECEPTOR</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Review assigned clinical cases and practicals, return for corrections or approve and lock cases.
              </p>
            </div>

            {/* College Admin Card */}
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-extrabold text-sm">
                <Landmark className="w-4 h-4" />
                <span>COLLEGE ADMIN</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Manage students, preceptors, assignments, cases, monitoring and institutional document formats.
              </p>
            </div>

            {/* Super Admin Card */}
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>SUPER ADMIN</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Govern the platform, approve colleges and maintain centralized clinical knowledge masters.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

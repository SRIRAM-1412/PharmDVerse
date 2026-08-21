import React, { useState, Component } from 'react';
import {
  LogIn, PlusCircle, FolderKanban, FileText, ClipboardCheck, Send,
  Eye, CheckCircle2, FileDown, Stethoscope, Users, FileSearch,
  Lock, Building2, LayoutDashboard, Landmark, BarChart3, ShieldCheck,
  Maximize2, X, Info, AlertCircle, ArrowRight, RotateCcw, Check, Sparkles, Sliders, AlertTriangle
} from 'lucide-react';

class PanelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('[WorkflowReferencePanel Error Caught]:', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 text-center text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl">
          Workflow Diagram Reference
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Native Vector Workflow Reference Component (No static images used).
 * Displays clean, interactive, responsive workflow diagrams for Student, Preceptor, and College Admin roles.
 */
export const WorkflowReferencePanel = ({ role = 'student' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Student Steps (11 Sequential Steps)
  const studentSteps = [
    { title: 'Student Login', icon: LogIn, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' },
    { title: 'Add New Case', icon: PlusCircle, bg: 'bg-blue-500 text-white shadow-xs' },
    { title: 'My Clinical Cases', icon: FolderKanban, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' },
    { title: 'Clinical Documentation', icon: FileText, bg: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300' },
    { title: 'Save Forms', icon: ClipboardCheck, bg: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300' },
    { title: 'AI Case Analysis', icon: Sparkles, bg: 'bg-emerald-500 text-white shadow-xs' },
    { title: 'Pre-Submission Review / Review & Modify', icon: RotateCcw, bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' },
    { title: 'Submit', icon: Send, bg: 'bg-amber-500 text-white shadow-xs' },
    { title: 'Track Status', icon: Eye, bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300' },
    { title: 'Approved Case', icon: CheckCircle2, bg: 'bg-emerald-600 text-white shadow-xs' },
    { title: 'PDF / PPT', icon: FileDown, bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' }
  ];

  // Preceptor Steps (6 Sequential Steps)
  const preceptorSteps = [
    { title: 'Preceptor Login', icon: Stethoscope, bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' },
    { title: 'Assigned Students & Cases', icon: Users, bg: 'bg-emerald-600 text-white shadow-xs' },
    { title: 'Review Clinical Documentation', icon: FileSearch, bg: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300' },
    { title: 'Approve / Return', icon: RotateCcw, bg: 'bg-amber-500 text-white shadow-xs' },
    { title: 'Approved & Locked', icon: Lock, bg: 'bg-emerald-600 text-white shadow-xs' },
    { title: 'Download PDF/PPT', icon: FileDown, bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' }
  ];

  // Admin Steps (7 Sequential Steps)
  const adminSteps = [
    { title: 'Admin Login', icon: Building2, bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300' },
    { title: 'Dashboard', icon: LayoutDashboard, bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' },
    { title: 'Preceptor & Student Management', icon: Users, bg: 'bg-purple-600 text-white shadow-xs' },
    { title: 'Assignment & All Cases', icon: Landmark, bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' },
    { title: 'Case Status & Monitoring', icon: BarChart3, bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300' },
    { title: 'Approved Cases', icon: ShieldCheck, bg: 'bg-emerald-600 text-white shadow-xs' },
    { title: 'Download PDF/PPT', icon: FileDown, bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300' }
  ];

  const getRoleConfig = () => {
    switch (role) {
      case 'preceptor':
        return {
          title: 'Preceptor Review Workflow',
          badge: 'Preceptor Guide',
          themeBorder: 'border-emerald-200 dark:border-emerald-900',
          themeBg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
          badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          steps: preceptorSteps
        };
      case 'college_admin':
        return {
          title: 'College Admin Workflow',
          badge: 'Admin Guide',
          themeBorder: 'border-purple-200 dark:border-purple-900',
          themeBg: 'bg-purple-50/80 dark:bg-purple-950/40',
          badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-300 border-purple-300 dark:border-purple-700',
          btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
          steps: adminSteps
        };
      case 'student':
      default:
        return {
          title: 'Student Workflow Guide',
          badge: 'Student Guide',
          themeBorder: 'border-blue-200 dark:border-blue-900',
          themeBg: 'bg-blue-50/80 dark:bg-blue-950/40',
          badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-300 border-blue-300 dark:border-blue-700',
          btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
          steps: studentSteps
        };
    }
  };

  const config = getRoleConfig();

  return (
    <PanelErrorBoundary>
      {/* COMPACT TOP RIGHT WORKFLOW CARD */}
      <div className={`p-3.5 rounded-2xl border ${config.themeBorder} ${config.themeBg} shadow-xs flex flex-col justify-between space-y-3 w-full max-w-sm sm:max-w-md ml-auto shrink-0 relative overflow-hidden transition-all duration-200 hover:shadow-md`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${config.badgeBg} shrink-0`}>
              {config.badge}
            </span>
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate">
              {config.title}
            </h4>
          </div>

          <button
            onClick={() => setIsExpanded(true)}
            className={`px-3 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${config.btnBg}`}
            title="Expand Interactive Workflow Diagram"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Expand</span>
          </button>
        </div>

        {/* NATIVE VECTOR STEP PIPELINE PREVIEW */}
        <div
          onClick={() => setIsExpanded(true)}
          className="w-full p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 cursor-pointer group shadow-inner transition-all hover:border-emerald-400 dark:hover:border-emerald-700"
        >
          <div className="grid grid-cols-5 gap-2 items-center">
            {config.steps.slice(0, 5).map((st, idx) => {
              const IconComp = st.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center gap-1 min-w-0">
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-xl ${st.bg} flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[8px] font-black flex items-center justify-center shadow-xs">
                      {idx + 1}
                    </span>
                  </div>
                  <span className="text-[9.5px] font-extrabold text-slate-700 dark:text-slate-300 leading-tight w-full truncate text-center">
                    {st.title}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <Sparkles className="w-3 h-3" /> Step-by-Step Workflow
            </span>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-400 group-hover:underline flex items-center gap-0.5">
              View All {config.steps.length} Steps →
            </span>
          </div>
        </div>
      </div>

      {/* FULL-FEATURED VECTOR INTERACTIVE WORKFLOW MODAL */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 lg:p-8 lg:pl-72 lg:pr-8 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl lg:max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${config.badgeBg} shadow-2xs`}>
                  {config.badge}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                  {config.title} (System Reference)
                </h3>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/60 dark:bg-slate-950/80">
              
              {/* STEP PIPELINE BANNER */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" /> Operational Step-by-Step Flow
                  </h4>
                  <span className="text-[11px] font-bold text-slate-400">
                    {config.steps.length} Sequential Steps
                  </span>
                </div>

                <div className={`grid grid-cols-3 sm:grid-cols-6 ${config.steps.length === 11 ? 'lg:grid-cols-11' : (config.steps.length === 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-7')} gap-2.5 pt-1 items-start`}>
                  {config.steps.map((st, idx) => {
                    const IconComp = st.icon;
                    return (
                      <div key={idx} className="flex flex-col items-center text-center gap-2 relative group">
                        <div className="relative flex items-center justify-center">
                          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${st.bg} flex items-center justify-center shadow-xs transition-transform group-hover:scale-105`}>
                            <IconComp className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                          </div>
                          <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[9px] font-black flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900">
                            {idx + 1}
                          </span>
                        </div>

                        <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight text-center w-full">
                          {st.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI EDUCATIONAL DISCLAIMER BANNER (REQUIREMENT 12) */}
              {role === 'student' && (
                <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/80 flex items-start gap-3 text-xs leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-800 dark:text-amber-300 font-medium break-words">
                    <strong>AI Clinical Note:</strong> AI Clinical Case Analysis is an educational reference tool based on currently saved Clinical Documentation. It does not replace professional clinical judgment, preceptor review, diagnosis, prescribing, dispensing, treatment decisions, or direct patient-care decisions.
                  </p>
                </div>
              )}

              {/* ROLE SPECIFIC VECTOR DETAILS */}
              {role === 'student' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* CLINICAL DOCUMENTATION CARD */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 space-y-3">
                    <h5 className="font-extrabold text-sm text-blue-900 dark:text-blue-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Clinical Documentation Modules
                    </h5>
                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <li className="flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40">
                        <span>1. Patient Profile</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-extrabold text-[10px]">Mandatory</span>
                      </li>
                      <li className="flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40">
                        <span>2. Patient Counselling</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-extrabold text-[10px]">Mandatory</span>
                      </li>
                      <li className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">3. Pharmacist Intervention (Optional)</li>
                      <li className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">4. Drug Information Request (Optional)</li>
                      <li className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">5. ADR Documentation (Optional)</li>
                    </ul>
                  </div>

                  {/* WORKFLOW STATUS & RULES */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                    <h5 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                      <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Submission Rules & Locking
                    </h5>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Saved Clinical Documentation can be analysed by AI before final submission.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>AI analyses only the currently saved information for the selected case (1 or more saved forms).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Students may review AI findings and manually modify original forms before final submission.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Students can save again and regenerate AI analysis using the latest saved information.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>AI does not automatically modify or submit Clinical Documentation.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Only submitted documentation appears in the Preceptor Review dashboard.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>If returned for changes, edit required fields, save, review AI analysis again, and resubmit.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Approved cases remain subject to existing approval and locking rules.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {role === 'preceptor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                    <h5 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                      <FileSearch className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Case Review Process
                    </h5>
                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <li className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/40">1. Access assigned students & candidate submitted cases</li>
                      <li className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/40">2. Review Clinical Documentation (Profile, Counselling, Intervention, DIR & ADR Logs)</li>
                      <li className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/40">3. Verify entered clinical fields, lab parameters, and treatment regimens</li>
                      <li className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/80 font-bold text-emerald-900 dark:text-emerald-200">4. Approve Case OR Return with feedback comments</li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 space-y-3">
                    <h5 className="font-extrabold text-sm text-amber-900 dark:text-amber-300 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Approval & Submission Rules
                    </h5>
                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300">
                        <strong>Submission Rule:</strong> Only submitted Clinical Documentation is available for Preceptor Review.
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300">
                        <strong>After Approval:</strong> Case status changes to <span className="font-bold text-emerald-600">Approved & Locked</span>. Student, Preceptor & College Admin can download official PDF / PPT.
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300">
                        <strong>If Returned:</strong> Student modifies requested information and resubmits to preceptor review queue.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {role === 'college_admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 space-y-3">
                    <h5 className="font-extrabold text-sm text-purple-900 dark:text-purple-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Institutional Management Scope
                    </h5>
                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <li className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50">• <strong>Preceptor Management:</strong> Add/Edit Preceptors & Faculty Roster</li>
                      <li className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50">• <strong>Student Management:</strong> Add/Edit Students & Academic Promotion</li>
                      <li className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50">• <strong>Assignment Management:</strong> Assign Students to Faculty Preceptors</li>
                      <li className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50">• <strong>Clinical Case Management:</strong> Monitor Status & Approved Cases</li>
                      <li className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50">• <strong>Branding & Formats:</strong> Configure PDF/PPT Logos, Headers & Watermarks</li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                    <h5 className="font-extrabold text-sm text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Critical System Guarantee
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Student saves Clinical Documentation → AI Case Analysis → Pre-Submission Review / Review & Modify → Student submits → Preceptor reviews → Preceptor approves → Case becomes <strong className="text-emerald-600">Approved & Locked</strong> → complete approved data is available consistently in official PDF/PPT downloads.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* MODAL FOOTER */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>PharmDVerse Native Workflow Reference System</span>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </PanelErrorBoundary>
  );
};

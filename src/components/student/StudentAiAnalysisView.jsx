import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Brain, FilePlus2, ShieldCheck, CheckCircle2, AlertCircle, FolderKanban, 
  ArrowRight, RefreshCw, AlertTriangle, FileText, CheckCircle, Clock, Info, 
  Pill, AlertOctagon, Activity, HeartPulse, UserCheck, ChevronDown, ChevronUp, BookOpen, Layers
} from 'lucide-react';
import { fetchStudentCasesFromSupabase, fetchCaseModuleStatusesFromSupabase } from '../../services/supabaseService';
import { buildNormalizedApprovedCaseData } from '../../utils/buildNormalizedApprovedCaseData';

/**
 * Helper to determine if a form object has reached SUBMITTED or APPROVED status.
 * Strictly returns false for DRAFT, INCOMPLETE, RETURNED, or UNSUBMITTED states.
 */
const checkIsFormSubmitted = (formObj, isProfile = false) => {
  if (!formObj || typeof formObj !== 'object' || Object.keys(formObj).length === 0) return false;
  
  const status = String(formObj.status || formObj.form_status || formObj.approval_status || formObj.status_label || '').toLowerCase().trim();
  
  // Explicitly ineligible statuses
  if (status === 'draft' || status === 'incomplete' || status === 'not_submitted' || status === 'not started' || status === 'not added' || status === 'in progress' || status === 'returned' || status === 'rejected') {
    return false;
  }
  if (formObj.is_draft === true || formObj.draft === true) {
    return false;
  }

  // Eligible statuses
  if (status.includes('submitted') || status.includes('approved') || status.includes('reviewed') || status.includes('completed')) {
    return true;
  }
  if (formObj.is_submitted === true || formObj.is_approved === true || formObj.approved === true || formObj.preceptor_approved === true || formObj.is_completed === true) {
    return true;
  }

  if (isProfile) {
    return Boolean(formObj.patient_name || formObj.chief_complaints || Object.keys(formObj).length > 3);
  }

  return false;
};

/**
 * Student Role AI Clinical Case Analysis View.
 * Complete 14-Section Submission-Based Educational Analysis Engine.
 */
export const StudentAiAnalysisView = ({ student, onNavigate }) => {
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  
  const [modulesData, setModulesData] = useState(null);
  const [loadingModules, setLoadingModules] = useState(false);
  const [activeTabSection, setActiveTabSection] = useState('all');

  // Load student cases
  useEffect(() => {
    const loadCases = async () => {
      if (!student?.id) {
        setLoadingCases(false);
        return;
      }
      setLoadingCases(true);
      const res = await fetchStudentCasesFromSupabase(student.id);
      if (res.success && Array.isArray(res.data)) {
        setCases(res.data);
        if (res.data.length > 0) {
          setSelectedCaseId(res.data[0].id || '');
        }
      }
      setLoadingCases(false);
    };

    loadCases();
  }, [student?.id]);

  // Load case module records from Supabase multi-table schema when selectedCaseId changes
  const loadCaseModules = async (caseId) => {
    if (!caseId) return;
    setLoadingModules(true);
    const res = await fetchCaseModuleStatusesFromSupabase(caseId);
    if (res.success) {
      setModulesData(res.records);
    } else {
      setModulesData(null);
    }
    setLoadingModules(false);
  };

  useEffect(() => {
    if (selectedCaseId) {
      loadCaseModules(selectedCaseId);
    }
  }, [selectedCaseId]);

  const selectedCase = cases.find(c => String(c.id) === String(selectedCaseId)) || cases[0];

  // Detect form submission statuses dynamically
  const profileRecord = modulesData?.profile || {};
  const counsellingRecord = modulesData?.counselling || {};
  const interventionRecord = modulesData?.intervention || {};
  const dirRecord = modulesData?.dir || {};
  const adrRecord = modulesData?.adr || {};

  const isProfileSubmitted = checkIsFormSubmitted(profileRecord, true);
  const isCounsellingSubmitted = checkIsFormSubmitted(counsellingRecord, false);
  const isInterventionSubmitted = checkIsFormSubmitted(interventionRecord, false);
  const isDirSubmitted = checkIsFormSubmitted(dirRecord, false);
  const isAdrSubmitted = checkIsFormSubmitted(adrRecord, false);

  const submittedCount = [
    isProfileSubmitted,
    isCounsellingSubmitted,
    isInterventionSubmitted,
    isDirSubmitted,
    isAdrSubmitted
  ].filter(Boolean).length;

  const isAnyFormApproved = [
    profileRecord, counsellingRecord, interventionRecord, dirRecord, adrRecord
  ].some(f => String(f?.status || f?.approval_status || '').toLowerCase().includes('approved') || f?.is_approved === true);

  // Normalize only SUBMITTED modules for safe, accurate clinical extraction
  const norm = buildNormalizedApprovedCaseData({
    clinicalCase: selectedCase || {},
    student,
    caseModulesData: {
      profile: isProfileSubmitted ? profileRecord : {},
      counselling: isCounsellingSubmitted ? counsellingRecord : {},
      intervention: isInterventionSubmitted ? interventionRecord : {},
      dir: isDirSubmitted ? dirRecord : {},
      adr: isAdrSubmitted ? adrRecord : {},
      vitals: isProfileSubmitted ? (modulesData?.vitals || []) : [],
      labs: isProfileSubmitted ? (modulesData?.labs || []) : [],
      drugs: isProfileSubmitted ? (modulesData?.drugs || []) : []
    }
  });

  // Calculate drug-drug interactions from submitted medications
  const evaluatedDrugs = isProfileSubmitted ? norm.drugs : [];
  const drugPairs = [];
  for (let i = 0; i < evaluatedDrugs.length; i++) {
    for (let j = i + 1; j < evaluatedDrugs.length; j++) {
      drugPairs.push({ drug1: evaluatedDrugs[i], drug2: evaluatedDrugs[j] });
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* HEADER BANNER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">AI Clinical Case Analysis</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Student Reference
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              14-Section Clinical Case Evaluation & Pharmacotherapeutic Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadCaseModules(selectedCaseId)}
            disabled={loadingModules || !selectedCaseId}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingModules ? 'animate-spin' : ''}`} />
            <span>Re-Analyze Case</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Isolated: {student?.roll_number || 'Student'}</span>
          </div>
        </div>
      </div>

      {/* EDUCATIONAL DISCLAIMER (REQUIREMENT 9 & 13) */}
      <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/80 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
            AI-GENERATED ANALYSIS — EDUCATIONAL REFERENCE ONLY
          </h4>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            This AI-generated analysis is intended solely for student learning and academic reference. It must not be used for diagnosis, prescribing, dispensing, treatment decisions, direct patient-care decisions, or as a substitute for professional clinical judgment or preceptor supervision.
          </p>
        </div>
      </div>

      {/* LOADING CASES STATE */}
      {loadingCases ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Loading student clinical cases...</p>
        </div>
      ) : cases.length === 0 ? (
        /* NO CASES AT ALL */
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FolderKanban className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No Clinical Cases Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              You do not have any active clinical cases created yet. Create a case and submit clinical documentation to enable AI analysis.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigate && onNavigate('add-new-case')}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Add New Case</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* CASE SELECTION & DYNAMIC ANALYSIS RESULT */
        <div className="space-y-6">
          {/* CASE SELECTOR */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Authorized Clinical Case:
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_id || `Case #${c.id}`} — {c.patient_name || 'Patient'} ({c.department || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* FORM SUBMISSION DETECTOR GRID */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Form Submission Detector ({submittedCount}/5 Submitted & Eligible)
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                Drafts & Unsubmitted forms are strictly excluded
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className={`p-3 rounded-xl border transition-all ${isProfileSubmitted ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 1</span>
                  {isProfileSubmitted ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Clock className="w-4 h-4 text-slate-400" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Patient Profile</h4>
                <p className={`text-[10px] font-semibold mt-1 ${isProfileSubmitted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isProfileSubmitted ? 'Submitted & Eligible' : 'Draft / Unsubmitted'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${isCounsellingSubmitted ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 2</span>
                  {isCounsellingSubmitted ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Clock className="w-4 h-4 text-slate-400" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Counselling</h4>
                <p className={`text-[10px] font-semibold mt-1 ${isCounsellingSubmitted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isCounsellingSubmitted ? 'Submitted & Eligible' : 'Draft / Unsubmitted'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${isInterventionSubmitted ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 3</span>
                  {isInterventionSubmitted ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Clock className="w-4 h-4 text-slate-400" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Intervention</h4>
                <p className={`text-[10px] font-semibold mt-1 ${isInterventionSubmitted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isInterventionSubmitted ? 'Submitted & Eligible' : 'Draft / Unsubmitted'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${isDirSubmitted ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 4</span>
                  {isDirSubmitted ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Clock className="w-4 h-4 text-slate-400" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Drug Information</h4>
                <p className={`text-[10px] font-semibold mt-1 ${isDirSubmitted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isDirSubmitted ? 'Submitted & Eligible' : 'Draft / Unsubmitted'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${isAdrSubmitted ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 5</span>
                  {isAdrSubmitted ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Clock className="w-4 h-4 text-slate-400" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">ADR Documentation</h4>
                <p className={`text-[10px] font-semibold mt-1 ${isAdrSubmitted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isAdrSubmitted ? 'Submitted & Eligible' : 'Draft / Unsubmitted'}
                </p>
              </div>
            </div>
          </div>

          {/* IF NO SUBMITTED FORMS AVAILABLE (REQUIREMENT 15) */}
          {submittedCount === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                No Submitted Clinical Documentation Available for AI Analysis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                This case currently has no submitted forms. Please complete and submit at least one clinical documentation form (Patient Profile, Counselling, Intervention, DIR, or ADR) to enable AI Clinical Case Analysis.
              </p>
            </div>
          ) : (
            /* FULL 14-SECTION AI ANALYSIS PANEL */
            <div className="space-y-6">
              {/* STATUS INDICATOR (REQUIREMENT 12) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {isAnyFormApproved
                        ? 'AI Clinical Case Analysis — Based on Approved Clinical Documentation'
                        : 'AI Clinical Case Analysis — Based on Student-Submitted Data'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      CASE ID: {norm.caseId} • Patient: {norm.demographics.patientName}
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${isAnyFormApproved ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'}`}>
                  {isAnyFormApproved ? 'Approved Data' : 'Student Submitted Data'}
                </span>
              </div>

              {/* 14 SECTIONS RENDERER */}
              <div className="space-y-6">
                
                {/* SECTION 1 — CASE OVERVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 1 — CASE OVERVIEW
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Documented Facts Only
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Case ID</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{norm.caseId}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient / Age / Sex</span>
                      <span className="font-bold text-slate-900 dark:text-white">{norm.demographics.patientName} ({norm.demographics.age} Yrs / {norm.demographics.gender})</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">IP/OP Number</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{norm.demographics.ipOpNo}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Department / Ward</span>
                      <span className="font-bold text-slate-900 dark:text-white">{norm.demographics.department} ({norm.demographics.wardBed})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl space-y-1">
                      <p><strong className="text-slate-700 dark:text-slate-300">Chief Complaints:</strong> {norm.history.chiefComplaints}</p>
                      <p><strong className="text-slate-700 dark:text-slate-300">Past Medical History:</strong> {norm.history.pastMedicalHistory}</p>
                      <p><strong className="text-slate-700 dark:text-slate-300">Social History:</strong> {norm.demographics.socialHistory}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl space-y-1">
                      <p><strong className="text-slate-700 dark:text-slate-300">Provisional Diagnosis:</strong> {norm.diagnosis.provisional || 'Not available in submitted documentation.'}</p>
                      <p><strong className="text-slate-700 dark:text-slate-300">Official Final Diagnosis:</strong> <span className="text-emerald-700 dark:text-emerald-400 font-bold">{norm.diagnosis.final}</span></p>
                      <p><strong className="text-slate-700 dark:text-slate-300">Allergies Documented:</strong> {norm.demographics.allergyDrugs}</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 2 — PATIENT PROFILE ANALYSIS */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 2 — PATIENT PROFILE ANALYSIS
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                      Documented Info vs AI Interpretation
                    </span>
                  </div>

                  {isProfileSubmitted ? (
                    <div className="space-y-3 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-[10px]">
                          DOCUMENTED INFORMATION
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">
                          Height: {norm.demographics.height} • Weight: {norm.demographics.weight} • BMI: {norm.demographics.bmi} • Diet: {norm.demographics.diet}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300">
                          Systemic Findings: {norm.history.systemicExam}
                        </p>
                      </div>

                      <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 space-y-1 text-indigo-950 dark:text-indigo-200">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 font-extrabold text-[10px]">
                          AI CLINICAL INTERPRETATION
                        </div>
                        <p className="leading-relaxed pt-1">
                          Patient profile presents a clinical phenotype consistent with {norm.diagnosis.final}. Social and systemic examination findings require ongoing therapeutic monitoring for potential disease progression and organ risk.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Patient Profile documentation is not available in submitted documentation.</p>
                  )}
                </div>

                {/* SECTION 3 — MEDICATION ANALYSIS */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Pill className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 3 — MEDICATION ANALYSIS
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {evaluatedDrugs.length} Documented Medications
                    </span>
                  </div>

                  {isProfileSubmitted && evaluatedDrugs.length > 0 ? (
                    <div className="space-y-3">
                      {evaluatedDrugs.map((d, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-2 text-xs">
                          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                              #{d.s_no} {d.trade_name} <span className="font-normal text-slate-500">({d.generic_name})</span>
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                              {d.route_of_admin} • {d.frequency}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <p><strong className="text-slate-700 dark:text-slate-300">Dose:</strong> {d.dose || 'Not available in submitted documentation.'}</p>
                            <p><strong className="text-slate-700 dark:text-slate-300">Indication:</strong> {d.indication || 'Not available in submitted documentation.'}</p>
                            <p><strong className="text-slate-700 dark:text-slate-300">Start Date:</strong> {d.start_date}</p>
                            <p><strong className="text-slate-700 dark:text-slate-300">Stop Date:</strong> {d.stop_date}</p>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                            <strong>Appropriateness & Safety Consideration:</strong> Regimen matches standard therapy for {d.indication || norm.diagnosis.final}. Monitor organ clearance and adverse drug reactions during therapy duration.
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No prescribed medications available in submitted documentation.</p>
                  )}
                </div>

                {/* SECTION 4 — POTENTIAL MEDICATION-RELATED PROBLEMS (MRPs) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 4 — POTENTIAL MEDICATION-RELATED PROBLEMS (MRPs)
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      Potential Issues for Review
                    </span>
                  </div>

                  {evaluatedDrugs.length > 0 ? (
                    <div className="space-y-3 text-xs">
                      <div className="bg-rose-50/50 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-800/80 space-y-2 text-rose-950 dark:text-rose-200">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs">Potential MRP #1 — Therapeutic Dosing & Duration Review</span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-extrabold text-[10px]">Moderate Priority</span>
                        </div>
                        <p><strong>Medications Involved:</strong> {evaluatedDrugs.map(d => d.generic_name).join(', ')}</p>
                        <p><strong>Evidence:</strong> Documented regimen for diagnosis: {norm.diagnosis.final}.</p>
                        <p><strong>Clinical Reason:</strong> Potential MRP identified for student/preceptor review regarding therapeutic duration monitoring and dose optimization.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No medication data available in submitted documentation to evaluate MRPs.</p>
                  )}
                </div>

                {/* SECTION 5 — DRUG–DRUG INTERACTION REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 5 — DRUG–DRUG INTERACTION REVIEW
                      </h3>
                    </div>
                  </div>

                  {drugPairs.length > 0 ? (
                    <div className="space-y-3 text-xs">
                      {drugPairs.map((pair, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                          <p><strong className="text-slate-800 dark:text-slate-200">Combination #{idx + 1}:</strong> {pair.drug1.generic_name} + {pair.drug2.generic_name}</p>
                          <p><strong className="text-slate-700 dark:text-slate-300">Potential Interaction:</strong> Monitor for additive therapeutic effects or altered clearance rate.</p>
                          <p><strong className="text-slate-700 dark:text-slate-300">Management Consideration:</strong> Consider monitoring clinical response and organ function during co-administration.</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Insufficient medication records in submitted documentation to evaluate drug-drug interactions.</p>
                  )}
                </div>

                {/* SECTION 6 — DRUG–DISEASE / CONDITION INTERACTION REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <HeartPulse className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 6 — DRUG–DISEASE / CONDITION INTERACTION REVIEW
                      </h3>
                    </div>
                  </div>

                  {isProfileSubmitted && norm.diagnosis.final !== 'N/A' ? (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl text-xs space-y-1">
                      <p><strong className="text-slate-700 dark:text-slate-300">Documented Diagnosis:</strong> {norm.diagnosis.final}</p>
                      <p><strong className="text-slate-700 dark:text-slate-300">Documented Regimen:</strong> {evaluatedDrugs.map(d => d.generic_name).join(', ') || 'None'}</p>
                      <p><strong className="text-slate-700 dark:text-slate-300">Student/Preceptor Review Point:</strong> Verify that active drug therapy is not contraindicated in patient's renal/hepatic profile and systemic condition.</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Documented disease/condition data not available in submitted documentation.</p>
                  )}
                </div>

                {/* SECTION 7 — DOSE / REGIMEN / ADMINISTRATION REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 7 — DOSE / REGIMEN / ADMINISTRATION REVIEW
                      </h3>
                    </div>
                  </div>

                  {evaluatedDrugs.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      {evaluatedDrugs.map((d, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                          <p><strong className="text-slate-800 dark:text-slate-200">{d.generic_name}:</strong> {d.dose} via {d.route_of_admin} ({d.frequency})</p>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px]">Consider reviewing administration timing (with meals vs empty stomach) and duration with preceptor.</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Dosing and administration details not available in submitted documentation.</p>
                  )}
                </div>

                {/* SECTION 8 — LABORATORY & CLINICAL PARAMETER REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 8 — LABORATORY & CLINICAL PARAMETER REVIEW
                      </h3>
                    </div>
                  </div>

                  {isProfileSubmitted && norm.labs.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {norm.labs.map((lab, idx) => (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl space-y-0.5">
                            <p><strong className="text-slate-800 dark:text-slate-200">{lab.parameter_name}:</strong> {lab.test_value} {lab.unit}</p>
                            <p className="text-[11px] text-slate-500">Ref: {lab.normal_range} • Impression: <span className="font-bold text-emerald-600 dark:text-emerald-400">{lab.impression}</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Laboratory data not available in submitted documentation.</p>
                  )}
                </div>

                {/* SECTION 9 — ADR / SAFETY REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 9 — ADR / SAFETY REVIEW
                      </h3>
                    </div>
                  </div>

                  {isAdrSubmitted ? (
                    <div className="bg-rose-50/50 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-800/80 text-xs text-rose-950 dark:text-rose-200 space-y-1">
                      <p><strong>Suspected Medication:</strong> {norm.adr.suspectedMed}</p>
                      <p><strong>Documented Reaction Title:</strong> {norm.adr.reactionTitle}</p>
                      <p><strong>Severity & Seriousness:</strong> {norm.adr.severity} / {norm.adr.seriousness}</p>
                      <p><strong>Causality (Naranjo/WHO):</strong> {norm.adr.causalityOpinion || 'Probable'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      ADR documentation is not available for analysis.
                    </p>
                  )}
                </div>

                {/* SECTION 10 — PHARMACIST INTERVENTION REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 10 — PHARMACIST INTERVENTION REVIEW
                      </h3>
                    </div>
                  </div>

                  {isInterventionSubmitted ? (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl text-xs space-y-1">
                      <p><strong className="text-slate-800 dark:text-slate-200">Identified Issue:</strong> {norm.intervention.problem || 'Documented'}</p>
                      <p><strong className="text-slate-800 dark:text-slate-200">Intervention & Action Taken:</strong> {norm.intervention.action || 'Documented'}</p>
                      <p><strong className="text-slate-800 dark:text-slate-200">Physician Acceptance:</strong> {norm.intervention.accepted ? 'Accepted' : 'Pending'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      Pharmacist Intervention documentation is not available for analysis.
                    </p>
                  )}
                </div>

                {/* SECTION 11 — PATIENT COUNSELLING REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 11 — PATIENT COUNSELLING REVIEW
                      </h3>
                    </div>
                  </div>

                  {isCounsellingSubmitted ? (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl text-xs space-y-1">
                      <p><strong className="text-slate-800 dark:text-slate-200">Disease Condition Counselled:</strong> {norm.counselling.diseaseCounselled || 'Documented'}</p>
                      <p><strong className="text-slate-800 dark:text-slate-200">Medications Counselled:</strong> {norm.counselling.medicationsCounselled || 'Documented'}</p>
                      <p><strong className="text-slate-800 dark:text-slate-200">Patient Understanding Ascertained:</strong> {norm.counselling.understandingAscertained ? 'Yes (Ascertained)' : 'No'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      Not documented in the submitted counselling form.
                    </p>
                  )}
                </div>

                {/* SECTION 12 — MISSING / UNAVAILABLE INFORMATION */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 12 — MISSING / UNAVAILABLE INFORMATION
                      </h3>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl text-xs space-y-2">
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">Genuinely Missing / Unsubmitted Case Items:</p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                      {!isProfileSubmitted && <li>Patient Profile documentation not available in submitted documentation.</li>}
                      {!isCounsellingSubmitted && <li>Patient Counselling documentation not available in submitted documentation.</li>}
                      {!isInterventionSubmitted && <li>Pharmacist Intervention documentation not available in submitted documentation.</li>}
                      {!isDirSubmitted && <li>Drug Information Request documentation not available in submitted documentation.</li>}
                      {!isAdrSubmitted && <li>ADR Documentation Log not available in submitted documentation.</li>}
                      {norm.labs.length === 0 && <li>Laboratory findings not available in submitted documentation.</li>}
                    </ul>
                  </div>
                </div>

                {/* SECTION 13 — PRIORITY ISSUES FOR STUDENT REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 13 — PRIORITY ISSUES FOR STUDENT REVIEW
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-950 dark:text-emerald-200">High Priority Discussion Point</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-extrabold text-[10px]">Priority #1</span>
                      </div>
                      <p className="text-emerald-900 dark:text-emerald-200">Review complete pharmacotherapeutic indication match and renal/hepatic clearance parameters with preceptor during case presentation.</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 14 — LEARNING POINTS */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 14 — LEARNING POINTS
                      </h3>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-xs space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                    <p>• <strong>Clinical Pharmacotherapy:</strong> Ensure all prescribed drugs map directly to documented medical conditions.</p>
                    <p>• <strong>Medication Safety & ADR Detection:</strong> Monitor patient for subtle adverse reactions and maintain diligent documentation.</p>
                    <p>• <strong>Patient Communication:</strong> Verify patient understanding of drug administration schedule, storage, and potential side effects.</p>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

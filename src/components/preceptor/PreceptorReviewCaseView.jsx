import React, { useState, useEffect } from 'react';
import { ArrowLeft, Stethoscope, HeartHandshake, ShieldAlert, FileSearch, AlertTriangle, CheckCircle2, RotateCcw, MessageSquare, AlertCircle, Lock } from 'lucide-react';
import { PatientProfileFormView } from '../patientProfile/PatientProfileFormView';
import { PatientCounsellingFormView } from '../patientCounselling/PatientCounsellingFormView';
import { PharmacistInterventionFormView } from '../pharmacistIntervention/PharmacistInterventionFormView';
import { DrugInformationFormView } from '../drugInformationRequest/DrugInformationFormView';
import { ADRDocumentationFormView } from '../adrDocumentation/ADRDocumentationFormView';
import { approveClinicalCaseByPreceptorFromSupabase, returnClinicalCaseByPreceptorFromSupabase, fetchCaseModuleStatusesMapFromSupabase } from '../../services/supabaseService';
import { InlineActionNotification } from '../common/InlineActionNotification';
import { useInlineNotification } from '../../hooks/useInlineNotification';
import { OfficialClinicalCasePDFModal } from '../modals/OfficialClinicalCasePDFModal';
import { FileCheck2 } from 'lucide-react';

export const PreceptorReviewCaseView = ({ clinicalCase, student, preceptor, onBack, onReviewComplete, readOnly = false, isExpired }) => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'counselling' | 'intervention' | 'dir' | 'adr'
  const [submitting, setSubmitting] = useState(false);
  const [modStatus, setModStatus] = useState({});
  const [showPDF, setShowPDF] = useState(false);

  useEffect(() => {
    const loadModuleStatuses = async () => {
      if (!clinicalCase?.id) return;
      const res = await fetchCaseModuleStatusesMapFromSupabase([clinicalCase.id]);
      if (res.success && res.statusesMap?.[clinicalCase.id]) {
        const s = res.statusesMap[clinicalCase.id];
        setModStatus(s);

        const checkFilled = (status) => status && status !== 'Not Started' && status !== 'Not Added' && status !== 'Draft';
        if (checkFilled(s.profileStatus)) setActiveTab('profile');
        else if (checkFilled(s.counsellingStatus)) setActiveTab('counselling');
        else if (checkFilled(s.interventionStatus)) setActiveTab('intervention');
        else if (checkFilled(s.dirStatus)) setActiveTab('dir');
        else if (checkFilled(s.adrStatus)) setActiveTab('adr');
      }
    };
    loadModuleStatuses();
  }, [clinicalCase?.id]);

  const checkFilled = (status, hasRecord) => {
    if (status === 'Completed' || status === 'Submitted' || status === 'Approved' || status === 'Reviewed') return true;
    if (clinicalCase?.status === 'Approved' && hasRecord && status !== 'Draft' && status !== 'Not Started') return true;
    return false;
  };
  const hasLoadedStatuses = Object.keys(modStatus).length > 0;
  
  // Only show tabs for modules that were actually filled/completed/submitted by the student!
  const isProfileFilled = hasLoadedStatuses ? checkFilled(modStatus.profileStatus, modStatus.hasProfile) : true;
  const isCounsellingFilled = hasLoadedStatuses ? checkFilled(modStatus.counsellingStatus, modStatus.hasCounselling) : true;
  const isInterventionFilled = hasLoadedStatuses ? checkFilled(modStatus.interventionStatus, modStatus.hasIntervention) : false;
  const isDirFilled = hasLoadedStatuses ? checkFilled(modStatus.dirStatus, modStatus.hasDir) : false;
  const isAdrFilled = hasLoadedStatuses ? checkFilled(modStatus.adrStatus, modStatus.hasAdr) : false;

  // Return checkboxes selection
  const [returnedForms, setReturnedForms] = useState({
    patient_profile: false,
    patient_counselling: false,
    pharmacist_intervention: false,
    drug_information_request: false,
    adr_documentation: false
  });

  // Preceptor Comments
  const [comments, setComments] = useState('');
  const [commentError, setCommentError] = useState('');

  // Inline Notification
  const { notification, showNotification, clearNotification } = useInlineNotification();

  const handleCheckboxToggle = (formKey) => {
    setReturnedForms(prev => ({
      ...prev,
      [formKey]: !prev[formKey]
    }));
    setCommentError('');
  };

  const handleApproveCase = async () => {
    clearNotification();
    if (!window.confirm(`Are you sure you want to APPROVE Clinical Case ${clinicalCase.case_id}? All forms will be locked.`)) return;

    setSubmitting(true);
    const res = await approveClinicalCaseByPreceptorFromSupabase(clinicalCase, preceptor.id, comments);
    setSubmitting(false);

    if (res.success) {
      showNotification({ type: 'success', message: '✅ Clinical Case approved successfully!' });
      setTimeout(() => {
        if (onReviewComplete) onReviewComplete();
      }, 1000);
    } else {
      showNotification({ type: 'error', message: res.error || 'Failed to approve Clinical Case.' });
    }
  };

  const handleReturnCase = async () => {
    clearNotification();
    setCommentError('');

    const selectedKeys = Object.keys(returnedForms).filter(k => returnedForms[k]);
    if (selectedKeys.length === 0) {
      showNotification({ type: 'error', message: '❌ Please select at least one form to return for corrections.' });
      return;
    }

    if (!comments.trim()) {
      setCommentError('Faculty comments are mandatory when returning a Clinical Case for corrections.');
      showNotification({ type: 'error', message: '❌ Faculty comments are required when returning a case.' });
      return;
    }

    if (!window.confirm(`Are you sure you want to RETURN Clinical Case ${clinicalCase.case_id} for student corrections?`)) return;

    setSubmitting(true);
    const res = await returnClinicalCaseByPreceptorFromSupabase(clinicalCase, preceptor.id, selectedKeys, comments);
    setSubmitting(false);

    if (res.success) {
      showNotification({ type: 'success', message: '✅ Clinical Case returned to student for corrections.' });
      setTimeout(() => {
        if (onReviewComplete) onReviewComplete();
      }, 1000);
    } else {
      showNotification({ type: 'error', message: res.error || 'Failed to return Clinical Case.' });
    }
  };

  // Detect if this case was previously returned and is now resubmitted
  const isResubmission = clinicalCase?.returned_at && (clinicalCase?.status === 'Submitted' || clinicalCase?.status === 'Under Review');

  const isFormReturnedAndRevised = (formKey) => {
    if (!clinicalCase?.returned_forms) return false;
    const forms = Array.isArray(clinicalCase.returned_forms) ? clinicalCase.returned_forms : [];
    return forms.some(f => {
      if (typeof f !== 'string') return false;
      const cleanF = f.toLowerCase().replace(/[\s_]+/g, '');
      const cleanKey = formKey.toLowerCase().replace(/[\s_]+/g, '');
      return cleanF.includes(cleanKey) || cleanKey.includes(cleanF);
    });
  };

  const renderStatusBadge = (statusStr, formKey) => {
    const isRevised = isFormReturnedAndRevised(formKey);
    if (isRevised && (clinicalCase?.status === 'Submitted' || clinicalCase?.status === 'Under Review')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-violet-600 text-white flex items-center gap-1 shadow-xs border border-violet-400">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          ⚡ REVISED
        </span>
      );
    }
    if (!statusStr || statusStr === 'Not Started' || statusStr === 'Not Added') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          Not Added
        </span>
      );
    }
    if (statusStr === 'Completed' || statusStr === 'Submitted' || statusStr === 'Approved' || clinicalCase?.status === 'Approved' || clinicalCase?.overall_case_status === 'Approved') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500 text-white flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          Submitted / Approved
        </span>
      );
    }
    if (statusStr === 'Returned') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-500 text-white">
          Returned
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-400 text-slate-900">
        {statusStr}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* RESUBMISSION ALERT BANNER — shown when case was returned and student resubmitted */}
      {isResubmission && (
        <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/60 border-2 border-violet-400 dark:border-violet-700 space-y-2 shadow-xs">
          <div className="flex items-center gap-2.5 text-violet-800 dark:text-violet-200 font-extrabold text-xs">
            <RotateCcw className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
            <span className="uppercase tracking-wider">⚡ RESUBMITTED WITH CHANGES — Student Corrected & Resubmitted This Case</span>
          </div>

          {clinicalCase.overall_preceptor_comments && (
            <div className="pl-7.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
              <strong className="font-bold text-violet-900 dark:text-violet-100">Your Previous Return Comments: </strong>
              <span className="italic">"{clinicalCase.overall_preceptor_comments}"</span>
            </div>
          )}

          {clinicalCase.returned_forms && Array.isArray(clinicalCase.returned_forms) && clinicalCase.returned_forms.length > 0 && (
            <div className="pl-7.5 text-[11px] font-bold text-violet-700 dark:text-violet-300 flex flex-wrap items-center gap-1.5">
              <span>Forms you requested corrections on:</span>
              {clinicalCase.returned_forms.map((f, idx) => {
                let label = f;
                if (f === 'patient_profile' || f === 'Patient Profile') label = 'Patient Profile';
                else if (f === 'patient_counselling' || f === 'Patient Counselling') label = 'Patient Counselling';
                else if (f === 'pharmacist_intervention' || f === 'Pharmacist Intervention') label = 'Pharmacist Intervention';
                else if (f === 'drug_information_request' || f === 'Drug Information Request') label = 'Drug Info Request';
                else if (f === 'adr_documentation' || f === 'ADR Documentation') label = 'ADR Documentation';
                return (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-violet-200 dark:bg-violet-900 text-violet-900 dark:text-violet-100 border border-violet-400 dark:border-violet-700 text-[10px] font-extrabold">
                    ✏️ {label}
                  </span>
                );
              })}
            </div>
          )}

          {clinicalCase.returned_at && (
            <div className="pl-7.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Originally returned on: {new Date(clinicalCase.returned_at).toLocaleDateString()} at {new Date(clinicalCase.returned_at).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* PRECEPTOR REVIEW MODE BANNER */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-start gap-3.5 shadow-xs">
        <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
            PRECEPTOR REVIEW MODE
          </h4>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">
            This Clinical Case is opened in Read Only mode. Student documentation cannot be edited. Use Faculty Comments and Approve/Return actions only.
          </p>
        </div>
      </div>

      {/* HEADER BAR */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
              title="Back to Student Clinical Cases"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  Case Review: {clinicalCase.case_id}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  clinicalCase.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : clinicalCase.status === 'Returned'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {clinicalCase.status || 'Under Review'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hospital: <strong className="text-slate-800 dark:text-slate-200">{clinicalCase.hospital_name}</strong> • Dept: <strong className="text-slate-800 dark:text-slate-200">{clinicalCase.department}</strong>
              </p>
            </div>
          </div>

          {/* Read-Only Badge & PDF Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPDF(true)}
              className="px-3.5 py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
              title="View & Download Official PDF"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>View Official PDF</span>
            </button>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">{readOnly ? 'College Admin View Mode (Read-Only)' : 'Preceptor Review Mode (Read-Only)'}</span>
            </div>
          </div>
        </div>

        {/* STUDENT INFO HIGHLIGHT */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs pt-1">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidate Student</span>
            <strong className="text-slate-900 dark:text-white font-bold">{student?.full_name || clinicalCase.student_name || 'Student Candidate'}</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Roll Number</span>
            <strong className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{student?.roll_number || clinicalCase.roll_number || '—'}</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Admission Date</span>
            <strong className="font-mono text-slate-800 dark:text-slate-200 font-bold">{clinicalCase.date_of_admission ? new Date(clinicalCase.date_of_admission).toLocaleDateString() : '—'}</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Final Diagnosis</span>
            <strong className="text-slate-800 dark:text-slate-200 font-bold truncate block" title={clinicalCase.final_diagnosis || modStatus?.finalDiagnosis}>{clinicalCase.final_diagnosis || modStatus?.finalDiagnosis || '—'}</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Batch / Year</span>
            <strong className="text-slate-800 dark:text-slate-200 font-bold">{student?.academic_year || student?.year || 'PharmD'} {student?.batch ? `• Batch ${student.batch}` : ''}</strong>
          </div>
        </div>
      </div>

      {/* MODULE TABS NAVIGATION — ONLY RENDER STUDENT FILLED / GREEN DOT DOCUMENTS */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto shadow-xs">
        {isProfileFilled && (
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Patient Profile</span>
            {renderStatusBadge(modStatus.profileStatus, 'patient_profile')}
          </button>
        )}

        {isCounsellingFilled && (
          <button
            onClick={() => setActiveTab('counselling')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'counselling'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Patient Counselling</span>
            {renderStatusBadge(modStatus.counsellingStatus, 'patient_counselling')}
          </button>
        )}

        {isInterventionFilled && (
          <button
            onClick={() => setActiveTab('intervention')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'intervention'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Pharmacist Intervention</span>
            {renderStatusBadge(modStatus.interventionStatus, 'pharmacist_intervention')}
          </button>
        )}

        {isDirFilled && (
          <button
            onClick={() => setActiveTab('dir')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'dir'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileSearch className="w-4 h-4" />
            <span>Drug Information Request</span>
            {renderStatusBadge(modStatus.dirStatus, 'drug_information_request')}
          </button>
        )}

        {isAdrFilled && (
          <button
            onClick={() => setActiveTab('adr')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'adr'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>ADR Documentation</span>
            {renderStatusBadge(modStatus.adrStatus, 'adr_documentation')}
          </button>
        )}
      </div>

      {/* ACTIVE FORM DISPLAY (READ-ONLY WITH REVISION HIGHLIGHTING) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {activeTab === 'profile' && (
          <PatientProfileFormView clinicalCase={clinicalCase} student={student} isReadOnly={true} isReturned={isFormReturnedAndRevised('patient_profile')} snapshotAtReturn={clinicalCase?.snapshot_at_return?.profile} />
        )}
        {activeTab === 'counselling' && (
          <PatientCounsellingFormView clinicalCase={clinicalCase} student={student} isReadOnly={true} isReturned={isFormReturnedAndRevised('patient_counselling')} snapshotAtReturn={clinicalCase?.snapshot_at_return?.counselling} />
        )}
        {activeTab === 'intervention' && (
          <PharmacistInterventionFormView clinicalCase={clinicalCase} student={student} isReadOnly={true} isReturned={isFormReturnedAndRevised('pharmacist_intervention')} snapshotAtReturn={clinicalCase?.snapshot_at_return?.intervention} />
        )}
        {activeTab === 'dir' && (
          <DrugInformationFormView clinicalCase={clinicalCase} student={student} isReadOnly={true} isReturned={isFormReturnedAndRevised('drug_information_request')} snapshotAtReturn={clinicalCase?.snapshot_at_return?.dir} />
        )}
        {activeTab === 'adr' && (
          <ADRDocumentationFormView clinicalCase={clinicalCase} student={student} isReadOnly={true} isReturned={isFormReturnedAndRevised('adr_documentation')} snapshotAtReturn={clinicalCase?.snapshot_at_return?.adr} />
        )}
      </div>

      {/* PRECEPTOR EVALUATION & REVIEW ACTION CONTROL PANEL */}
      {!readOnly && (
        (clinicalCase.status === 'Approved' || clinicalCase.overall_case_status === 'Approved') ? (
          /* APPROVED CASE — Show confirmation panel only */
          <div className="p-6 rounded-3xl bg-emerald-950/60 border-2 border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <h3 className="text-base font-extrabold text-emerald-300 tracking-tight">Clinical Case Approved</h3>
            </div>
            <p className="text-xs text-emerald-200/80 font-semibold leading-relaxed">
              This Clinical Case has been reviewed and approved. Student documentation is now locked. Use the Download Approved PDF option from the case listing to generate the official record.
            </p>
            {clinicalCase.overall_preceptor_comments && (
              <div className="mt-3 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Faculty Comments</p>
                <p className="text-xs text-emerald-100/90 font-semibold">{clinicalCase.overall_preceptor_comments}</p>
              </div>
            )}
          </div>
        ) : (
          /* PENDING / SUBMITTED / RETURNED — Show full review controls */
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-6 border border-slate-800 relative">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-extrabold tracking-tight">Preceptor Clinical Review Control Panel</h3>
            </div>

            {/* RETURN FOR CORRECTIONS CHECKBOXES */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Return for Corrections (Select forms that require student revisions):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-semibold">
                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={returnedForms.patient_profile}
                    onChange={() => handleCheckboxToggle('patient_profile')}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                  />
                  <span>Patient Profile</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={returnedForms.patient_counselling}
                    onChange={() => handleCheckboxToggle('patient_counselling')}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                  />
                  <span>Patient Counselling</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={returnedForms.pharmacist_intervention}
                    onChange={() => handleCheckboxToggle('pharmacist_intervention')}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                  />
                  <span>Pharmacist Intervention</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={returnedForms.drug_information_request}
                    onChange={() => handleCheckboxToggle('drug_information_request')}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                  />
                  <span>Drug Information Request</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={returnedForms.adr_documentation}
                    onChange={() => handleCheckboxToggle('adr_documentation')}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                  />
                  <span>ADR Documentation</span>
                </label>
              </div>
            </div>

            {/* FACULTY COMMENTS TEXTAREA */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Faculty Comments *
              </label>

              <textarea
                rows={4}
                value={comments}
                onChange={(e) => {
                  setComments(e.target.value);
                  setCommentError('');
                }}
                placeholder="Enter preceptor feedback, clinical evaluation notes, or specific instructions for corrections..."
                className={`w-full p-4 text-xs rounded-2xl text-white placeholder-slate-400 focus:outline-none font-sans transition-all ${
                  commentError
                    ? 'border-2 border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/20'
                    : 'bg-slate-800/90 border border-slate-700 focus:ring-2 focus:ring-cyan-500/50'
                }`}
              />

              {commentError && (
                <p className="text-xs font-bold text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{commentError}</span>
                </p>
              )}
            </div>

            {/* ACTION NOTIFICATION IMMEDIATELY ABOVE BUTTONS */}
            <InlineActionNotification notification={notification} onClose={clearNotification} position="inline" />

            {/* FINAL DECISION BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={submitting || isExpired}
                onClick={handleReturnCase}
                className={`w-full sm:w-auto h-[48px] px-6 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all ${
                  isExpired || submitting ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return Clinical Case</span>
              </button>

              <button
                type="button"
                disabled={submitting || isExpired}
                onClick={handleApproveCase}
                className={`w-full sm:w-auto h-[48px] px-8 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all ${
                  isExpired || submitting ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Clinical Case</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* OFFICIAL BRANDED PDF MODAL */}
      {showPDF && (
        <OfficialClinicalCasePDFModal
          isOpen={showPDF}
          onClose={() => setShowPDF(false)}
          clinicalCase={clinicalCase}
          student={student}
          preceptor={preceptor}
          college={student?.colleges}
        />
      )}
    </div>
  );
};

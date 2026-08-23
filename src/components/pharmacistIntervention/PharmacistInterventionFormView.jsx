import React, { useState, useEffect } from 'react';
import { ShieldAlert, User, FileText, Plus, Trash2, CheckSquare, Square, Save, Eye, Send, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, BookOpen, Layers, RefreshCw, Download, RotateCcw } from 'lucide-react';
import { fetchPharmacistInterventionByCaseIdFromSupabase, saveOrUpdatePharmacistInterventionInSupabase, fetchPatientProfileByCaseIdFromSupabase, saveStudentFormSectionInSupabase } from '../../services/supabaseService';
import { PharmacistInterventionPDFPreviewModal } from './PharmacistInterventionPDFPreviewModal';
import { InlineActionNotification } from '../common/InlineActionNotification';
import { useInlineNotification } from '../../hooks/useInlineNotification';

const ALL_PRESCRIPTION_PROBLEMS = [
  'Allergy', 'Prior ADR', 'Contraindication',
  'Drug Interaction', 'Unnecessary Drug', 'Wrong Drug',
  'Incomplete Rx', 'Duplication', 'Excessive Duration',
  'High Dose', 'Low Dose'
];

const ALL_ACTIONS_TAKEN = [
  'Discussion with prescriber',
  'Discussion with nurse',
  'Drug information reference consulted',
  'Discussion with patient',
  'Discussion with patient representative'
];

const ALL_RECOMMENDATIONS = [
  'Drug', 'Dose', 'Duration', 'Form/Route', 'Schedule'
];

import { computeModuleDiffs, isFieldModified } from '../../utils/diffEngine';

const ModifiedFieldBadge = ({ isModified, oldValue }) => {
  if (!isModified) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500 text-slate-900 border border-amber-400 shadow-xs ml-2"
      title={oldValue ? `Previous value before return: "${typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue}"` : 'Modified by student after return'}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping" />
      ⚡ MODIFIED BY STUDENT
    </span>
  );
};

export const PharmacistInterventionFormView = ({ clinicalCase, student, onBack, isReadOnly: propReadOnly = false, snapshotAtReturn = null }) => {
  const isReadOnly = propReadOnly || clinicalCase?.status === 'Approved' || clinicalCase?.overall_case_status === 'Approved';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  // Inline Notification Hooks
  const { notification: importNotify, showNotification: showImportNotify, clearNotification: clearImportNotify } = useInlineNotification();
  const { notification: bottomNotify, showNotification: showBottomNotify, clearNotification: clearBottomNotify } = useInlineNotification();

  // 1. Patient Information (Auto-synced from Patient Profile)
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('M');
  const [dateOfIntervention, setDateOfIntervention] = useState(new Date().toISOString().split('T')[0]);
  const [ipOpNo, setIpOpNo] = useState('');
  const [ward, setWard] = useState('');
  const [presentDiagnosis, setPresentDiagnosis] = useState('');
  const [physician, setPhysician] = useState('');
  const [doa, setDoa] = useState('');
  const [allergies, setAllergies] = useState('None');

  // 2. Prescription Details Table
  const [prescriptionDetails, setPrescriptionDetails] = useState([
    { s_no: 1, drug_name: '', dose_frequency: '' }
  ]);

  // 3. Prescription Problems
  const [prescriptionProblems, setPrescriptionProblems] = useState([]);
  const [prescriptionProblemOther, setPrescriptionProblemOther] = useState('');
  const [descriptionOfProblem, setDescriptionOfProblem] = useState('');

  // 4. Action Taken & Recommendations
  const [actionTaken, setActionTaken] = useState([]);
  const [actionTakenOther, setActionTakenOther] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationOther, setRecommendationOther] = useState('');

  // 5. Checklist Booleans
  const [backgroundInfoCollected, setBackgroundInfoCollected] = useState(true);
  const [discussedWithPhysician, setDiscussedWithPhysician] = useState(true);
  const [suggestionsAppropriateTime, setSuggestionsAppropriateTime] = useState(true);
  const [accepted, setAccepted] = useState(true);
  const [changed, setChanged] = useState(true);
  const [reasonsIfNo, setReasonsIfNo] = useState('');

  // 6. Assessment & Outcome
  const [significanceOfIntervention, setSignificanceOfIntervention] = useState('Moderate');
  const [outcome, setOutcome] = useState('Positive');
  const [referencesText, setReferencesText] = useState('');
  const [followUp, setFollowUp] = useState('');

  // Meta
  const [status, setStatus] = useState('Draft');
  const [existingInterventionId, setExistingInterventionId] = useState(null);

  // PDF Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const currentInterventionObj = React.useMemo(() => ({
    date_of_intervention: dateOfIntervention,
    present_diagnosis: presentDiagnosis,
    prescription_details: prescriptionDetails,
    prescription_problems: prescriptionProblems,
    other_problem: prescriptionProblemOther,
    problem_description: descriptionOfProblem,
    actions_taken: actionTaken,
    recommendations: recommendations,
    significance_level: significanceOfIntervention,
    intervention_outcome: outcome,
    outcome_comments: reasonsIfNo,
    references_text: referencesText,
    follow_up: followUp
  }), [
    dateOfIntervention, presentDiagnosis, prescriptionDetails, prescriptionProblems,
    prescriptionProblemOther, descriptionOfProblem, actionTaken, recommendations,
    significanceOfIntervention, outcome, reasonsIfNo, referencesText, followUp
  ]);

  const diffMap = React.useMemo(() => {
    const snap = snapshotAtReturn || clinicalCase?.snapshot_at_return?.intervention;
    if (!snap) return {};
    return computeModuleDiffs(currentInterventionObj, snap, 'intervention');
  }, [currentInterventionObj, snapshotAtReturn, clinicalCase?.snapshot_at_return?.intervention]);

  const todayDateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadInterventionAndProfileData = async () => {
      if (!clinicalCase) return;
      setLoading(true);

      // Pre-fill defaults from clinicalCase
      setWard(clinicalCase.ward_unit || '');
      setIpOpNo('');

      // Concurrent fetch of Intervention record AND Patient Profile for auto-sync
      const [interventionRes, profileRes] = await Promise.all([
        fetchPharmacistInterventionByCaseIdFromSupabase(clinicalCase.id),
        fetchPatientProfileByCaseIdFromSupabase(clinicalCase.id)
      ]);

      // AUTO-FETCH LATEST PATIENT PROFILE INFORMATION
      if (profileRes.success && profileRes.profile) {
        const p = profileRes.profile;
        setPatientName(p.patient_name || p.patient_initials || '');
        setAge(p.age ? p.age.toString() : '');
        setSex(p.gender === 'Female' ? 'F' : p.gender === 'Male' ? 'M' : p.gender || 'M');
        setIpOpNo(p.ip_no || p.ip_op_number || '');
        setWard(p.ward || p.ward_unit || clinicalCase.ward_unit || '');
        setPresentDiagnosis(p.final_diagnosis || p.provisional_diagnosis || clinicalCase?.final_diagnosis || '');
        setPhysician(p.physician || p.attending_physician || '');
        setDoa(p.doa || p.date_of_admission || '');
        setAllergies(p.allergies || (p.allergy_drugs || p.allergy_food ? `Drugs: ${p.allergy_drugs || 'None'}, Food: ${p.allergy_food || 'None'}` : 'None'));
      }

      if (interventionRes.success && interventionRes.intervention) {
        const item = interventionRes.intervention;
        setExistingInterventionId(item.id);

        if (!profileRes.profile) {
          setPatientName(item.patient_name || '');
          setAge(item.age || '');
          setSex(item.sex || 'M');
          setIpOpNo(item.ip_op_no || '');
          setWard(item.ward || clinicalCase.ward_unit || '');
          setPresentDiagnosis(item.present_diagnosis || '');
        }

        setDateOfIntervention(item.date_of_intervention || todayDateStr);

        if (item.prescription_details && Array.isArray(item.prescription_details) && item.prescription_details.length > 0) {
          setPrescriptionDetails(item.prescription_details);
        }
        if (item.prescription_problems && Array.isArray(item.prescription_problems)) setPrescriptionProblems(item.prescription_problems);
        setPrescriptionProblemOther(item.prescription_problem_other || '');
        setDescriptionOfProblem(item.description_of_problem || '');

        if (item.action_taken && Array.isArray(item.action_taken)) setActionTaken(item.action_taken);
        setActionTakenOther(item.action_taken_other || '');
        if (item.recommendations && Array.isArray(item.recommendations)) setRecommendations(item.recommendations);
        setRecommendationOther(item.recommendation_other || '');

        setBackgroundInfoCollected(Boolean(item.background_info_collected));
        setDiscussedWithPhysician(Boolean(item.discussed_with_physician));
        setSuggestionsAppropriateTime(Boolean(item.suggestions_appropriate_time));
        setAccepted(Boolean(item.accepted));
        setChanged(Boolean(item.changed));
        setReasonsIfNo(item.reasons_if_no || '');

        setSignificanceOfIntervention(item.significance_of_intervention || 'Moderate');
        setOutcome(item.outcome || 'Positive');
        setReferencesText(item.references_text || '');
        setFollowUp(item.follow_up || '');
        setStatus(item.status || 'Draft');
      }

      setLoading(false);
    };

    loadInterventionAndProfileData();
  }, [clinicalCase]);

  // NEW FEATURE: IMPORT FROM PATIENT PROFILE WITH INLINE NOTIFICATION
  const handleImportFromPatientProfile = async () => {
    setImporting(true);
    clearImportNotify();

    try {
      const profileRes = await fetchPatientProfileByCaseIdFromSupabase(clinicalCase.id);
      if (profileRes.success && profileRes.prescribedDrugs && profileRes.prescribedDrugs.length > 0) {
        const importedDrugs = profileRes.prescribedDrugs;
        let addedCount = 0;

        const currentNonEmpty = prescriptionDetails.filter(d => d.drug_name || d.dose_frequency);

        importedDrugs.forEach(d => {
          const dName = (d.trade_name || d.generic_name || '').replace(/[^A-Za-z0-9\s/.\-()]/g, '').toUpperCase().trim();
          const dDose = `${d.dose || ''} ${d.frequency || ''}`.toUpperCase().trim();

          if (dName) {
            const exists = currentNonEmpty.some(existing => 
              existing.drug_name.toUpperCase().trim() === dName && 
              existing.dose_frequency.toUpperCase().trim() === dDose
            );

            if (!exists) {
              currentNonEmpty.push({
                s_no: currentNonEmpty.length + 1,
                drug_name: dName,
                dose_frequency: dDose
              });
              addedCount++;
            }
          }
        });

        const reindexed = currentNonEmpty.map((row, idx) => ({ ...row, s_no: idx + 1 }));
        setPrescriptionDetails(reindexed.length > 0 ? reindexed : [{ s_no: 1, drug_name: '', dose_frequency: '' }]);

        if (addedCount > 0) {
          showImportNotify({
            type: 'success',
            message: `✅ Prescription details imported successfully (${addedCount} medicines added).`
          });
        } else {
          showImportNotify({
            type: 'info',
            message: 'ℹ Prescription details are already up to date.'
          });
        }
      } else {
        showImportNotify({
          type: 'warning',
          message: '⚠️ No prescribed medications found in the Patient Profile to import.'
        });
      }
    } catch (err) {
      showImportNotify({
        type: 'error',
        message: '❌ Unable to import prescription details. Please try again.'
      });
    }

    setImporting(false);
  };

  // Drug Table Handlers
  const handleAddDrugRow = () => {
    setPrescriptionDetails([
      ...prescriptionDetails,
      { s_no: prescriptionDetails.length + 1, drug_name: '', dose_frequency: '' }
    ]);
  };

  const handleRemoveDrugRow = (index) => {
    const updated = prescriptionDetails.filter((_, idx) => idx !== index).map((row, idx) => ({ ...row, s_no: idx + 1 }));
    setPrescriptionDetails(updated.length > 0 ? updated : [{ s_no: 1, drug_name: '', dose_frequency: '' }]);
  };

  const handleUpdateDrugRow = (index, field, value) => {
    const updated = [...prescriptionDetails];
    let sanitizedVal = value;
    if (field === 'drug_name') {
      sanitizedVal = value.replace(/[^A-Za-z0-9\s/.\-()]/g, '').toUpperCase();
    } else if (field === 'dose_frequency') {
      sanitizedVal = value.toUpperCase();
    }
    updated[index][field] = sanitizedVal;
    setPrescriptionDetails(updated);
  };

  // Toggle Handlers
  const handleToggleProblem = (prob) => {
    if (prescriptionProblems.includes(prob)) {
      setPrescriptionProblems(prescriptionProblems.filter(p => p !== prob));
    } else {
      setPrescriptionProblems([...prescriptionProblems, prob]);
    }
  };

  const handleToggleAction = (act) => {
    if (actionTaken.includes(act)) {
      setActionTaken(actionTaken.filter(a => a !== act));
    } else {
      setActionTaken([...actionTaken, act]);
    }
  };

  const handleToggleRecommendation = (rec) => {
    if (recommendations.includes(rec)) {
      setRecommendations(recommendations.filter(r => r !== rec));
    } else {
      setRecommendations([...recommendations, rec]);
    }
  };

  const handleSaveIntervention = async (newStatus = 'Draft') => {
    clearBottomNotify();

    // Filter out completely empty drug rows
    const cleanedRxDetails = prescriptionDetails.filter(d => d.drug_name.trim() || d.dose_frequency.trim());

    if (newStatus === 'Submitted') {
      if (!patientName.trim()) {
        showBottomNotify({ type: 'error', message: '✖ Patient Initials are required.' });
        return;
      }
      if (!descriptionOfProblem.trim()) {
        showBottomNotify({ type: 'error', message: '✖ Please enter Description of Problem.' });
        return;
      }
      if (cleanedRxDetails.length === 0) {
        showBottomNotify({ type: 'error', message: '✖ Please enter at least one Prescription Detail row.' });
        return;
      }
      for (const rx of cleanedRxDetails) {
        if (!rx.drug_name.trim() || !rx.dose_frequency.trim()) {
          showBottomNotify({ type: 'error', message: '✖ Drug Name and Dose & Frequency are required for all prescription rows.' });
          return;
        }
      }
    }

    setSaving(true);

    const payload = {
      clinical_case_id: clinicalCase.id,
      student_id: student.id,
      college_id: student.college_id,
      patient_name: patientName.trim(),
      age,
      sex,
      date_of_intervention: dateOfIntervention,
      ip_op_no: ipOpNo,
      ward,
      present_diagnosis: presentDiagnosis.trim(),
      prescription_details: cleanedRxDetails,
      prescription_problems: prescriptionProblems,
      prescription_problem_other: prescriptionProblemOther.trim(),
      description_of_problem: descriptionOfProblem.trim(),
      action_taken: actionTaken,
      action_taken_other: actionTakenOther.trim(),
      recommendations: recommendations,
      recommendation_other: recommendationOther.trim(),
      background_info_collected: backgroundInfoCollected,
      discussed_with_physician: discussedWithPhysician,
      suggestions_appropriate_time: suggestionsAppropriateTime,
      accepted,
      changed,
      reasons_if_no: (!accepted || !changed) ? reasonsIfNo.trim() : null,
      significance_of_intervention: significanceOfIntervention,
      outcome,
      references_text: referencesText.trim(),
      follow_up: followUp.trim(),
      status: newStatus
    };

    const res = await saveStudentFormSectionInSupabase({
      section_type: 'intervention',
      is_mandatory: false,
      payload
    });
    setSaving(false);

    if (res.success) {
      setExistingInterventionId(res.intervention.id);
      setStatus(newStatus);
      showBottomNotify({
        type: 'success',
        message: newStatus === 'Submitted' ? '✓ Saved Successfully' : '✓ Draft saved successfully'
      });
    } else {
      showBottomNotify({
        type: 'error',
        message: res.error || '✖ Failed to save Pharmacist Intervention documentation.'
      });
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading Pharmacist Intervention Form...</p>
      </div>
    );
  }

  if (!clinicalCase) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Clinical Case Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Please select a case from My Clinical Cases list to document Pharmacist Intervention.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">Back to My Cases</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn w-full min-w-0 pb-12">
      
      {/* TOP HEADER - CLEAN NO DUPLICATE BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to My Cases"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Pharmacist Intervention Documentation Form</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Case ID: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{clinicalCase.case_id}</strong> • Student: <strong className="text-slate-800 dark:text-slate-200">{student?.full_name}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* FACULTY RETURN FEEDBACK BANNER */}
      {(clinicalCase?.status === 'Returned' || status === 'Returned') && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-800 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-extrabold text-xs">
            <RotateCcw className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>FACULTY RETURN FEEDBACK FOR CORRECTIONS</span>
          </div>
          {clinicalCase?.overall_preceptor_comments && (
            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium pl-6.5 italic">
              "{clinicalCase.overall_preceptor_comments}"
            </p>
          )}
        </div>
      )}

      {/* FORM BODY — wrapped in fieldset for read-only enforcement */}
      <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0, minInlineSize: 'auto' }}>

      {/* 1. PATIENT INFORMATION */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            1. Patient Information
          </h3>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> Auto-Synced from Patient Profile
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          {/* Patient Initials (Auto Synced) */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Patient Initials *</label>
            <input
              type="text"
              readOnly
              value={patientName}
              placeholder="Auto-synced Patient Initials"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase tracking-wider"
            />
          </div>

          {/* Age / Sex (Auto Synced) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Age / Sex</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={age}
                placeholder="Age"
                className="w-full h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              <input
                type="text"
                readOnly
                value={sex}
                placeholder="Sex"
                className="w-16 h-[44px] px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-center"
              />
            </div>
          </div>

          {/* Date of Intervention */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Intervention *</label>
            <input
              type="date"
              value={dateOfIntervention}
              max={todayDateStr}
              onChange={(e) => setDateOfIntervention(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
            />
          </div>

          {/* IP / OP No. (Auto Synced) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">IP / OP No.</label>
            <input
              type="text"
              readOnly
              value={ipOpNo}
              placeholder="Auto-synced IP/OP Number"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
            />
          </div>

          {/* Ward (Auto Synced) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ward</label>
            <input
              type="text"
              readOnly
              value={ward}
              placeholder="Auto-synced Ward"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            />
          </div>

          {/* Present Diagnosis (Auto Synced) */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Present Diagnosis</label>
            <input
              type="text"
              readOnly
              value={presentDiagnosis}
              placeholder="Auto-synced Diagnosis"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            />
          </div>
        </div>
      </div>

      {/* 2. PRESCRIPTION DETAILS TABLE WITH INLINE NOTIFICATION */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            2. Prescription Details
          </h3>

          <div className="flex items-center gap-2">
            {/* IMPORT FROM PATIENT PROFILE BUTTON WITH INLINE NOTIFICATION */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={handleImportFromPatientProfile}
                disabled={importing}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Import from Patient Profile</span>
              </button>
              <InlineActionNotification notification={importNotify} onClose={clearImportNotify} position="inline" />
            </div>

            {/* ADD DRUG ROW BUTTON */}
            <button
              type="button"
              onClick={handleAddDrugRow}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Drug Row</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 w-16 text-center">S. No</th>
                <th className="p-3">Name of the Drug *</th>
                <th className="p-3">Dose & Frequency *</th>
                <th className="p-3 w-16 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {prescriptionDetails.map((row, index) => (
                <tr key={index}>
                  <td className="p-3 text-center font-mono font-bold text-slate-500">{row.s_no}</td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={row.drug_name}
                      onChange={(e) => handleUpdateDrugRow(index, 'drug_name', e.target.value)}
                      placeholder="Enter drug name"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold uppercase"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={row.dose_frequency}
                      onChange={(e) => handleUpdateDrugRow(index, 'dose_frequency', e.target.value)}
                      placeholder="Enter dose & frequency"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold uppercase"
                    />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveDrugRow(index)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. PRESCRIPTION PROBLEM */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          3. Prescription Problem (Check all that apply)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {ALL_PRESCRIPTION_PROBLEMS.map((prob, i) => {
            const isSelected = prescriptionProblems.includes(prob);
            return (
              <div
                key={i}
                onClick={() => handleToggleProblem(prob)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 font-bold text-amber-900 dark:text-amber-200'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-amber-600 shrink-0">
                  {isSelected ? <CheckSquare className="w-4 h-4 fill-amber-500 text-white dark:text-slate-900" /> : <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                </div>
                <span>{prob}</span>
              </div>
            );
          })}
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Others (specify):</label>
          <input
            type="text"
            value={prescriptionProblemOther}
            onChange={(e) => setPrescriptionProblemOther(e.target.value)}
            placeholder="Enter other prescription problems"
            className="w-full h-9 px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Description of Problem *</label>
          <textarea
            rows={3}
            required
            value={descriptionOfProblem}
            onChange={(e) => setDescriptionOfProblem(e.target.value)}
            placeholder="Enter description of problem"
            className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
          />
        </div>
      </div>

      {/* 4. ACTION TAKEN & RECOMMENDATIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Action Taken */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
            4. Action Taken
          </h3>

          <div className="space-y-2 text-xs">
            {ALL_ACTIONS_TAKEN.map((act, i) => {
              const isSelected = actionTaken.includes(act);
              return (
                <div
                  key={i}
                  onClick={() => handleToggleAction(act)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 font-bold text-slate-900 dark:text-white'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="text-emerald-600 shrink-0">
                    {isSelected ? <CheckSquare className="w-4 h-4 fill-emerald-600 text-white dark:text-slate-900" /> : <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                  </div>
                  <span>{act}</span>
                </div>
              );
            })}

            <div>
              <input
                type="text"
                value={actionTakenOther}
                onChange={(e) => setActionTakenOther(e.target.value)}
                placeholder="Enter other action taken"
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
            5. Recommendations (Change)
          </h3>

          <div className="space-y-2 text-xs">
            {ALL_RECOMMENDATIONS.map((rec, i) => {
              const isSelected = recommendations.includes(rec);
              return (
                <div
                  key={i}
                  onClick={() => handleToggleRecommendation(rec)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700 font-bold text-indigo-900 dark:text-indigo-200'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="text-indigo-600 shrink-0">
                    {isSelected ? <CheckSquare className="w-4 h-4 fill-indigo-600 text-white dark:text-slate-900" /> : <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                  </div>
                  <span>Change: {rec}</span>
                </div>
              );
            })}

            <div>
              <input
                type="text"
                value={recommendationOther}
                onChange={(e) => setRecommendationOther(e.target.value)}
                placeholder="Enter other recommendations"
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

      </div>

      {/* 5. CHECKLIST QUESTIONS & ASSESSMENT */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
          6. Intervention Checklist & Significance
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Specific background information collected?</span>
            <div className="flex gap-4 font-bold">
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="c1" checked={backgroundInfoCollected === true} onChange={() => setBackgroundInfoCollected(true)} /> Yes</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="c1" checked={backgroundInfoCollected === false} onChange={() => setBackgroundInfoCollected(false)} /> No</label>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Problem identified discussed with concerned physician?</span>
            <div className="flex gap-4 font-bold">
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="c2" checked={discussedWithPhysician === true} onChange={() => setDiscussedWithPhysician(true)} /> Yes</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="c2" checked={discussedWithPhysician === false} onChange={() => setDiscussedWithPhysician(false)} /> No</label>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Suggestions made at appropriate time:</span>
            <div className="flex gap-4 font-bold">
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="c3" checked={suggestionsAppropriateTime === true} onChange={() => setSuggestionsAppropriateTime(true)} /> Yes</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="c3" checked={suggestionsAppropriateTime === false} onChange={() => setSuggestionsAppropriateTime(false)} /> No</label>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Accepted:</span>
            <div className="flex gap-4 font-bold">
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="c4" checked={accepted === true} onChange={() => setAccepted(true)} /> Yes</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="c4" checked={accepted === false} onChange={() => setAccepted(false)} /> No</label>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Changed:</span>
            <div className="flex gap-4 font-bold">
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="c5" checked={changed === true} onChange={() => setChanged(true)} /> Yes</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="c5" checked={changed === false} onChange={() => setChanged(false)} /> No</label>
            </div>
          </div>

          {(!accepted || !changed) && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">If no, give reason(s):</label>
              <input
                type="text"
                value={reasonsIfNo}
                onChange={(e) => setReasonsIfNo(e.target.value)}
                placeholder="Enter reason if not accepted/changed"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Significance of intervention *</label>
            <div className="flex gap-2">
              {['Minor', 'Moderate', 'Major'].map((sig) => (
                <button
                  key={sig}
                  type="button"
                  onClick={() => setSignificanceOfIntervention(sig)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    significanceOfIntervention === sig
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {sig}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Outcome *</label>
            <div className="flex gap-2">
              {['Positive', 'Negative', 'No change'].map((out) => (
                <button
                  key={out}
                  type="button"
                  onClick={() => setOutcome(out)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    outcome === out
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {out}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. REFERENCES & FOLLOW UP */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          7. References & Follow-up
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">References</label>
            <textarea
              rows={2}
              value={referencesText}
              onChange={(e) => setReferencesText(e.target.value)}
              placeholder="Enter references"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Follow-up Notes</label>
            <textarea
              rows={2}
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Enter follow-up notes"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      </fieldset>
      {/* END FORM BODY */}

      {/* ACTION SECTION AT THE BOTTOM WITH INLINE NOTIFICATION */}
      {!isReadOnly && (
        <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
          <InlineActionNotification notification={bottomNotify} onClose={clearBottomNotify} position="inline" />

          <div className="flex flex-wrap items-center justify-end gap-3">

          <button
            type="button"
            onClick={() => handleSaveIntervention('Draft')}
            disabled={saving}
            className="h-[46px] px-6 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{existingInterventionId ? 'Update Draft' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveIntervention('Submitted')}
            disabled={saving}
            className="h-[46px] px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/10 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
          >
            <span>Save</span>
          </button>
          </div>
        </div>
      )}

    </div>
  );
};

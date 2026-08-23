import React, { useState, useEffect } from 'react';
import { ShieldAlert, User, Activity, Pill, HeartPulse, FileText, Upload, CheckCircle2, AlertTriangle, ArrowLeft, Save, Eye, Send, Loader2, Plus, Trash2, ShieldCheck, Clock, Download, RefreshCw, Calendar, FileDown, RotateCcw } from 'lucide-react';
import { fetchADRReportByCaseIdFromSupabase, generateUniqueAdrNumberInSupabase, saveOrUpdateADRReportInSupabase, fetchPatientProfileByCaseIdFromSupabase, saveStudentFormSectionInSupabase } from '../../services/supabaseService';
import { ADRReportPreviewModal } from './ADRReportPreviewModal';
import { InlineActionNotification } from '../common/InlineActionNotification';
import { useInlineNotification } from '../../hooks/useInlineNotification';

const REACTION_CATEGORIES = [
  'Dermatological',
  'Gastrointestinal',
  'Neurological',
  'Cardiovascular',
  'Respiratory',
  'Hematological',
  'Hepatic',
  'Renal',
  'Endocrine',
  'Musculoskeletal',
  'Psychiatric',
  'Ophthalmic',
  'General/Systemic',
  'Other'
];

const PATIENT_CONDITIONS = [
  'Recovering',
  'Recovered',
  'Not Recovered',
  'Recovering with Sequelae',
  'Fatal',
  'Unknown'
];

const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];

const SERIOUSNESS_OPTIONS = [
  'Hospitalization',
  'Life-threatening',
  'Disability',
  'Congenital Anomaly',
  'Death',
  'Other'
];

const CAUSALITY_OPTIONS = [
  'Certain',
  'Probable',
  'Possible',
  'Unlikely',
  'Conditional',
  'Unassessable'
];

const ACTION_TAKEN_OPTIONS = ['Drug Withdrawn', 'Dose Reduced', 'Continued', 'Unknown'];
const DECHALLENGE_OPTIONS = ['Positive', 'Negative', 'Not Done', 'Unknown'];
const RECHALLENGE_OPTIONS = ['Positive', 'Negative', 'Not Done', 'Unknown'];

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

export const ADRDocumentationFormView = ({ clinicalCase, student, onBack, isReadOnly: propReadOnly = false, snapshotAtReturn = null }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inline Notification Hooks
  const { notification: bottomNotify, showNotification: showBottomNotify, clearNotification: clearBottomNotify } = useInlineNotification();
  const { notification: suspectedImportNotify, showNotification: showSuspectedImportNotify, clearNotification: clearSuspectedImportNotify } = useInlineNotification();
  const { notification: concomitantImportNotify, showNotification: showConcomitantImportNotify, clearNotification: clearConcomitantImportNotify } = useInlineNotification();

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. GENERAL RECORD & PATIENT INFORMATION
  const [adrNumber, setAdrNumber] = useState('');
  const [reportingDate, setReportingDate] = useState(todayStr);
  const [assignedPreceptorName, setAssignedPreceptorName] = useState('Faculty Preceptor');
  const [approvalStatus, setApprovalStatus] = useState('Draft');

  const [patientInitials, setPatientInitials] = useState('');
  const [hospitalRegNumber, setHospitalRegNumber] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('M');
  const [weight, setWeight] = useState('');
  const [department, setDepartment] = useState('');
  const [ward, setWard] = useState('');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');

  // 2. REACTION OVERVIEW
  const [reactionTitle, setReactionTitle] = useState('');
  const [reactionCategorySelect, setReactionCategorySelect] = useState('Dermatological');
  const [reactionCategoryOther, setReactionCategoryOther] = useState('');
  const [reactionDescription, setReactionDescription] = useState('');
  const [reactionStartedAt, setReactionStartedAt] = useState('');
  const [reactionEndedAt, setReactionEndedAt] = useState('');
  const [reactionDuration, setReactionDuration] = useState('');
  const [clinicalManagementProvided, setClinicalManagementProvided] = useState('');
  const [currentPatientCondition, setCurrentPatientCondition] = useState('Recovering');

  // 3. SUSPECTED MEDICATION (DYNAMIC TABLE)
  const [suspectedMeds, setSuspectedMeds] = useState([
    {
      medicine_name: '',
      generic_name: '',
      strength: '500 mg',
      dosage_form: 'Tablet',
      dose: '1 tab',
      route: 'Oral',
      frequency: 'BD',
      start_date: '',
      stop_date: '',
      clinical_indication: '',
      manufacturer: '',
      batch_number: '',
      expiry_date: ''
    }
  ]);

  // 4. OTHER CONCURRENT MEDICATIONS (DYNAMIC TABLE)
  const [concomitantMeds, setConcomitantMeds] = useState([]);

  // 5. PATIENT CLINICAL BACKGROUND
  const [drugAllergyHistory, setDrugAllergyHistory] = useState('None known');
  const [previousAdrHistory, setPreviousAdrHistory] = useState('None');
  const [relevantMedicalConditions, setRelevantMedicalConditions] = useState('');
  const [pregnancyLactationStatus, setPregnancyLactationStatus] = useState('Not Applicable');
  const [renalStatus, setRenalStatus] = useState('Normal');
  const [hepaticStatus, setHepaticStatus] = useState('Normal');
  const [lifestyleFactors, setLifestyleFactors] = useState('Non-smoker, Non-alcoholic');
  const [additionalClinicalNotes, setAdditionalClinicalNotes] = useState('');

  // 6. REACTION ASSESSMENT & CAUSALITY
  const [reactionSeverity, setReactionSeverity] = useState('Moderate');
  const [reactionSeriousness, setReactionSeriousness] = useState('Hospitalization');
  const [patientOutcome, setPatientOutcome] = useState('Recovered');
  const [actionTakenOnSuspectedDrug, setActionTakenOnSuspectedDrug] = useState('Drug Withdrawn');
  const [rechallengeInformation, setRechallengeInformation] = useState('Not Done');
  const [dechallengeInformation, setDechallengeInformation] = useState('Positive');
  const [initialCausalityOpinion, setInitialCausalityOpinion] = useState('Probable');
  const [clinicalRemarks, setClinicalRemarks] = useState('');

  // 7. SUPPORTING DOCUMENTS (FILES)
  const [attachments, setAttachments] = useState([]);

  // 8. REVIEW INFORMATION & REMARKS
  const [studentRemarks, setStudentRemarks] = useState('');
  const [preceptorReview, setPreceptorReview] = useState('');
  const [facultyComments, setFacultyComments] = useState('');

  const currentAdrObj = React.useMemo(() => ({
    adr_number: adrNumber,
    reporting_date: reportingDate,
    patient_initials: patientInitials,
    hospital_reg_number: hospitalRegNumber,
    age, gender, weight, department,
    reaction_title: reactionTitle,
    reaction_category: reactionCategorySelect === 'Other' ? reactionCategoryOther : reactionCategorySelect,
    reaction_description: reactionDescription,
    reaction_started_at: reactionStartedAt,
    reaction_ended_at: reactionEndedAt,
    reaction_duration: reactionDuration,
    reaction_outcome: currentPatientCondition,
    clinical_management: clinicalManagementProvided,
    suspected_drugs: suspectedMeds,
    concomitant_drugs: concomitantMeds,
    relevant_medical_conditions: relevantMedicalConditions,
    pregnancy_lactation_status: pregnancyLactationStatus,
    renal_status: renalStatus,
    hepatic_status: hepaticStatus,
    lifestyle_factors: lifestyleFactors,
    additional_clinical_notes: additionalClinicalNotes,
    reaction_severity: reactionSeverity,
    reaction_seriousness: reactionSeriousness,
    patient_outcome: patientOutcome,
    action_taken_on_suspected_drug: actionTakenOnSuspectedDrug,
    rechallenge_information: rechallengeInformation,
    dechallenge_information: dechallengeInformation,
    initial_causality_opinion: initialCausalityOpinion,
    clinical_remarks: clinicalRemarks,
    student_remarks: studentRemarks
  }), [
    adrNumber, reportingDate, patientInitials, hospitalRegNumber, age, gender, weight, department,
    reactionTitle, reactionCategorySelect, reactionCategoryOther, reactionDescription, reactionStartedAt, reactionEndedAt,
    reactionDuration, currentPatientCondition, clinicalManagementProvided, suspectedMeds, concomitantMeds,
    relevantMedicalConditions, pregnancyLactationStatus, renalStatus, hepaticStatus, lifestyleFactors,
    additionalClinicalNotes, reactionSeverity, reactionSeriousness, patientOutcome,
    actionTakenOnSuspectedDrug, rechallengeInformation, dechallengeInformation,
    initialCausalityOpinion, clinicalRemarks, studentRemarks
  ]);

  const diffMap = React.useMemo(() => {
    const snap = snapshotAtReturn || clinicalCase?.snapshot_at_return?.adr;
    if (!snap) return {};
    return computeModuleDiffs(currentAdrObj, snap, 'adr');
  }, [currentAdrObj, snapshotAtReturn, clinicalCase?.snapshot_at_return?.adr]);

  // Meta
  const [existingReportId, setExistingReportId] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Helper: Focus/Blur Placeholder logic
  const handleFocusPlaceholder = (e) => {
    e.target.dataset.ph = e.target.placeholder;
    e.target.placeholder = '';
  };

  const handleBlurPlaceholder = (e) => {
    if (e.target.dataset.ph) {
      e.target.placeholder = e.target.dataset.ph;
    }
  };

  // Helper: Auto-calculate Reaction Duration
  useEffect(() => {
    if (reactionStartedAt && reactionEndedAt) {
      const start = new Date(reactionStartedAt);
      const end = new Date(reactionEndedAt);
      if (end >= start) {
        const diffMs = end - start;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(diffHrs / 24);
        const hrs = diffHrs % 24;

        if (days > 0 && hrs > 0) {
          setReactionDuration(`${days} Day${days > 1 ? 's' : ''} ${hrs} Hour${hrs > 1 ? 's' : ''}`);
        } else if (days > 0) {
          setReactionDuration(`${days} Day${days > 1 ? 's' : ''}`);
        } else {
          setReactionDuration(`${hrs} Hour${hrs > 1 ? 's' : ''}`);
        }
      } else {
        setReactionDuration('Invalid duration (Ended before Started)');
      }
    } else {
      setReactionDuration('');
    }
  }, [reactionStartedAt, reactionEndedAt]);

  useEffect(() => {
    const loadADRData = async () => {
      if (!clinicalCase || !clinicalCase.id) {
        setLoading(false);
        return;
      }
      setLoading(true);

      // Pre-fill defaults from clinicalCase
      setDepartment(clinicalCase.department || '');
      setWard(clinicalCase.ward_unit || '');
      setAssignedPreceptorName(student?.assigned_preceptor_name || clinicalCase.preceptor_name || 'Faculty Preceptor');

      try {
        const [res, profileRes] = await Promise.all([
          fetchADRReportByCaseIdFromSupabase(clinicalCase.id),
          fetchPatientProfileByCaseIdFromSupabase(clinicalCase.id)
        ]);

        if (profileRes.success && profileRes.profile) {
          const p = profileRes.profile;
          setPatientInitials(p.patient_name || p.patient_initials || '');
          setHospitalRegNumber(p.ip_no || p.ip_op_number || '');
          setAge(p.age ? p.age.toString() : '');
          setGender(p.gender === 'Female' ? 'F' : p.gender === 'Male' ? 'M' : p.gender || 'M');
          setWeight(p.weight || '');
          setWard(p.ward || p.ward_unit || clinicalCase.ward_unit || '');
          setPrimaryDiagnosis(p.final_diagnosis || p.provisional_diagnosis || clinicalCase?.final_diagnosis || '');
          setDrugAllergyHistory(p.allergies || (p.allergy_drugs || p.allergy_food ? `Drugs: ${p.allergy_drugs || 'None'}, Food: ${p.allergy_food || 'None'}` : 'None'));
          setPregnancyLactationStatus(p.pregnancy_status || p.pregnancy_lactation_status || 'Not Applicable');
          setRenalStatus(p.renal_status || 'Normal');
          setHepaticStatus(p.hepatic_status || 'Normal');
        }

        if (res.success && res.report) {
          const rep = res.report;
          setExistingReportId(rep.id);
          setAdrNumber(rep.adr_number || '');
          setReportingDate(rep.reporting_date || todayStr);
          setAssignedPreceptorName(rep.assigned_preceptor_name || student?.assigned_preceptor_name || 'Faculty Preceptor');
          setApprovalStatus(rep.approval_status || 'Draft');

          setPatientInitials(rep.patient_initials || '');
          setHospitalRegNumber(rep.hospital_reg_number || '');
          setAge(rep.age || '');
          setGender(rep.gender || 'M');
          setWeight(rep.weight || '');
          setDepartment(rep.department || clinicalCase.department || '');
          setWard(rep.ward || clinicalCase.ward_unit || '');
          setPrimaryDiagnosis(rep.primary_diagnosis || '');

          setReactionTitle(rep.reaction_title || '');
          if (REACTION_CATEGORIES.includes(rep.reaction_category)) {
            setReactionCategorySelect(rep.reaction_category);
            setReactionCategoryOther('');
          } else if (rep.reaction_category) {
            setReactionCategorySelect('Other');
            setReactionCategoryOther(rep.reaction_category);
          }

          setReactionDescription(rep.reaction_description || '');
          setReactionStartedAt(rep.reaction_started_at ? rep.reaction_started_at.split('T')[0] : '');
          setReactionEndedAt(rep.reaction_ended_at ? rep.reaction_ended_at.split('T')[0] : '');
          setReactionDuration(rep.reaction_duration || '');
          setClinicalManagementProvided(rep.clinical_management_provided || '');
          setCurrentPatientCondition(rep.current_patient_condition || 'Recovering');

          setDrugAllergyHistory(rep.drug_allergy_history || 'None known');
          setPreviousAdrHistory(rep.previous_adr_history || 'None');
          setRelevantMedicalConditions(rep.relevant_medical_conditions || '');
          setPregnancyLactationStatus(rep.pregnancy_lactation_status || 'Not Applicable');
          setRenalStatus(rep.renal_status || 'Normal');
          setHepaticStatus(rep.hepatic_status || 'Normal');
          setLifestyleFactors(rep.lifestyle_factors || 'Non-smoker, Non-alcoholic');
          setAdditionalClinicalNotes(rep.additional_clinical_notes || '');

          setReactionSeverity(rep.reaction_severity || 'Moderate');
          setReactionSeriousness(rep.reaction_seriousness || 'Hospitalization');
          setPatientOutcome(rep.patient_outcome || 'Recovered');
          setActionTakenOnSuspectedDrug(rep.action_taken_on_suspected_drug || 'Drug Withdrawn');
          setRechallengeInformation(rep.rechallenge_information || 'Not Done');
          setDechallengeInformation(rep.dechallenge_information || 'Positive');
          setInitialCausalityOpinion(rep.initial_causality_opinion || 'Probable');
          setClinicalRemarks(rep.clinical_remarks || '');

          setStudentRemarks(rep.student_remarks || '');
          setPreceptorReview(rep.preceptor_review || '');
          setFacultyComments(rep.faculty_comments || '');

          if (res.suspectedMeds && res.suspectedMeds.length > 0) setSuspectedMeds(res.suspectedMeds);
          if (res.concomitantMeds) setConcomitantMeds(res.concomitantMeds);
          if (res.attachments) setAttachments(res.attachments);
        } else {
          // Auto-generate ADR Record Number & create initial Draft record in Supabase
          const genRes = await generateUniqueAdrNumberInSupabase();
          const newAdrNo = genRes.success ? genRes.adrNumber : `ADR-${new Date().getFullYear()}-000001`;
          setAdrNumber(newAdrNo);

          // Initial draft payload
          const initialDraftPayload = {
            clinical_case_id: clinicalCase.id,
            student_id: student.id,
            college_id: student.college_id,
            adr_number: newAdrNo,
            reporting_date: todayStr,
            reported_by_student_name: student?.full_name || '',
            assigned_preceptor_name: student?.assigned_preceptor_name || clinicalCase.preceptor_name || 'Faculty Preceptor',
            patient_initials: profileRes?.profile?.patient_name || profileRes?.profile?.patient_initials || '',
            hospital_reg_number: profileRes?.profile?.ip_no || profileRes?.profile?.ip_op_number || '',
            age: profileRes?.profile?.age ? profileRes.profile.age.toString() : '',
            gender: profileRes?.profile?.gender === 'Female' ? 'F' : profileRes?.profile?.gender === 'Male' ? 'M' : profileRes?.profile?.gender || 'M',
            weight: profileRes?.profile?.weight || '',
            department: clinicalCase.department || '',
            ward: profileRes?.profile?.ward || profileRes?.profile?.ward_unit || clinicalCase.ward_unit || '',
            primary_diagnosis: profileRes?.profile?.final_diagnosis || profileRes?.profile?.provisional_diagnosis || '',
            approval_status: 'Draft'
          };

          const draftRes = await saveOrUpdateADRReportInSupabase(initialDraftPayload, [], [], []);
          if (draftRes.success && draftRes.report) {
            setExistingReportId(draftRes.report.id);
          }
        }
      } catch (err) {
        console.error('Error loading ADR report data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadADRData();
  }, [clinicalCase, student]);

  // IMPORT SUSPECTED MEDICATIONS FROM PATIENT PROFILE
  const handleImportSuspectedFromProfile = async () => {
    clearSuspectedImportNotify();
    try {
      const res = await fetchPatientProfileByCaseIdFromSupabase(clinicalCase.id);
      if (!res.success || !res.profile) {
        showSuspectedImportNotify({ type: 'warning', message: '⚠ No prescribed medications found in Patient Profile.' });
        return;
      }
      const p = res.profile;
      const rawMeds = p.medications || p.prescribed_medications || p.current_medications || [];

      if (!Array.isArray(rawMeds) || rawMeds.length === 0) {
        showSuspectedImportNotify({ type: 'warning', message: '⚠ No prescribed medications found in Patient Profile to import.' });
        return;
      }

      // Filter out existing meds to avoid duplicate rows
      const existingNames = new Set(suspectedMeds.map(m => (m.medicine_name || '').toLowerCase().trim()));
      const newMedsToImport = rawMeds.filter(m => {
        const name = (m.medicine_name || m.drug_name || m.brand_name || '').toLowerCase().trim();
        return name && !existingNames.has(name);
      });

      if (newMedsToImport.length === 0) {
        showSuspectedImportNotify({ type: 'info', message: 'ℹ Prescribed medications are already imported.' });
        return;
      }

      const formattedImported = newMedsToImport.map(m => ({
        medicine_name: m.medicine_name || m.drug_name || m.brand_name || '',
        generic_name: m.generic_name || '',
        strength: m.strength || '500 mg',
        dosage_form: m.dosage_form || 'Tablet',
        dose: m.dose || '1 tab',
        route: m.route || 'Oral',
        frequency: m.frequency || 'OD',
        start_date: m.start_date || '',
        stop_date: m.stop_date || '',
        clinical_indication: m.indication || m.purpose || '',
        manufacturer: '',
        batch_number: '',
        expiry_date: ''
      }));

      // Replace first empty row if blank
      if (suspectedMeds.length === 1 && !suspectedMeds[0].medicine_name.trim()) {
        setSuspectedMeds(formattedImported);
      } else {
        setSuspectedMeds([...suspectedMeds, ...formattedImported]);
      }

      showSuspectedImportNotify({ type: 'success', message: '✅ Prescribed medications imported successfully from Patient Profile.' });
    } catch (err) {
      showSuspectedImportNotify({ type: 'error', message: '❌ Unable to import prescribed medications.' });
    }
  };

  // IMPORT CONCOMITANT MEDICATIONS FROM PATIENT PROFILE
  const handleImportConcomitantFromProfile = async () => {
    clearConcomitantImportNotify();
    try {
      const res = await fetchPatientProfileByCaseIdFromSupabase(clinicalCase.id);
      if (!res.success || !res.profile) {
        showConcomitantImportNotify({ type: 'warning', message: '⚠ No concurrent medications found in Patient Profile.' });
        return;
      }
      const p = res.profile;
      const rawMeds = p.medications || p.prescribed_medications || p.concomitant_medications || p.other_medications || [];

      if (!Array.isArray(rawMeds) || rawMeds.length === 0) {
        showConcomitantImportNotify({ type: 'warning', message: '⚠ No concurrent medications found in Patient Profile to import.' });
        return;
      }

      const existingNames = new Set(concomitantMeds.map(m => (m.medicine_name || '').toLowerCase().trim()));
      const newMedsToImport = rawMeds.filter(m => {
        const name = (m.medicine_name || m.drug_name || m.brand_name || '').toLowerCase().trim();
        return name && !existingNames.has(name);
      });

      if (newMedsToImport.length === 0) {
        showConcomitantImportNotify({ type: 'info', message: 'ℹ Concurrent medications are already imported.' });
        return;
      }

      const formattedImported = newMedsToImport.map(m => ({
        medicine_name: m.medicine_name || m.drug_name || m.brand_name || '',
        dose: m.dose || '1 tab',
        route: m.route || 'Oral',
        frequency: m.frequency || 'OD',
        purpose: m.indication || m.purpose || '',
        start_date: m.start_date || '',
        stop_date: m.stop_date || ''
      }));

      setConcomitantMeds([...concomitantMeds, ...formattedImported]);
      showConcomitantImportNotify({ type: 'success', message: '✅ Concurrent medications imported successfully from Patient Profile.' });
    } catch (err) {
      showConcomitantImportNotify({ type: 'error', message: '❌ Unable to import concurrent medications.' });
    }
  };

  // DYNAMIC SUSPECTED MEDS HANDLERS
  const handleAddSuspectedMed = () => {
    setSuspectedMeds([
      ...suspectedMeds,
      {
        medicine_name: '',
        generic_name: '',
        strength: '',
        dosage_form: 'Tablet',
        dose: '',
        route: 'Oral',
        frequency: 'OD',
        start_date: '',
        stop_date: '',
        clinical_indication: '',
        manufacturer: '',
        batch_number: '',
        expiry_date: ''
      }
    ]);
  };

  const handleRemoveSuspectedMed = (index) => {
    setSuspectedMeds(suspectedMeds.filter((_, i) => i !== index));
  };

  const handleUpdateSuspectedMed = (index, field, value) => {
    const updated = [...suspectedMeds];
    updated[index][field] = value;
    setSuspectedMeds(updated);
  };

  // DYNAMIC CONCOMITANT MEDS HANDLERS
  const handleAddConcomitantMed = () => {
    setConcomitantMeds([
      ...concomitantMeds,
      {
        medicine_name: '',
        dose: '',
        route: 'Oral',
        frequency: 'OD',
        purpose: '',
        start_date: '',
        stop_date: ''
      }
    ]);
  };

  const handleRemoveConcomitantMed = (index) => {
    setConcomitantMeds(concomitantMeds.filter((_, i) => i !== index));
  };

  const handleUpdateConcomitantMed = (index, field, value) => {
    const updated = [...concomitantMeds];
    updated[index][field] = value;
    setConcomitantMeds(updated);
  };

  // FILE ATTACHMENT HANDLER
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (attachments.length + files.length > 5) {
      showBottomNotify({ type: 'warning', message: '⚠ Maximum 5 files allowed for ADR supporting documents.' });
      return;
    }

    const newAtts = files.map(f => ({
      file_name: f.name,
      file_type: f.type || 'Document',
      file_size: f.size ? `${(f.size / 1024).toFixed(1)} KB` : 'Unknown',
      file_url: URL.createObjectURL(f)
    }));

    setAttachments([...attachments, ...newAtts]);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // SAVE & SUBMIT HANDLER
  const handleSaveADR = async (newStatus = 'Draft') => {
    clearBottomNotify();

    const finalReactionCategory = reactionCategorySelect === 'Other' ? reactionCategoryOther.trim() : reactionCategorySelect;

    // Mandatory Validation ONLY on Submit
    if (newStatus === 'Submitted') {
      if (reportingDate > todayStr) {
        showBottomNotify({ type: 'error', message: '✖ Reporting Date cannot be a future date.' });
        return;
      }
      if (reactionStartedAt && reactionStartedAt > reportingDate) {
        showBottomNotify({ type: 'error', message: '✖ Reaction Started Date cannot be after Reporting Date.' });
        return;
      }
      if (reactionStartedAt && reactionEndedAt && reactionEndedAt < reactionStartedAt) {
        showBottomNotify({ type: 'error', message: '✖ Reaction Ended Date must be after Reaction Started Date.' });
        return;
      }
      if (!reactionTitle.trim()) {
        showBottomNotify({ type: 'error', message: '✖ Please enter Reaction Title.' });
        return;
      }
      if (reactionCategorySelect === 'Other' && !reactionCategoryOther.trim()) {
        showBottomNotify({ type: 'error', message: '✖ Please specify Reaction Category.' });
        return;
      }
      if (!reactionDescription.trim()) {
        showBottomNotify({ type: 'error', message: '✖ Please enter Adverse Reaction Description.' });
        return;
      }
      const validSuspected = suspectedMeds.filter(m => m.medicine_name.trim().length > 0);
      if (validSuspected.length === 0) {
        showBottomNotify({ type: 'error', message: '✖ At least one Suspected Medicine with medicine name is required before submission.' });
        return;
      }
    }

    setSaving(true);

    const masterPayload = {
      clinical_case_id: clinicalCase.id,
      student_id: student.id,
      college_id: student.college_id,
      adr_number: adrNumber,
      reporting_date: reportingDate,
      reported_by_student_name: student.full_name,
      assigned_preceptor_name: assignedPreceptorName,
      patient_initials: patientInitials,
      hospital_reg_number: hospitalRegNumber,
      age,
      gender,
      weight,
      department,
      ward,
      primary_diagnosis: primaryDiagnosis,
      reaction_title: reactionTitle.trim(),
      reaction_category: finalReactionCategory,
      reaction_description: reactionDescription.trim(),
      reaction_started_at: reactionStartedAt ? new Date(reactionStartedAt).toISOString() : null,
      reaction_ended_at: reactionEndedAt ? new Date(reactionEndedAt).toISOString() : null,
      reaction_duration: reactionDuration,
      clinical_management_provided: clinicalManagementProvided.trim(),
      current_patient_condition: currentPatientCondition,
      drug_allergy_history: drugAllergyHistory,
      previous_adr_history: previousAdrHistory,
      relevant_medical_conditions: relevantMedicalConditions,
      pregnancy_lactation_status: pregnancyLactationStatus,
      renal_status: renalStatus,
      hepatic_status: hepaticStatus,
      lifestyle_factors: lifestyleFactors.trim(),
      additional_clinical_notes: additionalClinicalNotes.trim(),
      reaction_severity: reactionSeverity,
      reaction_seriousness: reactionSeriousness,
      patient_outcome: patientOutcome,
      action_taken_on_suspected_drug: actionTakenOnSuspectedDrug,
      rechallenge_information: rechallengeInformation,
      dechallenge_information: dechallengeInformation,
      initial_causality_opinion: initialCausalityOpinion,
      clinical_remarks: clinicalRemarks.trim(),
      student_remarks: studentRemarks.trim(),
      preceptor_review: preceptorReview,
      faculty_comments: facultyComments,
      approval_status: newStatus
    };

    const res = await saveStudentFormSectionInSupabase({
      section_type: 'adr',
      is_mandatory: false,
      payload: masterPayload,
      suspectedMeds,
      concomitantMeds,
      attachments
    });
    setSaving(false);

    if (res.success) {
      setExistingReportId(res.report.id);
      setApprovalStatus(newStatus);
      showBottomNotify({
        type: 'success',
        message: newStatus === 'Submitted' ? '✓ Saved Successfully' : '✓ Draft saved successfully'
      });
    } else {
      showBottomNotify({
        type: 'error',
        message: res.error || '✖ Failed to save Adverse Drug Reaction documentation.'
      });
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading ADR Documentation Form...</p>
      </div>
    );
  }

  if (!clinicalCase) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Clinical Case Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Please select a case from My Clinical Cases list to document Adverse Drug Reactions.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">Back to My Cases</button>
      </div>
    );
  }

  const isReadOnly = propReadOnly || approvalStatus === 'Submitted' || approvalStatus === 'Approved' || clinicalCase?.status === 'Approved' || clinicalCase?.overall_case_status === 'Approved';

  return (
    <div className="space-y-6 animate-fadeIn w-full min-w-0 pb-12">
      
      {/* TOP HEADER */}
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
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <span>Adverse Drug Reaction (ADR) Documentation</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Case ID: <strong className="font-mono text-amber-600 dark:text-amber-400">{clinicalCase.case_id}</strong> • Record No: <strong className="font-mono text-slate-800 dark:text-slate-200">{adrNumber}</strong> • Status: <strong className="uppercase font-bold text-emerald-600 dark:text-emerald-400">{approvalStatus}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* FACULTY RETURN FEEDBACK BANNER */}
      {(clinicalCase?.status === 'Returned' || approvalStatus === 'Returned') && (
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

      {/* 1. GENERAL RECORD & PATIENT INFORMATION */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            1. General Record & Patient Information
          </h3>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> Auto Synced from Patient Profile
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ADR Record Number (Auto)</label>
            <input type="text" readOnly value={adrNumber} className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-mono font-extrabold" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" /> Reporting Date *
            </label>
            <input
              type="date"
              disabled={isReadOnly}
              max={todayStr}
              value={reportingDate}
              onChange={(e) => setReportingDate(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reported By (Student)</label>
            <input type="text" readOnly value={student?.full_name || ''} className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Preceptor</label>
            <input type="text" readOnly value={assignedPreceptorName} className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Patient Initials</label>
            <input type="text" readOnly value={patientInitials} className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hospital Reg / IP No</label>
            <input type="text" readOnly value={hospitalRegNumber} className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Age / Gender / Weight</label>
            <div className="flex gap-1.5">
              <input type="text" readOnly value={age ? `${age}y` : ''} className="w-1/3 h-[44px] px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-bold text-center" />
              <input type="text" readOnly value={gender} className="w-1/3 h-[44px] px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-bold text-center" />
              <input type="text" readOnly value={weight ? `${weight}kg` : ''} className="w-1/3 h-[44px] px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-bold text-center" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department / Ward</label>
            <input type="text" readOnly value={`${department || ''} / ${ward || ''}`} className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" />
          </div>

          <div className="sm:col-span-4">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Diagnosis</label>
            <textarea rows={2} readOnly value={primaryDiagnosis} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white" />
          </div>
        </div>
      </div>

      {/* 2. ADVERSE REACTION DETAILS */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Activity className="w-4 h-4 text-amber-500" />
          2. Adverse Reaction Details
        </h3>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reaction Title *</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={reactionTitle}
                onChange={(e) => setReactionTitle(e.target.value)}
                onFocus={handleFocusPlaceholder}
                onBlur={handleBlurPlaceholder}
                placeholder="Enter adverse reaction title"
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reaction Category *</label>
              <select
                disabled={isReadOnly}
                value={reactionCategorySelect}
                onChange={(e) => setReactionCategorySelect(e.target.value)}
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                {REACTION_CATEGORIES.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {reactionCategorySelect === 'Other' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Specify Reaction Category *</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={reactionCategoryOther}
                onChange={(e) => setReactionCategoryOther(e.target.value)}
                onFocus={handleFocusPlaceholder}
                onBlur={handleBlurPlaceholder}
                placeholder="Enter Reaction Category"
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reaction Description *</label>
            <textarea
              rows={4}
              disabled={isReadOnly}
              value={reactionDescription}
              onChange={(e) => setReactionDescription(e.target.value)}
              onFocus={handleFocusPlaceholder}
              onBlur={handleBlurPlaceholder}
              placeholder="Enter adverse reaction description"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date Reaction Started</label>
              <input
                type="date"
                disabled={isReadOnly}
                max={todayStr}
                value={reactionStartedAt}
                onChange={(e) => setReactionStartedAt(e.target.value)}
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date Reaction Ended</label>
              <input
                type="date"
                disabled={isReadOnly}
                max={todayStr}
                value={reactionEndedAt}
                onChange={(e) => setReactionEndedAt(e.target.value)}
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reaction Duration (Auto)</label>
              <input
                type="text"
                readOnly
                value={reactionDuration}
                placeholder="Duration auto-calculated"
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Clinical Management Provided</label>
              <textarea
                rows={3}
                disabled={isReadOnly}
                value={clinicalManagementProvided}
                onChange={(e) => setClinicalManagementProvided(e.target.value)}
                onFocus={handleFocusPlaceholder}
                onBlur={handleBlurPlaceholder}
                placeholder="Enter clinical management provided"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Patient Condition *</label>
              <select
                disabled={isReadOnly}
                value={currentPatientCondition}
                onChange={(e) => setCurrentPatientCondition(e.target.value)}
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                {PATIENT_CONDITIONS.map((cond, i) => (
                  <option key={i} value={cond}>{cond}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SUSPECTED MEDICATION(S) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800 relative">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Pill className="w-4 h-4 text-amber-500" />
            3. Suspected Medication(s) *
          </h3>

          <div className="flex flex-wrap items-center gap-2 relative">
            <InlineActionNotification notification={suspectedImportNotify} onClose={clearSuspectedImportNotify} position="inline" />

            {!isReadOnly && (
              <>
                <button
                  type="button"
                  onClick={handleImportSuspectedFromProfile}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-600" />
                  <span>Import from Patient Profile</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddSuspectedMed}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Suspected Medicine</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {suspectedMeds.map((med, idx) => (
            <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between font-bold border-b border-slate-200/60 dark:border-slate-800 pb-2">
                <span>Suspected Medicine #{idx + 1}</span>
                {!isReadOnly && suspectedMeds.length > 1 && (
                  <button type="button" onClick={() => handleRemoveSuspectedMed(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Brand Name *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={med.medicine_name}
                    onChange={(e) => handleUpdateSuspectedMed(idx, 'medicine_name', e.target.value)}
                    onFocus={handleFocusPlaceholder}
                    onBlur={handleBlurPlaceholder}
                    placeholder="Enter brand name"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Generic Name</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={med.generic_name}
                    onChange={(e) => handleUpdateSuspectedMed(idx, 'generic_name', e.target.value)}
                    onFocus={handleFocusPlaceholder}
                    onBlur={handleBlurPlaceholder}
                    placeholder="Enter generic name"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dose / Route / Freq</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={med.dose}
                    onChange={(e) => handleUpdateSuspectedMed(idx, 'dose', e.target.value)}
                    onFocus={handleFocusPlaceholder}
                    onBlur={handleBlurPlaceholder}
                    placeholder="e.g. 500mg Oral BD"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Indication</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={med.clinical_indication}
                    onChange={(e) => handleUpdateSuspectedMed(idx, 'clinical_indication', e.target.value)}
                    onFocus={handleFocusPlaceholder}
                    onBlur={handleBlurPlaceholder}
                    placeholder="Enter indication"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={med.start_date}
                    onChange={(e) => handleUpdateSuspectedMed(idx, 'start_date', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Stop Date</label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={med.stop_date}
                    onChange={(e) => handleUpdateSuspectedMed(idx, 'stop_date', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Manufacturer (Optional)</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={med.manufacturer}
                    onChange={(e) => handleUpdateSuspectedMed(idx, 'manufacturer', e.target.value)}
                    onFocus={handleFocusPlaceholder}
                    onBlur={handleBlurPlaceholder}
                    placeholder="Enter manufacturer"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Batch No (Optional)</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={med.batch_number}
                    onChange={(e) => handleUpdateSuspectedMed(idx, 'batch_number', e.target.value)}
                    onFocus={handleFocusPlaceholder}
                    onBlur={handleBlurPlaceholder}
                    placeholder="Enter batch number"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-semibold"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. OTHER CONCURRENT MEDICATIONS */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800 relative">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Pill className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            4. Other Concurrent Medications
          </h3>

          <div className="flex flex-wrap items-center gap-2 relative">
            <InlineActionNotification notification={concomitantImportNotify} onClose={clearConcomitantImportNotify} position="inline" />

            {!isReadOnly && (
              <>
                <button
                  type="button"
                  onClick={handleImportConcomitantFromProfile}
                  className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 text-xs font-bold border border-cyan-200 dark:border-cyan-800 flex items-center gap-1.5 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Import Concurrent Medications</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddConcomitantMed}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Concurrent Medicine</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {concomitantMeds.length === 0 ? (
            <p className="text-slate-400 italic text-center py-2">No concurrent medications added.</p>
          ) : (
            concomitantMeds.map((med, idx) => (
              <div key={idx} className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Medicine Name</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={med.medicine_name}
                    onChange={(e) => handleUpdateConcomitantMed(idx, 'medicine_name', e.target.value)}
                    onFocus={handleFocusPlaceholder}
                    onBlur={handleBlurPlaceholder}
                    placeholder="Enter medicine name"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dose / Freq</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={med.dose}
                    onChange={(e) => handleUpdateConcomitantMed(idx, 'dose', e.target.value)}
                    onFocus={handleFocusPlaceholder}
                    onBlur={handleBlurPlaceholder}
                    placeholder="e.g. 1 tab BD"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Purpose / Indication</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={med.purpose}
                    onChange={(e) => handleUpdateConcomitantMed(idx, 'purpose', e.target.value)}
                    onFocus={handleFocusPlaceholder}
                    onBlur={handleBlurPlaceholder}
                    placeholder="Enter purpose"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={med.start_date}
                      onChange={(e) => handleUpdateConcomitantMed(idx, 'start_date', e.target.value)}
                      className="w-full h-9 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-bold"
                    />
                  </div>

                  {!isReadOnly && (
                    <button type="button" onClick={() => handleRemoveConcomitantMed(idx)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg self-end mb-0.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. PATIENT CLINICAL BACKGROUND */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-amber-500" />
            5. Patient Clinical Background
          </h3>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> Auto Synced from Patient Profile
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Drug Allergy History</label>
            <input type="text" readOnly value={drugAllergyHistory} className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Previous ADR History</label>
            <input type="text" readOnly value={previousAdrHistory} className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Pregnancy / Lactation Status</label>
            <input type="text" readOnly value={pregnancyLactationStatus} className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Renal Status / Hepatic Status</label>
            <input type="text" readOnly value={`${renalStatus} / ${hepaticStatus}`} className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lifestyle Factors (Editable)</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={lifestyleFactors}
              onChange={(e) => setLifestyleFactors(e.target.value)}
              onFocus={handleFocusPlaceholder}
              onBlur={handleBlurPlaceholder}
              placeholder="Enter lifestyle factors"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </div>
      </div>

      {/* 6. REACTION ASSESSMENT & CAUSALITY */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          6. Reaction Assessment & Causality *
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reaction Severity *</label>
            <select
              disabled={isReadOnly}
              value={reactionSeverity}
              onChange={(e) => setReactionSeverity(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              {SEVERITY_OPTIONS.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reaction Seriousness *</label>
            <select
              disabled={isReadOnly}
              value={reactionSeriousness}
              onChange={(e) => setReactionSeriousness(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              {SERIOUSNESS_OPTIONS.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Causality Opinion *</label>
            <select
              disabled={isReadOnly}
              value={initialCausalityOpinion}
              onChange={(e) => setInitialCausalityOpinion(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              {CAUSALITY_OPTIONS.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Action Taken on Suspected Drug</label>
            <select
              disabled={isReadOnly}
              value={actionTakenOnSuspectedDrug}
              onChange={(e) => setActionTakenOnSuspectedDrug(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              {ACTION_TAKEN_OPTIONS.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Dechallenge Information</label>
            <select
              disabled={isReadOnly}
              value={dechallengeInformation}
              onChange={(e) => setDechallengeInformation(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              {DECHALLENGE_OPTIONS.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Rechallenge Information</label>
            <select
              disabled={isReadOnly}
              value={rechallengeInformation}
              onChange={(e) => setRechallengeInformation(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              {RECHALLENGE_OPTIONS.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 7. SUPPORTING DOCUMENTS */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Upload className="w-4 h-4 text-amber-500" />
          7. Supporting Documents (Max 5 Files)
        </h3>

        {!isReadOnly && attachments.length < 5 && (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="adr-file-upload"
            />
            <label htmlFor="adr-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-amber-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to upload PDF, JPG, JPEG, PNG</span>
              <span className="text-[10px] text-slate-400">Maximum 5 files</span>
            </label>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="space-y-2 text-xs">
            {attachments.map((att, i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{att.file_name}</span>
                  {att.file_size && <span className="text-[10px] text-slate-400">({att.file_size})</span>}
                </div>

                <div className="flex items-center gap-2">
                  {att.file_url && (
                    <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="p-1 text-cyan-600 hover:bg-cyan-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  {!isReadOnly && (
                    <button type="button" onClick={() => handleRemoveAttachment(i)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 8. REVIEW INFORMATION & REMARKS */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-4 h-4 text-amber-500" />
          8. Student Remarks & Review Information
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student Remarks</label>
            <textarea
              rows={3}
              disabled={isReadOnly}
              value={studentRemarks}
              onChange={(e) => setStudentRemarks(e.target.value)}
              onFocus={handleFocusPlaceholder}
              onBlur={handleBlurPlaceholder}
              placeholder="Enter student remarks"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {(preceptorReview || facultyComments) && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-amber-700 dark:text-amber-400 block">Faculty Preceptor Review</span>
              {preceptorReview && <p className="font-bold text-slate-900 dark:text-white">{preceptorReview}</p>}
              {facultyComments && <p className="italic text-slate-600 dark:text-slate-300">{facultyComments}</p>}
            </div>
          )}
        </div>
      </div>

      </fieldset>
      {/* END FORM BODY */}

      {!isReadOnly && (
        <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
          <InlineActionNotification notification={bottomNotify} onClose={clearBottomNotify} position="inline" />

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => handleSaveADR('Draft')}
              disabled={saving}
              className="h-[46px] px-6 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{existingReportId ? 'Update Draft' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveADR('Submitted')}
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

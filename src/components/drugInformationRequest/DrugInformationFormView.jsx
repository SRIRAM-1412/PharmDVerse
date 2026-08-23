import React, { useState, useEffect } from 'react';
import { FileSearch, User, Clock, FileText, Save, Eye, Send, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, BookOpen, Layers, ShieldCheck, RefreshCw, Plus, Trash2, Phone, Calendar, RotateCcw } from 'lucide-react';
import { fetchDrugInformationRequestByCaseIdFromSupabase, saveOrUpdateDrugInformationRequestInSupabase, fetchPatientProfileByCaseIdFromSupabase, saveStudentFormSectionInSupabase } from '../../services/supabaseService';
import { DrugInformationPDFPreviewModal } from './DrugInformationPDFPreviewModal';
import { InlineActionNotification } from '../common/InlineActionNotification';
import { useInlineNotification } from '../../hooks/useInlineNotification';

const ENQUIRER_TYPES = [
  'Resident Physician',
  'Consultant Physician',
  'Staff Nurse',
  'Clinical Pharmacist',
  'Pharmacology Faculty',
  'Intern',
  'PG Student',
  'Patient',
  'Patient Attender',
  'Other'
];

const DEFAULT_DESIGNATIONS = {
  'Resident Physician': 'Resident Doctor',
  'Consultant Physician': 'Consultant Physician',
  'Staff Nurse': 'Nursing Staff',
  'Clinical Pharmacist': 'Clinical Pharmacist',
  'Pharmacology Faculty': 'Faculty / Professor',
  'Intern': 'Clinical Intern',
  'PG Student': 'Postgraduate Student',
  'Patient': 'N/A',
  'Patient Attender': 'Patient Relative',
  'Other': 'Healthcare Professional'
};

const PROFESSIONAL_STATUSES = [
  'Physician',
  'Nurse',
  'Pharmacist',
  'Student',
  'Patient',
  'Caregiver',
  'Other Healthcare Professional'
];

const QUESTION_CATEGORIES = [
  'Dosage & Administration',
  'Drug Interaction',
  'Adverse Drug Reaction',
  'Contraindications',
  'Pregnancy & Lactation',
  'Renal Dose Adjustment',
  'Hepatic Dose Adjustment',
  'Therapeutic Use',
  'Pharmacokinetics',
  'Pharmacodynamics',
  'Drug Compatibility',
  'Poisoning / Toxicology',
  'Storage & Stability',
  'Availability',
  'Cost Information',
  'Other'
];

const TIMEFRAMES_NEEDED = [
  'Immediately',
  'Within 30 Minutes',
  'Within 2–4 Hours',
  'Same Day',
  'Next Working Day'
];

const REFERENCE_TYPES = [
  'Textbook',
  'Database',
  'Guideline',
  'Journal',
  'Package Insert',
  'Institutional SOP',
  'Website',
  'Other'
];

const FREQUENTLY_USED_REFERENCES = [
  "Goodman & Gilman's Pharmacological Basis of Therapeutics",
  "Katzung Basic & Clinical Pharmacology",
  "Harrison's Principles of Internal Medicine",
  "Micromedex",
  "Lexicomp",
  "UpToDate",
  "AHFS Drug Information",
  "BNF (British National Formulary)",
  "Martindale: The Complete Drug Reference",
  "Stockley's Drug Interactions"
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

export const DrugInformationFormView = ({ clinicalCase, student, onBack, isReadOnly: propReadOnly = false, snapshotAtReturn = null }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inline Notification Hook
  const { notification: bottomNotify, showNotification: showBottomNotify, clearNotification: clearBottomNotify } = useInlineNotification();

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Session & Enquirer Details
  const [requestDate, setRequestDate] = useState(todayStr);
  const [requestTime, setRequestTime] = useState('11:00 AM');
  
  const [enquirerSelect, setEnquirerSelect] = useState('Resident Physician');
  const [enquirerNameOther, setEnquirerNameOther] = useState('');
  const [designation, setDesignation] = useState('Resident Doctor');
  const [phoneNo, setPhoneNo] = useState('');
  const [unitWard, setUnitWard] = useState('');
  const [professionalStatus, setProfessionalStatus] = useState('Physician');

  // 2. Details of Enquiry
  const [questionCategorySelect, setQuestionCategorySelect] = useState('Dosage & Administration');
  const [questionCategoryOther, setQuestionCategoryOther] = useState('');
  const [timeframeNeeded, setTimeframeNeeded] = useState('Within 2–4 Hours');
  const [detailsOfEnquiry, setDetailsOfEnquiry] = useState('');

  // 3. Patient Background Information (Auto Synced)
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('M');
  const [weightKg, setWeightKg] = useState('');
  const [allergies, setAllergies] = useState('None');
  const [currentDiagnosis, setCurrentDiagnosis] = useState('');

  // 4. Response Provided
  const [informationProvided, setInformationProvided] = useState('');

  // 5. Dynamic References
  const [references, setReferences] = useState([
    { id: 'ref-1', type: 'Textbook', source: "Goodman & Gilman's Pharmacological Basis of Therapeutics (14th Ed)" }
  ]);

  // Meta
  const [status, setStatus] = useState('Draft');
  const [existingRequestId, setExistingRequestId] = useState(null);

  // PDF Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const currentDirObj = React.useMemo(() => ({
    request_date: requestDate,
    request_time: requestTime,
    enquirer_select: enquirerSelect,
    enquirer_name_other: enquirerNameOther,
    designation, phone_no: phoneNo, unit_ward: unitWard, professional_status: professionalStatus,
    details_of_enquiry: detailsOfEnquiry,
    question_category: questionCategorySelect === 'Other' ? questionCategoryOther : questionCategorySelect,
    category_other: questionCategoryOther,
    timeframe_needed: timeframeNeeded,
    information_provided: informationProvided,
    references
  }), [
    requestDate, requestTime, enquirerSelect, enquirerNameOther, designation, phoneNo, unitWard,
    professionalStatus, detailsOfEnquiry, questionCategorySelect, questionCategoryOther,
    timeframeNeeded, informationProvided, references
  ]);

  const diffMap = React.useMemo(() => {
    const snap = snapshotAtReturn || clinicalCase?.snapshot_at_return?.dir;
    if (!snap) return {};
    return computeModuleDiffs(currentDirObj, snap, 'dir');
  }, [currentDirObj, snapshotAtReturn, clinicalCase?.snapshot_at_return?.dir]);

  // Helper: Placeholder Focus Handlers
  const handleFocusPlaceholder = (e) => {
    e.target.dataset.ph = e.target.placeholder;
    e.target.placeholder = '';
  };

  const handleBlurPlaceholder = (e) => {
    if (e.target.dataset.ph) {
      e.target.placeholder = e.target.dataset.ph;
    }
  };

  useEffect(() => {
    const loadDIRData = async () => {
      if (!clinicalCase || !clinicalCase.id) {
        setLoading(false);
        return;
      }
      setLoading(true);

      // Pre-fill defaults from clinicalCase
      setUnitWard(clinicalCase.ward_unit || '');

      try {
        const [dirRes, profileRes] = await Promise.all([
          fetchDrugInformationRequestByCaseIdFromSupabase(clinicalCase.id),
          fetchPatientProfileByCaseIdFromSupabase(clinicalCase.id)
        ]);

        if (profileRes.success && profileRes.profile) {
          const p = profileRes.profile;
          setAge(p.age ? p.age.toString() : '');
          setSex(p.gender === 'Female' ? 'F' : p.gender === 'Male' ? 'M' : p.gender || 'M');
          setWeightKg(p.weight || '');
          setUnitWard(p.ward || p.ward_unit || clinicalCase.ward_unit || '');
          setAllergies(p.allergies || (p.allergy_drugs || p.allergy_food ? `Drugs: ${p.allergy_drugs || 'None'}, Food: ${p.allergy_food || 'None'}` : 'None'));
          setCurrentDiagnosis(p.final_diagnosis || p.provisional_diagnosis || clinicalCase?.final_diagnosis || '');
        }

        if (dirRes.success && dirRes.request) {
          const item = dirRes.request;
          setExistingRequestId(item.id);
          setRequestDate(item.request_date || todayStr);
          setRequestTime(item.request_time || '11:00 AM');
          
          if (ENQUIRER_TYPES.includes(item.enquirer_name)) {
            setEnquirerSelect(item.enquirer_name);
            setEnquirerNameOther('');
          } else if (item.enquirer_name) {
            setEnquirerSelect('Other');
            setEnquirerNameOther(item.enquirer_name);
          }

          setDesignation(item.designation || '');
          setPhoneNo(item.phone_no || '');
          setUnitWard(item.unit_ward || clinicalCase.ward_unit || '');
          setProfessionalStatus(item.professional_status || 'Physician');

          if (QUESTION_CATEGORIES.includes(item.question_category)) {
            setQuestionCategorySelect(item.question_category);
            setQuestionCategoryOther('');
          } else if (item.question_category) {
            setQuestionCategorySelect('Other');
            setQuestionCategoryOther(item.question_category);
          }

          setTimeframeNeeded(item.answer_needed || 'Within 2–4 Hours');
          setDetailsOfEnquiry(item.details_of_enquiry || '');

          setAge(item.age || '');
          setSex(item.sex || 'M');
          setWeightKg(item.weight_kg || '');
          setAllergies(item.allergies || 'None');
          setCurrentDiagnosis(item.current_medical_problem || '');
          setInformationProvided(item.information_provided || '');

          // Try parsing dynamic references array from ref_others or fallback to legacy fields
          if (item.ref_others && item.ref_others.startsWith('[') && item.ref_others.endsWith(']')) {
            try {
              const parsedRefs = JSON.parse(item.ref_others);
              if (Array.isArray(parsedRefs) && parsedRefs.length > 0) {
                setReferences(parsedRefs);
              }
            } catch (e) {
              // Fallback to text
            }
          } else {
            const legacyList = [];
            if (item.ref_textbooks) legacyList.push({ id: 'ref-1', type: 'Textbook', source: item.ref_textbooks });
            if (item.ref_journals) legacyList.push({ id: 'ref-2', type: 'Journal', source: item.ref_journals });
            if (item.ref_micromedex) legacyList.push({ id: 'ref-3', type: 'Database', source: item.ref_micromedex });
            if (item.ref_website) legacyList.push({ id: 'ref-4', type: 'Website', source: item.ref_website });
            if (item.ref_others && !item.ref_others.startsWith('[')) legacyList.push({ id: 'ref-5', type: 'Other', source: item.ref_others });
            
            if (legacyList.length > 0) setReferences(legacyList);
          }

          setStatus(item.status || 'Draft');
        }
      } catch (err) {
        console.error('Error loading DIR data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDIRData();
  }, [clinicalCase]);

  // Handle Enquirer Selection Change
  const handleEnquirerChange = (val) => {
    setEnquirerSelect(val);
    if (val !== 'Other') {
      setEnquirerNameOther('');
      setDesignation(DEFAULT_DESIGNATIONS[val] || '');
    } else {
      setDesignation('Healthcare Professional');
    }
  };

  // Dynamic Reference Handlers
  const handleAddReference = () => {
    setReferences([
      ...references,
      { id: `ref-${Date.now()}`, type: 'Textbook', source: '' }
    ]);
  };

  const handleRemoveReference = (id) => {
    if (references.length <= 1) {
      showBottomNotify({ type: 'warning', message: '⚠ At least one reference row must remain.' });
      return;
    }
    setReferences(references.filter(r => r.id !== id));
  };

  const handleUpdateReference = (id, field, value) => {
    setReferences(references.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSaveRequest = async (newStatus = 'Draft') => {
    clearBottomNotify();

    const finalEnquirerName = enquirerSelect === 'Other' ? enquirerNameOther.trim() : enquirerSelect;
    const finalQuestionCategory = questionCategorySelect === 'Other' ? questionCategoryOther.trim() : questionCategorySelect;

    // Strict Validation only on Submit
    if (newStatus === 'Submitted') {
      if (requestDate > todayStr) {
        showBottomNotify({ type: 'error', message: '✖ Request Date cannot be a future date.' });
        return;
      }
      if (phoneNo.trim() && phoneNo.trim().length !== 10) {
        showBottomNotify({ type: 'error', message: '✖ Phone Number must be exactly 10 digits.' });
        return;
      }
      if (enquirerSelect === 'Other' && !enquirerNameOther.trim()) {
        showBottomNotify({ type: 'error', message: '✖ Please enter Enquirer Name.' });
        return;
      }
      if (questionCategorySelect === 'Other' && !questionCategoryOther.trim()) {
        showBottomNotify({ type: 'error', message: '✖ Please enter Question Category.' });
        return;
      }
      if (!detailsOfEnquiry.trim()) {
        showBottomNotify({ type: 'error', message: '✖ Please enter Details of Enquiry (Question).' });
        return;
      }
      if (!informationProvided.trim()) {
        showBottomNotify({ type: 'error', message: '✖ Please enter Information Provided (Answer).' });
        return;
      }
      const validRefs = references.filter(r => r.source.trim().length > 0);
      if (validRefs.length === 0) {
        showBottomNotify({ type: 'error', message: '✖ At least one valid Reference source is required before submitting.' });
        return;
      }
    }

    setSaving(true);

    // Format references for backward compatibility + JSON serialization
    const textbooksRef = references.filter(r => r.type === 'Textbook').map(r => r.source).join('; ');
    const journalsRef = references.filter(r => r.type === 'Journal').map(r => r.source).join('; ');
    const databaseRef = references.filter(r => r.type === 'Database').map(r => r.source).join('; ');
    const websiteRef = references.filter(r => r.type === 'Website').map(r => r.source).join('; ');
    const jsonRefsString = JSON.stringify(references.map(r => ({ type: r.type, source: r.source.trim() })));

    const payload = {
      clinical_case_id: clinicalCase.id,
      student_id: student.id,
      college_id: student.college_id,
      request_date: requestDate,
      request_time: requestTime,
      enquirer_name: finalEnquirerName,
      designation: designation.trim(),
      phone_no: phoneNo.trim(),
      unit_ward: unitWard,
      professional_status: professionalStatus,
      mode_of_request: 'Direct',
      answer_needed: timeframeNeeded,
      details_of_enquiry: detailsOfEnquiry.trim(),
      question_category: finalQuestionCategory,
      purpose_of_enquiry: 'Better patient care',
      age,
      sex,
      weight_kg: weightKg,
      allergies,
      current_medical_problem: currentDiagnosis.trim(),
      answer_given_timeframe: timeframeNeeded,
      mode_of_reply: 'Written',
      information_provided: informationProvided.trim(),
      ref_textbooks: textbooksRef,
      ref_journals: journalsRef,
      ref_micromedex: databaseRef,
      ref_website: websiteRef,
      ref_others: jsonRefsString,
      status: newStatus
    };

    const res = await saveStudentFormSectionInSupabase({
      section_type: 'dir',
      is_mandatory: false,
      payload
    });
    setSaving(false);

    if (res.success) {
      setExistingRequestId(res.request.id);
      setStatus(newStatus);
      showBottomNotify({
        type: 'success',
        message: newStatus === 'Submitted' ? '✓ Saved Successfully' : '✓ Draft saved successfully'
      });
    } else {
      showBottomNotify({
        type: 'error',
        message: res.error || '✖ Failed to save Drug Information Request documentation.'
      });
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading Drug Information Request Form...</p>
      </div>
    );
  }

  if (!clinicalCase) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Clinical Case Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Please select a case from My Clinical Cases list to document Drug Information Request.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">Back to My Cases</button>
      </div>
    );
  }

  const isReadOnly = propReadOnly || status === 'Submitted' || status === 'Approved' || clinicalCase?.status === 'Approved' || clinicalCase?.overall_case_status === 'Approved';

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
              <FileSearch className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>Drug Information Request & Documentation Form</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Case ID: <strong className="font-mono text-cyan-600 dark:text-cyan-400">{clinicalCase.case_id}</strong> • Status: <strong className="uppercase font-bold text-emerald-600 dark:text-emerald-400">{status}</strong>
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

      {/* 1. ENQUIRER & SESSION INFORMATION */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          1. Enquirer & Session Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-600" /> Request Date *
            </label>
            <input
              type="date"
              disabled={isReadOnly}
              max={todayStr}
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-600" /> Request Time *
            </label>
            <input
              type="time"
              disabled={isReadOnly}
              value={requestTime}
              onChange={(e) => setRequestTime(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Enquirer Category *</label>
            <select
              disabled={isReadOnly}
              value={enquirerSelect}
              onChange={(e) => handleEnquirerChange(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              {ENQUIRER_TYPES.map((type, i) => (
                <option key={i} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {enquirerSelect === 'Other' ? (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Name of Enquirer *</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={enquirerNameOther}
                onChange={(e) => setEnquirerNameOther(e.target.value)}
                onFocus={handleFocusPlaceholder}
                onBlur={handleBlurPlaceholder}
                placeholder="Enter Enquirer Name"
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                onFocus={handleFocusPlaceholder}
                onBlur={handleBlurPlaceholder}
                placeholder="Enter designation"
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-cyan-600" /> Phone Number (10 Digits)
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onFocus={handleFocusPlaceholder}
              onBlur={handleBlurPlaceholder}
              placeholder="Enter 10-digit phone number"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit / Ward (Auto-Fetched)</label>
            <input
              type="text"
              readOnly
              value={unitWard}
              placeholder="Unit/Ward"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Professional Status *</label>
            <select
              disabled={isReadOnly}
              value={professionalStatus}
              onChange={(e) => setProfessionalStatus(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              {PROFESSIONAL_STATUSES.map((st, i) => (
                <option key={i} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. DETAILS OF ENQUIRY */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          2. Details of Enquiry & Category
        </h3>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Question Category *</label>
              <select
                disabled={isReadOnly}
                value={questionCategorySelect}
                onChange={(e) => setQuestionCategorySelect(e.target.value)}
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                {QUESTION_CATEGORIES.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Timeframe Needed *</label>
              <select
                disabled={isReadOnly}
                value={timeframeNeeded}
                onChange={(e) => setTimeframeNeeded(e.target.value)}
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                {TIMEFRAMES_NEEDED.map((tf, i) => (
                  <option key={i} value={tf}>{tf}</option>
                ))}
              </select>
            </div>
          </div>

          {questionCategorySelect === 'Other' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Specify Question Category *</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={questionCategoryOther}
                onChange={(e) => setQuestionCategoryOther(e.target.value)}
                onFocus={handleFocusPlaceholder}
                onBlur={handleBlurPlaceholder}
                placeholder="Enter Question Category"
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Details of Enquiry (Question) *</label>
            <textarea
              rows={4}
              disabled={isReadOnly}
              value={detailsOfEnquiry}
              onChange={(e) => setDetailsOfEnquiry(e.target.value)}
              onFocus={handleFocusPlaceholder}
              onBlur={handleBlurPlaceholder}
              placeholder="Enter details of enquiry"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/40 leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* 3. PATIENT BACKGROUND INFORMATION */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            3. Patient Background Information
          </h3>
          <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> Auto Synced from Patient Profile
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Age / Sex</label>
            <div className="flex gap-2">
              <input type="text" readOnly value={age} placeholder="Age" className="w-full h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold" />
              <input type="text" readOnly value={sex} placeholder="Sex" className="w-16 h-[44px] px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-center" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Weight (kg)</label>
            <input type="text" readOnly value={weightKg} placeholder="Weight" className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold" />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Known Allergies</label>
            <input type="text" readOnly value={allergies} placeholder="Allergies" className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-bold text-rose-600 dark:text-rose-400" />
          </div>

          <div className="sm:col-span-4">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Diagnosis</label>
            <textarea rows={2} readOnly value={currentDiagnosis} placeholder="Current Diagnosis" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-bold" />
          </div>
        </div>
      </div>

      {/* 4. RESPONSE PROVIDED */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          4. Response Provided (Information Provided) *
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Information Provided (Answer) *
            </label>
            <textarea
              rows={6}
              disabled={isReadOnly}
              value={informationProvided}
              onChange={(e) => setInformationProvided(e.target.value)}
              onFocus={handleFocusPlaceholder}
              onBlur={handleBlurPlaceholder}
              placeholder="Enter response or information provided"
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>
        </div>
      </div>

      {/* 5. DYNAMIC REFERENCES & FREQUENTLY USED REFERENCES */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            5. References & Quick References *
          </h3>

          {!isReadOnly && (
            <button
              type="button"
              onClick={handleAddReference}
              className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 text-xs font-bold border border-cyan-200 dark:border-cyan-800 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Reference</span>
            </button>
          )}
        </div>

        <div className="space-y-4 text-xs">
          {references.map((ref, idx) => (
            <div key={ref.id || idx} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                
                {/* Reference Type Dropdown */}
                <div className="w-full sm:w-48">
                  <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">Reference Type</label>
                  <select
                    disabled={isReadOnly}
                    value={ref.type}
                    onChange={(e) => handleUpdateReference(ref.id, 'type', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  >
                    {REFERENCE_TYPES.map((rt, i) => (
                      <option key={i} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>

                {/* Frequently Used Reference Quick Select */}
                {!isReadOnly && (
                  <div className="w-full sm:w-64">
                    <label className="block text-[10px] uppercase font-extrabold text-cyan-600 dark:text-cyan-400 mb-1">Frequently Used Quick Select</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleUpdateReference(ref.id, 'source', e.target.value);
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-cyan-200 dark:border-cyan-900 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 font-semibold"
                    >
                      <option value="">-- Choose Quick Reference --</option>
                      {FREQUENTLY_USED_REFERENCES.map((freq, i) => (
                        <option key={i} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Delete Row Button */}
                {!isReadOnly && references.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveReference(ref.id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 self-end sm:self-center transition-colors"
                    title="Delete Reference"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Reference Source Free Text Input */}
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">Reference Source Details *</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={ref.source}
                  onChange={(e) => handleUpdateReference(ref.id, 'source', e.target.value)}
                  onFocus={handleFocusPlaceholder}
                  onBlur={handleBlurPlaceholder}
                  placeholder="Enter reference source details"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>
            </div>
          ))}
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
            onClick={() => handleSaveRequest('Draft')}
            disabled={saving}
            className="h-[46px] px-6 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{existingRequestId ? 'Update Draft' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveRequest('Submitted')}
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

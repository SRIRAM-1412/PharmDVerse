import React, { useState, useEffect } from 'react';
import { UserCheck, Stethoscope, Activity, FileText, FlaskConical, Pill, Save, Eye, Send, ArrowLeft, Plus, Trash2, Loader2, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { 
  fetchPatientProfileByCaseIdFromSupabase, 
  saveOrUpdatePatientProfileInSupabase, 
  saveLabInvestigationsInSupabase, 
  savePrescribedDrugsInSupabase, 
  saveStudentFormSectionInSupabase, 
  fetchDrugKnowledgeFromSupabase,
  fetchActiveOtherInvestigationKnowledgeFromSupabase,
  fetchPatientOtherInvestigationsFromSupabase,
  savePatientOtherInvestigationsInSupabase
} from '../../services/supabaseService';
import { resolveTradeNameToGeneric } from '../../utils/prescriptionParserService';
import { PatientProfilePDFPreviewModal } from './PatientProfilePDFPreviewModal';
import { InlineActionNotification } from '../common/InlineActionNotification';
import { useInlineNotification } from '../../hooks/useInlineNotification';
import { SearchableSelect } from '../common/SearchableSelect';
import { computeModuleDiffs, isFieldModified } from '../../utils/diffEngine';
import { CLINICAL_DEPARTMENTS, CLINICAL_WARDS_UNITS } from '../../constants/clinicalMasterData';
import { 
  FORM_LAB_CATEGORY_MAP as LAB_CATEGORY_MAP, 
  normalizeLabParamNameToDbName, 
  getFormDisplayNameForDbParam 
} from '../../constants/labMasterData';

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

const DEFAULT_LAB_ROWS = [
  { category: 'Haematological Patterns', parameter_name: 'Hb', reference_range: '11-16.5 %', test_value: '' },
  { category: 'Haematological Patterns', parameter_name: 'RBC', reference_range: '3.8-5.8 cells/mm', test_value: '' },
  { category: 'Haematological Patterns', parameter_name: 'WBC', reference_range: '4000-10000 cells/mm', test_value: '' },
  { category: 'Blood Glucose', parameter_name: 'FBS', reference_range: '70-100 mg/dl', test_value: '' },
  { category: 'Blood Glucose', parameter_name: 'RBS', reference_range: '70-140 mg/dl', test_value: '' },
  { category: 'Renal Function Tests', parameter_name: 'S.Cr', reference_range: '0.6-1.1 mg%', test_value: '' },
  { category: 'Liver Functions Test', parameter_name: 'SGOT (AST)', reference_range: '6-38 u/l', test_value: '' },
  { category: 'Electrolytes', parameter_name: 'Na', reference_range: '135-145 meq/l', test_value: '' }
];

// Helper to evaluate if test value is Normal or Abnormal (below/above ref range)
const evaluateTestValueStatus = (valStr, refRangeStr) => {
  if (!valStr || isNaN(valStr.trim())) return 'none';
  const val = parseFloat(valStr.trim());

  const match = refRangeStr ? refRangeStr.match(/([\d.]+)\s*-\s*([\d.]+)/) : null;
  if (!match) return 'none';

  const min = parseFloat(match[1]);
  const max = parseFloat(match[2]);

  if (!isNaN(min) && !isNaN(max)) {
    if (val >= min && val <= max) return 'normal'; // Green
    return 'abnormal'; // Red
  }
  return 'none';
};

export const PatientProfileFormView = ({ clinicalCase, student, onBack, isReadOnly: propReadOnly = false, isReturned = false, snapshotAtReturn = null, highlightField = null }) => {
  const isReadOnly = propReadOnly || clinicalCase?.status === 'Approved' || clinicalCase?.overall_case_status === 'Approved';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Auto-scroll and highlight target field from Pre-Submission Review
  useEffect(() => {
    if (highlightField && !loading) {
      const timer = setTimeout(() => {
        let elem = document.getElementById(highlightField) || document.querySelector(`[data-field-id="${highlightField}"]`);
        if (!elem) {
          const hLower = String(highlightField).toLowerCase();
          if (hLower.includes('allerg')) elem = document.getElementById('field-allergies') || document.querySelector('[name*="allerg"]');
          else if (hLower.includes('diag')) elem = document.getElementById('field-diagnosis') || document.querySelector('[name*="diag"]');
          else if (hLower.includes('complaint')) elem = document.getElementById('field-chief_complaints') || document.querySelector('[name*="complaint"]');
          else if (hLower.includes('med')) elem = document.getElementById('field-prescribed-drugs') || document.querySelector('[data-field-type="prescribed-drugs"]') || document.querySelector('table');
          else if (hLower.includes('lab')) elem = document.getElementById('field-lab-investigations') || document.querySelector('[data-field-type="lab-investigations"]') || document.querySelector('table');
        }

        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (elem.focus) elem.focus();
          elem.classList.add('ring-4', 'ring-amber-500', 'border-amber-500', 'bg-amber-100/90', 'dark:bg-amber-950/90', 'transition-all', 'duration-300');
          setTimeout(() => {
            elem.classList.remove('ring-4', 'ring-amber-500', 'border-amber-500', 'bg-amber-100/90', 'dark:bg-amber-950/90');
          }, 6000);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [highlightField, loading]);

  // 1. Patient Details
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [ipNo, setIpNo] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [ward, setWard] = useState('');
  const [department, setDepartment] = useState('');
  const [doa, setDoa] = useState('');
  const [doc, setDoc] = useState('');
  const [dod, setDod] = useState('');
  const [physician, setPhysician] = useState('');

  // 2. Medical Histories
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [pastMedicalHistory, setPastMedicalHistory] = useState('');
  const [pastMedicationHistory, setPastMedicationHistory] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');

  // 3. Social & Allergy History
  const [smokerPackDay, setSmokerPackDay] = useState('');
  const [smokerDuration, setSmokerDuration] = useState('');
  const [alcoholicAmountDay, setAlcoholicAmountDay] = useState('');
  const [alcoholicDuration, setAlcoholicDuration] = useState('');
  const [allergyFood, setAllergyFood] = useState('');
  const [allergyDrugs, setAllergyDrugs] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('Single');

  // 4. Physical Examination
  const [cyanosis, setCyanosis] = useState('Absent');
  const [icterus, setIcterus] = useState('Absent');
  const [pallor, setPallor] = useState('Absent');
  const [cvs, setCvs] = useState('');
  const [gi, setGi] = useState('');
  const [rs, setRs] = useState('');
  const [cns, setCns] = useState('');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');

  // 5. Vital Signs (Array)
  const [vitalSigns, setVitalSigns] = useState([
    { date: new Date().toISOString().split('T')[0], temp: '', bp: '', pr: '', rr: '', spo2: '' }
  ]);

  // 6. Dynamic Lab Investigations (Array)
  const [labInvestigations, setLabInvestigations] = useState(DEFAULT_LAB_ROWS);

  // 7. Other & Final Diagnosis
  const [otherInvestigations, setOtherInvestigations] = useState('');
  const [structuredOtherInvestigations, setStructuredOtherInvestigations] = useState([]);
  const [activeOtherInvMaster, setActiveOtherInvMaster] = useState([]);
  const [finalDiagnosis, setFinalDiagnosis] = useState('');

  // 8. Dynamic Prescribed Drugs (Array)
  const [prescribedDrugs, setPrescribedDrugs] = useState([
    { s_no: 1, trade_name: '', generic_name: '', route_of_admin: 'Oral', dose: '', frequency: 'OD', start_date: '', stop_date: '' }
  ]);

  const [drugStatusMap, setDrugStatusMap] = useState({});

  useEffect(() => {
    let isMounted = true;
    const checkDrugStatuses = async () => {
      const newMap = {};
      for (let i = 0; i < prescribedDrugs.length; i++) {
        const d = prescribedDrugs[i];
        const searchVal = d.generic_name || d.trade_name;
        if (searchVal && searchVal.trim()) {
          const res = await fetchDrugKnowledgeFromSupabase(searchVal);
          if (isMounted) newMap[i] = res;
        }
      }
      if (isMounted) setDrugStatusMap(newMap);
    };
    checkDrugStatuses();
    return () => { isMounted = false; };
  }, [JSON.stringify(prescribedDrugs)]);

  // 9. Discharge Summary
  const [dischargeSummary, setDischargeSummary] = useState('');

  // Profile Status
  const [profileStatus, setProfileStatus] = useState('Draft');
  const [existingProfileId, setExistingProfileId] = useState(null);

  // Inline Notification Hook
  const { notification: bottomNotify, showNotification: showBottomNotify, clearNotification: clearBottomNotify } = useInlineNotification();

  // PDF Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Inline Real-Time Date Error Computations
  const getDocError = () => {
    if (!doc) return null;
    if (doa && doc < doa) return 'DOC cannot be earlier than DOA';
    if (dod && doc > dod) return 'DOC cannot be later than DOD';
    return null;
  };

  const getDodError = () => {
    if (!dod) return null;
    if (doa && dod < doa) return 'DOD cannot be earlier than DOA';
    return null;
  };

  const docError = getDocError();
  const dodError = getDodError();

  const currentProfileObj = React.useMemo(() => ({
    patient_name: patientName,
    age, gender, ip_no: ipNo, height, weight, bmi, ward, department, doa, doc, dod, physician,
    chief_complaints: chiefComplaints,
    past_medical_history: pastMedicalHistory,
    past_medication_history: pastMedicationHistory,
    family_history: familyHistory,
    smoker_pack_day: smokerPackDay, smoker_duration: smokerDuration,
    alcoholic_amount_day: alcoholicAmountDay, alcoholic_duration: alcoholicDuration,
    allergy_food: allergyFood, allergy_drugs: allergyDrugs, marital_status: maritalStatus,
    cyanosis, icterus, pallor, cvs, gi, rs, cns, provisional_diagnosis: provisionalDiagnosis,
    other_investigations: otherInvestigations,
    final_diagnosis: finalDiagnosis,
    discharge_summary: dischargeSummary,
    vital_signs: vitalSigns,
    lab_investigations: labInvestigations,
    prescribed_drugs: prescribedDrugs
  }), [
    patientName, age, gender, ipNo, height, weight, bmi, ward, department, doa, doc, dod, physician,
    chiefComplaints, pastMedicalHistory, pastMedicationHistory, familyHistory,
    smokerPackDay, smokerDuration, alcoholicAmountDay, alcoholicDuration,
    allergyFood, allergyDrugs, maritalStatus, cyanosis, icterus, pallor, cvs, gi, rs, cns,
    provisionalDiagnosis, otherInvestigations, finalDiagnosis, dischargeSummary,
    vitalSigns, labInvestigations, prescribedDrugs
  ]);

  const diffMap = React.useMemo(() => {
    const snap = snapshotAtReturn || clinicalCase?.snapshot_at_return?.profile;
    if (!snap) return {};
    return computeModuleDiffs(currentProfileObj, snap, 'profile');
  }, [currentProfileObj, snapshotAtReturn, clinicalCase?.snapshot_at_return?.profile]);

  // Load Existing Profile if available
  useEffect(() => {
    const loadProfileData = async () => {
      if (!clinicalCase) return;
      setLoading(true);

      // Pre-fill from clinicalCase defaults if empty
      setWard(clinicalCase.ward_unit || '');
      setDepartment(clinicalCase.department || '');
      setDoa(clinicalCase.date_of_admission || '');
      setDoc(clinicalCase.date_of_collection || '');

      const res = await fetchPatientProfileByCaseIdFromSupabase(clinicalCase.id);
      if (res.success && res.profile) {
        const p = res.profile;
        setExistingProfileId(p.id);

        const initName = p.patient_name || p.patient_initials || '';
        setPatientName(initName.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4));

        setAge(p.age ? p.age.toString().replace(/\D/g, '').slice(0, 2) : '');
        setGender(p.gender || 'Male');

        const loadedIp = p.ip_no || p.ip_op_number || '';
        setIpNo(loadedIp.replace(/\D/g, '').slice(0, 10));

        setHeight(p.height || p.height_cm ? (p.height || p.height_cm).toString().replace(/\D/g, '').slice(0, 3) : '');
        setWeight(p.weight || p.weight_kg ? (p.weight || p.weight_kg).toString().replace(/\D/g, '').slice(0, 3) : '');
        setBmi(p.bmi || '');

        setWard(p.ward || p.ward_unit || clinicalCase.ward_unit || '');
        setDepartment(p.department || clinicalCase.department || '');
        setDoa(p.doa || p.date_of_admission || clinicalCase.date_of_admission || '');
        setDoc(p.doc || p.date_of_collection || clinicalCase.date_of_collection || '');
        setDod(p.dod || p.date_of_discharge || '');
        setPhysician(p.physician || p.attending_physician || '');

        setChiefComplaints(p.chief_complaints || '');
        setPastMedicalHistory(p.past_medical_history || '');
        setPastMedicationHistory(p.past_medication_history || '');
        setFamilyHistory(p.family_history || '');

        setSmokerPackDay(p.smoker_pack_day || '');
        setSmokerDuration(p.smoker_duration || '');
        setAlcoholicAmountDay(p.alcoholic_amount_day || '');
        setAlcoholicDuration(p.alcoholic_duration || '');
        setAllergyFood(p.allergy_food || '');
        setAllergyDrugs(p.allergy_drugs || p.allergies || '');
        setMaritalStatus(p.marital_status || 'Single');

        setCyanosis(p.cyanosis || 'Absent');
        setIcterus(p.icterus || 'Absent');
        setPallor(p.pallor || 'Absent');
        setCvs(p.cvs || '');
        setGi(p.gi || '');
        setRs(p.rs || '');
        setCns(p.cns || '');
        setProvisionalDiagnosis(p.provisional_diagnosis || '');

        if (p.vital_signs && p.vital_signs.length > 0) setVitalSigns(p.vital_signs);
        setOtherInvestigations(p.other_investigations || '');
        setFinalDiagnosis(p?.final_diagnosis || clinicalCase?.final_diagnosis || '');
        setDischargeSummary(p.discharge_summary || '');
        setProfileStatus(p.status || 'Draft');

        // Load Active Master Other Investigations
        const masterRes = await fetchActiveOtherInvestigationKnowledgeFromSupabase();
        if (masterRes.success) setActiveOtherInvMaster(masterRes.data || []);

        // Load Patient Structured Other Investigations
        const structRes = await fetchPatientOtherInvestigationsFromSupabase(p.id);
        if (structRes.success && structRes.data && structRes.data.length > 0) {
          setStructuredOtherInvestigations(structRes.data);
        } else {
          setStructuredOtherInvestigations([]);
        }

        if (res.labInvestigations && res.labInvestigations.length > 0) {
          const loadedLabs = res.labInvestigations.map(item => {
            const formParamName = getFormDisplayNameForDbParam(item.parameter_name) || item.parameter_name || '';
            return {
              id: item.id,
              category: item.category || 'Haematological Patterns',
              parameter_name: formParamName,
              reference_range: item.reference_range || '',
              test_value: item.test_value !== null && item.test_value !== undefined ? String(item.test_value) : ''
            };
          });
          setLabInvestigations(loadedLabs);
        }

        if (res.prescribedDrugs && res.prescribedDrugs.length > 0) {
          const seenDrug = new Set();
          const uniqueDrugs = [];
          res.prescribedDrugs.forEach(item => {
            const key = `${item.trade_name}_${item.generic_name}_${item.dose}`;
            if (!seenDrug.has(key)) {
              seenDrug.add(key);
              uniqueDrugs.push({
                s_no: uniqueDrugs.length + 1,
                trade_name: (item.trade_name || '').trim(),
                generic_name: (item.generic_name || '').trim(),
                route_of_admin: item.route_of_admin || 'Oral',
                dose: item.dose || '',
                frequency: item.frequency || 'OD',
                start_date: item.start_date || '',
                stop_date: item.stop_date || ''
              });
            }
          });
          setPrescribedDrugs(uniqueDrugs);
        }
      }

      setLoading(false);
    };

    loadProfileData();
  }, [clinicalCase]);

  // Height Weight BMI Calculation Helper
  const handleWeightHeightChange = (wVal, hVal) => {
    setWeight(wVal);
    setHeight(hVal);
    if (wVal && hVal && !isNaN(wVal) && !isNaN(hVal) && parseFloat(hVal) > 0) {
      const heightInMeters = parseFloat(hVal) / 100;
      const calculatedBmi = (parseFloat(wVal) / (heightInMeters * heightInMeters)).toFixed(1);
      setBmi(calculatedBmi);
    } else {
      setBmi('');
    }
  };

  // Dynamic Vital Signs Handlers
  const handleAddVitalRow = () => {
    setVitalSigns([...vitalSigns, { date: new Date().toISOString().split('T')[0], temp: '', bp: '', pr: '', rr: '', spo2: '' }]);
  };

  const handleRemoveVitalRow = (idx) => {
    setVitalSigns(vitalSigns.filter((_, i) => i !== idx));
  };

  // Dynamic Lab Investigations Handlers
  const handleAddLabRow = () => {
    const defaultCat = 'Haematological Patterns';
    const defaultParamObj = LAB_CATEGORY_MAP[defaultCat][0];
    setLabInvestigations([
      ...labInvestigations,
      {
        category: defaultCat,
        parameter_name: defaultParamObj.parameter_name,
        reference_range: defaultParamObj.reference_range,
        test_value: ''
      }
    ]);
  };

  const handleLabCategoryChange = (idx, newCategory) => {
    const paramsList = LAB_CATEGORY_MAP[newCategory] || LAB_CATEGORY_MAP['General'];
    const defaultParamObj = paramsList[0];
    const copy = [...labInvestigations];
    copy[idx] = {
      category: newCategory,
      parameter_name: defaultParamObj.parameter_name,
      reference_range: defaultParamObj.reference_range,
      test_value: ''
    };
    setLabInvestigations(copy);
  };

  const handleLabParameterChange = (idx, newParamName) => {
    const copy = [...labInvestigations];
    const currentCat = copy[idx].category;
    const paramsList = LAB_CATEGORY_MAP[currentCat] || LAB_CATEGORY_MAP['General'];
    const foundObj = paramsList.find(p => p.parameter_name === newParamName) || { parameter_name: newParamName, reference_range: '' };

    copy[idx].parameter_name = foundObj.parameter_name;
    copy[idx].reference_range = foundObj.reference_range;
    setLabInvestigations(copy);
  };

  const handleRemoveLabRow = (idx) => {
    setLabInvestigations(labInvestigations.filter((_, i) => i !== idx));
  };

  // Dynamic Prescribed Drugs Handlers
  const handleAddDrugRow = () => {
    setPrescribedDrugs([
      ...prescribedDrugs,
      { s_no: prescribedDrugs.length + 1, trade_name: '', generic_name: '', route_of_admin: 'Oral', dose: '', frequency: 'OD', start_date: '', stop_date: '' }
    ]);
  };

  const handleRemoveDrugRow = (idx) => {
    setPrescribedDrugs(prescribedDrugs.filter((_, i) => i !== idx));
  };

  // Validate required fields for Profile completion — used on every save
  const isProfileComplete = () => {
    return (
      patientName.trim().length > 0 &&
      age.trim().length > 0 &&
      ipNo.trim().length > 0 &&
      !!doa &&
      chiefComplaints.trim().length > 0 &&
      finalDiagnosis.trim().length > 0
    );
  };

  // Save / Update Handler — BOTH buttons call this; completion determined by field validation
  const handleSaveProfile = async () => {
    setFormError('');
    setSaveSuccess('');

    // Date cross-validation (always)
    if (dod && doa && dod < doa) {
      setFormError('Date of Discharge (DOD) cannot be earlier than Date of Admission (DOA).');
      return;
    }
    if (doc && doa && doc < doa) {
      setFormError('Date of Collection (DOC) cannot be earlier than Date of Admission (DOA).');
      return;
    }
    if (doc && dod && doc > dod) {
      setFormError('Date of Collection (DOC) cannot be after Date of Discharge (DOD).');
      return;
    }

    // Determine completion purely by field validation (not by which button was clicked)
    const allRequiredFilled = isProfileComplete();
    // Status: 'Submitted' when all required fields complete, else keep 'Draft'
    const saveStatus = allRequiredFilled ? 'Submitted' : 'Draft';

    setSaving(true);

    try {
      const payload = {
        clinical_case_id: clinicalCase.id,
        student_id: student.id,
        college_id: student.college_id,
        patient_name: patientName.trim(),
        age,
        gender,
        ip_no: ipNo,
        height,
        weight,
        bmi,
        ward,
        department,
        doa: doa || null,
        doc: doc || null,
        dod: dod || null,
        physician,
        chief_complaints: chiefComplaints,
        past_medical_history: pastMedicalHistory,
        past_medication_history: pastMedicationHistory,
        family_history: familyHistory,
        smoker_pack_day: smokerPackDay,
        smoker_duration: smokerDuration,
        alcoholic_amount_day: alcoholicAmountDay,
        alcoholic_duration: alcoholicDuration,
        allergy_food: allergyFood,
        allergy_drugs: allergyDrugs,
        marital_status: maritalStatus,
        cyanosis,
        icterus,
        pallor,
        cvs,
        gi,
        rs,
        cns,
        provisional_diagnosis: provisionalDiagnosis,
        vital_signs: vitalSigns,
        other_investigations: otherInvestigations,
        final_diagnosis: finalDiagnosis,
        discharge_summary: dischargeSummary,
        status: saveStatus
      };

      // Save Patient Profile using the unified Save API
      const profRes = await saveStudentFormSectionInSupabase({
        section_type: 'profile',
        is_mandatory: true,
        completion_status: allRequiredFilled,
        payload
      });

      if (!profRes.success) {
        setSaving(false);
        const cleanMsg = (profRes.error || '').includes('Failed to fetch') || (profRes.error || '').includes('TypeError')
          ? '✖ Connection error: Unable to connect to Supabase server. Please check your internet connection and try again.'
          : (profRes.error || '✖ Failed to save Patient Profile.');
        showBottomNotify({ type: 'error', message: cleanMsg });
        return;
      }

      const savedProfileId = profRes.profile.id;
      setExistingProfileId(savedProfileId);

      // Save Child Tables (converting UI display name to DB parameter name for Section 3/4 integration)
      const activeLabRecords = labInvestigations
        .filter(l => l.parameter_name && l.test_value !== undefined && l.test_value !== null && String(l.test_value).trim() !== '')
        .map(l => ({
          ...l,
          parameter_name: normalizeLabParamNameToDbName(l.parameter_name)
        }));
      const activeDrugRecords = prescribedDrugs.filter(d => d.trade_name || d.generic_name);

      await Promise.all([
        saveLabInvestigationsInSupabase(savedProfileId, activeLabRecords),
        savePrescribedDrugsInSupabase(savedProfileId, activeDrugRecords),
        savePatientOtherInvestigationsInSupabase(savedProfileId, structuredOtherInvestigations)
      ]);

      setSaving(false);
      
      // Sync completion flags strictly using backend response to avoid cached values
      if (clinicalCase) {
        clinicalCase.profile_completed = !!profRes.profile_completed;
        clinicalCase.counselling_completed = !!profRes.counselling_completed;
      }

      setProfileStatus(profRes.profile_completed ? 'Completed' : 'Draft');
      
      showBottomNotify({
        type: 'success',
        message: '✓ Patient Profile saved successfully! Returning to Pre-Submission Review...'
      });

      if (onBack) {
        setTimeout(() => {
          onBack();
        }, 1000);
      }
    } catch (err) {
      setSaving(false);
      const rawErr = err?.message || String(err);
      const cleanMsg = rawErr.includes('Failed to fetch') || rawErr.includes('TypeError')
        ? '✖ Connection error: Unable to connect to Supabase server. Please check your internet connection and try again.'
        : `✖ Save failed: ${rawErr}`;
      showBottomNotify({ type: 'error', message: cleanMsg });
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading Patient Documentation Form...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn w-full min-w-0 pb-12">
      
      {/* TOP BAR - CLEAN NO DUPLICATE BUTTONS */}
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
              <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Patient Documentation Form (Patient Profile)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Case ID: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{clinicalCase.case_id}</strong> • Student: <strong className="text-slate-800 dark:text-slate-200">{student?.full_name}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* FACULTY RETURN FEEDBACK BANNER */}
      {(clinicalCase?.status === 'Returned' || profileStatus === 'Returned') && (
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

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* FORM BODY — wrapped in fieldset for read-only enforcement */}
      <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0, minInlineSize: 'auto' }}>

      {/* 1. PATIENT DETAILS SECTION */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          1. Patient Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Patient Initials */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Patient Initials *</label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4))}
              placeholder="Enter patient initials"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold tracking-wider uppercase focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Initials only (Max 4 letters)</span>
          </div>

          {/* Age / Sex */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Age / Sex *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 2))}
                placeholder="Enter age"
                className="w-full h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Numeric (Max 2 digits)</span>
          </div>

          {/* I.P Number */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">I.P Number *</label>
            <input
              type="text"
              value={ipNo}
              onChange={(e) => setIpNo(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Enter I.P. number"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Numeric (Exactly 10 digits)</span>
          </div>

          {/* Height / Weight */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Height (cm) / Weight (kg)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={height}
                onChange={(e) => handleWeightHeightChange(weight, e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="Enter height (cm)"
                className="w-full h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
              <input
                type="text"
                value={weight}
                onChange={(e) => handleWeightHeightChange(e.target.value.replace(/\D/g, '').slice(0, 3), height)}
                placeholder="Enter weight (kg)"
                className="w-full h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* BMI */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">BMI (kg/m²)</label>
            <input
              type="text"
              readOnly
              value={bmi}
              placeholder="Auto calculated BMI"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold"
            />
          </div>

          {/* Attending Physician */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Attending Physician</label>
            <input
              type="text"
              value={physician}
              onChange={(e) => setPhysician(e.target.value.replace(/[^A-Za-z\s.]/g, ''))}
              placeholder="Enter attending physician"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          {/* Ward / Department */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ward / Department</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SearchableSelect
                value={ward}
                onChange={setWard}
                options={CLINICAL_WARDS_UNITS}
                placeholder="Search or Select Ward..."
              />
              <SearchableSelect
                value={department}
                onChange={setDepartment}
                options={CLINICAL_DEPARTMENTS}
                placeholder="Search or Select Department..."
              />
            </div>
          </div>

          {/* Date of Admission (DOA) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Admission (DOA) *</label>
            <input
              type="date"
              value={doa}
              onChange={(e) => setDoa(e.target.value)}
              className="w-full h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
            />
          </div>

          {/* Date of Collection (DOC) with Physical min/max & Inline Realtime Validation */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Collection (DOC)</label>
            <input
              type="date"
              value={doc}
              min={doa || undefined}
              max={dod || undefined}
              onChange={(e) => setDoc(e.target.value)}
              className={`w-full h-[44px] px-3 rounded-xl border font-mono transition-colors ${
                docError
                  ? 'border-rose-500 bg-rose-50/60 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white'
              }`}
            />
            {docError ? (
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 block animate-fadeIn">
                ⚠️ {docError}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 mt-0.5 block">DOA ≤ DOC ≤ DOD</span>
            )}
          </div>

          {/* Date of Discharge (DOD) with Physical min & Inline Realtime Validation */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Discharge (DOD)</label>
            <input
              type="date"
              value={dod}
              min={doa || undefined}
              onChange={(e) => setDod(e.target.value)}
              className={`w-full h-[44px] px-3 rounded-xl border font-mono transition-colors ${
                dodError
                  ? 'border-rose-500 bg-rose-50/60 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white'
              }`}
            />
            {dodError ? (
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 block animate-fadeIn">
                ⚠️ {dodError}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 mt-0.5 block">DOD ≥ DOA</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. CHIEF COMPLAINTS & HISTORIES */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          2. Chief Complaints & Medical Histories
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Chief Complaints *</label>
            <textarea
              rows={3}
              value={chiefComplaints}
              onChange={(e) => setChiefComplaints(e.target.value)}
              placeholder="Enter chief complaints"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Past Medical History</label>
            <textarea
              rows={3}
              value={pastMedicalHistory}
              onChange={(e) => setPastMedicalHistory(e.target.value)}
              placeholder="Enter past medical history"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Past Medication History</label>
            <textarea
              rows={3}
              value={pastMedicationHistory}
              onChange={(e) => setPastMedicationHistory(e.target.value)}
              placeholder="Enter past medication history"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Family Medical History</label>
            <textarea
              rows={3}
              value={familyHistory}
              onChange={(e) => setFamilyHistory(e.target.value)}
              placeholder="Enter family medical history"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 3. SOCIAL & ALLERGY HISTORY */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          3. Social History & Allergies
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Smoker History</label>
            <div className="space-y-2">
              <input type="text" value={smokerPackDay} onChange={(e) => setSmokerPackDay(e.target.value)} placeholder="Pack / Day" className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900" />
              <input type="text" value={smokerDuration} onChange={(e) => setSmokerDuration(e.target.value)} placeholder="Duration" className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Alcohol History</label>
            <div className="space-y-2">
              <input type="text" value={alcoholicAmountDay} onChange={(e) => setAlcoholicAmountDay(e.target.value)} placeholder="Amount / Day" className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900" />
              <input type="text" value={alcoholicDuration} onChange={(e) => setAlcoholicDuration(e.target.value)} placeholder="Duration" className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900" />
            </div>
          </div>

          <div id="field-allergies" data-field-id="field-allergies">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Allergies</label>
            <div className="space-y-2">
              <input type="text" value={allergyFood} onChange={(e) => setAllergyFood(e.target.value)} placeholder="Enter food allergies" className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900" />
              <input type="text" value={allergyDrugs} onChange={(e) => setAllergyDrugs(e.target.value)} placeholder="Enter drug allergies" className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 font-bold text-rose-600" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Marital Status</label>
            <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className="w-full h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 font-bold">
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. PHYSICAL EXAMINATION */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          4. Physical Examination & Systemic Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cyanosis</label>
            <select value={cyanosis} onChange={(e) => setCyanosis(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 font-bold">
              <option value="Absent">Absent</option>
              <option value="Present">Present</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Icterus</label>
            <select value={icterus} onChange={(e) => setIcterus(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 font-bold">
              <option value="Absent">Absent</option>
              <option value="Present">Present</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Pallor</label>
            <select value={pallor} onChange={(e) => setPallor(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 font-bold">
              <option value="Absent">Absent</option>
              <option value="Present">Present</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CVS (Cardiovascular)</label>
            <input type="text" value={cvs} onChange={(e) => setCvs(e.target.value)} placeholder="Enter CVS status" className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">GI (Gastrointestinal)</label>
            <input type="text" value={gi} onChange={(e) => setGi(e.target.value)} placeholder="Enter GI status" className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">RS (Respiratory System)</label>
            <input type="text" value={rs} onChange={(e) => setRs(e.target.value)} placeholder="Enter RS status" className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CNS (Central Nervous System)</label>
            <input type="text" value={cns} onChange={(e) => setCns(e.target.value)} placeholder="Enter CNS status" className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900" />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Provisional Diagnosis</label>
          <input type="text" value={provisionalDiagnosis} onChange={(e) => setProvisionalDiagnosis(e.target.value)} placeholder="Enter provisional diagnosis" className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 font-bold text-xs" />
        </div>
      </div>

      {/* 5. VITAL SIGNS */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            5. Vital Signs Log
          </h3>
          <button type="button" onClick={handleAddVitalRow} className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Vital Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Temp (°F)</th>
                <th className="p-2">BP (mmHg)</th>
                <th className="p-2">Pulse (bpm)</th>
                <th className="p-2">RR (cpm)</th>
                <th className="p-2">SpO2 (%)</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {vitalSigns.map((row, idx) => (
                <tr key={idx}>
                  <td className="p-2"><input type="date" value={row.date} onChange={(e) => { const copy = [...vitalSigns]; copy[idx].date = e.target.value; setVitalSigns(copy); }} className="w-32 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-mono" /></td>
                  <td className="p-2"><input type="text" value={row.temp} onChange={(e) => { const copy = [...vitalSigns]; copy[idx].temp = e.target.value; setVitalSigns(copy); }} placeholder="Temp" className="w-20 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-mono" /></td>
                  <td className="p-2"><input type="text" value={row.bp} onChange={(e) => { const copy = [...vitalSigns]; copy[idx].bp = e.target.value; setVitalSigns(copy); }} placeholder="BP" className="w-24 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-mono font-bold" /></td>
                  <td className="p-2"><input type="text" value={row.pr} onChange={(e) => { const copy = [...vitalSigns]; copy[idx].pr = e.target.value; setVitalSigns(copy); }} placeholder="PR" className="w-20 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-mono" /></td>
                  <td className="p-2"><input type="text" value={row.rr} onChange={(e) => { const copy = [...vitalSigns]; copy[idx].rr = e.target.value; setVitalSigns(copy); }} placeholder="RR" className="w-20 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-mono" /></td>
                  <td className="p-2"><input type="text" value={row.spo2} onChange={(e) => { const copy = [...vitalSigns]; copy[idx].spo2 = e.target.value; setVitalSigns(copy); }} placeholder="SpO2" className="w-20 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-mono" /></td>
                  <td className="p-2 text-center">
                    {vitalSigns.length > 1 && (
                      <button type="button" onClick={() => handleRemoveVitalRow(idx)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. LAB INVESTIGATIONS (RULE 2 IMPLEMENTATION) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            6. Laboratory Investigations
          </h3>
          <button type="button" onClick={handleAddLabRow} className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Lab Parameter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Parameter Name</th>
                <th className="p-2.5">Reference Range (Auto)</th>
                <th className="p-2.5">Test Value</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {labInvestigations.map((lab, idx) => {
                const categoryList = Object.keys(LAB_CATEGORY_MAP);
                const currentCategory = LAB_CATEGORY_MAP[lab.category] ? lab.category : categoryList[0];
                const parameterOptions = LAB_CATEGORY_MAP[currentCategory] || [];
                const valStatus = evaluateTestValueStatus(lab.test_value, lab.reference_range);

                let testValueClasses = "w-28 h-8 px-2 rounded-lg border bg-transparent font-mono font-bold focus:outline-none transition-colors ";
                if (valStatus === 'normal') {
                  testValueClasses += "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 ";
                } else if (valStatus === 'abnormal') {
                  testValueClasses += "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 ";
                } else {
                  testValueClasses += "border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white ";
                }

                return (
                  <tr key={idx}>
                    {/* Category Dropdown */}
                    <td className="p-2">
                      <select
                        value={currentCategory}
                        onChange={(e) => handleLabCategoryChange(idx, e.target.value)}
                        className="w-44 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-bold text-indigo-900 dark:text-indigo-300"
                      >
                        {categoryList.map((cat, cIdx) => (
                          <option key={cIdx} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </td>

                    {/* Dependent Parameter Dropdown */}
                    <td className="p-2">
                      <select
                        value={lab.parameter_name}
                        onChange={(e) => handleLabParameterChange(idx, e.target.value)}
                        className="w-48 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-semibold"
                      >
                        {parameterOptions.map((pObj, pIdx) => (
                          <option key={pIdx} value={pObj.parameter_name}>{pObj.parameter_name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Reference Range (Auto-populated, Read Only) */}
                    <td className="p-2">
                      <input
                        type="text"
                        readOnly
                        value={lab.reference_range}
                        placeholder="Auto ref range"
                        className="w-40 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px]"
                      />
                    </td>

                    {/* Test Value (Numeric Input with Auto Highlighting) */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={lab.test_value}
                        onChange={(e) => {
                          const copy = [...labInvestigations];
                          copy[idx].test_value = e.target.value.replace(/[^0-9.]/g, '');
                          setLabInvestigations(copy);
                        }}
                        placeholder="Enter test value"
                        className={testValueClasses}
                      />
                    </td>

                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLabRow(idx)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. OTHER INVESTIGATIONS & FINAL DIAGNOSIS */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            7. Radiological / Other Investigations & Final Diagnosis
          </h3>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setStructuredOtherInvestigations(prev => [...prev, { investigation_knowledge_id: '', investigation_name: '', test_date: '', finding_result: '', remarks: '' }])}
              className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Investigation
            </button>
          )}
        </div>

        {/* HISTORICAL LEGACY FREE-TEXT DISPLAY (PRESERVED) */}
        {otherInvestigations && otherInvestigations.trim() !== '' && (
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Previous / Legacy Free-Text Other Investigations</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap pl-6">
              {otherInvestigations}
            </p>
            <p className="text-[10px] text-amber-700 dark:text-amber-400 italic pl-6 pt-1">
              * Historical free-text records are preserved for reference. Use the structured table below for any new diagnostic investigation entries.
            </p>
          </div>
        )}

        {/* STRUCTURED OTHER INVESTIGATIONS REPEATABLE TABLE */}
        <div className="space-y-3">
          <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
            Structured Diagnostic Investigations
          </label>

          {structuredOtherInvestigations.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-slate-500 text-xs font-medium border border-dashed border-slate-200 dark:border-slate-800">
              No structured investigations documented. {!isReadOnly && 'Click "Add Investigation" above to select a master test.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Investigation (Master)</th>
                    <th className="p-2.5">Test Date</th>
                    <th className="p-2.5">Finding / Result *</th>
                    <th className="p-2.5">Remarks / Notes</th>
                    {!isReadOnly && <th className="p-2.5 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {structuredOtherInvestigations.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2 min-w-[200px]">
                        {isReadOnly ? (
                          <span className="font-bold text-slate-900 dark:text-white">{inv.investigation_name || '—'}</span>
                        ) : (
                          <select
                            value={inv.investigation_knowledge_id || ''}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const masterObj = activeOtherInvMaster.find(m => m.id === selectedId);
                              const copy = [...structuredOtherInvestigations];
                              copy[idx].investigation_knowledge_id = selectedId;
                              copy[idx].investigation_name = masterObj ? masterObj.investigation_name : (e.target.value || '');
                              setStructuredOtherInvestigations(copy);
                            }}
                            className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                          >
                            <option value="">-- Select Investigation --</option>
                            {activeOtherInvMaster.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.category ? `[${m.category}] ` : ''}{m.investigation_name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="p-2 w-36">
                        {isReadOnly ? (
                          <span className="font-mono text-slate-600 dark:text-slate-400">{inv.test_date || '—'}</span>
                        ) : (
                          <input
                            type="date"
                            value={inv.test_date || ''}
                            onChange={(e) => {
                              const copy = [...structuredOtherInvestigations];
                              copy[idx].test_date = e.target.value;
                              setStructuredOtherInvestigations(copy);
                            }}
                            className="w-full h-9 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 font-mono text-[11px]"
                          />
                        )}
                      </td>
                      <td className="p-2 min-w-[220px]">
                        {isReadOnly ? (
                          <span className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{inv.finding_result || '—'}</span>
                        ) : (
                          <textarea
                            rows={2}
                            value={inv.finding_result || ''}
                            onChange={(e) => {
                              const copy = [...structuredOtherInvestigations];
                              copy[idx].finding_result = e.target.value;
                              setStructuredOtherInvestigations(copy);
                            }}
                            placeholder="Enter patient test result (e.g. LVEF 35%, Sinus tachycardia)"
                            className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        )}
                      </td>
                      <td className="p-2 min-w-[160px]">
                        {isReadOnly ? (
                          <span className="text-slate-600 dark:text-slate-400 italic">{inv.remarks || '—'}</span>
                        ) : (
                          <input
                            type="text"
                            value={inv.remarks || ''}
                            onChange={(e) => {
                              const copy = [...structuredOtherInvestigations];
                              copy[idx].remarks = e.target.value;
                              setStructuredOtherInvestigations(copy);
                            }}
                            placeholder="Optional remarks"
                            className="w-full h-9 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        )}
                      </td>
                      {!isReadOnly && (
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const copy = structuredOtherInvestigations.filter((_, i) => i !== idx);
                              setStructuredOtherInvestigations(copy);
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FINAL DIAGNOSIS */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
            Final Diagnosis <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            disabled={isReadOnly}
            value={finalDiagnosis}
            onChange={(e) => setFinalDiagnosis(e.target.value)}
            placeholder="Enter final diagnosis"
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold disabled:opacity-75"
          />
        </div>
      </div>

      {/* 8. PRESCRIBED MEDICATIONS */}
      <div className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-xs space-y-4 ${
        isReturned ? 'border-2 border-violet-400 dark:border-violet-700 bg-violet-50/20 dark:bg-violet-950/20' : 'border-slate-200/80 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>8. Prescribed Medications</span>
            </h3>
            {isReturned && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-violet-600 text-white flex items-center gap-1 shadow-xs border border-violet-400">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                ⚡ STUDENT REVISIONS APPLIED
              </span>
            )}
          </div>

          {!isReadOnly && (
            <button type="button" onClick={handleAddDrugRow} className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Drug Row
            </button>
          )}
        </div>

        {isReturned && (
          <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-950/60 border border-violet-300 dark:border-violet-800 text-xs font-bold text-violet-900 dark:text-violet-200 flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
              <span>Prescribed medications list updated by candidate upon form return. Review all listed rows below.</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-violet-600 text-white text-[10px] uppercase font-black">
              Updated List ({prescribedDrugs.length} Drugs)
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="p-2 w-10 text-center">S.No</th>
                <th className="p-2">Brand / Trade Name</th>
                <th className="p-2">Generic Name</th>
                <th className="p-2">Route</th>
                <th className="p-2">Dose</th>
                <th className="p-2">Freq</th>
                <th className="p-2">Start Date</th>
                <th className="p-2">Stop Date</th>
                <th className="p-2">DB Status</th>
                {!isReadOnly && <th className="p-2 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {prescribedDrugs.map((d, idx) => {
                const statusInfo = drugStatusMap[idx];
                return (
                  <tr key={idx} className={isReturned ? 'bg-violet-50/40 dark:bg-violet-950/20 border-l-4 border-l-violet-500' : ''}>
                    <td className="p-2 font-mono font-bold text-center">{idx + 1}</td>
                    <td className="p-2">
                      <input
                        id={`field-med-name-${idx}`}
                        data-field-id={`field-med-name-${idx}`}
                        type="text"
                        value={d.trade_name}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          const copy = [...prescribedDrugs];
                          copy[idx].trade_name = rawVal;
                          const resolved = resolveTradeNameToGeneric(rawVal);
                          if (resolved && resolved.status === 'RESOLVED' && resolved.genericNameDisplay) {
                            copy[idx].generic_name = resolved.genericNameDisplay;
                            if (resolved.dosageForm && resolved.dosageForm !== 'Oral' && (!copy[idx].route_of_admin || copy[idx].route_of_admin === 'Oral')) {
                              copy[idx].route_of_admin = resolved.dosageForm === 'Injection' ? 'IV' : resolved.dosageForm;
                            }
                            if (resolved.extractedStrength && !copy[idx].dose) {
                              copy[idx].dose = resolved.extractedStrength;
                            }
                            if (resolved.extractedFrequency && !copy[idx].frequency) {
                              copy[idx].frequency = resolved.extractedFrequency;
                            }
                          }
                          setPrescribedDrugs(copy);
                        }}
                        placeholder="Enter trade name (e.g. Tab. Augmentin 625)"
                        className="w-44 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={d.generic_name}
                        onChange={(e) => {
                          const copy = [...prescribedDrugs];
                          copy[idx].generic_name = e.target.value;
                          setPrescribedDrugs(copy);
                        }}
                        placeholder="Generic active ingredient(s)"
                        className="w-48 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-semibold"
                      />
                    </td>
                    <td className="p-2">
                      <select value={d.route_of_admin} onChange={(e) => { const copy = [...prescribedDrugs]; copy[idx].route_of_admin = e.target.value; setPrescribedDrugs(copy); }} className="w-20 h-8 px-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent">
                        <option value="Oral">Oral</option>
                        <option value="IV">IV</option>
                        <option value="IM">IM</option>
                        <option value="SC">SC</option>
                        <option value="Inhalation">Inhalation</option>
                        <option value="Topical">Topical</option>
                      </select>
                    </td>
                    <td className="p-2"><input type="text" value={d.dose} onChange={(e) => { const copy = [...prescribedDrugs]; copy[idx].dose = e.target.value; setPrescribedDrugs(copy); }} placeholder="Enter dose" className="w-24 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-mono font-bold" /></td>
                    <td className="p-2"><input type="text" value={d.frequency} onChange={(e) => { const copy = [...prescribedDrugs]; copy[idx].frequency = e.target.value; setPrescribedDrugs(copy); }} placeholder="Enter frequency" className="w-24 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-bold" /></td>
                    <td className="p-2"><input type="date" value={d.start_date} onChange={(e) => { const copy = [...prescribedDrugs]; copy[idx].start_date = e.target.value; setPrescribedDrugs(copy); }} className="w-28 h-8 px-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-mono text-[11px]" /></td>
                    <td className="p-2"><input type="date" value={d.stop_date} onChange={(e) => { const copy = [...prescribedDrugs]; copy[idx].stop_date = e.target.value; setPrescribedDrugs(copy); }} className="w-28 h-8 px-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent font-mono text-[11px]" /></td>
                    <td className="p-2">
                      {statusInfo ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded border whitespace-nowrap ${
                          statusInfo.status === 'FOUND' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' :
                          statusInfo.status === 'NOT_FOUND' ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' :
                          statusInfo.status === 'ERROR' ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' :
                          'bg-slate-100 text-slate-700 border-slate-300'
                        }`} title={statusInfo.message}>
                          {statusInfo.status === 'FOUND' ? '✓ Found in DB' : statusInfo.status === 'NOT_FOUND' ? '⚠️ Not in DB' : '⚠️ DB Error'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Enter drug</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {prescribedDrugs.length > 1 && (
                        <button type="button" onClick={() => handleRemoveDrugRow(idx)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9. DISCHARGE SUMMARY */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          9. Discharge Summary & Outcome
        </h3>

        <textarea
          rows={3}
          value={dischargeSummary}
          onChange={(e) => setDischargeSummary(e.target.value)}
          placeholder="Enter discharge summary"
          className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
        />
      </div>

      </fieldset>
      {/* END FORM BODY */}

      {/* ACTION SECTION AT THE BOTTOM */}
      {!isReadOnly && (
        <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
          <InlineActionNotification notification={bottomNotify} onClose={clearBottomNotify} position="inline" />

          <div className="flex flex-wrap items-center justify-end gap-3">

          {/* Required fields hint */}
          {!isProfileComplete() && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mr-auto">
              * Complete required fields to mark as Completed (green dot)
            </span>
          )}
          
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="h-[46px] px-6 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{existingProfileId ? 'Update Draft' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="h-[46px] px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/10 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save</span>
          </button>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { HeartHandshake, User, Clock, FileText, CheckSquare, Square, Save, Eye, Send, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, RotateCcw } from 'lucide-react';
import { fetchPatientCounsellingByCaseIdFromSupabase, saveOrUpdatePatientCounsellingInSupabase, fetchPatientProfileByCaseIdFromSupabase, saveStudentFormSectionInSupabase } from '../../services/supabaseService';
import { PatientCounsellingPDFPreviewModal } from './PatientCounsellingPDFPreviewModal';
import { InlineActionNotification } from '../common/InlineActionNotification';
import { useInlineNotification } from '../../hooks/useInlineNotification';

const ALL_POINTS_COVERED = [
  'Name and purpose of medication',
  'Dosage regimen',
  'Advice on missed dose',
  'Potential side effects',
  'Significant interactions (Drug-Drug, Drug-food, drug-Disease)',
  'Precautions to be taken',
  'Storage recommendations',
  'Benefits of completing case',
  'Life style modifications'
];

// Helper to convert 24-hour time string ("14:30") to 12-hour AM/PM string ("02:30 PM")
const formatTo12Hour = (time24Str) => {
  if (!time24Str) return '10:30 AM';
  if (time24Str.includes('AM') || time24Str.includes('PM')) return time24Str;
  const [h, m] = time24Str.split(':');
  let hour = parseInt(h, 10);
  if (isNaN(hour)) return time24Str;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  const hourStr = hour < 10 ? `0${hour}` : hour;
  return `${hourStr}:${m || '00'} ${ampm}`;
};

// Helper to convert 12-hour AM/PM string ("10:30 AM") to 24-hour string ("10:30") for <input type="time">
const parseTo24Hour = (time12Str) => {
  if (!time12Str) return '10:30';
  if (!time12Str.includes('AM') && !time12Str.includes('PM')) return time12Str;
  const [time, period] = time12Str.trim().split(/\s+/);
  if (!time) return '10:30';
  let [h, m] = time.split(':');
  let hour = parseInt(h, 10);
  if (isNaN(hour)) return '10:30';
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  const hourStr = hour < 10 ? `0${hour}` : hour;
  return `${hourStr}:${m || '00'}`;
};

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

export const PatientCounsellingFormView = ({ clinicalCase, student, onBack, isReadOnly: propReadOnly = false, snapshotAtReturn = null }) => {
  const isReadOnly = propReadOnly || clinicalCase?.status === 'Approved' || clinicalCase?.overall_case_status === 'Approved';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inline Notification Hook
  const { notification: bottomNotify, showNotification: showBottomNotify, clearNotification: clearBottomNotify } = useInlineNotification();

  // 1. Session & Patient Details
  const [counsellingDate, setCounsellingDate] = useState(new Date().toISOString().split('T')[0]);
  const [counsellingTimeRaw, setCounsellingTimeRaw] = useState('10:30');
  const [patientType, setPatientType] = useState('In patient');
  const [ipOpNumber, setIpOpNumber] = useState('');
  const [unitWard, setUnitWard] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('M');
  const [allergies, setAllergies] = useState('None');
  const [patientName, setPatientName] = useState('');
  const [specificBackgroundCollected, setSpecificBackgroundCollected] = useState(true);

  // 2. Disease & Medications
  const [diseaseCounselled, setDiseaseCounselled] = useState('');
  const [medicationsCounselled, setMedicationsCounselled] = useState('');

  // 3. Points Covered (Array of strings)
  const [pointsCovered, setPointsCovered] = useState([
    'Name and purpose of medication',
    'Dosage regimen',
    'Precautions to be taken',
    'Life style modifications'
  ]);

  // 4. Barriers
  const [majorBarriersInvolved, setMajorBarriersInvolved] = useState(false);
  const [barrierDetails, setBarrierDetails] = useState('');
  const [barrierOvercome, setBarrierOvercome] = useState(true);

  // 5. Duration & Recipient
  const [timeTaken, setTimeTaken] = useState('10 to 20 min.');
  const [counsellingProvidedTo, setCounsellingProvidedTo] = useState('Patient');
  const [representativeReasons, setRepresentativeReasons] = useState([]);
  const [representativeOtherReason, setRepresentativeOtherReason] = useState('');

  // 6. Aids & Materials
  const [counsellingAidsUsed, setCounsellingAidsUsed] = useState('');
  const [counsellingMaterialProvided, setCounsellingMaterialProvided] = useState('');

  // 7. Outcome
  const [understandingAscertained, setUnderstandingAscertained] = useState(true);

  // Meta
  const [status, setStatus] = useState('Draft');
  const [existingCounsellingId, setExistingCounsellingId] = useState(null);

  // PDF Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const currentCounsellingObj = React.useMemo(() => ({
    counselling_date: counsellingDate,
    counselling_time: counsellingTimeRaw,
    patient_type: patientType,
    ip_op_number: ipOpNumber,
    unit_ward: unitWard,
    age, sex, allergies,
    patient_name: patientName,
    disease_counselled: diseaseCounselled,
    medications_counselled: medicationsCounselled,
    points_covered: pointsCovered,
    major_barriers_involved: majorBarriersInvolved,
    barrier_details: barrierDetails,
    barrier_overcome: barrierOvercome,
    time_taken: timeTaken,
    counselling_provided_to: counsellingProvidedTo,
    representative_reasons: representativeReasons,
    representative_other_reason: representativeOtherReason,
    counselling_aids_used: counsellingAidsUsed,
    counselling_material_provided: counsellingMaterialProvided,
    understanding_ascertained: understandingAscertained
  }), [
    counsellingDate, counsellingTimeRaw, patientType, ipOpNumber, unitWard, age, sex, allergies,
    patientName, diseaseCounselled, medicationsCounselled, pointsCovered,
    majorBarriersInvolved, barrierDetails, barrierOvercome, timeTaken, counsellingProvidedTo,
    representativeReasons, representativeOtherReason, counsellingAidsUsed, counsellingMaterialProvided,
    understandingAscertained
  ]);

  const diffMap = React.useMemo(() => {
    const snap = snapshotAtReturn || clinicalCase?.snapshot_at_return?.counselling;
    if (!snap) return {};
    return computeModuleDiffs(currentCounsellingObj, snap, 'counselling');
  }, [currentCounsellingObj, snapshotAtReturn, clinicalCase?.snapshot_at_return?.counselling]);

  useEffect(() => {
    const loadCounsellingAndProfileData = async () => {
      if (!clinicalCase) return;
      setLoading(true);

      // Pre-fill defaults from clinicalCase
      setUnitWard(clinicalCase.ward_unit || '');
      setPatientType(clinicalCase.ip_op_type === 'OP' ? 'Outpatient' : 'In patient');

      // Concurrent fetch of Patient Counselling AND Patient Profile for live auto-sync
      const [counsellingRes, profileRes] = await Promise.all([
        fetchPatientCounsellingByCaseIdFromSupabase(clinicalCase.id),
        fetchPatientProfileByCaseIdFromSupabase(clinicalCase.id)
      ]);

      // AUTO-FETCH LATEST PATIENT PROFILE INFORMATION
      if (profileRes.success && profileRes.profile) {
        const p = profileRes.profile;
        setPatientName(p.patient_name || p.patient_initials || '');
        setIpOpNumber(p.ip_no || p.ip_op_number || '');
        setAge(p.age ? p.age.toString() : '');
        setSex(p.gender === 'Female' ? 'F' : p.gender === 'Male' ? 'M' : p.gender || 'M');
        setUnitWard(p.ward || p.ward_unit || clinicalCase.ward_unit || '');
        setAllergies(p.allergies || (p.allergy_drugs || p.allergy_food ? `Drugs: ${p.allergy_drugs || 'None'}, Food: ${p.allergy_food || 'None'}` : 'None'));
        setDiseaseCounselled(prev => prev || p.final_diagnosis || p.provisional_diagnosis || clinicalCase?.final_diagnosis || '');
      }

      if (counsellingRes.success && counsellingRes.counselling) {
        const c = counsellingRes.counselling;
        setExistingCounsellingId(c.id);
        setCounsellingDate(c.counselling_date || new Date().toISOString().split('T')[0]);
        setCounsellingTimeRaw(parseTo24Hour(c.counselling_time || '10:30 AM'));
        setPatientType(c.patient_type || 'In patient');
        
        // Use counselling values if profile wasn't available
        if (!profileRes.profile) {
          setIpOpNumber(c.ip_op_number || '');
          setUnitWard(c.unit_ward || clinicalCase.ward_unit || '');
          setAge(c.age || '');
          setSex(c.sex || 'M');
          setAllergies(c.allergies || 'None');
        }

        setSpecificBackgroundCollected(Boolean(c.specific_background_collected));
        setDiseaseCounselled(c.disease_counselled || c.disease_condition || '');
        setMedicationsCounselled(c.medications_counselled || '');
        if (c.points_covered && Array.isArray(c.points_covered)) setPointsCovered(c.points_covered);

        setMajorBarriersInvolved(Boolean(c.major_barriers_involved));
        setBarrierDetails(c.barrier_details || c.barriers_identified || '');
        setBarrierOvercome(Boolean(c.barrier_overcome));

        setTimeTaken(c.time_taken || c.duration_minutes || '10 to 20 min.');
        setCounsellingProvidedTo(c.counselling_provided_to || c.provided_to || 'Patient');
        if (c.representative_reasons && Array.isArray(c.representative_reasons)) setRepresentativeReasons(c.representative_reasons);
        setRepresentativeOtherReason(c.representative_other_reason || '');

        setCounsellingAidsUsed(c.counselling_aids_used || '');
        setCounsellingMaterialProvided(c.counselling_material_provided || c.educational_materials_used || '');
        setUnderstandingAscertained(Boolean(c.understanding_ascertained));
        setStatus(c.status || 'Draft');
      }

      setLoading(false);
    };

    loadCounsellingAndProfileData();
  }, [clinicalCase]);

  const handleTogglePointCovered = (pt) => {
    if (pointsCovered.includes(pt)) {
      setPointsCovered(pointsCovered.filter(p => p !== pt));
    } else {
      setPointsCovered([...pointsCovered, pt]);
    }
  };

  const handleToggleRepReason = (reason) => {
    if (representativeReasons.includes(reason)) {
      setRepresentativeReasons(representativeReasons.filter(r => r !== reason));
    } else {
      setRepresentativeReasons([...representativeReasons, reason]);
    }
  };

  // Validate required fields for Counselling completion (Disease Counselled + Medications Counselled)
  const isCounsellingComplete = () => {
    return (
      diseaseCounselled && diseaseCounselled.trim().length > 0 &&
      medicationsCounselled && medicationsCounselled.trim().length > 0
    );
  };

  const handleSaveCounselling = async () => {
    clearBottomNotify();
    const formattedTime = formatTo12Hour(counsellingTimeRaw);

    // Determine completion purely from field validation (not from which button was clicked)
    const allRequiredFilled = isCounsellingComplete();
    const saveStatus = allRequiredFilled ? 'Submitted' : 'Draft';

    setSaving(true);

    const payload = {
      clinical_case_id: clinicalCase.id,
      student_id: student.id,
      college_id: student.college_id,
      counselling_date: counsellingDate,
      counselling_time: formattedTime,
      patient_type: patientType,
      ip_op_number: ipOpNumber,
      unit_ward: unitWard,
      age,
      sex,
      allergies,
      specific_background_collected: specificBackgroundCollected,
      disease_counselled: diseaseCounselled.trim(),
      medications_counselled: medicationsCounselled.trim(),
      points_covered: pointsCovered,
      major_barriers_involved: majorBarriersInvolved,
      barrier_details: majorBarriersInvolved ? barrierDetails.trim() : null,
      barrier_overcome: majorBarriersInvolved ? barrierOvercome : false,
      time_taken: timeTaken,
      counselling_provided_to: counsellingProvidedTo,
      representative_reasons: counsellingProvidedTo === 'Patient representative' ? representativeReasons : [],
      representative_other_reason: counsellingProvidedTo === 'Patient representative' ? representativeOtherReason.trim() : null,
      counselling_aids_used: counsellingAidsUsed.trim(),
      counselling_material_provided: counsellingMaterialProvided.trim(),
      understanding_ascertained: understandingAscertained,
      status: saveStatus
    };

    const res = await saveStudentFormSectionInSupabase({
      section_type: 'counselling',
      is_mandatory: true,
      completion_status: allRequiredFilled, // ← field-validation based, not button-based
      payload
    });
    setSaving(false);

    if (res.success) {
      setExistingCounsellingId(res.counselling.id);
      
      // Sync completion flags strictly using backend response to avoid cached values
      if (clinicalCase) {
        clinicalCase.profile_completed = !!res.profile_completed;
        clinicalCase.counselling_completed = !!res.counselling_completed;
      }

      setStatus(res.counselling_completed ? 'Completed' : 'Draft');
      
      showBottomNotify({
        type: 'success',
        message: res.counselling_completed
          ? '✓ Counselling saved and marked as Completed (Green)'
          : '✓ Draft saved. Fill Disease Counselled and Medications to mark as Completed.'
      });
    } else {
      showBottomNotify({
        type: 'error',
        message: res.error || '✖ Failed to save Patient Counselling documentation.'
      });
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading Patient Counselling Documentation Form...</p>
      </div>
    );
  }

  const formattedTimeDisplay = formatTo12Hour(counsellingTimeRaw);

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto pb-12">
      
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
              <HeartHandshake className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Patient Counselling Documentation Form</span>
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
            1. Patient & Session Information
          </h3>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> Auto-Synced from Patient Profile
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          {/* Counselling Date */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Counselling Date *</label>
            <input
              type="date"
              value={counsellingDate}
              onChange={(e) => setCounsellingDate(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
            />
          </div>

          {/* Session Time - Clean Native Time Picker */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Session Time ({formattedTimeDisplay})</label>
            <input
              type="time"
              value={counsellingTimeRaw}
              onChange={(e) => setCounsellingTimeRaw(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
            />
          </div>

          {/* Type of Patient */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Type of Patient *</label>
            <select
              value={patientType}
              onChange={(e) => setPatientType(e.target.value)}
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
            >
              <option value="In patient">In patient</option>
              <option value="Outpatient">Outpatient</option>
            </select>
          </div>

          {/* IP / OP Number (Auto Synced) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">IP / OP Number</label>
            <input
              type="text"
              readOnly
              value={ipOpNumber}
              placeholder="Auto-synced IP/OP Number"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
            />
          </div>

          {/* Unit / Ward (Auto Synced) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit / Ward</label>
            <input
              type="text"
              readOnly
              value={unitWard}
              placeholder="Auto-synced Ward"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
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

          {/* Known Allergies (Auto Synced) */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Known Allergies</label>
            <input
              type="text"
              readOnly
              value={allergies}
              placeholder="Auto-synced allergies"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-bold text-rose-600 dark:text-rose-400"
            />
          </div>

          <div className="sm:col-span-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Other patient's specific background information collected?</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                <input type="radio" name="bg_collected" checked={specificBackgroundCollected === true} onChange={() => setSpecificBackgroundCollected(true)} />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                <input type="radio" name="bg_collected" checked={specificBackgroundCollected === false} onChange={() => setSpecificBackgroundCollected(false)} />
                <span>No</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DISEASE & MEDICATIONS COUNSELLED */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          2. Disease & Medications Counselled
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Disease Counselled *</label>
            <textarea
              rows={3}
              required
              value={diseaseCounselled}
              onChange={(e) => setDiseaseCounselled(e.target.value)}
              placeholder="Enter disease counselled"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Medications Counselled *</label>
            <textarea
              rows={3}
              required
              value={medicationsCounselled}
              onChange={(e) => setMedicationsCounselled(e.target.value)}
              placeholder="Enter medications counselled"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {/* 3. POINTS COVERED DURING COUNSELLING SESSION */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          3. Points Covered During Counselling Session
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {ALL_POINTS_COVERED.map((pt, i) => {
            const isSelected = pointsCovered.includes(pt);
            return (
              <div
                key={i}
                onClick={() => handleTogglePointCovered(pt)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 font-bold text-slate-900 dark:text-white'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-emerald-600 dark:text-emerald-400 shrink-0">
                  {isSelected ? <CheckSquare className="w-5 h-5 fill-emerald-600 text-white dark:fill-emerald-500 dark:text-slate-900" /> : <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />}
                </div>
                <span>{pt}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. BARRIERS INVOLVED */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          4. Counselling Barriers & Resolution
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Any major barriers involved?</span>
            <div className="flex items-center gap-4 font-bold">
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="radio" name="barriers" checked={majorBarriersInvolved === true} onChange={() => setMajorBarriersInvolved(true)} />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="radio" name="barriers" checked={majorBarriersInvolved === false} onChange={() => setMajorBarriersInvolved(false)} />
                <span>No</span>
              </label>
            </div>
          </div>

          {majorBarriersInvolved && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Whether barrier was rightly overcome?</span>
              <div className="flex items-center gap-4 font-bold">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="overcome" checked={barrierOvercome === true} onChange={() => setBarrierOvercome(true)} />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="overcome" checked={barrierOvercome === false} onChange={() => setBarrierOvercome(false)} />
                  <span>No</span>
                </label>
              </div>
            </div>
          )}

          {majorBarriersInvolved && (
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">If Yes, Specify Details of Barrier:</label>
              <input
                type="text"
                value={barrierDetails}
                onChange={(e) => setBarrierDetails(e.target.value)}
                placeholder="Enter details of barrier"
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* 5. COUNSELLING DURATION & RECIPIENT */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          5. Counselling Duration & Recipient
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Time taken for counselling *</label>
            <div className="flex flex-wrap gap-2">
              {['Less than 10 min.', '10 to 20 min.', 'More than 20 min.'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeTaken(t)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    timeTaken === t
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Counselling provided to *</label>
            <div className="flex gap-2">
              {['Patient', 'Patient representative'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCounsellingProvidedTo(r)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    counsellingProvidedTo === r
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {counsellingProvidedTo === 'Patient representative' && (
            <div className="sm:col-span-2 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-2">
              <label className="block font-bold text-amber-900 dark:text-amber-300">If patient's representative, give reason:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Patient is unconscious', 'Hearing problem', 'Language problem', 'Pediatric patient'].map((reason, idx) => {
                  const isChecked = representativeReasons.includes(reason);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleRepReason(reason)}
                      className={`p-2 rounded-xl text-xs font-semibold text-left transition-all border ${
                        isChecked ? 'bg-amber-600 text-white border-amber-700' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}{reason}
                    </button>
                  );
                })}
              </div>

              <div>
                <input
                  type="text"
                  value={representativeOtherReason}
                  onChange={(e) => setRepresentativeOtherReason(e.target.value)}
                  placeholder="Enter other representative reason"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white mt-1"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. COUNSELLING AIDS & MATERIALS */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          6. Counselling Aids & Material Provided
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Counselling aids used</label>
            <input
              type="text"
              value={counsellingAidsUsed}
              onChange={(e) => setCounsellingAidsUsed(e.target.value)}
              placeholder="Enter counselling aids used"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Counselling material provided</label>
            <input
              type="text"
              value={counsellingMaterialProvided}
              onChange={(e) => setCounsellingMaterialProvided(e.target.value)}
              placeholder="Enter counselling material provided"
              className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div className="sm:col-span-2 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <span className="font-extrabold text-emerald-900 dark:text-emerald-300">Understanding of the patient ascertained?</span>
            <div className="flex items-center gap-4 font-bold">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="understanding" checked={understandingAscertained === true} onChange={() => setUnderstandingAscertained(true)} />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="understanding" checked={understandingAscertained === false} onChange={() => setUnderstandingAscertained(false)} />
                <span>No</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      </fieldset>
      {/* END FORM BODY */}

      {/* ACTION SECTION AT THE BOTTOM */}
      {!isReadOnly && (
        <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
          <InlineActionNotification notification={bottomNotify} onClose={clearBottomNotify} position="inline" />

          <div className="flex flex-wrap items-center justify-end gap-3">

          {/* Required fields hint */}
          {!isCounsellingComplete() && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mr-auto">
              * Fill Disease Counselled and Medications Counselled to mark as Completed (green dot)
            </span>
          )}

          <button
            type="button"
            onClick={handleSaveCounselling}
            disabled={saving}
            className="h-[46px] px-6 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{existingCounsellingId ? 'Update Draft' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveCounselling}
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

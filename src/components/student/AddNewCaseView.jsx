import React, { useState, useEffect } from 'react';
import { FilePlus2, User, GraduationCap, Building2, Stethoscope, Calendar, Save, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { fetchStudentAssignedPreceptorFromSupabase, insertClinicalCaseToSupabase } from '../../services/supabaseService';
import { supabase } from '../../lib/supabaseClient';
import { SearchableSelect } from '../common/SearchableSelect';
import { CLINICAL_DEPARTMENTS, CLINICAL_WARDS_UNITS } from '../../constants/clinicalMasterData';
import { resolveCollegeHospitalOptions } from '../../utils/resolveCollegeHospitalOptions';

export const AddNewCaseView = ({ student, onCancel, onSuccess, isExpired }) => {
  const [caseId, setCaseId] = useState('');
  const [assignedPreceptor, setAssignedPreceptor] = useState(null);
  const [loading, setLoading] = useState(true);

  const initialOptions = resolveCollegeHospitalOptions(student?.colleges, student);
  const [hospitalOptions, setHospitalOptions] = useState(initialOptions);
  const [hospitalName, setHospitalName] = useState(initialOptions[0] || '');

  const [department, setDepartment] = useState('');
  const [wardUnit, setWardUnit] = useState('');
  const [ipOpType, setIpOpType] = useState('IP');
  const [dateOfAdmission, setDateOfAdmission] = useState(new Date().toISOString().split('T')[0]);
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const initializeForm = async () => {
      if (!student) return;
      setLoading(true);

      const collegeId = student.college_id || student?.colleges?.id;
      let fetchedCollege = student?.colleges || null;

      // Fetch preceptor and complete college data from Supabase in parallel
      const [precRes, colRes] = await Promise.all([
        fetchStudentAssignedPreceptorFromSupabase(student.id),
        collegeId ? supabase.from('colleges').select('*').eq('id', collegeId).maybeSingle() : Promise.resolve({ data: null })
      ]);

      if (precRes.success && precRes.data) setAssignedPreceptor(precRes.data);

      if (colRes?.data) {
        fetchedCollege = { ...fetchedCollege, ...colRes.data };
      }

      const resolvedOpts = resolveCollegeHospitalOptions(fetchedCollege, student);
      setHospitalOptions(resolvedOpts);
      if (resolvedOpts.length > 0 && !hospitalName) {
        setHospitalName(resolvedOpts[0]);
      } else if (resolvedOpts.length > 0 && !resolvedOpts.includes(hospitalName)) {
        setHospitalName(resolvedOpts[0]);
      }

      setLoading(false);
    };

    initializeForm();
  }, [student]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const errors = {};

    if (!hospitalName.trim()) errors.hospitalName = 'Please select Hospital Name.';
    if (!department.trim()) errors.department = 'Please select Department.';
    if (!wardUnit.trim()) errors.wardUnit = 'Please select Ward / Unit.';
    if (!dateOfAdmission) errors.dateOfAdmission = 'Date of admission is required.';
    if (!finalDiagnosis.trim()) errors.finalDiagnosis = 'Final diagnosis is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please complete all required fields highlighted in red below.');
      return;
    }
    setFieldErrors({});

    setSaving(true);
    const res = await insertClinicalCaseToSupabase({
      caseId,
      collegeId: student.college_id,
      studentId: student.id,
      preceptorId: assignedPreceptor ? assignedPreceptor.id : null,
      hospitalName: hospitalName.trim(),
      department: department.trim(),
      wardUnit: wardUnit.trim(),
      ipOpType,
      dateOfAdmission,
      dateOfCollection: dateOfAdmission,
      academicYear: student.academic_year || '2026–2027',
      finalDiagnosis: finalDiagnosis.trim(),
      status
    });
    setSaving(false);

    if (res.success) {
      setCaseId(res.data.case_id);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } else {
      setFormError(res.error || 'Failed to save clinical case record.');
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading Credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Add New Clinical Patient Case</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Initiate a new student clinical case logbook entry for hospital ward rounds.
          </p>
        </div>

        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* AUTO-GENERATED CASE ID & READ-ONLY STUDENT DETAILS */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-50 via-emerald-50/40 to-teal-50/40 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-900/90 border border-slate-200/90 dark:border-slate-700/80 shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-700/60">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-emerald-700 dark:text-emerald-400 tracking-wider">Auto-Generated Case Identifier</span>
              <h3 className="text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {caseId || `${student?.colleges?.college_code || 'CLG'}-${new Date().getFullYear()}-XXXX (Generated after saving)`}
              </h3>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 shadow-2xs">
              Draft Case Entry
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold block">Student Name</span>
              <strong className="font-extrabold text-slate-900 dark:text-white">{student?.full_name}</strong>
            </div>

            <div>
              <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold block">Roll Number</span>
              <strong className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{student?.roll_number}</strong>
            </div>

            <div>
              <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold block">College</span>
              <strong className="font-extrabold text-slate-900 dark:text-white truncate block">{student?.colleges?.college_name || 'Pharmacy College'}</strong>
            </div>

            <div>
              <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold block">Assigned Preceptor</span>
              <strong className="font-bold text-teal-700 dark:text-teal-400">{assignedPreceptor ? assignedPreceptor.full_name : 'Unassigned'}</strong>
            </div>
          </div>
        </div>

        {/* CLINICAL CASE ENTRY FIELDS */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Hospital & Clinical Ward Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hospital Name *
              </label>
              <SearchableSelect
                value={hospitalName}
                onChange={(val) => { setHospitalName(val); setFieldErrors(prev => ({ ...prev, hospitalName: '' })); }}
                options={hospitalOptions}
                placeholder="Select Hospital Name..."
                required
                hasError={Boolean(fieldErrors.hospitalName)}
              />
              {fieldErrors.hospitalName && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.hospitalName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department *
              </label>
              <SearchableSelect
                value={department}
                onChange={(val) => { setDepartment(val); setFieldErrors(prev => ({ ...prev, department: '' })); }}
                options={CLINICAL_DEPARTMENTS}
                placeholder="Search or Select Department..."
                required
                hasError={Boolean(fieldErrors.department)}
              />
              {fieldErrors.department && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.department}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ward / Unit *
              </label>
              <SearchableSelect
                value={wardUnit}
                onChange={(val) => { setWardUnit(val); setFieldErrors(prev => ({ ...prev, wardUnit: '' })); }}
                options={CLINICAL_WARDS_UNITS}
                placeholder="Search or Select Ward / Unit..."
                required
                hasError={Boolean(fieldErrors.wardUnit)}
              />
              {fieldErrors.wardUnit && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.wardUnit}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                IP / OP Category *
              </label>
              <select
                value={ipOpType}
                onChange={(e) => setIpOpType(e.target.value)}
                className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-bold"
              >
                <option value="IP">In-Patient (IP)</option>
                <option value="OP">Out-Patient (OP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Date of Admission *
              </label>
              <input
                type="date"
                required
                value={dateOfAdmission}
                onChange={(e) => { setDateOfAdmission(e.target.value); setFieldErrors(prev => ({ ...prev, dateOfAdmission: '' })); }}
                className={`w-full h-[46px] px-3.5 text-xs rounded-xl border text-slate-900 dark:text-white focus:ring-2 focus:outline-none font-mono font-bold transition-all ${
                  fieldErrors.dateOfAdmission
                    ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-emerald-500/50'
                }`}
              />
              {fieldErrors.dateOfAdmission && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.dateOfAdmission}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Final Diagnosis *
              </label>
              <input
                type="text"
                required
                value={finalDiagnosis}
                onChange={(e) => { setFinalDiagnosis(e.target.value); setFieldErrors(prev => ({ ...prev, finalDiagnosis: '' })); }}
                placeholder="Enter final diagnosis"
                className={`w-full h-[46px] px-3.5 text-xs rounded-xl border text-slate-900 dark:text-white focus:ring-2 focus:outline-none font-medium transition-all ${
                  fieldErrors.finalDiagnosis
                    ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-emerald-500/50'
                }`}
              />
              {fieldErrors.finalDiagnosis && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.finalDiagnosis}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM BUTTONS & ACTION FEEDBACK */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2.5 shadow-xs animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 shadow-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Clinical Case created successfully! Redirecting to My Cases...</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="h-[48px] px-6 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || isExpired}
              className="h-[48px] px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Case Record...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Draft Case</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

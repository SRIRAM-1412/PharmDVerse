import React, { useState, useEffect } from 'react';
import { Building2, User, KeyRound, Eye, EyeOff, Save, CheckCircle2, AlertTriangle, Upload, Trash2, RefreshCw, Award, CreditCard, ShieldCheck, Lock, Calendar, Users, Clock } from 'lucide-react';
import { updateCollegeProfileAndSubscriptionInSupabase, uploadCollegeLogoToSupabaseStorage, fetchCollegeByIdFromSupabase, fetchCollegeSubscriptionByIdFromSupabase } from '../../services/supabaseService';
import { saveActiveSession } from '../../services/authService';
import { SUBSCRIPTION_PLANS, getPlanDetails, calculateDaysRemaining, getSubscriptionStatusDetails, formatSubscriptionDate } from '../../utils/subscriptionUtils';

export const CollegeAdminProfileView = ({ college: initialCollege, onProfileUpdated }) => {
  const [currentCollege, setCurrentCollege] = useState(initialCollege);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [liveStudentCount, setLiveStudentCount] = useState(0);

  const [formData, setFormData] = useState({
    collegeName: initialCollege?.name || initialCollege?.college_name || '',
    isAutonomous: Boolean(initialCollege?.isAutonomous ?? initialCollege?.is_autonomous ?? false),
    hospitalName: initialCollege?.hospitalName || initialCollege?.hospital_name || initialCollege?.primary_hospital_name || '',
    collegeLogoUrl: initialCollege?.logoUrl || initialCollege?.college_logo_url || '',
    hospitalLogoUrl: initialCollege?.hospitalLogoUrl || initialCollege?.hospital_logo_url || '',
    principalName: initialCollege?.principalName || initialCollege?.principal_name || '',
    principalMobile: initialCollege?.principalMobile || initialCollege?.principal_mobile || '',
    principalEmail: initialCollege?.principalEmail || initialCollege?.principal_email || initialCollege?.adminUsername || '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // FETCH FRESH COLLEGE & SUBSCRIPTION RECORD DIRECTLY FROM SUPABASE ON MOUNT
  useEffect(() => {
    const loadFreshCollegeAndSubscription = async () => {
      if (initialCollege?.id) {
        const res = await fetchCollegeSubscriptionByIdFromSupabase(initialCollege.id);
        if (res.success) {
          if (res.college) {
            const fresh = res.college;
            setCurrentCollege(fresh);
            setFormData(prev => ({
              ...prev,
              collegeName: fresh.college_name || prev.collegeName,
              isAutonomous: Boolean(fresh.is_autonomous),
              hospitalName: fresh.hospital_name || prev.hospitalName,
              collegeLogoUrl: fresh.college_logo_url || prev.collegeLogoUrl,
              hospitalLogoUrl: fresh.hospital_logo_url || prev.hospitalLogoUrl,
              principalName: fresh.principal_name || prev.principalName,
              principalMobile: fresh.principal_mobile || prev.principalMobile,
              principalEmail: fresh.principal_email || prev.principalEmail
            }));
          }
          if (res.subscription) {
            setSubscriptionData(res.subscription);
          }
          setLiveStudentCount(res.studentCount || 0);
        }
      }
    };
    loadFreshCollegeAndSubscription();

    const handleCollegeUpdatedEvent = () => loadFreshCollegeAndSubscription();
    window.addEventListener('pharmdverse_college_updated', handleCollegeUpdatedEvent);
    return () => window.removeEventListener('pharmdverse_college_updated', handleCollegeUpdatedEvent);
  }, [initialCollege?.id]);

  const [uploadingCollegeLogo, setUploadingCollegeLogo] = useState(false);
  const [uploadingHospitalLogo, setUploadingHospitalLogo] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrorMsg('');
  };

  const handleCollegeLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setErrorMsg('College Logo file size exceeds 500 KB limit. Please choose a smaller image.');
      return;
    }

    setUploadingCollegeLogo(true);
    setErrorMsg('');
    const res = await uploadCollegeLogoToSupabaseStorage(file);
    setUploadingCollegeLogo(false);

    if (res.success && res.url) {
      setFormData(prev => ({ ...prev, collegeLogoUrl: res.url }));
    } else {
      setErrorMsg(res.error || 'Failed to upload College Logo.');
    }
  };

  const handleHospitalLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setErrorMsg('Hospital Logo file size exceeds 500 KB limit. Please choose a smaller image.');
      return;
    }

    setUploadingHospitalLogo(true);
    setErrorMsg('');
    const res = await uploadCollegeLogoToSupabaseStorage(file);
    setUploadingHospitalLogo(false);

    if (res.success && res.url) {
      setFormData(prev => ({ ...prev, hospitalLogoUrl: res.url }));
    } else {
      setErrorMsg(res.error || 'Failed to upload Hospital Logo.');
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all changes back to currently saved profile data?')) {
      setFormData({
        collegeName: currentCollege?.name || currentCollege?.college_name || '',
        isAutonomous: Boolean(currentCollege?.isAutonomous ?? currentCollege?.is_autonomous ?? false),
        hospitalName: currentCollege?.hospitalName || currentCollege?.hospital_name || currentCollege?.primary_hospital_name || '',
        collegeLogoUrl: currentCollege?.logoUrl || currentCollege?.college_logo_url || '',
        hospitalLogoUrl: currentCollege?.hospitalLogoUrl || currentCollege?.hospital_logo_url || '',
        principalName: currentCollege?.principalName || currentCollege?.principal_name || '',
        principalMobile: currentCollege?.principalMobile || currentCollege?.principal_mobile || '',
        principalEmail: currentCollege?.principalEmail || currentCollege?.principal_email || currentCollege?.adminUsername || '',
        newPassword: '',
        confirmNewPassword: ''
      });
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.collegeName.trim()) {
      setErrorMsg('College Name is required.');
      return;
    }

    if (formData.newPassword || formData.confirmNewPassword) {
      const pwdErrs = {};
      if (formData.newPassword.length < 8) {
        pwdErrs.newPassword = '❌ Password must contain at least 8 characters.';
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        pwdErrs.confirmNewPassword = '❌ Passwords do not match.';
      }
      if (Object.keys(pwdErrs).length > 0) {
        setFieldErrors(pwdErrs);
        return;
      }
    }
    setFieldErrors({});

    setSaving(true);
    const updatePayload = {
      collegeCode: currentCollege.code || currentCollege.college_code,
      collegeName: formData.collegeName,
      collegeLogoUrl: formData.collegeLogoUrl,
      hospitalName: formData.hospitalName,
      hospitalLogoUrl: formData.hospitalLogoUrl,
      isAutonomous: formData.isAutonomous,
      collegeDescription: currentCollege.description || currentCollege.college_description,
      city: currentCollege.city,
      state: currentCollege.state,
      principalName: formData.principalName,
      principalMobile: formData.principalMobile,
      principalEmail: formData.principalEmail,
      adminPassword: formData.newPassword || undefined,
      subscriptionPlan: currentCollege.subscriptionPlan || 'Professional',
      subscriptionStatus: currentCollege.status || 'Active'
    };

    const res = await updateCollegeProfileAndSubscriptionInSupabase(currentCollege.id, updatePayload);
    setSaving(false);

    if (res.success && res.college) {
      const updatedCollegeRecord = res.college;
      setCurrentCollege(updatedCollegeRecord);
      saveActiveSession({ viewMode: 'college_admin', college: updatedCollegeRecord, user: updatedCollegeRecord });

      // BROADCAST LIVE SYNCHRONIZATION EVENT TO ALL LAYOUTS, PREVIEWS & BRANDING MODULES
      window.dispatchEvent(new CustomEvent('pharmdverse_college_updated', { detail: updatedCollegeRecord }));

      setSuccessMsg('College & Hospital Identity saved to Supabase! Autonomous status, logos, and headers have been updated everywhere across PharmDVerse.');
      setTimeout(() => {
        setSuccessMsg('');
        if (onProfileUpdated) onProfileUpdated(updatedCollegeRecord);
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Failed to update College Profile.');
    }
  };

  const rawMaxLimit = subscriptionData?.maximum_students || currentCollege?.maxStudentsAllowed;
  const planKey = subscriptionData?.plan_name || currentCollege?.subscriptionPlan || 'Professional';
  const planDetails = getPlanDetails(planKey, rawMaxLimit);
  const maxStudents = planDetails.maxStudents;
  const availableSeats = Math.max(0, maxStudents - liveStudentCount);
  const startDateStr = subscriptionData?.subscription_start_date || currentCollege?.subscriptionStartDate || new Date().toISOString().split('T')[0];
  const expiryDateStr = subscriptionData?.subscription_expiry_date || currentCollege?.subscriptionExpiryDate || '2027-08-04';
  const rawStatus = currentCollege?.status || (subscriptionData ? subscriptionData.status : 'Active');
  const statusMeta = getSubscriptionStatusDetails(expiryDateStr, rawStatus);

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>My College Profile</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage College & Hospital Identity, logos, autonomous status, and College Admin credentials.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: COLLEGE & HOSPITAL IDENTITY */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              College & Hospital Identity Configuration
            </h3>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
              Single Source of Truth
            </span>
          </div>

          {/* COLLEGE DETAILS */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-indigo-900 dark:text-indigo-300 border-l-2 border-indigo-600 pl-2">
              College Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  College Name *
                </label>
                <input
                  type="text"
                  name="collegeName"
                  required
                  value={formData.collegeName}
                  onChange={handleChange}
                  placeholder="e.g. Central College of Pharmacy"
                  className="w-full h-[46px] px-3.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Autonomous Status *
                </label>
                <select
                  name="isAutonomous"
                  value={formData.isAutonomous ? 'Yes' : 'No'}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAutonomous: e.target.value === 'Yes' }))}
                  className="w-full h-[46px] px-3.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                >
                  <option value="No">No (Standard Affiliated)</option>
                  <option value="Yes">Yes (Autonomous)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  When set to "Yes", "(Autonomous)" will automatically display below College Name in all Print & PDF documents.
                </p>
              </div>
            </div>

            {/* COLLEGE LOGO UPLOAD & PREVIEW */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                College Logo (JPG / JPEG / PNG, Max 500 KB)
              </label>

              <div className="flex items-center gap-4 flex-wrap">
                {formData.collegeLogoUrl ? (
                  <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <img src={formData.collegeLogoUrl} alt="College Logo Preview" className="w-14 h-14 object-contain rounded-lg border border-slate-200 dark:border-slate-700" />
                    <div>
                      <span className="text-[10px] font-mono text-emerald-600 font-bold block">College Logo Attached</span>
                      <div className="flex gap-2 mt-1">
                        <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                          Replace Logo
                          <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleCollegeLogoUpload} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, collegeLogoUrl: '' }))}
                          className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>{uploadingCollegeLogo ? 'Uploading Logo...' : 'Upload College Logo'}</span>
                    <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleCollegeLogoUpload} disabled={uploadingCollegeLogo} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* HOSPITAL DETAILS */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-teal-900 dark:text-teal-300 border-l-2 border-teal-600 pl-2">
              Hospital Details
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hospital Name *
              </label>
              <input
                type="text"
                name="hospitalName"
                required
                value={formData.hospitalName}
                onChange={handleChange}
                placeholder="e.g. Primary Teaching Hospital"
                className="w-full h-[46px] px-3.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 focus:outline-none"
              />
            </div>

            {/* HOSPITAL LOGO UPLOAD & PREVIEW */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Hospital Logo (JPG / JPEG / PNG, Max 500 KB)
              </label>

              <div className="flex items-center gap-4 flex-wrap">
                {formData.hospitalLogoUrl ? (
                  <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <img src={formData.hospitalLogoUrl} alt="Hospital Logo Preview" className="w-14 h-14 object-contain rounded-lg border border-slate-200 dark:border-slate-700" />
                    <div>
                      <span className="text-[10px] font-mono text-teal-600 font-bold block">Hospital Logo Attached</span>
                      <div className="flex gap-2 mt-1">
                        <label className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer">
                          Replace Logo
                          <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleHospitalLogoUpload} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, hospitalLogoUrl: '' }))}
                          className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-teal-600" />
                    <span>{uploadingHospitalLogo ? 'Uploading Logo...' : 'Upload Hospital Logo'}</span>
                    <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleHospitalLogoUpload} disabled={uploadingHospitalLogo} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* SECTION 2: SUBSCRIPTION DETAILS (INFORMATIONAL & READ-ONLY FOR COLLEGE ADMIN) */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20 border border-emerald-300/60 dark:border-emerald-800/80 shadow-xs space-y-5">
          <div className="pb-3 border-b border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Subscription Details</span>
            </h3>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              <Lock className="w-3 h-3 text-slate-400" /> Informational Only (Managed by Super Admin)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* PLAN */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60 shadow-xs space-y-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">PLAN</span>
              <strong className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block">
                {planDetails.name}
              </strong>
            </div>

            {/* STUDENT CAPACITY */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60 shadow-xs space-y-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">STUDENT CAPACITY</span>
              <strong className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block">
                {liveStudentCount} / {maxStudents} Students
              </strong>
            </div>

            {/* AVAILABLE SEATS */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60 shadow-xs space-y-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">AVAILABLE STUDENT SEATS</span>
              <strong className="text-sm font-extrabold text-teal-600 dark:text-teal-400 block">
                {availableSeats} Students Available
              </strong>
            </div>

            {/* STATUS */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60 shadow-xs space-y-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">SUBSCRIPTION STATUS</span>
              <div className="pt-0.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${statusMeta.badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${statusMeta.dotClass}`}></span>
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* START DATE */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">SUBSCRIPTION START DATE</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{formatSubscriptionDate(startDateStr)}</span>
              </div>
            </div>

            {/* EXPIRY DATE */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">SUBSCRIPTION EXPIRY DATE</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{formatSubscriptionDate(expiryDateStr)}</span>
              </div>
            </div>

            {/* TIME REMAINING */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">TIME REMAINING</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {statusMeta.daysRemaining < 0 ? 'Expired' : `${statusMeta.daysRemaining} Days Remaining`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PRINCIPAL DETAILS */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Principal / Admin Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Principal Name *
              </label>
              <input
                type="text"
                name="principalName"
                required
                value={formData.principalName}
                onChange={handleChange}
                className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mobile Number *
              </label>
              <input
                type="tel"
                name="principalMobile"
                required
                value={formData.principalMobile}
                onChange={handleChange}
                className="w-full h-[46px] px-3.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address * (Admin User ID)
              </label>
              <input
                type="email"
                name="principalEmail"
                required
                value={formData.principalEmail}
                onChange={handleChange}
                className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECURITY CREDENTIALS UPDATE */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/40 dark:from-indigo-950/20 dark:via-slate-900 dark:to-sky-950/20 border border-indigo-200/80 dark:border-indigo-900/80 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-2 pb-2 border-b border-indigo-200/60 dark:border-indigo-900/60">
            <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Update College Admin Password
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Admin Password (Min 8 chars)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={(e) => { handleChange(e); setFieldErrors(prev => ({ ...prev, newPassword: '' })); }}
                  placeholder="Leave blank to keep current password"
                  className={`w-full h-[46px] pl-3.5 pr-10 text-xs font-mono rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all ${
                    fieldErrors.newPassword
                      ? 'border-rose-500 focus:ring-rose-500/50'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className="text-[10px] text-rose-600 mt-1 font-semibold pl-1">{fieldErrors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={(e) => { handleChange(e); setFieldErrors(prev => ({ ...prev, confirmNewPassword: '' })); }}
                  placeholder="Confirm new password"
                  className={`w-full h-[46px] pl-3.5 pr-10 text-xs font-mono rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all ${
                    fieldErrors.confirmNewPassword
                      ? 'border-rose-500 focus:ring-rose-500/50'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmNewPassword && (
                <p className="text-[10px] text-rose-600 mt-1 font-semibold pl-1">{fieldErrors.confirmNewPassword}</p>
              )}
            </div>
          </div>
        </div>

        {/* BUTTONS: SAVE CHANGES, RESET */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="h-[48px] px-5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Reset</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="h-[48px] px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { useColleges } from '../../context/CollegeContext';
import { Building2, MapPin, Award, User, Save, CreditCard, Trash2, AlertTriangle, ImageIcon, Upload, Loader2, CheckCircle2, KeyRound, Eye, EyeOff, Lock, Users, Calendar, ShieldCheck, Clock } from 'lucide-react';
import { SUBSCRIPTION_PLANS, getPlanDetails, calculateDaysRemaining, getSubscriptionStatusDetails, formatSubscriptionDate } from '../../utils/subscriptionUtils';

export const EditCollegeModal = ({ isOpen, onClose, college, onSave, onDelete, isFullPage = false }) => {
  const { uploadCollegeLogo = async () => ({ success: false }), activeColleges = [] } = useColleges() || {};

  const [formData, setFormData] = useState({
    collegeName: '',
    collegeCode: '',
    collegeLogoUrl: '',
    collegeDescription: '',
    logoBg: 'from-emerald-600 to-teal-700',
    address: '',
    city: '',
    district: '',
    state: '',
    pinCode: '',
    universityAffiliation: '',
    pciApprovalNo: '',
    principalName: '',
    principalMobile: '',
    principalEmail: '',
    adminPassword: '',
    confirmAdminPassword: '',
    subscriptionPlan: 'Professional',
    subscriptionStartDate: new Date().toISOString().split('T')[0],
    subscriptionExpiryDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
    maxStudentsAllowed: 300,
    subscriptionStatus: 'Active'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const collegeId = college?.id || college?.collegeId || college?.code;

  useEffect(() => {
    if (college) {
      const email = college.principalEmail || college.principal_email || college.email || '';
      const planMeta = getPlanDetails(college.subscriptionPlan || 'Professional');

      setFormData({
        collegeName: college.name || college.collegeName || college.college_name || '',
        collegeCode: college.code || college.collegeCode || college.college_code || '',
        collegeLogoUrl: college.logoUrl || college.college_logo_url || '',
        collegeDescription: college.description || college.college_description || '',
        logoBg: college.logoBg || college.college_logo || 'from-emerald-600 to-teal-700',
        address: college.address || '',
        city: college.city || '',
        district: college.district || '',
        state: college.state || '',
        pinCode: college.pinCode || college.pincode || '',
        universityAffiliation: college.universityAffiliation || college.university_affiliation || '',
        pciApprovalNo: college.pciApprovalNo || college.pci_approval_number || '',
        principalName: college.principalName || college.principal_name || college.contactName || college.contact_person || '',
        principalMobile: college.principalMobile || college.principal_mobile || college.mobileNumber || college.mobile_number || '',
        principalEmail: email,
        adminPassword: '',
        confirmAdminPassword: '',
        subscriptionPlan: planMeta.id,
        subscriptionStartDate: college.subscriptionStartDate || new Date().toISOString().split('T')[0],
        subscriptionExpiryDate: college.subscriptionExpiryDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
        maxStudentsAllowed: planMeta.maxStudents,
        subscriptionStatus: college.subscriptionStatus || 'Active'
      });
      setValidationError('');
    }
  }, [collegeId]);

  if (!isOpen && !isFullPage) return null;
  if (!college && !isFullPage) return null;

  const currentStudentsCount = college?.currentStudentsCount || 0;
  const activePlanMeta = getPlanDetails(formData.subscriptionPlan);
  const maxCapacity = activePlanMeta.maxStudents;
  const availableSeats = Math.max(0, maxCapacity - currentStudentsCount);
  const isDowngradeExceeded = currentStudentsCount > maxCapacity;
  const daysRemaining = calculateDaysRemaining(formData.subscriptionExpiryDate);
  const liveStatusDetails = getSubscriptionStatusDetails(formData.subscriptionExpiryDate, formData.subscriptionStatus);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'subscriptionPlan') {
      const planMeta = getPlanDetails(value);
      setFormData(prev => ({
        ...prev,
        subscriptionPlan: planMeta.id,
        maxStudentsAllowed: planMeta.maxStudents
      }));
      setValidationError('');
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationError('');
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, WEBP, or SVG).');
      return;
    }

    setUploadingLogo(true);
    setLogoUploadSuccess(false);

    try {
      const res = await uploadCollegeLogo(file);
      setUploadingLogo(false);

      if (res.success && res.url) {
        setFormData(prev => ({ ...prev, collegeLogoUrl: res.url }));
        setLogoUploadSuccess(true);
        setTimeout(() => setLogoUploadSuccess(false), 2500);
      } else {
        alert('Failed to upload logo image. Please try again.');
      }
    } catch (err) {
      setUploadingLogo(false);
      console.error('Logo upload error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setErrors({});

    if (isDowngradeExceeded) {
      setValidationError(`❌ Cannot downgrade plan: Current student count (${currentStudentsCount}) exceeds the selected plan capacity (${maxCapacity}). Please reduce registered students or select a higher capacity plan.`);
      return;
    }

    const errorsList = {};

    // 1. Field validation
    if (!formData.collegeName || !formData.collegeName.trim()) {
      errorsList.collegeName = '❌ This field is required.';
    }
    if (!formData.collegeCode || !formData.collegeCode.trim()) {
      errorsList.collegeCode = '❌ This field is required.';
    }
    if (!formData.city || !formData.city.trim()) {
      errorsList.city = '❌ This field is required.';
    }
    if (!formData.state || !formData.state.trim()) {
      errorsList.state = '❌ This field is required.';
    }
    if (!formData.principalName || !formData.principalName.trim()) {
      errorsList.principalName = '❌ This field is required.';
    }
    if (!formData.principalMobile || !formData.principalMobile.trim()) {
      errorsList.principalMobile = '❌ This field is required.';
    }

    // Email validation
    if (!formData.principalEmail || !formData.principalEmail.trim()) {
      errorsList.principalEmail = '❌ This field is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.principalEmail.trim())) {
        errorsList.principalEmail = '❌ Please enter a valid email address.';
      } else {
        // Unique Check - ONLY run if the email field was modified!
        const originalEmail = college.principalEmail || college.principal_email || college.email || '';
        if (formData.principalEmail.trim().toLowerCase() !== originalEmail.trim().toLowerCase()) {
          const existing = activeColleges.find(
            c => c.id !== college?.id && (
              c.adminUsername?.toLowerCase() === formData.principalEmail.trim().toLowerCase() || 
              c.principalEmail?.toLowerCase() === formData.principalEmail.trim().toLowerCase() || 
              c.college_admin_username?.toLowerCase() === formData.principalEmail.trim().toLowerCase()
            )
          );
          if (existing) {
            errorsList.principalEmail = `❌ User ID is already assigned to another college (${existing.name}).`;
          }
        }
      }
    }

    // Password validation - only run if user typed a password
    if (formData.adminPassword || formData.confirmAdminPassword) {
      if (formData.adminPassword.length < 8) {
        errorsList.adminPassword = '❌ Password must contain at least 8 characters.';
      }
      if (formData.adminPassword !== formData.confirmAdminPassword) {
        errorsList.confirmAdminPassword = '❌ Passwords do not match.';
      }
    }

    // If there are validation errors, set state, auto scroll & focus, and return
    if (Object.keys(errorsList).length > 0) {
      setErrors(errorsList);
      
      // Auto Scroll & Focus to first error
      const firstErrorField = Object.keys(errorsList)[0];
      setTimeout(() => {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }, 50);
      return;
    }

    // 2. Modified fields save check
    // We only save modified fields. Unchanged fields are not validated or sent unnecessarily.
    // Also merge unchanged fields to prevent overwriting with null/blank values.
    const finalData = { ...formData };
    
    // Fill unchanged fields from college object if they are missing or empty
    const checkAndRestore = (key, val, originalVal) => {
      if (val === undefined || val === null || val === '') {
        finalData[key] = originalVal || '';
      }
    };

    checkAndRestore('collegeName', formData.collegeName, college.name || college.collegeName || college.college_name);
    checkAndRestore('collegeCode', formData.collegeCode, college.code || college.collegeCode || college.college_code);
    checkAndRestore('collegeLogoUrl', formData.collegeLogoUrl, college.logoUrl || college.college_logo_url);
    checkAndRestore('collegeDescription', formData.collegeDescription, college.description || college.college_description);
    checkAndRestore('logoBg', formData.logoBg, college.logoBg || college.college_logo);
    checkAndRestore('address', formData.address, college.address);
    checkAndRestore('city', formData.city, college.city);
    checkAndRestore('district', formData.district, college.district);
    checkAndRestore('state', formData.state, college.state);
    checkAndRestore('pinCode', formData.pinCode, college.pinCode || college.pincode);
    checkAndRestore('universityAffiliation', formData.universityAffiliation, college.universityAffiliation || college.university_affiliation);
    checkAndRestore('pciApprovalNo', formData.pciApprovalNo, college.pciApprovalNo || college.pci_approval_number);
    checkAndRestore('principalName', formData.principalName, college.principalName || college.principal_name || college.contactName || college.contact_person);
    checkAndRestore('principalMobile', formData.principalMobile, college.principalMobile || college.principal_mobile || college.mobileNumber || college.mobile_number);
    checkAndRestore('principalEmail', formData.principalEmail, college.principalEmail || college.principal_email || college.email);

    setSaving(true);
    try {
      const res = await onSave(college ? college.id : null, finalData);
      setSaving(false);

      if (res && res.error) {
        // Unexpected system-level error banner
        setValidationError(`❌ Unable to save changes. Please try again later. Details: ${res.error}`);
      } else {
        // Determine whether a password was updated
        const passwordUpdated = Boolean(formData.adminPassword);
        
        // Show success toast notification
        if (passwordUpdated) {
          setToastMessage('✅ College Admin password updated successfully.');
        } else {
          setToastMessage('✅ College Profile updated successfully.');
        }

        // Reset password fields and validation messages
        setFormData(prev => ({
          ...prev,
          adminPassword: '',
          confirmAdminPassword: ''
        }));
        setErrors({});

        setSavedSuccess(true);
        setTimeout(() => {
          setToastMessage('');
          setSavedSuccess(false);
          // Do NOT call onClose() here to keep the user on the same page.
        }, 4000);
      }
    } catch (err) {
      setSaving(false);
      setValidationError('❌ Unable to save changes. Please try again later.');
    }
  };

  const handleDeleteConfirm = () => {
    if (onDelete && college) {
      onDelete(college.id);
      setShowDeleteConfirm(false);
      if (onClose) onClose();
    }
  };

  const logoPresetGradients = [
    { label: "Emerald Teal", value: "from-emerald-600 to-teal-700" },
    { label: "Ocean Cyan", value: "from-cyan-600 to-blue-700" },
    { label: "Indigo Sky", value: "from-blue-600 to-indigo-700" },
    { label: "Deep Purple", value: "from-purple-600 to-indigo-800" }
  ];

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* VALIDATION ERROR BANNER */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}
      
      {/* SECTION 1: COLLEGE BRANDING */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          College Identity & Logos
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Logo Upload & Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              College Logo (JPG / PNG / SVG)
            </label>

            <div className="flex items-start gap-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60">
              <div className="relative shrink-0">
                {formData.collegeLogoUrl ? (
                  <img
                    src={formData.collegeLogoUrl}
                    alt="College Logo Preview"
                    className="w-16 h-16 rounded-xl object-contain bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 shadow-sm"
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${formData.logoBg} flex items-center justify-center text-white font-extrabold text-sm shadow-sm border border-white/20`}>
                    {formData.collegeName ? formData.collegeName.substring(0, 4).toUpperCase() : 'LOGO'}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs">
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Logo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formData.collegeLogoUrl ? 'Change Logo Image' : 'Upload Logo Image'}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml,image/webp"
                    disabled={uploadingLogo}
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                </label>

                {logoUploadSuccess && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Logo uploaded successfully!
                  </span>
                )}

                {formData.collegeLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, collegeLogoUrl: '' }))}
                    className="block text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                  >
                    Remove uploaded logo (Use placeholder)
                  </button>
                )}

                <p className="text-[10px] text-slate-400">Recommended size: 200x200px or SVG vector</p>
              </div>
            </div>
          </div>

          {/* College Description Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                College Description (Max 500 characters)
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {formData.collegeDescription.length}/500
              </span>
            </div>

            <textarea
              name="collegeDescription"
              rows={4}
              maxLength={500}
              value={formData.collegeDescription}
              onChange={handleChange}
              placeholder="e.g. Established in 2007, A.M.Reddy Memorial College of Pharmacy is committed to excellence in pharmacy education, clinical training, research, and patient care."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none leading-relaxed"
            />
          </div>

        </div>
      </div>

      {/* SECTION 2: BASIC INFORMATION */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Basic Information
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
              placeholder="Enter college name"
              className={`w-full h-[46px] px-3.5 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all ${
                errors.collegeName 
                  ? 'border-rose-500 ring-2 ring-rose-500/10 focus:ring-rose-500/50' 
                  : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/50'
              }`}
            />
            {errors.collegeName && (
              <p className="text-[11px] text-rose-600 mt-1 font-semibold pl-1">
                {errors.collegeName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              College Code *
            </label>
            <input
              type="text"
              name="collegeCode"
              required
              value={formData.collegeCode}
              onChange={handleChange}
              placeholder="Enter college code"
              className={`w-full h-[46px] px-3.5 text-xs font-mono rounded-xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all ${
                errors.collegeCode 
                  ? 'border-rose-500 ring-2 ring-rose-500/10 focus:ring-rose-500/50' 
                  : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/50'
              }`}
            />
            {errors.collegeCode && (
              <p className="text-[11px] text-rose-600 mt-1 font-semibold pl-1">
                {errors.collegeCode}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Fallback Placeholder Theme Gradient
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {logoPresetGradients.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, logoBg: preset.value }))}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  formData.logoBg === preset.value
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${preset.value}`} />
                <span className="text-[11px] text-slate-700 dark:text-slate-300">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: LOCATION DETAILS */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Location Details
        </h4>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Campus Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter campus address"
            className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              City *
            </label>
            <input
              type="text"
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city"
              className={`w-full h-[46px] px-3.5 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all ${
                errors.city 
                  ? 'border-rose-500 ring-2 ring-rose-500/10 focus:ring-rose-500/50' 
                  : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/50'
              }`}
            />
            {errors.city && (
              <p className="text-[11px] text-rose-600 mt-1 font-semibold pl-1">
                {errors.city}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              District
            </label>
            <input
              type="text"
              name="district"
              value={formData.district}
              onChange={handleChange}
              placeholder="Enter district"
              className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              State *
            </label>
            <input
              type="text"
              name="state"
              required
              value={formData.state}
              onChange={handleChange}
              placeholder="Enter state"
              className={`w-full h-[46px] px-3.5 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all ${
                errors.state 
                  ? 'border-rose-500 ring-2 ring-rose-500/10 focus:ring-rose-500/50' 
                  : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/50'
              }`}
            />
            {errors.state && (
              <p className="text-[11px] text-rose-600 mt-1 font-semibold pl-1">
                {errors.state}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              PIN Code
            </label>
            <input
              type="text"
              name="pinCode"
              value={formData.pinCode}
              onChange={handleChange}
              placeholder="Enter PIN code"
              className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: PRINCIPAL INFORMATION */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Principal / Dean Information
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              placeholder="Enter principal name"
              className={`w-full h-[46px] px-3.5 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all ${
                errors.principalName 
                  ? 'border-rose-500 ring-2 ring-rose-500/10 focus:ring-rose-500/50' 
                  : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/50'
              }`}
            />
            {errors.principalName && (
              <p className="text-[11px] text-rose-600 mt-1 font-semibold pl-1">
                {errors.principalName}
              </p>
            )}
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
              placeholder="Enter mobile number"
              className={`w-full h-[46px] px-3.5 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all ${
                errors.principalMobile 
                  ? 'border-rose-500 ring-2 ring-rose-500/10 focus:ring-rose-500/50' 
                  : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/50'
              }`}
            />
            {errors.principalMobile && (
              <p className="text-[11px] text-rose-600 mt-1 font-semibold pl-1">
                {errors.principalMobile}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address * (Used as User ID)
            </label>
            <input
              type="email"
              name="principalEmail"
              required
              value={formData.principalEmail}
              onChange={handleChange}
              placeholder="e.g. principal@amrcp.edu.in"
              className={`w-full h-[46px] px-3.5 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all ${
                errors.principalEmail 
                  ? 'border-rose-500 ring-2 ring-rose-500/10 focus:ring-rose-500/50' 
                  : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/50'
              }`}
            />
            {errors.principalEmail && (
              <p className="text-[11px] text-rose-600 mt-1 font-semibold pl-1">
                {errors.principalEmail}
              </p>
            )}
          </div>
        </div>

        {/* SECTION 4.5: COLLEGE ADMIN LOGIN CREDENTIALS (NEW MANDATORY SECTION) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
              College Admin Login Credentials
            </h5>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/60 space-y-4">
            
            {/* User ID (Read-Only, Auto-Synced from Principal Email) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                User ID (Read Only • Auto-populated from Principal Email)
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={formData.principalEmail}
                  placeholder="Populates automatically from Principal Email"
                  className="w-full h-[46px] px-3.5 text-xs font-mono rounded-xl border border-indigo-200 dark:border-indigo-900/80 bg-white/80 dark:bg-slate-900/80 text-indigo-950 dark:text-indigo-200 font-bold cursor-not-allowed"
                />
                <Lock className="w-3.5 h-3.5 text-indigo-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Whenever the Principal Email Address above changes, this User ID updates automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Admin Password * (Min 8 chars)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="adminPassword"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    placeholder="Enter admin password (min 8 chars)"
                    className={`w-full h-[46px] pl-3.5 pr-10 text-xs font-mono rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all ${
                      errors.adminPassword 
                        ? 'border-rose-500 ring-2 ring-rose-500/10 focus:ring-rose-500/50' 
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
                {errors.adminPassword && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold pl-1">
                    {errors.adminPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmAdminPassword"
                    value={formData.confirmAdminPassword}
                    onChange={handleChange}
                    placeholder="Confirm admin password"
                    className={`w-full h-[46px] pl-3.5 pr-10 text-xs font-mono rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all ${
                      errors.confirmAdminPassword 
                        ? 'border-rose-500 ring-2 ring-rose-500/10 focus:ring-rose-500/50' 
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
                {errors.confirmAdminPassword && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold pl-1">
                    {errors.confirmAdminPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Password strength tips */}
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              🔒 Password will be securely hashed with SHA-256 before saving to database. Plain-text passwords are never stored.
            </p>

          </div>
        </div>
      </div>

      {/* SECTION 5: ACADEMIC INFORMATION */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Academic Information
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              University Affiliation
            </label>
            <input
              type="text"
              name="universityAffiliation"
              value={formData.universityAffiliation}
              onChange={handleChange}
              placeholder="Enter university affiliation"
              className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              PCI Approval Number
            </label>
            <input
              type="text"
              name="pciApprovalNo"
              value={formData.pciApprovalNo}
              onChange={handleChange}
              placeholder="Enter PCI approval number"
              className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 6: SUBSCRIPTION PLAN SECTION */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20 border border-emerald-300/60 dark:border-emerald-800/80 shadow-xs space-y-4">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2 pb-2 border-b border-emerald-200/60 dark:border-emerald-800/60">
          <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Subscription Plan Section
        </h4>

        {/* Downgrade Conflict Warning Banner */}
        {isDowngradeExceeded && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>PLAN CAPACITY CONFLICT WARNING</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              <strong>CURRENT STUDENTS:</strong> {currentStudentsCount} &nbsp;|&nbsp; <strong>SELECTED PLAN:</strong> {activePlanMeta.name} ({maxCapacity} Capacity)
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
              ⚠️ This college currently has {currentStudentsCount} registered students, which exceeds the selected plan capacity of {maxCapacity} students. Plan downgrade cannot be finalized until student count is resolved.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subscription Plan *
            </label>
            <select
              name="subscriptionPlan"
              value={formData.subscriptionPlan}
              onChange={handleChange}
              className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-semibold"
            >
              {Object.values(SUBSCRIPTION_PLANS).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Maximum Students Allowed (Read Only)
            </label>
            <div className="relative">
              <input
                type="number"
                name="maxStudentsAllowed"
                readOnly
                disabled
                value={formData.maxStudentsAllowed}
                className="w-full h-[46px] px-3.5 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-900/80 bg-emerald-50/50 dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 cursor-not-allowed"
              />
              <Lock className="w-3.5 h-3.5 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Automatically determined by selected Subscription Plan.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subscription Start Date *
            </label>
            <input
              type="date"
              name="subscriptionStartDate"
              required
              value={formData.subscriptionStartDate}
              onChange={handleChange}
              className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subscription Expiry Date *
            </label>
            <input
              type="date"
              name="subscriptionExpiryDate"
              required
              value={formData.subscriptionExpiryDate}
              onChange={handleChange}
              className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subscription Status *
            </label>
            <select
              name="subscriptionStatus"
              value={formData.subscriptionStatus}
              onChange={handleChange}
              className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-bold text-emerald-600 dark:text-emerald-400"
            >
              <option value="Active">Active (Live on Landing Page)</option>
              <option value="Inactive">Inactive (Suspended)</option>
            </select>
          </div>
        </div>

        {/* LIVE SUBSCRIPTION SUMMARY BOX */}
        <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Live Subscription Summary
            </h5>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${liveStatusDetails.badgeClass}`}>
              {liveStatusDetails.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] text-slate-400 font-semibold">PLAN</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">{activePlanMeta.shortName}</strong>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] text-slate-400 font-semibold">STUDENT USAGE</span>
              <strong className="text-slate-800 dark:text-slate-200 font-extrabold text-xs">{currentStudentsCount} / {maxCapacity}</strong>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] text-slate-400 font-semibold">AVAILABLE SEATS</span>
              <strong className="text-teal-600 dark:text-teal-400 font-extrabold text-xs">{availableSeats} Seats Available</strong>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] text-slate-400 font-semibold">TIME REMAINING</span>
              <strong className="text-slate-700 dark:text-slate-300 font-extrabold text-xs">{daysRemaining < 0 ? 'Expired' : `${daysRemaining} Days`}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <div><strong>START DATE:</strong> {formatSubscriptionDate(formData.subscriptionStartDate)}</div>
            <div><strong>EXPIRY DATE:</strong> {formatSubscriptionDate(formData.subscriptionExpiryDate)}</div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS: Delete, Cancel, Save */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 dark:border-slate-800">
        
        {/* Delete College Button */}
        {onDelete && college ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-[48px] px-4 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete College</span>
          </button>
        ) : <div />}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-[48px] px-6 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="h-[48px] px-7 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <ModalWrapper
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete College"
          subtitle={`Are you sure you want to delete ${formData.collegeName}?`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div>
                <strong className="block font-bold mb-1">Permanent Action</strong>
                This action will permanently delete the college profile, portal access, and subscription details from the system.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

    </form>
  );

  if (isFullPage) {
    return (
      <>
        {formContent}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 animate-slideIn">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div className="text-xs font-bold pr-2">{toastMessage}</div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <ModalWrapper
        isOpen={isOpen}
        onClose={onClose}
        title="Edit College Profile"
        subtitle={`Update details & Subscription Plan for ${college?.name || 'College'}`}
        maxWidth="max-w-4xl"
      >
        {formContent}
      </ModalWrapper>
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 animate-slideIn">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            ✓
          </div>
          <div className="text-xs font-bold pr-2">{toastMessage}</div>
        </div>
      )}
    </>
  );
};

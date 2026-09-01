import React, { useState } from 'react';
import { UserCheck, Phone, Mail, GraduationCap, Calendar, BookOpen, KeyRound, Eye, EyeOff, Upload, Trash2, Save, RotateCcw, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { insertStudentToSupabase, uploadProfilePhotoToSupabaseStorage } from '../../services/supabaseService';

export const AddStudentView = ({ college, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    rollNumber: '',
    fullName: '',
    gender: 'Male',
    mobileNumber: '',
    email: '',
    batch: 'Y26',
    course: 'Pharm.D',
    academicYear: '2026–2027',
    year: '1st Year',
    semester: '',
    password: '',
    confirmPassword: '',
    profilePhotoUrl: '',
    status: 'Active'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const username = formData.rollNumber ? formData.rollNumber.trim() : '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoUploadError('');

    if (file.size > 100 * 1024) {
      setPhotoUploadError('File size exceeds 100 KB limit. Please choose a smaller photo.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setPhotoUploadError('Invalid format. Only JPG, JPEG, and PNG images are allowed.');
      return;
    }

    setUploadingPhoto(true);
    const res = await uploadProfilePhotoToSupabaseStorage(file, 'students');
    setUploadingPhoto(false);

    if (res.success && res.url) {
      setFormData(prev => ({ ...prev, profilePhotoUrl: res.url }));
    } else {
      setPhotoUploadError(res.error || 'Failed to upload photo.');
    }
  };

  const handleDeletePhoto = () => {
    setFormData(prev => ({ ...prev, profilePhotoUrl: '' }));
    setPhotoUploadError('');
  };

  const handleReset = () => {
    setFormData({
      rollNumber: '',
      fullName: '',
      gender: 'Male',
      mobileNumber: '',
      email: '',
      batch: 'Y26',
      course: 'Pharm.D',
      academicYear: '2026–2027',
      year: '1st Year',
      semester: '',
      password: '',
      confirmPassword: '',
      profilePhotoUrl: '',
      status: 'Active'
    });
    setFormError('');
    setPhotoUploadError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.rollNumber.trim() || !formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError('Please fill in all mandatory fields marked with *');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Password and Confirm Password do not match.');
      return;
    }

    setSaving(true);
    const res = await insertStudentToSupabase(college.id, formData);
    setSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onSuccess) onSuccess();
      }, 1000);
    } else {
      setFormError(res.error || 'Failed to save student to database.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Add New {formData.course} Student</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enroll {formData.course} candidate for <strong className="text-slate-800 dark:text-slate-200">{college?.name}</strong>.
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

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Student enrolled successfully! Redirecting to Student List...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* TOP LAYOUT: Left Form Sections + Right Profile Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 8 COLS: PERSONAL & ACADEMIC INFO */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* SECTION 1: PERSONAL INFORMATION */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Roll Number * (Used as Username)
                  </label>
                  <input
                    type="text"
                    name="rollNumber"
                    required
                    value={formData.rollNumber}
                    onChange={handleChange}
                    placeholder="Enter roll number"
                    className="w-full h-[46px] px-3.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-medium"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="Enter mobile number"
                    className="w-full h-[46px] px-3.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: ACADEMIC INFORMATION */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Academic Information
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Batch *
                  </label>
                  <select
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    className="w-full h-[46px] px-3.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-bold"
                  >
                    <option value="Y22">Y22</option>
                    <option value="Y23">Y23</option>
                    <option value="Y24">Y24</option>
                    <option value="Y25">Y25</option>
                    <option value="Y26">Y26</option>
                    <option value="Y27">Y27</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Course *
                  </label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={(e) => {
                      const newCourse = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        course: newCourse,
                        year: '1st Year',
                        semester: newCourse === 'B.Pharm' ? 'Sem 1' : ''
                      }));
                      setFormError('');
                    }}
                    className="w-full h-[46px] px-3.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                  >
                    <option value="Pharm.D">Pharm.D (6-Year)</option>
                    <option value="B.Pharm">B.Pharm (4-Year)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Academic Year *
                  </label>
                  <select
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-medium"
                  >
                    <option value="2026–2027">2026–2027</option>
                    <option value="2025–2026">2025–2026</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Year *
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-semibold text-emerald-600 dark:text-emerald-400"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    {formData.course === 'Pharm.D' && <option value="5th Year">5th Year</option>}
                    {formData.course === 'Pharm.D' && <option value="6th Year">6th Year (Internship)</option>}
                  </select>
                </div>

                {/* Semester dropdown — only for B.Pharm */}
                {formData.course === 'B.Pharm' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Semester *
                    </label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleChange}
                      className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-semibold text-indigo-600 dark:text-indigo-400"
                    >
                      <option value="Sem 1">Sem 1</option>
                      <option value="Sem 2">Sem 2</option>
                      <option value="Sem 3">Sem 3</option>
                      <option value="Sem 4">Sem 4</option>
                      <option value="Sem 5">Sem 5</option>
                      <option value="Sem 6">Sem 6</option>
                      <option value="Sem 7">Sem 7</option>
                      <option value="Sem 8">Sem 8</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT 4 COLS: PROFILE PHOTO UPLOAD CARD & STATUS */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* PROFILE PHOTO CARD */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 text-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Profile Photo Card
              </h3>

              <div className="relative w-28 h-28 mx-auto">
                {formData.profilePhotoUrl ? (
                  <img
                    src={formData.profilePhotoUrl}
                    alt="Student Preview"
                    className="w-28 h-28 rounded-3xl object-cover border-2 border-emerald-500 shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                    <GraduationCap className="w-10 h-10 stroke-[1.5]" />
                    <span className="text-[10px] font-semibold mt-1">No Photo</span>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-400 space-y-0.5">
                <p className="font-semibold text-slate-600 dark:text-slate-300">Max File Size: 100 KB</p>
                <p>Allowed Formats: JPG, JPEG, PNG</p>
              </div>

              {photoUploadError && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/60 p-2 rounded-xl border border-rose-200 dark:border-rose-900">
                  {photoUploadError}
                </p>
              )}

              <div className="space-y-2 pt-1">
                <label className="w-full h-[40px] px-3 rounded-xl bg-slate-900 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs">
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    disabled={uploadingPhoto}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {formData.profilePhotoUrl && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="w-full h-[38px] px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* STATUS DROPDOWN */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Account Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-bold text-emerald-600 dark:text-emerald-400"
              >
                <option value="Active">Active (Can Access Student Logbook)</option>
                <option value="Inactive">Inactive (Access Suspended)</option>
              </select>
            </div>

          </div>

        </div>

        {/* SECTION 3: LOGIN CREDENTIALS */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/40 dark:from-indigo-950/20 dark:via-slate-900 dark:to-sky-950/20 border border-indigo-200/80 dark:border-indigo-900/80 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-2 pb-2 border-b border-indigo-200/60 dark:border-indigo-900/60">
            <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Student Login Credentials
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username (Read Only • Auto-populated)
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={username}
                placeholder="Populates from Roll Number"
                className="w-full h-[46px] px-3.5 text-xs font-mono rounded-xl border border-indigo-200 dark:border-indigo-900/80 bg-white/80 dark:bg-slate-900/80 text-indigo-950 dark:text-indigo-200 font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password * (Min 8 chars)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter student password"
                  className="w-full h-[46px] pl-3.5 pr-10 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className="w-full h-[46px] pl-3.5 pr-10 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM FORM ACTIONS */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="h-[48px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Form</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="h-[48px] px-6 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-[48px] px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Student...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Student</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

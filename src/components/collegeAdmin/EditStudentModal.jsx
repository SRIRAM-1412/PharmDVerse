import React, { useState, useEffect } from 'react';
import { UserCheck, Phone, Mail, GraduationCap, Calendar, BookOpen, Upload, Trash2, Save, X, Loader2, AlertTriangle } from 'lucide-react';
import { ModalWrapper } from '../modals/ModalWrapper';
import { updateStudentInSupabase, uploadProfilePhotoToSupabaseStorage } from '../../services/supabaseService';

export const EditStudentModal = ({ isOpen, onClose, student, onSuccess }) => {
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
    profilePhotoUrl: '',
    status: 'Active'
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        rollNumber: student.roll_number || '',
        fullName: student.full_name || '',
        gender: student.gender || 'Male',
        mobileNumber: student.mobile_number || '',
        email: student.email || '',
        batch: student.batch || 'Y26',
        course: student.course || 'Pharm.D',
        academicYear: student.academic_year || '2026–2027',
        year: student.year || '1st Year',
        semester: student.semester || '',
        profilePhotoUrl: student.profile_photo_url || '',
        status: student.status || 'Active'
      });
      setFormError('');
      setPhotoUploadError('');
    }
  }, [student]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.rollNumber.trim() || !formData.fullName.trim() || !formData.email.trim()) {
      setFormError('Please fill in all mandatory fields marked with *');
      return;
    }

    setSaving(true);
    const res = await updateStudentInSupabase(student.id, formData);
    setSaving(false);

    if (res.success) {
      if (onSuccess) onSuccess(res.data);
      onClose();
    } else {
      setFormError(res.error || 'Failed to update student profile.');
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Pharm.D Student Profile"
      subtitle={`Update details for ${student?.full_name || 'Student'}`}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {formError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="font-semibold">{formError}</span>
          </div>
        )}

        {/* PHOTO UPLOAD */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
          {formData.profilePhotoUrl ? (
            <img
              src={formData.profilePhotoUrl}
              alt="Student Preview"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-extrabold text-xl shadow-sm shrink-0">
              {formData.fullName ? formData.fullName.substring(0, 2).toUpperCase() : 'ST'}
            </div>
          )}

          <div className="flex-1 space-y-1 text-center sm:text-left">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Profile Photo (Optional)
            </label>
            <p className="text-[10px] text-slate-400">
              JPG, JPEG, or PNG formats only. Max file size: 100 KB.
            </p>
            {photoUploadError && (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">{photoUploadError}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1.5 transition-colors">
              {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" /> : <Upload className="w-3.5 h-3.5 text-slate-500" />}
              <span>{uploadingPhoto ? 'Uploading...' : 'Change Photo'}</span>
              <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
            </label>

            {formData.profilePhotoUrl && (
              <button
                type="button"
                onClick={handleDeletePhoto}
                className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                title="Remove Photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* BASIC & ACADEMIC DETAILS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Roll Number (Username) *
            </label>
            <input
              type="text"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              placeholder="e.g. 21PHD001"
              className="w-full h-10 px-3 font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. K. Ananya Reddy"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Gender *
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Mobile Number
            </label>
            <input
              type="text"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              className="w-full h-10 px-3 font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. student@college.edu"
              className="w-full h-10 px-3 font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Batch *
            </label>
            <input
              type="text"
              name="batch"
              value={formData.batch}
              onChange={handleChange}
              placeholder="e.g. Y26"
              className="w-full h-10 px-3 font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
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
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Pharm.D">Pharm.D (6-Year)</option>
              <option value="B.Pharm">B.Pharm (4-Year)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Academic Year *
            </label>
            <select
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="2026–2027">2026–2027</option>
              <option value="2025–2026">2025–2026</option>
              <option value="2024–2025">2024–2025</option>
              <option value="2023–2024">2023–2024</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Year of Study *
            </label>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              {formData.course === 'Pharm.D' && <option value="5th Year">5th Year</option>}
              {formData.course === 'Pharm.D' && <option value="Internship (6th Year)">Internship (6th Year)</option>}
            </select>
          </div>

          {/* Semester dropdown — only for B.Pharm */}
          {formData.course === 'B.Pharm' && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Semester *
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Account Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Active">Active (Can access Student Portal)</option>
              <option value="Inactive">Inactive (Access Suspended)</option>
            </select>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Updating...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

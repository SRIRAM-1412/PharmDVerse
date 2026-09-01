import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Award, Briefcase, Building2, Upload, Trash2, Save, X, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ModalWrapper } from '../modals/ModalWrapper';
import { updatePreceptorInSupabase, uploadProfilePhotoToSupabaseStorage } from '../../services/supabaseService';

export const EditPreceptorModal = ({ isOpen, onClose, preceptor, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    mobileNumber: '',
    email: '',
    qualification: '',
    designation: '',
    department: '',
    profilePhotoUrl: '',
    status: 'Active'
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preceptor) {
      setFormData({
        fullName: preceptor.full_name || '',
        gender: preceptor.gender || 'Male',
        mobileNumber: preceptor.mobile_number || '',
        email: preceptor.email || '',
        qualification: preceptor.qualification || '',
        designation: preceptor.designation || '',
        department: preceptor.department || '',
        profilePhotoUrl: preceptor.profile_photo_url || '',
        status: preceptor.status || 'Active'
      });
      setFormError('');
      setPhotoUploadError('');
    }
  }, [preceptor]);

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
      setPhotoUploadError('File size exceeds 100 KB limit. Please select a smaller photo.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setPhotoUploadError('Invalid format. Only JPG, JPEG, and PNG images are allowed.');
      return;
    }

    setUploadingPhoto(true);
    const res = await uploadProfilePhotoToSupabaseStorage(file, 'preceptors');
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

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.mobileNumber.trim() || !formData.qualification.trim() || !formData.designation.trim() || !formData.department.trim()) {
      setFormError('Please fill in all mandatory fields marked with *');
      return;
    }

    setSaving(true);
    const res = await updatePreceptorInSupabase(preceptor.id, formData);
    setSaving(false);

    if (res.success) {
      if (onSuccess) onSuccess(res.data);
      onClose();
    } else {
      setFormError(res.error || 'Failed to update preceptor profile.');
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Clinical Preceptor Profile"
      subtitle={`Update details for ${preceptor?.full_name || 'Preceptor'}`}
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
              alt="Preceptor Preview"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-extrabold text-xl shadow-sm shrink-0">
              {formData.fullName ? formData.fullName.substring(0, 2).toUpperCase() : 'PR'}
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

        {/* BASIC & CONTACT DETAILS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Dr. Sahithi Sri"
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
              Mobile Number *
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
              Email Address (User ID) *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. drsahithisri@gmail.com"
              className="w-full h-10 px-3 font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Qualification *
            </label>
            <input
              type="text"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              placeholder="e.g. Pharm.D / M.Pharm (Clinical Pharmacy)"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Designation *
            </label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g. Assistant Professor / Clinical Preceptor"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Department *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
            >
              <option value="" disabled>Select department</option>
              <option value="Pharmacy Practice">Pharmacy Practice</option>
              <option value="Pharmacology">Pharmacology</option>
            </select>
          </div>

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
              <option value="Active">Active (Can access Preceptor Portal)</option>
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

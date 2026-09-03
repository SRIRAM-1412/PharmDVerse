import React, { useState } from 'react';
import { UserCheck, GraduationCap, Calendar, Phone, Mail, ShieldCheck, Camera, Loader2, AlertTriangle } from 'lucide-react';
import { ChangePasswordSection } from '../common/ChangePasswordSection';
import { saveActiveSession, getActiveSession } from '../../services/authService';
import { uploadProfilePhotoToSupabaseStorage, updateStudentInSupabase } from '../../services/supabaseService';

export const StudentProfileView = ({ student, onLogout, forcePasswordReset = false }) => {
  const [studentState, setStudentState] = useState(student);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');

  if (!studentState) return null;

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoError('');
    setPhotoSuccess('');

    if (file.size > 100 * 1024) {
      setPhotoError('Photo size exceeds 100 KB. Please choose a smaller photo.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setPhotoError('Invalid format. Only JPG, JPEG, and PNG images are allowed.');
      return;
    }

    setUploadingPhoto(true);
    const res = await uploadProfilePhotoToSupabaseStorage(file, 'students');

    if (res.success && res.url) {
      const dbRes = await updateStudentInSupabase(studentState.id, { profile_photo_url: res.url });
      setUploadingPhoto(false);

      if (dbRes.success) {
        const updatedStudent = { ...studentState, profile_photo_url: res.url };
        setStudentState(updatedStudent);
        setPhotoSuccess('Profile photo updated successfully!');

        const session = getActiveSession();
        if (session) {
          saveActiveSession({ ...session, user: updatedStudent });
        }
      } else {
        setPhotoError(dbRes.error || 'Failed to save profile photo in database.');
      }
    } else {
      setUploadingPhoto(false);
      setPhotoError(res.error || 'Failed to upload photo to storage.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn w-full min-w-0">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>My Student Profile</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
          Student candidate profile and academic registration details.
        </p>
      </div>

      {/* MAIN PROFILE CARD */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        
        {/* AVATAR & HEADER */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100 dark:border-slate-800 text-center sm:text-left">
          <div className="relative group shrink-0">
            {studentState.profile_photo_url ? (
              <img
                src={studentState.profile_photo_url}
                alt={studentState.full_name}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-emerald-500 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
                {studentState.full_name ? studentState.full_name.substring(0, 2).toUpperCase() : 'ST'}
              </div>
            )}

            <label className="absolute inset-0 bg-slate-900/65 rounded-3xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold gap-1">
              {uploadingPhoto ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>Upload Photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handlePhotoChange}
                disabled={uploadingPhoto}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {studentState?.course || 'Pharmacy'} Candidate
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Roll: {studentState.roll_number}
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {studentState.full_name}
            </h3>

            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {studentState.course} • {studentState.year} • Batch {studentState.batch}
            </p>

            <p className="text-xs text-slate-400 font-mono">
              College: {studentState.colleges?.college_name || 'Pharmacy College'}
            </p>
          </div>
        </div>

        {photoError && (
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{photoError}</span>
          </p>
        )}

        {photoSuccess && (
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            {photoSuccess}
          </p>
        )}

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Roll Number (Username)</span>
            <strong className="text-slate-900 dark:text-white font-mono font-bold">{student.roll_number}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Full Name</span>
            <strong className="text-slate-900 dark:text-white font-bold">{student.full_name}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Gender</span>
            <strong className="text-slate-900 dark:text-white font-bold">{student.gender}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Batch</span>
            <strong className="text-slate-900 dark:text-white font-mono font-bold">{student.batch}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Course</span>
            <strong className="text-slate-900 dark:text-white font-bold">{student.course}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Academic Year</span>
            <strong className="text-slate-900 dark:text-white font-bold">{student.academic_year}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Year of Study</span>
            <strong className="text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400">{student.year}</strong>
          </div>

          {student.course === 'B.Pharm' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-medium text-[11px] block">Current Semester</span>
              <strong className="text-slate-900 dark:text-white font-bold text-sky-600 dark:text-sky-400">{student.semester || '—'}</strong>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] block">Mobile Number</span>
            <strong className="text-slate-900 dark:text-white font-mono font-bold">{student.mobile_number || '—'}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1 sm:col-span-2">
            <span className="text-slate-400 font-medium text-[11px] block">Email Address</span>
            <strong className="text-slate-900 dark:text-white font-mono font-bold">{student.email}</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>🔒 Read-only profile view. To request changes, contact College Admin.</span>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Status: {studentState.status}</span>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          {forcePasswordReset && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-1">Password Reset Required</strong>
                Your college administrator has reset your password. You must set a new secure password before you can access the portal.
              </div>
            </div>
          )}
          <ChangePasswordSection
            user={studentState}
            userType="Student"
            isForceReset={forcePasswordReset}
            onLogout={onLogout}
            onSuccess={(updatedStudent) => {
              setStudentState(updatedStudent);
              saveActiveSession({ viewMode: 'student_portal', college: updatedStudent.colleges || studentState.colleges, user: updatedStudent });
            }}
          />
        </div>

      </div>
    </div>
  );
};

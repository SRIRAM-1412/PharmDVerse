import React, { useState } from 'react';
import { UserCheck, GraduationCap, Calendar, Phone, Mail, ShieldCheck } from 'lucide-react';
import { ChangePasswordSection } from '../common/ChangePasswordSection';
import { saveActiveSession } from '../../services/authService';

export const StudentProfileView = ({ student, onLogout, forcePasswordReset = false }) => {
  const [studentState, setStudentState] = useState(student);
  if (!studentState) return null;

  return (
    <div className="space-y-6 animate-fadeIn w-full min-w-0">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>My Student Profile</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Read-only Pharm.D candidate profile and academic registration details.
        </p>
      </div>

      {/* MAIN PROFILE CARD */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        
        {/* AVATAR & HEADER */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100 dark:border-slate-800 text-center sm:text-left">
          {student.profile_photo_url ? (
            <img
              src={student.profile_photo_url}
              alt={student.full_name}
              className="w-24 h-24 rounded-3xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-md shrink-0">
              {student.full_name ? student.full_name.substring(0, 2).toUpperCase() : 'ST'}
            </div>
          )}

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Pharm.D Candidate
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Roll: {student.roll_number}
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {student.full_name}
            </h3>

            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {student.course} • {student.year} • Batch {student.batch}
            </p>

            <p className="text-xs text-slate-400 font-mono">
              College: {student.colleges?.college_name || 'Pharmacy College'}
            </p>
          </div>
        </div>

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

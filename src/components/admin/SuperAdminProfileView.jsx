import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, User, Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Save, Loader2, Calendar, Clock, ChevronLeft
} from 'lucide-react';
import { 
  fetchSuperAdminProfileFromSupabase, 
  updateSuperAdminProfileInSupabase, 
  changeSuperAdminPasswordInSupabase 
} from '../../services/supabaseService';
import { updateStoredSuperAdminSession, logoutSuperAdmin } from '../../services/authService';
import { usePlatform } from '../../context/PlatformContext';

export const SuperAdminProfileView = ({ admin, onProfileUpdated, onExitToLanding, onBack }) => {
  const { platformSettings } = usePlatform();
  const platformLogoUrl = platformSettings?.logo_url || '/pharmdverse-logo.png';
  const platformName = platformSettings?.platform_name || 'PharmDVerse ERP';
  const adminId = admin?.id;

  // Profile Form State
  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [lastLogin, setLastLogin] = useState(admin?.last_login || null);
  const [createdAt, setCreatedAt] = useState(admin?.created_at || null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotify, setProfileNotify] = useState(null);

  // Security / Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotify, setPasswordNotify] = useState(null);

  // Load fresh profile details from Supabase on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!adminId) return;
      setLoadingProfile(true);
      const res = await fetchSuperAdminProfileFromSupabase(adminId);
      if (res.success && res.data) {
        setName(res.data.name || '');
        setEmail(res.data.email || '');
        setLastLogin(res.data.last_login || null);
        setCreatedAt(res.data.created_at || null);
      }
      setLoadingProfile(false);
    };

    loadProfile();
  }, [adminId]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileNotify(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setProfileNotify({ type: 'error', message: 'Name and Email are required fields.' });
      return;
    }

    setSavingProfile(true);
    const res = await updateSuperAdminProfileInSupabase(adminId, { name: trimmedName, email: trimmedEmail });
    setSavingProfile(false);

    if (res.success) {
      setProfileNotify({ type: 'success', message: '✓ Super Admin profile updated successfully!' });
      // Update local storage session
      updateStoredSuperAdminSession({ name: trimmedName, email: trimmedEmail });
      if (onProfileUpdated) {
        onProfileUpdated({ ...admin, name: trimmedName, email: trimmedEmail });
      }
    } else {
      setProfileNotify({ type: 'error', message: res.error || 'Failed to update profile.' });
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordNotify(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordNotify({ type: 'error', message: 'All password fields are required.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordNotify({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotify({ type: 'error', message: 'New password and confirmation password do not match.' });
      return;
    }

    setSavingPassword(true);
    const res = await changeSuperAdminPasswordInSupabase(adminId, currentPassword, newPassword);
    setSavingPassword(false);

    if (res.success) {
      setPasswordNotify({ 
        type: 'success', 
        message: '✓ Password changed successfully! Signing out to enforce secure re-authentication...' 
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Auto logout after 2 seconds to require secure re-authentication with new password
      setTimeout(async () => {
        await logoutSuperAdmin();
        if (onExitToLanding) {
          onExitToLanding();
        } else {
          window.location.reload();
        }
      }, 2000);
    } else {
      setPasswordNotify({ type: 'error', message: res.error || 'Failed to change password.' });
    }
  };

  return (
    <div className="space-y-6 min-w-0 w-full text-wrap break-words pb-12">
      
      {/* HEADER BANNER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 flex items-center justify-center shrink-0 shadow-md">
            <img
              src={platformLogoUrl}
              alt={`${platformName} Logo`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => { e.target.src = '/pharmdverse-logo.png'; }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                My Profile & Security
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                Global Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your administrator account credentials, email, and password security.
            </p>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 1: PROFILE DETAILS FORM */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Administrator Profile
            </h2>
          </div>

          {profileNotify && (
            <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
              profileNotify.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}>
              {profileNotify.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{profileNotify.message}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Super Admin Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Super Admin Name"
                  disabled={loadingProfile || savingProfile}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pharmdverse.org"
                  disabled={loadingProfile || savingProfile}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Fixed Role Badge */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                System Access Role (Read-Only)
              </label>
              <div className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Global Super Admin</span>
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                  System Restricted
                </span>
              </div>
            </div>

            {/* Account Audit Info */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-[11px]">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Last Login</span>
                <strong className="text-slate-800 dark:text-slate-200 font-semibold block mt-0.5 truncate">
                  {lastLogin ? new Date(lastLogin).toLocaleString() : 'Active Session'}
                </strong>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Account Created</span>
                <strong className="text-slate-800 dark:text-slate-200 font-semibold block mt-0.5 truncate">
                  {createdAt ? new Date(createdAt).toLocaleDateString() : 'System Initialized'}
                </strong>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile || loadingProfile}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 2: PASSWORD & SECURITY FORM */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Password Security
            </h2>
          </div>

          {passwordNotify && (
            <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
              passwordNotify.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}>
              {passwordNotify.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{passwordNotify.message}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={savingPassword}
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                New Password (Minimum 8 Characters)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 8 chars)"
                  disabled={savingPassword}
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={savingPassword}
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Policy Hint */}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              🔒 Passwords are stored using Web Crypto SHA-256 hashing. Changing your password will require re-authenticating your Super Admin session.
            </p>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying & Hashing Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Update Password Credentials</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { authenticateSuperAdmin } from '../../services/authService';
import { checkExistingActiveSessionInSupabase, createActiveSessionInSupabase, invalidateAndCreateNewActiveSessionInSupabase } from '../../services/supabaseService';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { LogoPreviewModal } from './LogoPreviewModal';
import { LoginHeader } from './LoginHeader';
import { SessionConflictModal } from './SessionConflictModal';

export const SuperAdminModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  
  const [loginErrors, setLoginErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Active Session Conflict State
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingSuperAdmin, setPendingSuperAdmin] = useState(null);
  const [conflictLoading, setConflictLoading] = useState(false);

  if (!isOpen) return null;

  const validateLoginForm = () => {
    const errors = {};
    if (!loginEmail.trim()) {
      errors.email = 'Email Address is required.';
    }

    if (!loginPassword.trim()) {
      errors.password = 'Password is required.';
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!validateLoginForm()) return;

    setIsAuthenticating(true);

    const result = await authenticateSuperAdmin(loginEmail, loginPassword);

    if (result.success && result.superAdmin) {
      // Single Active Session Check
      const activeCheck = await checkExistingActiveSessionInSupabase(result.superAdmin.id, 'super_admin');
      setIsAuthenticating(false);

      if (activeCheck.hasActiveSession) {
        setPendingSuperAdmin(result.superAdmin);
        setShowConflictModal(true);
      } else {
        const sessionRes = await createActiveSessionInSupabase(result.superAdmin.id, 'super_admin');
        completeLogin(sessionRes.sessionToken);
      }
    } else {
      setIsAuthenticating(false);
      setAuthError(result.error || 'Invalid email or password.');
    }
  };

  const completeLogin = (token) => {
    setAuthError('');
    setLoginPassword('');
    onClose();
    if (onLoginSuccess) onLoginSuccess(token);
  };

  const handleForceContinue = async () => {
    if (!pendingSuperAdmin) return;
    setConflictLoading(true);
    const sessionRes = await invalidateAndCreateNewActiveSessionInSupabase(pendingSuperAdmin.id, 'super_admin');
    setConflictLoading(false);
    setShowConflictModal(false);

    if (sessionRes.success) {
      completeLogin(sessionRes.sessionToken);
      setPendingSuperAdmin(null);
    } else {
      setAuthError('Failed to establish new session. Please try again.');
    }
  };

  return (
    <>
      <ModalWrapper
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-[480px] w-[90vw] md:w-[480px]"
        rounded="rounded-3xl"
        hideDefaultHeader={true}
        customHeader={
          <LoginHeader
            portalTitle="Super Admin"
            portalSubtitle="Authorized Central Governance Access"
            onClose={onClose}
            isSuperAdmin={true}
          />
        }
      >
        <div className="space-y-4">

          {/* PORTAL LOGIN TITLE & SUBTITLE */}
          <div className="text-center pt-2 pb-1">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Super Admin Portal Login
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
              PharmDVerse Platform Administration Login
            </p>
          </div>

          {/* DIVIDER */}
          <div className="border-t border-slate-100 dark:border-slate-800/60" />

          {/* CENTRAL ENLARGED PHARMDVERSE LOGO */}
          <div className="py-1 flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setShowLogoModal(true)}
              className="relative group p-2 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all cursor-pointer focus:outline-none"
              title="Click to view official logo"
            >
              <img
                src="/pharmdverse-logo.png"
                alt="PharmDVerse Logo"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          </div>

          {/* General Authentication Failure Alert */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-center gap-2 text-center font-semibold animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSignIn} className="space-y-4">
            
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (loginErrors.email) setLoginErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="admin@pharmdverse.com"
                  className={`w-full h-[46px] pl-10 pr-4 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border transition-all focus:outline-none focus:ring-2 ${
                    loginErrors.email
                      ? 'border-rose-400 focus:ring-rose-500/30'
                      : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {loginErrors.email && (
                <p className="mt-1 text-[11px] text-rose-500 font-medium">{loginErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Master Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (loginErrors.password) setLoginErrors((prev) => ({ ...prev, password: null }));
                  }}
                  placeholder="••••••••••••"
                  className={`w-full h-[46px] pl-10 pr-10 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border transition-all focus:outline-none focus:ring-2 ${
                    loginErrors.password
                      ? 'border-rose-400 focus:ring-rose-500/30'
                      : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginErrors.password && (
                <p className="mt-1 text-[11px] text-rose-500 font-medium">{loginErrors.password}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="h-[46px] px-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="flex-1 h-[46px] px-6 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </ModalWrapper>

      {/* ACTIVE SESSION CONFLICT MODAL */}
      <SessionConflictModal
        isOpen={showConflictModal}
        onClose={() => {
          setShowConflictModal(false);
          setPendingSuperAdmin(null);
        }}
        onForceContinue={handleForceContinue}
        userRole="Super Admin"
        userName={pendingSuperAdmin?.name || pendingSuperAdmin?.email}
        isLoading={conflictLoading}
      />

      <LogoPreviewModal isOpen={showLogoModal} onClose={() => setShowLogoModal(false)} />
    </>
  );
};

import React, { useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { usePlatform } from '../../context/PlatformContext';
import { authenticatePreceptorInSupabase, checkExistingActiveSessionInSupabase, createActiveSessionInSupabase, invalidateAndCreateNewActiveSessionInSupabase } from '../../services/supabaseService';
import { Eye, EyeOff, LogIn, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { LogoPreviewModal } from './LogoPreviewModal';
import { LoginHeader } from './LoginHeader';
import { SessionConflictModal } from './SessionConflictModal';

export const PreceptorLoginModal = ({ isOpen, onClose, initialCollege, onLoginSuccess }) => {
  const { platformSettings } = usePlatform();
  const platformLogoUrl = platformSettings?.logo_url || '/pharmdverse-logo.png';
  const platformName = platformSettings?.platform_name || 'PharmDVerse';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [showLogoModal, setShowLogoModal] = useState(false);

  // Active Session Conflict State
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingPreceptor, setPendingPreceptor] = useState(null);
  const [conflictLoading, setConflictLoading] = useState(false);

  const collegeName = initialCollege?.name || initialCollege?.college_name || 'Pharmacy College';

  // Reset fields on modal open to prevent any browser prefilling
  React.useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setFieldErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const errors = {};

    if (!username.trim()) errors.username = 'Email address is required.';
    if (!password.trim()) errors.password = 'Password is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg('Please enter both Email Address and Password.');
      return;
    }
    setFieldErrors({});

    setLoggingIn(true);
    const targetCollegeId = initialCollege?.id || null;
    const res = await authenticatePreceptorInSupabase(username.trim(), password.trim(), targetCollegeId);

    if (res.success && res.preceptor) {
      const activeCheck = await checkExistingActiveSessionInSupabase(res.preceptor.id, 'preceptor');
      setLoggingIn(false);

      if (activeCheck.hasActiveSession) {
        setPendingPreceptor(res.preceptor);
        setShowConflictModal(true);
      } else {
        const sessionRes = await createActiveSessionInSupabase(res.preceptor.id, 'preceptor');
        completeLogin(res.preceptor, sessionRes.sessionToken);
      }
    } else {
      setLoggingIn(false);
      setErrorMsg(res.error || 'Invalid Email or Password.');
    }
  };

  const completeLogin = (preceptorObj, token) => {
    setSuccessMsg('✅ Login successful! Redirecting to Preceptor Portal...');
    setTimeout(() => {
      setSuccessMsg('');
      if (onLoginSuccess) onLoginSuccess(preceptorObj, token);
      if (onClose) onClose();
    }, 800);
  };

  const handleForceContinue = async () => {
    if (!pendingPreceptor) return;
    setConflictLoading(true);
    const sessionRes = await invalidateAndCreateNewActiveSessionInSupabase(pendingPreceptor.id, 'preceptor');
    setConflictLoading(false);
    setShowConflictModal(false);

    if (sessionRes.success) {
      completeLogin(pendingPreceptor, sessionRes.sessionToken);
      setPendingPreceptor(null);
    } else {
      setErrorMsg('Failed to establish new session. Please try again.');
    }
  };

  return (
    <>
      <ModalWrapper
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-md"
        hideDefaultHeader={true}
        customHeader={
          <LoginHeader
            college={initialCollege}
            portalTitle="Preceptor Portal"
            portalSubtitle="Faculty & Evaluator Gateway"
            onClose={onClose}
          />
        }
      >
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">

          {/* PORTAL LOGIN TITLE & SUBTITLE */}
          <div className="text-center pt-2 pb-1">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Preceptor Portal Login
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
              Faculty / Evaluator Login for {collegeName}
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
                src={platformLogoUrl}
                alt={`${platformName} Logo`}
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          </div>
        
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Username (Email Address) *
            </label>
            <input
              type="text"
              id="preceptor_username"
              name="preceptor_username_noautofill"
              autoComplete="off"
              required
              value={username}
              onChange={(e) => { setUsername(e.target.value); setFieldErrors(prev => ({ ...prev, username: '' })); }}
              placeholder="Enter preceptor email address"
              className={`w-full h-[46px] px-3.5 text-xs font-mono rounded-xl border text-slate-900 dark:text-white focus:ring-2 focus:outline-none font-bold transition-all ${
                fieldErrors.username
                  ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-cyan-500/50'
              }`}
            />
            {fieldErrors.username && (
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.username}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="preceptor_password"
                name="preceptor_password_noautofill"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); }}
                placeholder="Enter your password"
                className={`w-full h-[46px] pl-3.5 pr-10 text-xs font-mono rounded-xl border text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all ${
                  fieldErrors.password
                    ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-cyan-500/50'
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
            {fieldErrors.password && (
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>

          {/* ACTION ERROR / SUCCESS NEAR LOGIN BUTTON */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2 shadow-xs animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 shadow-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loggingIn}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-cyan-600/20 disabled:opacity-50 transition-all"
            >
              {loggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Login to Portal</span>
                </>
              )}
            </button>
          </div>

        </form>
      </ModalWrapper>
      <LogoPreviewModal isOpen={showLogoModal} onClose={() => setShowLogoModal(false)} />
      <SessionConflictModal
        isOpen={showConflictModal}
        userRole="preceptor"
        loading={conflictLoading}
        onCancel={() => {
          setShowConflictModal(false);
          setPendingPreceptor(null);
        }}
        onForceContinue={handleForceContinue}
      />
    </>
  );
};

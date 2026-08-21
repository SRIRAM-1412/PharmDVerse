import React, { useState, useEffect } from 'react';
import { 
  Globe, Image, Mail, FileText, Upload, CheckCircle2, AlertCircle, Save, RotateCcw, Loader2, Info, ChevronLeft
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { DEFAULT_PLATFORM_SETTINGS, uploadPlatformAssetToSupabase } from '../../services/platformService';

export const PlatformSettingsManagementView = ({ onBack }) => {
  const { platformSettings, updatePlatformSettings, loadingSettings } = usePlatform();

  const [formState, setFormState] = useState({
    platform_name: platformSettings?.platform_name || DEFAULT_PLATFORM_SETTINGS.platform_name,
    tagline: platformSettings?.tagline || DEFAULT_PLATFORM_SETTINGS.tagline,
    logo_url: platformSettings?.logo_url || DEFAULT_PLATFORM_SETTINGS.logo_url,
    favicon_url: platformSettings?.favicon_url || DEFAULT_PLATFORM_SETTINGS.favicon_url,
    support_email: platformSettings?.support_email || DEFAULT_PLATFORM_SETTINGS.support_email,
    footer_text: platformSettings?.footer_text || DEFAULT_PLATFORM_SETTINGS.footer_text
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [notify, setNotify] = useState(null);

  useEffect(() => {
    if (platformSettings) {
      setFormState({
        platform_name: platformSettings.platform_name || DEFAULT_PLATFORM_SETTINGS.platform_name,
        tagline: platformSettings.tagline || DEFAULT_PLATFORM_SETTINGS.tagline,
        logo_url: platformSettings.logo_url || DEFAULT_PLATFORM_SETTINGS.logo_url,
        favicon_url: platformSettings.favicon_url || DEFAULT_PLATFORM_SETTINGS.favicon_url,
        support_email: platformSettings.support_email || DEFAULT_PLATFORM_SETTINGS.support_email,
        footer_text: platformSettings.footer_text || DEFAULT_PLATFORM_SETTINGS.footer_text
      });
    }
  }, [platformSettings]);

  const handleChange = (field, val) => {
    setFormState(prev => ({ ...prev, [field]: val }));
  };

  // Upload Handlers
  const handleFileUpload = async (file, assetType) => {
    if (!file) return;
    if (assetType === 'logo') setUploadingLogo(true);
    if (assetType === 'favicon') setUploadingFavicon(true);

    const res = await uploadPlatformAssetToSupabase(file, assetType);
    if (assetType === 'logo') setUploadingLogo(false);
    if (assetType === 'favicon') setUploadingFavicon(false);

    if (res.success && res.publicUrl) {
      if (assetType === 'logo') handleChange('logo_url', res.publicUrl);
      if (assetType === 'favicon') handleChange('favicon_url', res.publicUrl);
      setNotify({ type: 'success', message: `✓ ${assetType === 'logo' ? 'Platform logo' : 'Favicon'} uploaded successfully!` });
    } else {
      setNotify({ type: 'error', message: res.error || 'Failed to upload asset image.' });
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotify(null);

    const trimmedName = formState.platform_name.trim();
    if (!trimmedName) {
      setNotify({ type: 'error', message: 'Platform Name is a required field.' });
      return;
    }

    setSavingSettings(true);
    const res = await updatePlatformSettings(formState);
    setSavingSettings(false);

    if (res.success) {
      setNotify({ type: 'success', message: '✓ Global Platform Settings updated and broadcasted across all portals!' });
    } else {
      setNotify({ type: 'error', message: res.error || 'Failed to save platform settings.' });
    }
  };

  // Reset Handler
  const handleResetDefault = () => {
    if (!window.confirm('Reset all platform settings back to default PharmDVerse identity?')) return;
    setFormState(DEFAULT_PLATFORM_SETTINGS);
    setNotify({ type: 'info', message: 'Platform settings reset to defaults. Click "Save Platform Settings" to apply globally.' });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto min-w-0 w-full text-wrap break-words pb-12">
      
      {/* HEADER BANNER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-xl shadow-xs shrink-0">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Platform Identity & Global Settings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                System Super Admin Only
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage platform-level website name, slogan, logo, favicon, and global footer text applied across all public & authenticated portals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          <button
            onClick={handleResetDefault}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* NOTICE BANNER */}
      <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/80 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900 dark:text-blue-200 font-medium leading-relaxed">
          <strong>Institutional Branding Notice:</strong> Platform Settings control global SaaS identity (Landing Page, System Title, Header/Footer, Default Logo). College-specific logos, letterheads, and document templates remain strictly managed under each college's Document Branding workspace.
        </p>
      </div>

      {/* NOTIFICATION ALERT */}
      {notify && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 ${
          notify.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300' :
          notify.type === 'info' ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300' :
          'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300'
        }`}>
          {notify.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />}
          <span>{notify.message}</span>
        </div>
      )}

      {/* MAIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: IDENTITY DETAILS */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Platform Identity & Tagline</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Platform Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Platform Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formState.platform_name}
                onChange={(e) => handleChange('platform_name', e.target.value)}
                placeholder="PharmDVerse ERP"
                disabled={savingSettings}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Support Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Support / Contact Email
              </label>
              <input
                type="email"
                value={formState.support_email}
                onChange={(e) => handleChange('support_email', e.target.value)}
                placeholder="support@pharmdverse.org"
                disabled={savingSettings}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Tagline */}
          <div className="text-xs">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Platform Tagline / Slogan
            </label>
            <input
              type="text"
              value={formState.tagline}
              onChange={(e) => handleChange('tagline', e.target.value)}
              placeholder="India's Premier Clinical Pharmacy Case Analysis & ERP Platform"
              disabled={savingSettings}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Text */}
          <div className="text-xs">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Global Landing Page Footer Copyright Text
            </label>
            <textarea
              rows={2}
              value={formState.footer_text}
              onChange={(e) => handleChange('footer_text', e.target.value)}
              placeholder="© 2026 PharmDVerse. All rights reserved."
              disabled={savingSettings}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* SECTION 2: BRANDING ASSETS (LOGO & FAVICON) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Image className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Platform Logo & Favicon Assets</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PLATFORM LOGO UPLOADER */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Platform Header & Navigation Logo
              </label>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
                  <img
                    src={formState.logo_url}
                    alt="Platform Logo Preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => { e.target.src = '/pharmdverse-logo.png'; }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Logo URL</span>
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate block mt-0.5">
                    {formState.logo_url}
                  </span>
                  <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs">
                    {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                      className="hidden"
                      disabled={uploadingLogo || savingSettings}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* FAVICON UPLOADER */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Browser Tab Favicon Icon (.ico / .png)
              </label>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
                  <img
                    src={formState.favicon_url}
                    alt="Favicon Preview"
                    className="w-8 h-8 object-contain"
                    onError={(e) => { e.target.src = '/pharmdverse-logo.png'; }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Favicon URL</span>
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate block mt-0.5">
                    {formState.favicon_url}
                  </span>
                  <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs">
                    {uploadingFavicon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}</span>
                    <input
                      type="file"
                      accept="image/png,image/x-icon,image/vnd.microsoft.icon"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'favicon')}
                      className="hidden"
                      disabled={uploadingFavicon || savingSettings}
                    />
                  </label>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={savingSettings || loadingSettings}
            className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {savingSettings ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Broadcasting Settings Globally...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Broadcast Platform Settings</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

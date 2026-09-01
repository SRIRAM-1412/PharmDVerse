import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { FileText, Save, RefreshCw, Eye, CheckCircle2, AlertTriangle, Loader2, Sparkles, Sliders, Layout, Building, Presentation, Info, ShieldCheck } from 'lucide-react';
import { 
  fetchBPharmBrandingSettingsFromSupabase, 
  saveBPharmBrandingSettingsInSupabase, 
  fetchCollegeByIdFromSupabase 
} from '../../services/supabaseService';
import { InlineActionNotification } from '../common/InlineActionNotification';
import { useInlineNotification } from '../../hooks/useInlineNotification';
import { ModalWrapper } from '../modals/ModalWrapper';
import { BPharmBrandedDocumentContainer } from '../branding/BPharmBrandedDocumentContainer';

const DEFAULT_SHARED_SETTINGS = {
  show_college_logo: true,
  show_college_name: true,
  show_autonomous: true,
  show_affiliation_logo: true,
  show_affiliation_name: true,
  watermark_enabled: true,
  watermark_text_line1: 'PHARMDVERSE',
  watermark_text_line2: 'Practical Record System',
  watermark_opacity: 10,
  watermark_position: 'Center',
  footer_enabled: true,
  footer_left_text: 'PharmDVerse',
  footer_center_text: 'Confidential Clinical Documentation',
  show_page_number: true,
  show_generated_datetime: true,
  paper_size: 'A4',
  orientation: 'Portrait',
  margin_top: '15mm',
  margin_bottom: '15mm',
  margin_left: '15mm',
  margin_right: '15mm',
  font_family: 'Times New Roman',
  title_font_size: '18px',
  heading_font_size: '14px',
  body_font_size: '12px',
  primary_color: '#0f172a',
  secondary_color: '#0284c7',
  table_header_color: '#f1f5f9',
  border_color: '#0f172a',
  text_color: '#0f172a',
  zebra_striping: false,
  repeat_table_header: true,
  repeat_header: true,
  repeat_footer: true,
  show_student_signature: true,
  show_preceptor_signature: true
};

const BPharmAdminFormatPDFPreview = ({ college, settings }) => {
  return (
    <BPharmBrandedDocumentContainer
      college={college}
      branding={settings}
      documentTitle="DOCUMENT FORMAT & BRANDING PREVIEW"
      caseId="BPHARM-PRACTICAL-RECORD-PREVIEW"
      student={{ full_name: '[ Student Name ]', roll_number: '[ Roll Number ]' }}
      preceptor={{ full_name: '[ Faculty Preceptor Name ]', designation: '[ Faculty Designation ]' }}
      preceptorName="[ Faculty Preceptor Name ]"
      pageNumber="1 of 1"
      showSignatures={true}
      isLastPage={true}
    >
      <div className="space-y-6 text-xs">
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center space-y-4 bg-slate-50/50">
          <div className="inline-block px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-[10px] uppercase font-bold tracking-widest">
            B.Pharm Practical Record Format Preview
          </div>
          
          <h3 className="text-base font-black uppercase text-slate-800 tracking-tight">
            [ B.PHARM PRACTICAL RECORD CONTENT AREA ]
          </h3>

          <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
            This area will automatically populate with the student's submitted experiment data, including generated Observation Tables, dynamically plotted Dose-Response Graphs, and Evaluation Feedback.
          </p>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-5 gap-2 text-[10px] font-mono">
            <div className="p-2.5 rounded bg-white border border-slate-200 shadow-2xs font-bold text-slate-700">
              1. Patient Profile
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200 shadow-2xs font-bold text-slate-700">
              2. Counselling
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200 shadow-2xs font-bold text-slate-700">
              3. Intervention
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200 shadow-2xs font-bold text-slate-700">
              4. Drug Info (DIR)
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200 shadow-2xs font-bold text-slate-700">
              5. ADR Log
            </div>
          </div>
        </div>

        <div className="border border-slate-300 p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
          <div>
            <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">PharmDVerse Verification Registry</div>
            <div className="font-bold text-xs">Experiment Status: EVALUATED & LOCKED [TEMPLATE PREVIEW]</div>
          </div>
          <div className="text-right text-[10px] font-mono text-slate-300">
            <div>Signed by: [Student Name]</div>
            <div>Approved by: [Faculty Preceptor Name]</div>
          </div>
        </div>
      </div>
    </BPharmBrandedDocumentContainer>
  );
};

export const BPharmDocumentBrandingView = ({ college: initialCollege }) => {
  const [college, setCollege] = useState(initialCollege);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const { platformSettings } = usePlatform();
  const platformName = platformSettings?.platform_name || 'PharmDVerse';
  const [settings, setSettings] = useState({ ...DEFAULT_SHARED_SETTINGS, watermark_text_line1: 'PHARMDVERSE', footer_left_text: platformName });

  const { notification: brandNotify, showNotification: showBrandNotify, clearNotification: clearBrandNotify } = useInlineNotification();

  useEffect(() => {
    setCollege(initialCollege);
  }, [initialCollege]);

  // LIVE SYNCHRONIZATION FOR COLLEGE IDENTITY
  useEffect(() => {
    const handleCollegeUpdated = (e) => {
      if (e.detail) {
        setCollege(e.detail);
      }
    };
    window.addEventListener('pharmdverse_college_updated', handleCollegeUpdated);
    return () => window.removeEventListener('pharmdverse_college_updated', handleCollegeUpdated);
  }, []);

  const loadBranding = async () => {
    if (!college?.id) return;
    setLoading(true);

    const [res, colRes] = await Promise.all([
      fetchBPharmBrandingSettingsFromSupabase(college.id),
      fetchCollegeByIdFromSupabase(college.id)
    ]);

    if (colRes.success && colRes.college) {
      setCollege(colRes.college);
    }

    if (res.success) {
      const saved = res.pdfSettings || res.settings || {};
      setSettings({
        ...DEFAULT_SHARED_SETTINGS,
        watermark_text_line1: saved.watermark_text_line1 || 'PHARMDVERSE',
        footer_left_text: saved.footer_left_text || platformName,
        ...saved,
        footer_enabled: saved.footer_enabled ?? saved.repeat_footer ?? true,
        watermark_enabled: saved.watermark_enabled ?? saved.show_watermark ?? true
      });
    } else {
      setSettings({ ...DEFAULT_SHARED_SETTINGS, watermark_text_line1: 'PHARMDVERSE', footer_left_text: platformName });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBranding();
  }, [college?.id]);

  const handleChange = (key, value) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      window.dispatchEvent(new CustomEvent('pharmdverse_branding_updated', { detail: updated }));
      return updated;
    });
  };

  const handleToggle = (key) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      window.dispatchEvent(new CustomEvent('pharmdverse_branding_updated', { detail: updated }));
      return updated;
    });
  };

  const handleRestoreDefault = () => {
    setSettings({ ...DEFAULT_SHARED_SETTINGS, watermark_text_line1: 'PHARMDVERSE', footer_left_text: platformName });
    window.dispatchEvent(new CustomEvent('pharmdverse_branding_updated', { detail: { ...DEFAULT_SHARED_SETTINGS, watermark_text_line1: 'PHARMDVERSE', footer_left_text: platformName } }));
    showBrandNotify({
      type: 'success',
      message: '✓ Restored shared B.Pharm PDF settings to default.'
    });
  };

  const handleSave = async () => {
    if (!college?.id) return;
    setSaving(true);

    const res = await saveBPharmBrandingSettingsInSupabase(college.id, settings);
    setSaving(false);

    if (res.success) {
      window.dispatchEvent(new CustomEvent('pharmdverse_branding_updated', { detail: settings }));
      showBrandNotify({
        type: 'success',
        message: '✓ Saved shared B.Pharm PDF settings successfully!'
      });
    } else {
      showBrandNotify({
        type: 'error',
        message: res.error || '✖ Failed to save shared B.Pharm PDF settings.'
      });
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading PDF & PPT Format Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn w-full">
      
      {/* HEADER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>B.Pharm PDF Format Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized Header, Watermark, Footer & Details settings configured once and shared across your B.Pharm PDF records for <strong className="text-slate-800 dark:text-slate-200">{college?.college_name || college?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Preview PDF A4</span>
          </button>

          

          <button
            type="button"
            onClick={handleRestoreDefault}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Restore Default</span>
          </button>

          <div className="flex items-center gap-2">
            <InlineActionNotification notification={brandNotify} onClose={clearBrandNotify} position="inline" />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Format Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CONSOLIDATED SHARED SECTIONS */}
      <div className="space-y-6 w-full min-w-0">
        
        {/* SECTION 1: COLLEGE & Affiliation IDENTITY (READ ONLY WITH MANDATORY MESSAGE) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Section 1: College & Affiliation Identity
            </h3>
            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
              Read Only
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-2.5 shadow-xs">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>These details are managed from My College Profile.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs opacity-90">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              {college?.college_logo_url || college?.logoUrl ? (
                <img src={college?.college_logo_url || college?.logoUrl} alt="College Logo" className="w-10 h-10 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 font-bold flex items-center justify-center">CL</div>
              )}
              <div>
                <span className="text-[10px] text-slate-400 block">College Name:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{college?.college_name || college?.name}</strong>
                {Boolean(college?.is_autonomous ?? college?.isAutonomous) && (
                  <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-bold italic">(Autonomous)</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              {college?.affiliation_logo_url || college?.affiliationLogoUrl ? (
                <img src={college?.affiliation_logo_url || college?.affiliationLogoUrl} alt="Affiliation Logo" className="w-10 h-10 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 font-bold flex items-center justify-center">HL</div>
              )}
              <div>
                <span className="text-[10px] text-slate-400 block">Affiliation Name:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{college?.affiliation_name || college?.affiliationName || college?.affiliation_name || 'Primary Affiliation Name'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: HEADER DISPLAY SWITCHES */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Section 2: Header Display Switches
            </h3>
            <span className="text-[10px] font-mono text-slate-400 font-medium">Applied to B.Pharm PDF</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {[
              { key: 'show_college_logo', label: 'Show College Logo' },
              { key: 'show_college_name', label: 'Show College Name' },
              { key: 'show_autonomous', label: 'Show Autonomous' },
              { key: 'show_affiliation_logo', label: 'Show Affiliation Logo' },
              { key: 'show_affiliation_name', label: 'Show Affiliation Name' }
            ].map((item) => (
              <div
                key={item.key}
                onClick={() => handleToggle(item.key)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  settings[item.key]
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-800 font-bold text-slate-900 dark:text-white'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <span>{item.label}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                  settings[item.key] ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                }`}>
                  {settings[item.key] ? 'ON' : 'OFF'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: WATERMARK */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Section 3: Watermark
            </h3>
            <button
              type="button"
              onClick={() => handleToggle('watermark_enabled')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                settings.watermark_enabled ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
              }`}
            >
              {settings.watermark_enabled ? 'Watermark Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Watermark Line 1</label>
                <input type="text" value={settings.watermark_text_line1} onChange={(e) => handleChange('watermark_text_line1', e.target.value)} className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Watermark Line 2</label>
                <input type="text" value={settings.watermark_text_line2} onChange={(e) => handleChange('watermark_text_line2', e.target.value)} className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Opacity ({settings.watermark_opacity}%)</label>
                <input type="range" min={5} max={30} value={settings.watermark_opacity} onChange={(e) => handleChange('watermark_opacity', e.target.value)} className="w-full" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Position</label>
                <select value={settings.watermark_position} onChange={(e) => handleChange('watermark_position', e.target.value)} className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                  <option value="Center">Center</option>
                  <option value="Diagonal">Diagonal</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: DOCUMENT FOOTER */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Layout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Section 4: Document Footer
            </h3>
            <button
              type="button"
              onClick={() => handleToggle('footer_enabled')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                settings.footer_enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
              }`}
            >
              {settings.footer_enabled ? 'Footer Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Left Footer Text</label>
                <input type="text" value={settings.footer_left_text} onChange={(e) => handleChange('footer_left_text', e.target.value)} className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Center Footer Text</label>
                <input type="text" value={settings.footer_center_text} onChange={(e) => handleChange('footer_center_text', e.target.value)} className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div onClick={() => handleToggle('show_page_number')} className={`p-2.5 rounded-xl border cursor-pointer flex justify-between items-center ${settings.show_page_number ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200'}`}>
                <div>
                  <span className="block font-bold">Show Page / Slide Number</span>
                  <span className="text-[10px] text-slate-400 font-normal">PDF: Page #</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">{settings.show_page_number ? 'YES' : 'NO'}</span>
              </div>

              <div onClick={() => handleToggle('show_generated_datetime')} className={`p-2.5 rounded-xl border cursor-pointer flex justify-between items-center ${settings.show_generated_datetime ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200'}`}>
                <div>
                  <span className="block font-bold">Show Date & Time</span>
                  <span className="text-[10px] text-slate-400 font-normal">Timestamp stamp</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">{settings.show_generated_datetime ? 'YES' : 'NO'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: STUDENT AND PRECEPTOR DETAILS */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Section 5: Show Student and Preceptor Details
            </h3>
            <span className="text-[10px] font-mono text-slate-400 font-medium">Applied to B.Pharm PDF</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div
              onClick={() => handleToggle('show_student_signature')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                settings.show_student_signature
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-800 font-bold text-slate-900 dark:text-white'
                  : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500'
              }`}
            >
              <div>
                <span className="block font-bold">Student Details & Signature</span>
                <span className="text-[10px] text-slate-400 font-normal">Display Student Name, Roll Number & Signature line</span>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                settings.show_student_signature ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
              }`}>
                {settings.show_student_signature ? 'SHOW' : 'HIDE'}
              </span>
            </div>

            <div
              onClick={() => handleToggle('show_preceptor_signature')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                settings.show_preceptor_signature
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-800 font-bold text-slate-900 dark:text-white'
                  : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500'
              }`}
            >
              <div>
                <span className="block font-bold">Preceptor Details & Signature</span>
                <span className="text-[10px] text-slate-400 font-normal">Display Preceptor Name, Designation & Signature line</span>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                settings.show_preceptor_signature ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
              }`}>
                {settings.show_preceptor_signature ? 'SHOW' : 'HIDE'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* PREVIEW FULL A4 PDF MODAL */}
      {isPreviewModalOpen && (
        <ModalWrapper
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title="Shared PDF Document Format Preview (A4 Portrait)"
          subtitle={`Previewing shared Header, Watermark, Footer & Student/Preceptor Signatures for ${college?.college_name || college?.name}`}
          maxWidth="max-w-7xl w-full"
        >
          <div className="p-6 bg-slate-100 dark:bg-slate-950 max-h-[85vh] overflow-y-auto">
            <BPharmAdminFormatPDFPreview college={college} settings={settings} />
          </div>
        </ModalWrapper>
      )}

    </div>
  );
};


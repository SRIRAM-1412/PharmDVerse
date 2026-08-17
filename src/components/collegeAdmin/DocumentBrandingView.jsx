import React, { useState, useEffect } from 'react';
import { FileText, Save, RefreshCw, Eye, CheckCircle2, AlertTriangle, Loader2, Sparkles, Sliders, Type, Layout, ShieldCheck, Printer, Building, MonitorPlay, Info, Presentation } from 'lucide-react';
import { 
  fetchDocumentBrandingSettingsFromSupabase, 
  savePdfBrandingSettingsInSupabase, 
  savePptBrandingSettingsInSupabase, 
  fetchCollegeByIdFromSupabase 
} from '../../services/supabaseService';
import { InlineActionNotification } from '../common/InlineActionNotification';
import { useInlineNotification } from '../../hooks/useInlineNotification';
import { ModalWrapper } from '../modals/ModalWrapper';
import { PharmDVerseBrandedDocumentContainer } from '../branding/PharmDVerseBrandedDocumentContainer';
import { ClinicalCaseDocumentRenderer } from '../branding/ClinicalCaseDocumentRenderer';
import { SAMPLE_CLINICAL_CASE_DATA } from '../../utils/sampleClinicalCaseDATA';

const DEFAULT_SETTINGS = {
  show_college_logo: true,
  show_college_name: true,
  show_autonomous: true,
  show_hospital_logo: true,
  show_hospital_name: true,
  watermark_enabled: true,
  watermark_text_line1: 'PHARMDVERSE',
  watermark_text_line2: 'Clinical Documentation System',
  watermark_opacity: 10,
  watermark_position: 'Center',
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

const AdminFormatPDFPreview = ({ college, settings }) => {
  return (
    <PharmDVerseBrandedDocumentContainer
      college={college}
      branding={settings}
      documentTitle="DOCUMENT BRANDING & FORMAT PREVIEW"
      caseId="COLLEGE-PDF-FORMAT-PREVIEW"
      student={{ full_name: '[ Student Name ]', roll_number: '[ Roll Number ]' }}
      preceptor={{ full_name: '[ Faculty Preceptor Name ]', designation: '[ Faculty Designation ]' }}
      preceptorName="[ Faculty Preceptor Name ]"
      pageNumber="1 of 1"
      showSignatures={true}
      isLastPage={true}
    >
      <div className="space-y-6 text-xs">
        {/* FORMAT PREVIEW PLACEHOLDER FRAME */}
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center space-y-4 bg-slate-50/50">
          <div className="inline-block px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-[10px] uppercase font-bold tracking-widest">
            College PDF Document Format Preview
          </div>
          
          <h3 className="text-base font-black uppercase text-slate-800 tracking-tight">
            [ CLINICAL DOCUMENTATION CONTENT AREA ]
          </h3>

          <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
            This area will automatically populate with the complete approved clinical documentation from all 5 modules (Patient Profile, Counselling Record, Pharmacist Intervention, Drug Information Request & ADR Monitoring Log) when an actual clinical case is approved for this college.
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

        {/* VERIFICATION & APPROVAL BADGE PLACEHOLDER */}
        <div className="border border-slate-300 p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
          <div>
            <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">PharmDVerse Verification Registry</div>
            <div className="font-bold text-xs">Case Status: APPROVED & LOCKED [TEMPLATE PREVIEW]</div>
          </div>
          <div className="text-right text-[10px] font-mono text-slate-300">
            <div>Signed by: [Student Name]</div>
            <div>Approved by: [Faculty Preceptor Name]</div>
          </div>
        </div>
      </div>
    </PharmDVerseBrandedDocumentContainer>
  );
};

const SamplePptSlidePreview = ({ college, pptSettings }) => {
  const [slideNum, setSlideNum] = useState(1);
  const showCollegeName = pptSettings?.show_college_name !== false;
  const showAutonomous = pptSettings?.show_autonomous !== false;
  const showHospitalName = pptSettings?.show_hospital_name !== false;
  const showCollegeLogo = (pptSettings?.show_logo !== false && pptSettings?.show_college_logo !== false);
  const showHospitalLogo = pptSettings?.show_hospital_logo !== false;

  const collegeName = pptSettings?.header_title || college?.college_name || college?.name || 'College Name';
  const hospitalName = college?.hospital_name || college?.hospitalName || college?.primary_hospital_name || 'Primary Hospital Name';
  const fontFamily = pptSettings?.font_family || 'Times New Roman';
  const titleSize = pptSettings?.ppt_title_font_size || '22px';
  const subHeadingSize = pptSettings?.ppt_subheading_font_size || '20px';
  const bodySize = pptSettings?.ppt_body_font_size || '18px';
  const footerText = pptSettings?.footer_text || 'Pharm.D Clinical Case Presentation • Confidential';

  return (
    <div className="space-y-4">
      {/* Slide Navigation Bar */}
      <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-md">
        <div className="flex items-center gap-2">
          <Presentation className="w-4 h-4 text-amber-400" />
          <span>PPT Slide Format Preview ({pptSettings?.aspect_ratio || '16:9'}) • Theme: {pptSettings?.theme || 'Clinical Emerald'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSlideNum(prev => Math.max(1, prev - 1))}
            disabled={slideNum === 1}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold transition-colors"
          >
            ← Prev Slide
          </button>
          <span className="font-mono text-amber-300 px-1 font-bold">Slide {slideNum} of 2 ({slideNum === 1 ? 'Title Slide' : 'Content Slide'})</span>
          <button
            type="button"
            onClick={() => setSlideNum(prev => Math.min(2, prev + 1))}
            disabled={slideNum === 2}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold transition-colors"
          >
            Next Slide →
          </button>
        </div>
      </div>

      {/* Slide Screen Frame */}
      <div className="border-4 border-slate-900 rounded-3xl p-6 bg-white shadow-2xl space-y-6 text-slate-900 min-h-[420px] flex flex-col justify-between" style={{ fontFamily }}>
        {slideNum === 1 && (
          <div className="space-y-5">
            {/* Header Box with Dual Logos (College Left, Hospital Right) */}
            <div className="p-4 bg-slate-100 rounded-2xl border-2 border-slate-900 flex items-center justify-between gap-4">
              {showCollegeLogo && (college?.college_logo_url || college?.logo_url) ? (
                <img src={college.college_logo_url || college.logo_url} alt="College Logo" className="w-14 h-14 object-contain rounded" />
              ) : <div className="w-14 h-14" />}

              <div className="flex-1 text-center space-y-0.5">
                {showCollegeName && (
                  <h2 className="font-extrabold uppercase text-slate-900" style={{ fontSize: titleSize }}>
                    {collegeName}
                  </h2>
                )}
                {(showAutonomous || showHospitalName) && (
                  <p className="text-slate-600 italic font-semibold" style={{ fontSize: subHeadingSize }}>
                    {showAutonomous ? '(Autonomous)' : ''}
                    {showAutonomous && showHospitalName ? ' • ' : ''}
                    {showHospitalName ? hospitalName : ''}
                  </p>
                )}
              </div>

              {showHospitalLogo && (college?.hospital_logo_url || college?.hospitalLogoUrl) ? (
                <img src={college.hospital_logo_url || college.hospitalLogoUrl} alt="Hospital Logo" className="w-14 h-14 object-contain rounded" />
              ) : <div className="w-14 h-14" />}
            </div>

            {/* Case ID Banner */}
            <div className="p-2.5 bg-slate-900 text-white rounded-xl text-center font-mono font-bold" style={{ fontSize: bodySize }}>
              CASE ID : [ CASE ID PLACEHOLDER ]
            </div>

            {/* Main Presentation Title */}
            <div className="text-center space-y-2 py-2">
              <h1 className="font-black text-emerald-700 uppercase tracking-tight" style={{ fontSize: `calc(${titleSize} + 4px)` }}>
                CLINICAL CASE PRESENTATION TITLE [PLACEHOLDER]
              </h1>
              <p className="font-bold text-slate-800" style={{ fontSize: subHeadingSize }}>
                Final Diagnosis: [ Final Diagnosis Placeholder ]
              </p>
            </div>

            {/* Student Details (LEFT) & Faculty Preceptor Details (RIGHT SIDE) */}
            {pptSettings?.show_student_preceptor !== false && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-300 grid grid-cols-2 gap-4 text-xs" style={{ fontSize: bodySize }}>
                {/* LEFT SIDE: STUDENT DETAILS */}
                <div className="text-left space-y-1 border-r border-slate-200 pr-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Submitted / Presented By:</span>
                  <strong className="text-slate-900 font-extrabold text-sm block">Student Name: [Student Name]</strong>
                  <span className="text-[11px] text-slate-600 block font-mono">Roll Number: [Roll Number]</span>
                </div>

                {/* RIGHT SIDE: FACULTY PRECEPTOR DETAILS */}
                <div className="text-right space-y-1 pl-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Evaluated & Approved By:</span>
                  <strong className="text-emerald-700 font-extrabold text-sm block">Faculty Preceptor: [Faculty Preceptor Name]</strong>
                  <span className="text-[11px] text-slate-600 block font-mono">Designation: [Faculty Designation]</span>
                </div>
              </div>
            )}
          </div>
        )}

        {slideNum > 1 && (
          <div className="space-y-4">
            <h2 className="font-extrabold text-slate-900 border-b pb-2 border-slate-300 flex items-center justify-between" style={{ fontSize: titleSize }}>
              <span>Module Slide Format Preview {slideNum}</span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 font-bold">🟢 Template Format</span>
            </h2>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3 bg-slate-50">
              <div className="text-xs font-mono font-bold uppercase text-slate-500">
                [ Module Content Layout Frame ]
              </div>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Actual student data for this module will render inside this styled layout container during case presentation export.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-300 text-center text-xs text-slate-500 font-medium">
          {footerText}
        </div>
      </div>
    </div>
  );
};

export const DocumentBrandingView = ({ college: initialCollege }) => {
  const [college, setCollege] = useState(initialCollege);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPptPreviewModalOpen, setIsPptPreviewModalOpen] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // PPT Format Settings State
  const [pptSettings, setPptSettings] = useState({
    theme: 'Clinical Emerald',
    aspect_ratio: '16:9 (Widescreen)',
    header_title: initialCollege?.college_name || initialCollege?.name || '',
    footer_text: 'Pharm.D Clinical Case Presentation • Confidential',
    show_logo: true,
    show_hospital_logo: true,
    show_watermark: true,
    show_autonomous: true,
    show_student_preceptor: true
  });
  const [pptSaving, setPptSaving] = useState(false);
  const { notification: pptNotify, showNotification: showPptNotify, clearNotification: clearPptNotify } = useInlineNotification();
  const { notification: brandNotify, showNotification: showBrandNotify, clearNotification: clearBrandNotify } = useInlineNotification();

  useEffect(() => {
    setCollege(initialCollege);
    if (initialCollege?.college_name || initialCollege?.name) {
      setPptSettings(prev => ({
        ...prev,
        header_title: prev.header_title || initialCollege.college_name || initialCollege.name
      }));
    }
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

    // Load PPT settings from localStorage if available
    try {
      const savedPpt = localStorage.getItem(`pharmdverse_ppt_settings_${college.id}`);
      if (savedPpt) {
        setPptSettings(JSON.parse(savedPpt));
      }
    } catch (e) {}

    const [res, colRes] = await Promise.all([
      fetchDocumentBrandingSettingsFromSupabase(college.id),
      fetchCollegeByIdFromSupabase(college.id)
    ]);

    if (colRes.success && colRes.college) {
      setCollege(colRes.college);
    }

    if (res.success) {
      const pdf = res.pdfSettings || res.settings || {};
      const ppt = res.pptSettings || {};

      setSettings({
        ...DEFAULT_SETTINGS,
        ...pdf
      });

      setPptSettings(prev => ({
        ...prev,
        ...ppt
      }));
    } else {
      setSettings(DEFAULT_SETTINGS);
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
    setSettings(DEFAULT_SETTINGS);
    window.dispatchEvent(new CustomEvent('pharmdverse_branding_updated', { detail: DEFAULT_SETTINGS }));
  };

  const handleSave = async () => {
    if (!college?.id) return;
    setSaving(true);

    const res = await savePdfBrandingSettingsInSupabase(college.id, settings);
    setSaving(false);

    if (res.success) {
      window.dispatchEvent(new CustomEvent('pharmdverse_branding_updated', { detail: settings }));
      showBrandNotify({
        type: 'success',
        message: '✓ PDF Format Settings saved successfully!'
      });
    } else {
      showBrandNotify({
        type: 'error',
        message: res.error || '✖ Failed to save PDF Format Settings.'
      });
    }
  };

  const handleSavePptFormat = async () => {
    if (!college?.id) return;
    setPptSaving(true);
    
    const res = await savePptBrandingSettingsInSupabase(college.id, pptSettings);
    try {
      localStorage.setItem(`pharmdverse_ppt_settings_${college.id}`, JSON.stringify(pptSettings));
    } catch (e) {}

    setPptSaving(false);
    if (res.success) {
      showPptNotify({
        type: 'success',
        message: '✓ PPT Format Settings saved successfully!'
      });
    } else {
      showPptNotify({
        type: 'error',
        message: res.error || '✖ Failed to save PPT Format Settings.'
      });
    }
  };

  const handleRestorePptDefault = () => {
    const def = {
      theme: 'Clinical Emerald',
      aspect_ratio: '16:9 (Widescreen)',
      header_title: college?.college_name || college?.name || 'Pharmacy College',
      footer_text: 'Pharm.D Clinical Case Presentation • Confidential',
      font_family: 'Times New Roman',
      ppt_title_font_size: '22px',
      ppt_subheading_font_size: '20px',
      ppt_body_font_size: '18px',
      show_logo: true,
      show_autonomous: true,
      show_student_preceptor: true
    };
    setPptSettings(def);
    try {
      if (college?.id) {
        localStorage.setItem(`pharmdverse_ppt_settings_${college.id}`, JSON.stringify(def));
      }
    } catch (e) {}
    showPptNotify({
      type: 'success',
      message: '✓ PPT Format Settings restored to default.'
    });
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
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      
      {/* HEADER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>PDF Format Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized PDF & Print Format Settings for all clinical documentation modules in <strong className="text-slate-800 dark:text-slate-200">{college?.college_name || college?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4 text-indigo-500" />
            <span>Preview Full A4</span>
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
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save PDF Format'}</span>
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

      {/* FULL-WIDTH CONFIGURATION PANELS */}
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="space-y-6">
          
          {/* SECTION 1: COLLEGE & HOSPITAL IDENTITY (READ ONLY WITH MANDATORY MESSAGE) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Section 1: College & Hospital Identity
              </h3>
              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                Read Only
              </span>
            </div>

            {/* MANDATORY PROMINENT MESSAGE */}
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
                {college?.hospital_logo_url || college?.hospitalLogoUrl ? (
                  <img src={college?.hospital_logo_url || college?.hospitalLogoUrl} alt="Hospital Logo" className="w-10 h-10 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 font-bold flex items-center justify-center">HL</div>
                )}
                <div>
                  <span className="text-[10px] text-slate-400 block">Hospital Name:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{college?.hospital_name || college?.hospitalName || college?.primary_hospital_name || 'Primary Hospital Name'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: HEADER SETTINGS */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Section 2: Header Display Switches
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {[
                { key: 'show_college_logo', label: 'Show College Logo' },
                { key: 'show_college_name', label: 'Show College Name' },
                { key: 'show_autonomous', label: 'Show Autonomous' },
                { key: 'show_hospital_logo', label: 'Show Hospital Logo' },
                { key: 'show_hospital_name', label: 'Show Hospital Name' }
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
                Section 3: PDF Watermark
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

          {/* SECTION 4: FOOTER */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Layout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Section 4: Document Footer
            </h3>

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
                  <span>Show Page Number</span>
                  <span className="text-[10px]">{settings.show_page_number ? 'YES' : 'NO'}</span>
                </div>

                <div onClick={() => handleToggle('show_generated_datetime')} className={`p-2.5 rounded-xl border cursor-pointer flex justify-between items-center ${settings.show_generated_datetime ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200'}`}>
                  <span>Show Date & Time</span>
                  <span className="text-[10px]">{settings.show_generated_datetime ? 'YES' : 'NO'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: PDF MULTI-PAGE CONTROLS & SIGNATURES */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Section 5: PDF Multi-page Controls & Signatures
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div onClick={() => handleToggle('repeat_header')} className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${settings.repeat_header ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 font-bold text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-500'}`}>
                <div>
                  <span className="block font-bold">Repeat Header</span>
                  <span className="text-[10px] text-slate-400 font-normal">Header on every page</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${settings.repeat_header ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
                  {settings.repeat_header ? 'ON' : 'OFF'}
                </span>
              </div>

              <div onClick={() => handleToggle('repeat_footer')} className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${settings.repeat_footer ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 font-bold text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-500'}`}>
                <div>
                  <span className="block font-bold">Repeat Footer</span>
                  <span className="text-[10px] text-slate-400 font-normal">Footer on every page</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${settings.repeat_footer ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
                  {settings.repeat_footer ? 'ON' : 'OFF'}
                </span>
              </div>

              <div onClick={() => handleToggle('show_student_signature')} className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${settings.show_student_signature ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 font-bold text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-500'}`}>
                <div>
                  <span className="block font-bold">Student Sig</span>
                  <span className="text-[10px] text-slate-400 font-normal">Display signature line</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${settings.show_student_signature ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
                  {settings.show_student_signature ? 'SHOW' : 'HIDE'}
                </span>
              </div>

              <div onClick={() => handleToggle('show_preceptor_signature')} className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${settings.show_preceptor_signature ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 font-bold text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-500'}`}>
                <div>
                  <span className="block font-bold">Preceptor Sig</span>
                  <span className="text-[10px] text-slate-400 font-normal">Display signature line</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${settings.show_preceptor_signature ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
                  {settings.show_preceptor_signature ? 'SHOW' : 'HIDE'}
                </span>
              </div>

              <div onClick={() => handleToggle('zebra_striping')} className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${settings.zebra_striping ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-400 font-bold text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-500'}`}>
                <div>
                  <span className="block font-bold">Zebra Striping</span>
                  <span className="text-[10px] text-slate-400 font-normal">Alternating table rows</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${settings.zebra_striping ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
                  {settings.zebra_striping ? 'ON' : 'OFF'}
                </span>
              </div>

              <div onClick={() => handleToggle('repeat_table_header')} className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${settings.repeat_table_header ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-400 font-bold text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-500'}`}>
                <div>
                  <span className="block font-bold">Repeat Table Th</span>
                  <span className="text-[10px] text-slate-400 font-normal">Table header on split</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${settings.repeat_table_header ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
                  {settings.repeat_table_header ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>



        </div>

      </div>

      {/* PPT FORMAT CONFIGURATION SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Presentation className="w-5 h-5 text-amber-500" />
              <span>PPT Format Configuration</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize presentation slides layout, header, themes, and presentation export formats for student case presentations.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPptPreviewModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Preview PPT Slides</span>
            </button>

            <button
              type="button"
              onClick={handleRestorePptDefault}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>Restore PPT Default</span>
            </button>

            <InlineActionNotification notification={pptNotify} onClose={clearPptNotify} position="inline" />
            <button
              type="button"
              onClick={handleSavePptFormat}
              disabled={pptSaving}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
            >
              {pptSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{pptSaving ? 'Saving...' : 'Save PPT Format'}</span>
            </button>
          </div>
        </div>

      {/* PPT FORMAT CONFIGURATION PANELS */}
      <div className="space-y-6 max-w-5xl mx-auto pt-6 border-t border-slate-200 dark:border-slate-800">
        
        {/* SECTION 1: COLLEGE & HOSPITAL IDENTITY (READ ONLY) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Section 1: College & Hospital Identity
            </h3>
            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
              Read Only
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2.5 shadow-xs">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>These details are managed from My College Profile.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs opacity-90">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              {college?.college_logo_url || college?.logoUrl ? (
                <img src={college?.college_logo_url || college?.logoUrl} alt="College Logo" className="w-10 h-10 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 font-bold flex items-center justify-center">CL</div>
              )}
              <div>
                <span className="text-[10px] text-slate-400 block">College Name:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{college?.college_name || college?.name}</strong>
                {Boolean(college?.is_autonomous ?? college?.isAutonomous) && (
                  <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-bold italic">(Autonomous)</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              {college?.hospital_logo_url || college?.hospitalLogoUrl ? (
                <img src={college?.hospital_logo_url || college?.hospitalLogoUrl} alt="Hospital Logo" className="w-10 h-10 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 font-bold flex items-center justify-center">HL</div>
              )}
              <div>
                <span className="text-[10px] text-slate-400 block">Hospital Name:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{college?.hospital_name || college?.hospitalName || college?.primary_hospital_name || 'Primary Hospital Name'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: HEADER DISPLAY SWITCHES */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Section 2: Header Display Switches
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {[
              { key: 'show_logo', label: 'Show College Logo' },
              { key: 'show_college_name', label: 'Show College Name' },
              { key: 'show_autonomous', label: 'Show Autonomous' },
              { key: 'show_hospital_logo', label: 'Show Hospital Logo' },
              { key: 'show_hospital_name', label: 'Show Hospital Name' },
              { key: 'show_student_preceptor', label: 'Show Student & Preceptor Details' }
            ].map((item) => {
              const isEnabled = pptSettings[item.key] !== false;
              return (
                <div
                  key={item.key}
                  onClick={() => setPptSettings(prev => ({ ...prev, [item.key]: !isEnabled }))}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isEnabled
                      ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-800 font-bold text-slate-900 dark:text-white'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                    isEnabled ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                  }`}>
                    {isEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: PPT WATERMARK */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Section 3: PPT Watermark
            </h3>
            <button
              type="button"
              onClick={() => setPptSettings(prev => ({ ...prev, show_watermark: !prev.show_watermark }))}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                pptSettings.show_watermark !== false ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
              }`}
            >
              {pptSettings.show_watermark !== false ? 'Watermark Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Watermark Line 1</label>
                <input
                  type="text"
                  value={pptSettings.watermark_text_line1 || college?.college_code || 'PHARMDVERSE'}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, watermark_text_line1: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Watermark Line 2</label>
                <input
                  type="text"
                  value={pptSettings.watermark_text_line2 || 'Clinical Case Presentation'}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, watermark_text_line2: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: SLIDE SETUP & FOOTER */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Layout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Section 4: Slide Setup & Footer
          </h3>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Presentation Theme</label>
                <select
                  value={pptSettings.theme}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="Clinical Emerald">Clinical Emerald (Recommended)</option>
                  <option value="Modern Navy">Modern Navy</option>
                  <option value="Academic Indigo">Academic Indigo</option>
                  <option value="Classic White">Classic Minimal White</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Slide Aspect Ratio</label>
                <select
                  value={pptSettings.aspect_ratio}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, aspect_ratio: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="16:9 (Widescreen)">16:9 (Widescreen - Modern HDTV)</option>
                  <option value="4:3 (Standard)">4:3 (Standard Projector)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Title Slide Header</label>
                <input
                  type="text"
                  value={pptSettings.header_title}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, header_title: e.target.value }))}
                  placeholder="e.g. Pharmacy College"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Slide Footer Text</label>
                <input
                  type="text"
                  value={pptSettings.footer_text}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, footer_text: e.target.value }))}
                  placeholder="e.g. Pharm.D Clinical Case Presentation • Confidential"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: PPT TYPOGRAPHY & FONT SIZES */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <Type className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>PPT Typography & Font Sizes</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Font Family Dropdown */}
            <div className="md:col-span-2 space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Font Family (Font Style)
              </label>
              <select
                value={pptSettings.font_family || 'Times New Roman'}
                onChange={(e) => setPptSettings(prev => ({ ...prev, font_family: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="Times New Roman">Times New Roman (Recommended)</option>
                <option value="Arial">Arial (Sans-serif)</option>
                <option value="Calibri">Calibri (Sans-serif)</option>
                <option value="Inter">Inter (Clean Modern)</option>
                <option value="Roboto">Roboto (Technical)</option>
                <option value="Georgia">Georgia (Serif)</option>
              </select>
            </div>

            {/* 3-Column Font Size Selector */}
            <div className="md:col-span-2 grid grid-cols-3 gap-2 text-[10px]">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Title Size
                </label>
                <select
                  value={pptSettings.ppt_title_font_size || '22px'}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, ppt_title_font_size: e.target.value }))}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white font-mono text-center"
                >
                  <option value="20px">20 px</option>
                  <option value="22px">22 px (Default)</option>
                  <option value="24px">24 px</option>
                  <option value="28px">28 px</option>
                  <option value="32px">32 px</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Heading Size
                </label>
                <select
                  value={pptSettings.ppt_subheading_font_size || '20px'}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, ppt_subheading_font_size: e.target.value }))}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white font-mono text-center"
                >
                  <option value="16px">16 px</option>
                  <option value="18px">18 px</option>
                  <option value="20px">20 px (Default)</option>
                  <option value="22px">22 px</option>
                  <option value="24px">24 px</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Body Size
                </label>
                <select
                  value={pptSettings.ppt_body_font_size || '18px'}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, ppt_body_font_size: e.target.value }))}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white font-mono text-center"
                >
                  <option value="14px">14 px</option>
                  <option value="16px">16 px</option>
                  <option value="18px">18 px (Default)</option>
                  <option value="20px">20 px</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>
      </div>

      {/* PREVIEW FULL PAGE MODAL */}
      {isPreviewModalOpen && (
        <ModalWrapper
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title={`Full ${settings.paper_size} (${settings.orientation}) PDF Format Preview`}
          subtitle={`Exact rendering across all PharmDVerse clinical documentation modules (${settings.paper_size} - ${settings.orientation})`}
          maxWidth="max-w-7xl w-full"
        >
          <div className="p-6 bg-slate-100 dark:bg-slate-950 max-h-[85vh] overflow-y-auto">
            <AdminFormatPDFPreview college={college} settings={settings} />
          </div>
        </ModalWrapper>
      )}

      {/* PREVIEW PPT SLIDES MODAL */}
      {isPptPreviewModalOpen && (
        <ModalWrapper
          isOpen={isPptPreviewModalOpen}
          onClose={() => setIsPptPreviewModalOpen(false)}
          title={`PowerPoint Slide Format Preview (${pptSettings.aspect_ratio || '16:9'})`}
          subtitle={`Theme: ${pptSettings.theme || 'Clinical Emerald'} • Font: ${pptSettings.font_family || 'Times New Roman'}`}
          maxWidth="max-w-5xl"
        >
          <div className="p-4 bg-slate-100 dark:bg-slate-950 max-h-[82vh] overflow-y-auto">
            <SamplePptSlidePreview college={college} pptSettings={pptSettings} />
          </div>
        </ModalWrapper>
      )}

    </div>
  );
};

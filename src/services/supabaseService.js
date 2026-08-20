import { supabase } from '../lib/supabaseClient';

/**
 * SHA-256 Password Hashing Helper
 * Uses Web Crypto API (SubtleCrypto) compatible with Browser and Node.js
 */
export const hashPassword = async (password) => {
  if (!password) return null;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Password hashing error:', err);
    return null;
  }
};

/**
 * Formats Supabase raw errors into user-friendly error messages
 */
export const formatSupabaseError = (err, fallbackMsg = 'Database operation failed.') => {
  if (!err) return fallbackMsg;
  const msg = typeof err === 'string' ? err : (err.message || String(err));
  if (msg.includes('Failed to fetch') || msg.includes('TypeError') || msg.includes('NetworkError')) {
    return 'Unable to connect to Supabase server. Please check your internet connection or try again.';
  }
  return msg || fallbackMsg;
};

/**
 * Upload profile photo to Supabase Storage bucket 'profile-photos' (100 KB max limit)
 */
export const uploadProfilePhotoToSupabaseStorage = async (file, folder = 'profiles') => {
  if (!file) return { success: false, error: 'No file provided' };

  if (file.size > 100 * 1024) {
    return { success: false, error: 'File size exceeds 100 KB limit. Please choose a smaller image.' };
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return { success: false, error: 'Invalid file format. Only JPG, JPEG, and PNG images are allowed.' };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, { upsert: true });

    if (error) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ success: true, url: reader.result });
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ success: true, url: reader.result });
      reader.readAsDataURL(file);
    });
  }
};

/**
 * Upload college logo file to Supabase Storage bucket 'college-logos' (500 KB limit)
 */
export const uploadCollegeLogoToSupabaseStorage = async (file) => {
  if (!file) return { success: false, error: 'No file provided' };

  if (file.size > 500 * 1024) {
    return { success: false, error: 'File size exceeds 500 KB limit. Please choose a smaller image.' };
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return { success: false, error: 'Invalid file format. Only JPG, JPEG, and PNG images are allowed.' };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `logo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { data, error } = await supabase.storage
      .from('college-logos')
      .upload(filePath, file, { upsert: true });

    if (error) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ success: true, url: reader.result });
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('college-logos')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ success: true, url: reader.result });
      reader.readAsDataURL(file);
    });
  }
};

// ====================================================================
// COLLEGE FETCH SERVICE
// ====================================================================

export const fetchCollegeByIdFromSupabase = async (collegeId) => {
  try {
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .eq('id', collegeId)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    return { success: true, college: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const fetchCollegeSubscriptionByIdFromSupabase = async (collegeId) => {
  if (!collegeId) return { success: false, error: 'College ID required' };
  try {
    const [collegeRes, subRes, studentsRes] = await Promise.all([
      supabase.from('colleges').select('*').eq('id', collegeId).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('college_id', collegeId).maybeSingle(),
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('college_id', collegeId)
    ]);

    return {
      success: true,
      college: collegeRes.data,
      subscription: subRes.data,
      studentCount: studentsRes.count || 0
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ====================================================================
// DOCUMENT BRANDING SERVICES
// ====================================================================

export const fetchDocumentBrandingSettingsFromSupabase = async (collegeId) => {
  if (!collegeId) return { success: false, error: 'College ID required' };
  try {
    const { data, error } = await supabase
      .from('document_branding_settings')
      .select('*')
      .eq('college_id', collegeId)
      .maybeSingle();

    if (error) return { success: false, error: error.message };

    if (data) {
      let pptSettings = {};
      try {
        if (data.footer_text && data.footer_text.startsWith('{')) {
          pptSettings = JSON.parse(data.footer_text);
        }
      } catch (e) {}

      const formattedSettings = {
        ...data,
        repeat_header: data.header_enabled ?? data.repeat_header ?? true,
        repeat_footer: data.footer_enabled ?? data.repeat_footer ?? true
      };

      return {
        success: true,
        settings: formattedSettings,
        pdfSettings: formattedSettings,
        pptSettings: Object.keys(pptSettings).length > 0 ? pptSettings : {
          theme: 'Clinical Emerald',
          aspect_ratio: '16:9 (Widescreen)',
          font_family: data.font_family || 'Times New Roman',
          ppt_title_font_size: '22px',
          ppt_subheading_font_size: '20px',
          ppt_body_font_size: '18px',
          header_title: data.college_name || '',
          footer_text: 'Pharm.D Clinical Case Presentation • Confidential',
          show_college_logo: data.show_college_logo ?? true,
          show_hospital_logo: data.show_hospital_logo ?? true,
          show_college_name: data.show_college_name ?? true,
          show_hospital_name: data.show_hospital_name ?? true,
          show_autonomous: data.show_autonomous ?? true,
          show_student_preceptor: true,
          show_watermark: data.watermark_enabled ?? true
        }
      };
    }

    // Default Fallback: Fetch college details and return pre-populated default settings
    const { data: college } = await supabase
      .from('colleges')
      .select('*')
      .eq('id', collegeId)
      .maybeSingle();

    const collegeName = college?.college_name || 'Pharmacy College';
    const defaultPdfSettings = {
      college_id: collegeId,
      show_college_logo: true,
      show_college_name: true,
      show_autonomous: true,
      show_hospital_logo: true,
      show_hospital_name: true,
      watermark_enabled: true,
      watermark_text_line1: college?.college_code ? `${college.college_code} ERP` : 'PHARMDVERSE',
      watermark_text_line2: collegeName,
      watermark_opacity: 10,
      watermark_position: 'Center',
      footer_left_text: collegeName,
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

    const defaultPptSettings = {
      theme: 'Clinical Emerald',
      aspect_ratio: '16:9 (Widescreen)',
      header_title: collegeName,
      footer_text: `${collegeName} • Clinical Case Presentation`,
      font_family: 'Times New Roman',
      ppt_title_font_size: '22px',
      ppt_subheading_font_size: '20px',
      ppt_body_font_size: '18px',
      show_college_logo: true,
      show_hospital_logo: true,
      show_college_name: true,
      show_hospital_name: true,
      show_autonomous: true,
      show_student_preceptor: true,
      show_watermark: true
    };

    return {
      success: true,
      settings: defaultPdfSettings,
      pdfSettings: defaultPdfSettings,
      pptSettings: defaultPptSettings,
      isDefault: true
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const savePdfBrandingSettingsInSupabase = async (collegeId, pdfPayload) => {
  try {
    const { data: existing } = await supabase
      .from('document_branding_settings')
      .select('id')
      .eq('college_id', collegeId)
      .maybeSingle();

    const payload = {
      college_id: collegeId,
      show_college_logo: pdfPayload.show_college_logo ?? true,
      show_college_name: pdfPayload.show_college_name ?? true,
      show_autonomous: pdfPayload.show_autonomous ?? true,
      show_hospital_logo: pdfPayload.show_hospital_logo ?? true,
      show_hospital_name: pdfPayload.show_hospital_name ?? true,
      watermark_enabled: pdfPayload.watermark_enabled ?? true,
      watermark_text_line1: pdfPayload.watermark_text_line1 || 'PHARMDVERSE',
      watermark_text_line2: pdfPayload.watermark_text_line2 || 'Clinical Documentation System',
      watermark_opacity: parseInt(pdfPayload.watermark_opacity, 10) || 10,
      watermark_position: pdfPayload.watermark_position || 'Center',
      footer_left_text: pdfPayload.footer_left_text || 'PharmDVerse',
      footer_center_text: pdfPayload.footer_center_text || 'Confidential Clinical Documentation',
      show_page_number: pdfPayload.show_page_number ?? true,
      show_generated_datetime: pdfPayload.show_generated_datetime ?? true,
      paper_size: pdfPayload.paper_size || 'A4',
      orientation: pdfPayload.orientation || 'Portrait',
      margin_top: pdfPayload.margin_top || '15mm',
      margin_bottom: pdfPayload.margin_bottom || '15mm',
      margin_left: pdfPayload.margin_left || '15mm',
      margin_right: pdfPayload.margin_right || '15mm',
      font_family: pdfPayload.font_family || 'Times New Roman',
      title_font_size: pdfPayload.title_font_size || '16pt',
      heading_font_size: pdfPayload.heading_font_size || '14pt',
      body_font_size: pdfPayload.body_font_size || '12pt',
      primary_color: pdfPayload.primary_color || '#0f172a',
      secondary_color: pdfPayload.secondary_color || '#0284c7',
      table_header_color: pdfPayload.table_header_color || '#f1f5f9',
      border_color: pdfPayload.border_color || '#0f172a',
      text_color: pdfPayload.text_color || '#0f172a',
      zebra_striping: pdfPayload.zebra_striping ?? false,
      repeat_table_header: pdfPayload.repeat_table_header ?? true,
      header_enabled: pdfPayload.repeat_header ?? pdfPayload.header_enabled ?? true,
      footer_enabled: pdfPayload.repeat_footer ?? pdfPayload.footer_enabled ?? true,
      show_student_signature: pdfPayload.show_student_signature ?? true,
      show_preceptor_signature: pdfPayload.show_preceptor_signature ?? true
    };

    if (existing) {
      const { data, error } = await supabase.from('document_branding_settings').update(payload).eq('id', existing.id).select();
      if (error) return { success: false, error: error.message };
      return { success: true, settings: { ...data[0], repeat_header: data[0].header_enabled, repeat_footer: data[0].footer_enabled } };
    } else {
      const { data, error } = await supabase.from('document_branding_settings').insert([payload]).select();
      if (error) return { success: false, error: error.message };
      return { success: true, settings: { ...data[0], repeat_header: data[0].header_enabled, repeat_footer: data[0].footer_enabled } };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const savePptBrandingSettingsInSupabase = async (collegeId, pptPayload) => {
  try {
    const { data: existing } = await supabase
      .from('document_branding_settings')
      .select('id')
      .eq('college_id', collegeId)
      .maybeSingle();

    const updatedPptSettings = {
      theme: pptPayload.theme || 'Clinical Emerald',
      aspect_ratio: pptPayload.aspect_ratio || '16:9 (Widescreen)',
      font_family: pptPayload.font_family || 'Times New Roman',
      ppt_title_font_size: pptPayload.ppt_title_font_size || '22px',
      ppt_subheading_font_size: pptPayload.ppt_subheading_font_size || '20px',
      ppt_body_font_size: pptPayload.ppt_body_font_size || '18px',
      header_title: pptPayload.header_title || '',
      footer_text: pptPayload.footer_text || 'Pharm.D Clinical Case Presentation • Confidential',
      show_college_logo: pptPayload.show_college_logo ?? pptPayload.show_logo ?? true,
      show_hospital_logo: pptPayload.show_hospital_logo ?? true,
      show_college_name: pptPayload.show_college_name ?? true,
      show_hospital_name: pptPayload.show_hospital_name ?? true,
      show_autonomous: pptPayload.show_autonomous ?? true,
      show_student_preceptor: pptPayload.show_student_preceptor ?? true,
      show_watermark: pptPayload.show_watermark ?? true
    };

    const pptJsonStr = JSON.stringify(updatedPptSettings);

    if (existing) {
      const { data, error } = await supabase
        .from('document_branding_settings')
        .update({ footer_text: pptJsonStr })
        .eq('id', existing.id)
        .select();

      if (error) return { success: false, error: error.message };
      return { success: true, pptSettings: updatedPptSettings };
    } else {
      const { data, error } = await supabase
        .from('document_branding_settings')
        .insert([{ college_id: collegeId, footer_text: pptJsonStr }])
        .select();

      if (error) return { success: false, error: error.message };
      return { success: true, pptSettings: updatedPptSettings };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const saveOrUpdateDocumentBrandingSettingsInSupabase = async (collegeId, settingsPayload) => {
  return await savePdfBrandingSettingsInSupabase(collegeId, settingsPayload);
};

export const uploadBrandingAssetToSupabaseStorage = async (file, collegeId, assetType = 'branding') => {
  if (!file) return { success: false, error: 'No file provided' };
  if (!collegeId) return { success: false, error: 'College ID required' };

  if (file.size > 1024 * 1024) {
    return { success: false, error: 'File size exceeds 1 MB limit.' };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${assetType}_${Date.now()}.${fileExt}`;
    const filePath = `${collegeId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('document-branding')
      .upload(filePath, file, { upsert: true });

    if (error) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ success: true, url: reader.result });
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('document-branding')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ success: true, url: reader.result });
      reader.readAsDataURL(file);
    });
  }
};

// ====================================================================
// ADR DOCUMENTATION SERVICES (SINGLE CONSOLIDATED TABLE)
// ====================================================================

export const generateUniqueAdrNumberInSupabase = async (collegeCode = 'CLG') => {
  try {
    const currentYear = new Date().getFullYear();
    const prefix = `ADR-${currentYear}-`;

    const { data, error } = await supabase
      .from('adr_reports')
      .select('adr_number')
      .like('adr_number', `${prefix}%`)
      .order('adr_number', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (data && data.length > 0 && data[0].adr_number) {
      const lastId = data[0].adr_number;
      const parts = lastId.split('-');
      if (parts.length === 3) {
        const parsedNum = parseInt(parts[2], 10);
        if (!isNaN(parsedNum)) nextNumber = parsedNum + 1;
      }
    }

    const formattedSequence = String(nextNumber).padStart(6, '0');
    return { success: true, adrNumber: `${prefix}${formattedSequence}` };
  } catch (err) {
    return { success: false, adrNumber: `ADR-2026-000001` };
  }
};

export const fetchADRReportByCaseIdFromSupabase = async (clinicalCaseId) => {
  try {
    const { data: report, error } = await supabase
      .from('adr_reports')
      .select('*')
      .eq('clinical_case_id', clinicalCaseId)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    if (!report) return { success: true, report: null, suspectedMeds: [], concomitantMeds: [], attachments: [] };

    return {
      success: true,
      report,
      suspectedMeds: report.suspected_medications || [],
      concomitantMeds: report.concomitant_medications || [],
      attachments: report.attachments || []
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const saveOrUpdateADRReportInSupabase = async (masterPayload, suspectedMeds = [], concomitantMeds = [], attachments = []) => {
  try {
    const VALID_ADR_COLS = new Set([
      'id', 'created_at', 'updated_at', 'clinical_case_id', 'student_id', 'college_id',
      'adr_number', 'reporting_date', 'reported_by_student_name', 'assigned_preceptor_name',
      'patient_initials', 'hospital_reg_number', 'age', 'gender', 'weight', 'department', 'ward',
      'primary_diagnosis', 'reaction_title', 'reaction_category', 'reaction_description',
      'reaction_started_at', 'reaction_ended_at', 'reaction_duration',
      'clinical_management_provided', 'current_patient_condition', 'drug_allergy_history',
      'previous_adr_history', 'relevant_medical_conditions', 'pregnancy_lactation_status',
      'renal_status', 'hepatic_status', 'lifestyle_factors', 'additional_clinical_notes',
      'reaction_severity', 'reaction_seriousness', 'patient_outcome',
      'action_taken_on_suspected_drug', 'rechallenge_information', 'dechallenge_information',
      'initial_causality_opinion', 'clinical_remarks', 'student_remarks', 'preceptor_review',
      'faculty_comments', 'approval_status', 'suspected_medications', 'concomitant_medications', 'attachments'
    ]);

    const fullPayloadRaw = {
      ...masterPayload,
      suspected_medications: suspectedMeds,
      concomitant_medications: concomitantMeds,
      attachments: attachments
    };

    const fullPayload = {};
    Object.keys(fullPayloadRaw).forEach(k => {
      if (VALID_ADR_COLS.has(k)) fullPayload[k] = fullPayloadRaw[k];
    });

    const { data: existing } = await supabase
      .from('adr_reports')
      .select('id')
      .eq('clinical_case_id', masterPayload.clinical_case_id)
      .maybeSingle();

    let savedReport = null;

    if (existing && existing.id) {
      const { data, error } = await supabase
        .from('adr_reports')
        .update(fullPayload)
        .eq('id', existing.id)
        .select();

      if (error) return { success: false, error: error.message };
      savedReport = data[0];
    } else {
      const { data, error } = await supabase
        .from('adr_reports')
        .insert([fullPayload])
        .select();

      if (error) return { success: false, error: error.message };
      savedReport = data[0];
    }

    return { success: true, report: savedReport };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ====================================================================
// DRUG INFORMATION REQUEST SERVICES
// ====================================================================

export const fetchDrugInformationRequestByCaseIdFromSupabase = async (clinicalCaseId) => {
  try {
    const { data: request, error } = await supabase
      .from('drug_information_requests')
      .select('*')
      .eq('clinical_case_id', clinicalCaseId)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    return { success: true, request: request || null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const saveOrUpdateDrugInformationRequestInSupabase = async (payload) => {
  try {
    const VALID_DIR_COLS = new Set([
      'id', 'created_at', 'updated_at', 'clinical_case_id', 'student_id', 'college_id',
      'request_date', 'request_time', 'enquirer_name', 'designation', 'phone_no', 'unit_ward',
      'professional_status', 'professional_status_other', 'mode_of_request', 'answer_needed',
      'details_of_enquiry', 'question_category', 'purpose_of_enquiry', 'purpose_other',
      'age', 'sex', 'weight_kg', 'allergies', 'current_medical_problem', 'is_pregnant_lactating',
      'pregnancy_lactation_details', 'other_investigations', 'drug_therapy',
      'answer_given_timeframe', 'reason_for_delay', 'mode_of_reply', 'information_provided',
      'ref_textbooks', 'ref_journals', 'ref_micromedex', 'ref_clinirex', 'ref_idis', 'ref_website', 'ref_others', 'status'
    ]);

    const cleanPayload = {};
    Object.keys(payload || {}).forEach(k => {
      if (VALID_DIR_COLS.has(k)) cleanPayload[k] = payload[k];
    });

    const { data: existing } = await supabase
      .from('drug_information_requests')
      .select('id')
      .eq('clinical_case_id', cleanPayload.clinical_case_id)
      .maybeSingle();

    let savedData = null;

    if (existing && existing.id) {
      const { data, error } = await supabase
        .from('drug_information_requests')
        .update(cleanPayload)
        .eq('id', existing.id)
        .select();

      if (error) return { success: false, error: error.message };
      savedData = data[0];
    } else {
      const { data, error } = await supabase
        .from('drug_information_requests')
        .insert([cleanPayload])
        .select();

      if (error) return { success: false, error: error.message };
      savedData = data[0];
    }

    return { success: true, request: savedData };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ====================================================================
// PHARMACIST INTERVENTION SERVICES
// ====================================================================

export const fetchPharmacistInterventionByCaseIdFromSupabase = async (clinicalCaseId) => {
  try {
    const { data: intervention, error } = await supabase
      .from('pharmacist_interventions')
      .select('*')
      .eq('clinical_case_id', clinicalCaseId)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    return { success: true, intervention: intervention || null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const saveOrUpdatePharmacistInterventionInSupabase = async (payload) => {
  try {
    const VALID_INTERVENTION_COLS = new Set([
      'id', 'created_at', 'updated_at', 'clinical_case_id', 'student_id', 'college_id',
      'patient_name', 'age', 'sex', 'date_of_intervention', 'ip_op_no', 'ward',
      'present_diagnosis', 'prescription_details', 'prescription_problems',
      'prescription_problem_other', 'description_of_problem', 'action_taken',
      'action_taken_other', 'recommendations', 'recommendation_other',
      'background_info_collected', 'discussed_with_physician', 'suggestions_appropriate_time',
      'accepted', 'changed', 'reasons_if_no', 'significance_of_intervention', 'outcome',
      'references_text', 'follow_up', 'status'
    ]);

    const cleanPayload = {};
    Object.keys(payload || {}).forEach(k => {
      if (VALID_INTERVENTION_COLS.has(k)) cleanPayload[k] = payload[k];
    });

    const { data: existing } = await supabase
      .from('pharmacist_interventions')
      .select('id')
      .eq('clinical_case_id', cleanPayload.clinical_case_id)
      .maybeSingle();

    let savedData = null;

    if (existing && existing.id) {
      const { data, error } = await supabase
        .from('pharmacist_interventions')
        .update(cleanPayload)
        .eq('id', existing.id)
        .select();

      if (error) return { success: false, error: error.message };
      savedData = data[0];
    } else {
      const { data, error } = await supabase
        .from('pharmacist_interventions')
        .insert([cleanPayload])
        .select();

      if (error) return { success: false, error: error.message };
      savedData = data[0];
    }

    return { success: true, intervention: savedData };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ====================================================================
// PATIENT COUNSELLING SERVICES
// ====================================================================

export const fetchPatientCounsellingByCaseIdFromSupabase = async (clinicalCaseId) => {
  try {
    const { data: counselling, error } = await supabase
      .from('patient_counselling')
      .select('*')
      .eq('clinical_case_id', clinicalCaseId)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    return { success: true, counselling: counselling || null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const saveOrUpdatePatientCounsellingInSupabase = async (payload) => {
  try {
    const VALID_COUNSELLING_COLS = new Set([
      'id', 'created_at', 'updated_at', 'clinical_case_id', 'student_id', 'college_id',
      'counselling_date', 'counselling_time', 'patient_type', 'ip_op_number', 'unit_ward',
      'age', 'sex', 'allergies', 'specific_background_collected', 'disease_counselled',
      'medications_counselled', 'points_covered', 'major_barriers_involved', 'barrier_details',
      'barrier_overcome', 'time_taken', 'counselling_provided_to', 'representative_reasons',
      'representative_other_reason', 'counselling_aids_used', 'counselling_material_provided',
      'understanding_ascertained', 'status'
    ]);

    const cleanPayload = {};
    Object.keys(payload || {}).forEach(k => {
      if (VALID_COUNSELLING_COLS.has(k)) cleanPayload[k] = payload[k];
    });

    const { data: existing } = await supabase
      .from('patient_counselling')
      .select('id')
      .eq('clinical_case_id', cleanPayload.clinical_case_id)
      .maybeSingle();

    let savedData = null;

    if (existing && existing.id) {
      const { data, error } = await supabase
        .from('patient_counselling')
        .update(cleanPayload)
        .eq('id', existing.id)
        .select();

      if (error) return { success: false, error: error.message };
      savedData = data[0];
    } else {
      const { data, error } = await supabase
        .from('patient_counselling')
        .insert([cleanPayload])
        .select();

      if (error) return { success: false, error: error.message };
      savedData = data[0];
    }

    return { success: true, counselling: savedData };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ====================================================================
// PATIENT PROFILE & CHILD TABLES SERVICES
// ====================================================================

export const fetchPatientProfileByCaseIdFromSupabase = async (clinicalCaseId) => {
  try {
    const { data: profile, error: profileErr } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('clinical_case_id', clinicalCaseId)
      .maybeSingle();

    if (profileErr) return { success: false, error: profileErr.message };
    if (!profile) return { success: true, profile: null, labInvestigations: [], prescribedDrugs: [] };

    const [labRes, drugRes] = await Promise.all([
      supabase.from('patient_lab_investigations').select('*').eq('patient_profile_id', profile.id).order('created_at', { ascending: true }),
      supabase.from('patient_prescribed_drugs').select('*').eq('patient_profile_id', profile.id).order('s_no', { ascending: true })
    ]);

    return {
      success: true,
      profile,
      labInvestigations: labRes.data || [],
      prescribedDrugs: drugRes.data || []
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const saveOrUpdatePatientProfileInSupabase = async (payload) => {
  try {
    const VALID_COLS = new Set([
      'id', 'created_at', 'updated_at', 'clinical_case_id', 'student_id', 'college_id',
      'patient_name', 'age', 'gender', 'ip_no', 'height', 'weight', 'bmi', 'ward',
      'department', 'doa', 'doc', 'dod', 'physician', 'chief_complaints',
      'past_medical_history', 'past_medication_history', 'family_history',
      'smoker_pack_day', 'smoker_duration', 'alcoholic_amount_day', 'alcoholic_duration',
      'allergy_food', 'allergy_drugs', 'marital_status', 'cyanosis', 'icterus', 'pallor',
      'cvs', 'gi', 'rs', 'cns', 'provisional_diagnosis', 'vital_signs',
      'other_investigations', 'final_diagnosis', 'discharge_summary', 'status'
    ]);

    const cleanPayload = {};
    Object.keys(payload || {}).forEach(key => {
      if (VALID_COLS.has(key)) {
        cleanPayload[key] = payload[key];
      }
    });

    const { data: existing } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('clinical_case_id', cleanPayload.clinical_case_id)
      .maybeSingle();

    let savedProfile = null;

    if (existing && existing.id) {
      const { data, error } = await supabase
        .from('patient_profiles')
        .update(cleanPayload)
        .eq('id', existing.id)
        .select();

      if (error) return { success: false, error: error.message };
      savedProfile = data[0];
    } else {
      const { data, error } = await supabase
        .from('patient_profiles')
        .insert([cleanPayload])
        .select();

      if (error) return { success: false, error: error.message };
      savedProfile = data[0];
    }

    return { success: true, profile: savedProfile };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const saveLabInvestigationsInSupabase = async (patientProfileId, labRecords) => {
  try {
    await supabase.from('patient_lab_investigations').delete().eq('patient_profile_id', patientProfileId);
    if (!labRecords || labRecords.length === 0) return { success: true, data: [] };

    const payloads = labRecords.map(r => ({
      patient_profile_id: patientProfileId,
      category: r.category || 'General',
      parameter_name: r.parameter_name,
      reference_range: r.reference_range || null,
      test_date: r.test_date || new Date().toISOString().split('T')[0],
      test_value: r.test_value || null,
      unit: r.unit || null
    }));

    const { data, error } = await supabase.from('patient_lab_investigations').insert(payloads).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const savePrescribedDrugsInSupabase = async (patientProfileId, drugRecords) => {
  try {
    await supabase.from('patient_prescribed_drugs').delete().eq('patient_profile_id', patientProfileId);
    if (!drugRecords || drugRecords.length === 0) return { success: true, data: [] };

    const payloads = drugRecords.map((d, index) => ({
      patient_profile_id: patientProfileId,
      s_no: d.s_no || index + 1,
      trade_name: d.trade_name,
      generic_name: d.generic_name,
      route_of_admin: d.route_of_admin || 'Oral',
      dose: d.dose,
      frequency: d.frequency || 'OD',
      start_date: d.start_date || null,
      stop_date: d.stop_date || null
    }));

    const { data, error } = await supabase.from('patient_prescribed_drugs').insert(payloads).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ====================================================================
// CLINICAL CASES SERVICES
// ====================================================================

export const generateUniqueCaseIdInSupabase = async (collegeCode = 'CLG') => {
  try {
    const currentYear = new Date().getFullYear();
    const prefix = `${collegeCode.toUpperCase()}-${currentYear}-`;

    const { data, error } = await supabase
      .from('clinical_cases')
      .select('case_id')
      .like('case_id', `${prefix}%`)
      .order('case_id', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (data && data.length > 0 && data[0].case_id) {
      const lastId = data[0].case_id;
      const parts = lastId.split('-');
      if (parts.length === 3) {
        const parsedNum = parseInt(parts[2], 10);
        if (!isNaN(parsedNum)) nextNumber = parsedNum + 1;
      }
    }

    const formattedSequence = String(nextNumber).padStart(6, '0');
    return { success: true, caseId: `${prefix}${formattedSequence}` };
  } catch (err) {
    return { success: false, caseId: `${collegeCode.toUpperCase()}-2026-000001` };
  }
};

export const insertClinicalCaseToSupabase = async (casePayload) => {
  try {
    const sanitizedIpOp = (casePayload.ipOpType || 'IP').includes('OP') ? 'OP' : 'IP';

    // 1. Try calling the Supabase RPC first (concurrency-safe)
    const { data, error } = await supabase.rpc('create_clinical_case', {
      p_student_id: casePayload.studentId,
      p_college_id: casePayload.collegeId,
      p_preceptor_id: casePayload.preceptorId || null,
      p_hospital_name: casePayload.hospitalName,
      p_department: casePayload.department,
      p_ward_unit: casePayload.wardUnit,
      p_ip_op_type: sanitizedIpOp,
      p_date_of_admission: casePayload.dateOfAdmission,
      p_academic_year: casePayload.academicYear || '2026–2027',
      p_status: casePayload.status || 'Draft',
      p_final_diagnosis: casePayload.finalDiagnosis || null
    });

    if (!error && data && data.success) {
      if (casePayload.finalDiagnosis && data.id) {
        try {
          const { data: existingProf } = await supabase
            .from('patient_profiles')
            .select('id')
            .eq('clinical_case_id', data.id)
            .maybeSingle();

          if (existingProf) {
            await supabase
              .from('patient_profiles')
              .update({ final_diagnosis: casePayload.finalDiagnosis })
              .eq('id', existingProf.id);
          } else {
            await supabase
              .from('patient_profiles')
              .insert([{
                clinical_case_id: data.id,
                final_diagnosis: casePayload.finalDiagnosis,
                status: 'Draft'
              }]);
          }
        } catch (e) {
          console.warn('Could not save finalDiagnosis to patient_profiles:', e);
        }
      }

      return { 
        success: true, 
        data: {
          id: data.id,
          case_id: data.case_id,
          ...casePayload,
          ipOpType: sanitizedIpOp
        } 
      };
    }

    if (!error && data && !data.success) {
      return { success: false, error: data.error };
    }

    const isRpcMissing = error && (
      error.code === '42883' || 
      error.message?.includes('Could not find the function') || 
      error.message?.includes('does not exist')
    );

    if (!isRpcMissing) {
      return { success: false, error: error?.message || 'Database error occurred.' };
    }

    // 2. Client-Side Fallback: If RPC does not exist, run sequential generation on the client
    console.warn('Supabase RPC create_clinical_case not found. Falling back to client-side sequential generation.');

    const [studentRes, collegeRes] = await Promise.all([
      supabase.from('students').select('roll_number').eq('id', casePayload.studentId).maybeSingle(),
      supabase.from('colleges').select('college_code').eq('id', casePayload.collegeId).maybeSingle()
    ]);

    const rollNumber = studentRes.data?.roll_number || 'UNKNOWN';
    const collegeCode = collegeRes.data?.college_code || 'CLG';
    const currentYear = new Date().getFullYear();

    let insertedRecord = null;
    let retries = 0;
    let success = false;
    let lastErrorMsg = '';

    while (!success && retries < 5) {
      const { count, error: countErr } = await supabase
        .from('clinical_cases')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', casePayload.studentId);

      if (countErr) {
        return { success: false, error: `Fallback failed: ${countErr.message}` };
      }

      const nextCaseNumber = (count || 0) + 1;
      const paddedNumber = String(nextCaseNumber).padStart(4, '0');
      const caseId = `${collegeCode}-${currentYear}-${rollNumber}-${paddedNumber}`;

      const { data: insertData, error: insertErr } = await supabase
        .from('clinical_cases')
        .insert([{
          case_id: caseId,
          case_number: nextCaseNumber,
          roll_number: rollNumber,
          college_id: casePayload.collegeId,
          student_id: casePayload.studentId,
          preceptor_id: casePayload.preceptorId || null,
          hospital_name: casePayload.hospitalName,
          department: casePayload.department,
          ward_unit: casePayload.wardUnit,
          ip_op_type: sanitizedIpOp,
          date_of_admission: casePayload.dateOfAdmission,
          date_of_collection: casePayload.dateOfAdmission,
          academic_year: casePayload.academicYear || '2026–2027',
          status: casePayload.status || 'Draft',
          final_diagnosis: casePayload.finalDiagnosis || null
        }])
        .select();

      if (!insertErr) {
        insertedRecord = insertData[0];
        success = true;
      } else {
        lastErrorMsg = insertErr.message;
        if (insertErr.code === '23505') {
          retries++;
        } else {
          const isColumnsMissing = insertErr.code === '42703' || insertErr.message?.includes('column') || insertErr.message?.includes('does not exist');
          if (isColumnsMissing) {
            console.warn('Columns case_number or roll_number do not exist. Falling back to legacy insert.');
            const { data: legacyData, error: legacyErr } = await supabase
              .from('clinical_cases')
              .insert([{
                case_id: caseId,
                college_id: casePayload.collegeId,
                student_id: casePayload.studentId,
                preceptor_id: casePayload.preceptorId || null,
                hospital_name: casePayload.hospitalName,
                department: casePayload.department,
                ward_unit: casePayload.wardUnit,
                ip_op_type: casePayload.ipOpType,
                date_of_admission: casePayload.dateOfAdmission,
                date_of_collection: casePayload.dateOfAdmission,
                academic_year: casePayload.academicYear || '2026–2027',
                status: casePayload.status || 'Draft'
              }])
              .select();

            if (!legacyErr) {
              return { success: true, data: legacyData[0] };
            } else {
              return { success: false, error: legacyErr.message };
            }
          }
          return { success: false, error: insertErr.message };
        }
      }
    }

    if (success && insertedRecord) {
      if (casePayload.finalDiagnosis) {
        try {
          const { data: existingProf } = await supabase
            .from('patient_profiles')
            .select('id')
            .eq('clinical_case_id', insertedRecord.id)
            .maybeSingle();

          if (existingProf) {
            await supabase
              .from('patient_profiles')
              .update({ final_diagnosis: casePayload.finalDiagnosis })
              .eq('id', existingProf.id);
          } else {
            await supabase
              .from('patient_profiles')
              .insert([{
                clinical_case_id: insertedRecord.id,
                final_diagnosis: casePayload.finalDiagnosis,
                status: 'Draft'
              }]);
          }
        } catch (e) {
          console.warn('Could not save finalDiagnosis to patient_profiles:', e);
        }
      }
      return { success: true, data: insertedRecord };
    } else {
      return { success: false, error: `Failed to insert clinical case fallback: ${lastErrorMsg}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const fetchStudentCasesFromSupabase = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('clinical_cases')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
};

export const fetchStudentCasesForPreceptorFromSupabase = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('clinical_cases')
      .select('*')
      .eq('student_id', studentId)
      .neq('status', 'Draft')
      .order('created_at', { ascending: false });

    if (error) return { success: false, data: [], error: error.message };
    const filtered = (data || []).filter(c => c.status !== 'Draft' && c.overall_case_status !== 'Draft');
    return { success: true, data: filtered };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
};

export const updateClinicalCaseInSupabase = async (caseRecordId, casePayload) => {
  try {
    const updateObj = {
      hospital_name: casePayload.hospitalName,
      department: casePayload.department,
      ward_unit: casePayload.wardUnit,
      ip_op_type: casePayload.ipOpType,
      date_of_admission: casePayload.dateOfAdmission,
      date_of_collection: casePayload.dateOfCollection,
      final_diagnosis: casePayload.finalDiagnosis || null
    };
    if (casePayload.status) {
      updateObj.status = casePayload.status;
    }

    const { data, error } = await supabase
      .from('clinical_cases')
      .update(updateObj)
      .eq('id', caseRecordId)
      .select();

    if (error) return { success: false, error: error.message };

    if (casePayload.finalDiagnosis !== undefined && caseRecordId) {
      try {
        const { data: existingProf } = await supabase
          .from('patient_profiles')
          .select('id')
          .eq('clinical_case_id', caseRecordId)
          .maybeSingle();

        if (existingProf) {
          await supabase
            .from('patient_profiles')
            .update({ final_diagnosis: casePayload.finalDiagnosis })
            .eq('id', existingProf.id);
        } else if (casePayload.finalDiagnosis) {
          await supabase
            .from('patient_profiles')
            .insert([{
              clinical_case_id: caseRecordId,
              final_diagnosis: casePayload.finalDiagnosis,
              status: 'Draft'
            }]);
        }
      } catch (e) {
        console.warn('Could not update finalDiagnosis in patient_profiles:', e);
      }
    }

    return { success: true, data: data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const deleteClinicalCaseFromSupabase = async (caseRecordId) => {
  try {
    if (!caseRecordId) return { success: false, error: 'Invalid Case ID' };

    // Fetch profile id if exists to clean up labs and drugs
    const { data: profile } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('clinical_case_id', caseRecordId)
      .maybeSingle();

    if (profile?.id) {
      await Promise.all([
        supabase.from('patient_lab_investigations').delete().eq('patient_profile_id', profile.id),
        supabase.from('patient_prescribed_drugs').delete().eq('patient_profile_id', profile.id)
      ]);
    }

    // Cascade delete across all child module tables
    await Promise.all([
      supabase.from('patient_profiles').delete().eq('clinical_case_id', caseRecordId),
      supabase.from('patient_counselling').delete().eq('clinical_case_id', caseRecordId),
      supabase.from('pharmacist_interventions').delete().eq('clinical_case_id', caseRecordId),
      supabase.from('drug_information_requests').delete().eq('clinical_case_id', caseRecordId),
      supabase.from('adr_reports').delete().eq('clinical_case_id', caseRecordId),
      supabase.from('workflow_notifications').delete().eq('clinical_case_id', caseRecordId),
      supabase.from('clinical_case_review_history').delete().eq('clinical_case_id', caseRecordId)
    ]);

    // Finally delete from clinical_cases table
    const { error } = await supabase.from('clinical_cases').delete().eq('id', caseRecordId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ====================================================================
// PRECEPTOR PORTAL SERVICES
// ====================================================================

export const authenticatePreceptorInSupabase = async (username, password, currentCollegeId = null) => {
  try {
    const inputHash = await hashPassword(password);
    if (!inputHash) return { success: false, error: 'Invalid password format' };

    const { data: preceptor, error } = await supabase
      .from('preceptors')
      .select('*, colleges(*)')
      .or(`username.eq.${username},email.eq.${username}`)
      .maybeSingle();

    if (error || !preceptor) return { success: false, error: 'Invalid Username or Password' };
    if (preceptor.colleges?.status === 'Inactive' || preceptor.colleges?.status === 'Disabled') {
      return { success: false, error: 'Your college portal is currently inactive. Please contact the System Administrator.' };
    }
    if (preceptor.status !== 'Active') return { success: false, error: 'Your Preceptor account is currently Inactive. Contact College Admin.' };
    if (preceptor.password_hash !== inputHash) {
      // Increment failed login attempts
      await supabase.from('preceptors').update({ failed_login_attempts: (preceptor.failed_login_attempts || 0) + 1 }).eq('id', preceptor.id);
      return { success: false, error: 'Invalid Username or Password' };
    }

    // Dynamic Multi-College Login Isolation Check
    if (currentCollegeId && preceptor.college_id !== currentCollegeId) {
      return { success: false, error: 'These credentials are not valid for this college.' };
    }

    // Successful login - update last_login_at and reset failed attempts
    await supabase.from('preceptors').update({ last_login_at: new Date().toISOString(), failed_login_attempts: 0 }).eq('id', preceptor.id);

    return { success: true, preceptor };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const fetchPreceptorAssignedStudentsFromSupabase = async (preceptorId) => {
  try {
    const { data, error } = await supabase
      .from('student_preceptor_assignments')
      .select(`*, students(*)`)
      .eq('preceptor_id', preceptorId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
};

// ====================================================================
// STUDENT PORTAL SERVICES
// ====================================================================

export const authenticateStudentInSupabase = async (username, password, currentCollegeId = null) => {
  try {
    const inputHash = await hashPassword(password);
    if (!inputHash) return { success: false, error: 'Invalid password format' };

    const { data: student, error } = await supabase
      .from('students')
      .select('*, colleges(*)')
      .or(`username.eq.${username},roll_number.eq.${username},email.eq.${username}`)
      .maybeSingle();

    if (error || !student) return { success: false, error: 'Invalid Username or Password' };
    if (student.colleges?.status === 'Inactive' || student.colleges?.status === 'Disabled') {
      return { success: false, error: 'Your college portal is currently inactive. Please contact the System Administrator.' };
    }
    if (student.status !== 'Active') return { success: false, error: 'Your Student account is currently Inactive. Contact College Admin.' };
    if (student.password_hash !== inputHash) {
      // Increment failed login attempts
      await supabase.from('students').update({ failed_login_attempts: (student.failed_login_attempts || 0) + 1 }).eq('id', student.id);
      return { success: false, error: 'Invalid Username or Password' };
    }

    // Dynamic Multi-College Login Isolation Check
    if (currentCollegeId && student.college_id !== currentCollegeId) {
      return { success: false, error: 'These credentials are not valid for this college.' };
    }

    // Successful login - update last_login_at and reset failed attempts
    await supabase.from('students').update({ last_login_at: new Date().toISOString(), failed_login_attempts: 0 }).eq('id', student.id);

    return { success: true, student };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const fetchStudentAssignedPreceptorFromSupabase = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('student_preceptor_assignments')
      .select(`*, preceptors(*)`)
      .eq('student_id', studentId)
      .eq('status', 'Active')
      .maybeSingle();

    if (error) return { success: false, data: null, error: error.message };
    return { success: true, data: data ? data.preceptors : null, assignment: data };
  } catch (err) {
    return { success: false, data: null, error: err.message };
  }
};

// ====================================================================
// STUDENT-PRECEPTOR ASSIGNMENTS CORE SERVICES
// ====================================================================

export const fetchAssignmentsFromSupabase = async (collegeId, preceptorId = null) => {
  try {
    let query = supabase
      .from('student_preceptor_assignments')
      .select(`*, students(*), preceptors(*)`)
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false });

    if (preceptorId) query = query.eq('preceptor_id', preceptorId);

    const { data, error } = await query;
    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
};

export const assignStudentsToPreceptorInSupabase = async ({ collegeId, preceptorId, studentIds, assignmentDate, remarks, status = 'Active' }) => {
  try {
    if (status === 'Active') {
      const { data: existingActive } = await supabase
        .from('student_preceptor_assignments')
        .select('student_id, students(roll_number, full_name)')
        .eq('college_id', collegeId)
        .eq('status', 'Active')
        .in('student_id', studentIds);

      if (existingActive && existingActive.length > 0) {
        const conflictNames = existingActive.map(a => a.students ? `${a.students.full_name} (${a.students.roll_number})` : a.student_id).join(', ');
        return { 
          success: false, 
          error: `The following student(s) already have an active preceptor assignment: ${conflictNames}. Please remove or deactivate their existing assignment before reassigning.` 
        };
      }
    }

    const dateToSave = assignmentDate || new Date().toISOString().split('T')[0];
    const payloads = studentIds.map(sId => ({
      college_id: collegeId,
      preceptor_id: preceptorId,
      student_id: sId,
      assignment_date: dateToSave,
      remarks: remarks || null,
      status: status
    }));

    const { data, error } = await supabase.from('student_preceptor_assignments').insert(payloads).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const updateAssignmentInSupabase = async (assignmentId, payload) => {
  try {
    const { data, error } = await supabase
      .from('student_preceptor_assignments')
      .update({ assignment_date: payload.assignmentDate, remarks: payload.remarks || null, status: payload.status || 'Active' })
      .eq('id', assignmentId)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const removeAssignmentFromSupabase = async (assignmentId) => {
  try {
    const { error } = await supabase.from('student_preceptor_assignments').delete().eq('id', assignmentId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ====================================================================
// PRECEPTOR CRUD SERVICES
// ====================================================================

export const fetchPreceptorsFromSupabase = async (collegeId) => {
  try {
    let query = supabase.from('preceptors').select('*').order('created_at', { ascending: false });
    if (collegeId) query = query.eq('college_id', collegeId);

    const { data, error } = await query;
    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
};

export const fetchPreceptorByIdFromSupabase = async (preceptorId) => {
  if (!preceptorId) return { success: false, error: 'Preceptor ID required' };
  try {
    const { data, error } = await supabase
      .from('preceptors')
      .select('*')
      .eq('id', preceptorId)
      .maybeSingle();

    if (error || !data) return { success: false, error: error?.message || 'Preceptor not found' };
    return { success: true, preceptor: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const insertPreceptorToSupabase = async (collegeId, preceptorData) => {
  try {
    const passwordHash = await hashPassword(preceptorData.password);
    if (!passwordHash) return { success: false, error: 'Password hashing failed' };

    const payload = {
      college_id: collegeId,
      full_name: preceptorData.fullName,
      gender: preceptorData.gender,
      mobile_number: preceptorData.mobileNumber,
      email: preceptorData.email,
      qualification: preceptorData.qualification,
      designation: preceptorData.designation,
      department: preceptorData.department,
      username: preceptorData.email,
      password_hash: passwordHash,
      profile_photo_url: preceptorData.profilePhotoUrl || null,
      status: preceptorData.status || 'Active'
    };

    const { data, error } = await supabase.from('preceptors').insert([payload]).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data: data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const updatePreceptorInSupabase = async (preceptorId, preceptorData) => {
  try {
    const payload = {
      full_name: preceptorData.fullName,
      gender: preceptorData.gender,
      mobile_number: preceptorData.mobileNumber,
      email: preceptorData.email,
      qualification: preceptorData.qualification,
      designation: preceptorData.designation,
      department: preceptorData.department,
      username: preceptorData.email,
      profile_photo_url: preceptorData.profilePhotoUrl || null,
      status: preceptorData.status || 'Active'
    };

    if (preceptorData.password) {
      const passwordHash = await hashPassword(preceptorData.password);
      if (passwordHash) payload.password_hash = passwordHash;
    }

    const { data, error } = await supabase.from('preceptors').update(payload).eq('id', preceptorId).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data: data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const deletePreceptorFromSupabase = async (preceptorId) => {
  try {
    const { error } = await supabase.from('preceptors').delete().eq('id', preceptorId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ====================================================================
// STUDENT CRUD SERVICES
// ====================================================================

export const fetchStudentsFromSupabase = async (collegeId) => {
  try {
    let query = supabase.from('students').select('*').order('created_at', { ascending: false });
    if (collegeId) query = query.eq('college_id', collegeId);

    const { data, error } = await query;
    if (error) return { success: false, data: [], students: [], error: error.message };
    return { success: true, data: data || [], students: data || [] };
  } catch (err) {
    return { success: false, data: [], students: [], error: err.message };
  }
};

export const insertStudentToSupabase = async (collegeId, studentData) => {
  try {
    const passwordHash = await hashPassword(studentData.password);
    if (!passwordHash) return { success: false, error: 'Password hashing failed' };

    const payload = {
      college_id: collegeId,
      roll_number: studentData.rollNumber,
      full_name: studentData.fullName,
      gender: studentData.gender,
      mobile_number: studentData.mobileNumber || null,
      email: studentData.email,
      batch: studentData.batch,
      course: studentData.course || 'Pharm.D',
      academic_year: studentData.academicYear || '2026–2027',
      year: studentData.year,
      username: studentData.rollNumber,
      password_hash: passwordHash,
      profile_photo_url: studentData.profilePhotoUrl || null,
      status: studentData.status || 'Active'
    };

    const { data, error } = await supabase.from('students').insert([payload]).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data: data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const updateStudentInSupabase = async (studentId, studentData) => {
  try {
    const payload = {
      roll_number: studentData.rollNumber,
      full_name: studentData.fullName,
      gender: studentData.gender,
      mobile_number: studentData.mobileNumber || null,
      email: studentData.email,
      batch: studentData.batch,
      course: studentData.course || 'Pharm.D',
      academic_year: studentData.academicYear || '2026–2027',
      year: studentData.year,
      username: studentData.rollNumber,
      profile_photo_url: studentData.profilePhotoUrl || null,
      status: studentData.status || 'Active'
    };

    if (studentData.password) {
      const passwordHash = await hashPassword(studentData.password);
      if (passwordHash) payload.password_hash = passwordHash;
    }

    const { data, error } = await supabase.from('students').update(payload).eq('id', studentId).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data: data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const deleteStudentFromSupabase = async (studentId) => {
  try {
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const promoteStudentsBatchInSupabase = async (studentIds, targetYear, targetAcademicYear) => {
  try {
    if (!studentIds || studentIds.length === 0) return { success: false, error: 'No students selected for promotion.' };
    
    const payload = {
      year: targetYear
    };
    if (targetAcademicYear) {
      payload.academic_year = targetAcademicYear;
    }

    const { data, error } = await supabase
      .from('students')
      .update(payload)
      .in('id', studentIds)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, count: data?.length || studentIds.length, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ====================================================================
// REGISTRATION REQUEST & COLLEGE CORE SERVICES
// ====================================================================

export const submitCollegeRegistrationToSupabase = async (formData) => {
  const payload = {
    college_name: formData.collegeName,
    city: formData.city,
    state: formData.state,
    contact_person: formData.contactName,
    mobile_number: formData.mobileNumber,
    email: formData.email,
    status: 'Pending'
  };

  try {
    const { data, error } = await supabase.from('registration_requests').insert([payload]).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data: data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const fetchRegistrationRequestsFromSupabase = async () => {
  try {
    const { data, error } = await supabase.from('registration_requests').select('*').order('created_at', { ascending: false });
    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
};

export const approveCollegeInSupabase = async (request) => {
  try {
    await supabase.from('registration_requests').update({ status: 'Approved', approved_at: new Date().toISOString() }).eq('id', request.id);

    const collegeCode = request.code || `${(request.collegeName || request.college_name).substring(0, 4).toUpperCase()}-${request.city.substring(0, 3).toUpperCase()}`;

    const collegePayload = {
      registration_request_id: request.id,
      college_code: collegeCode,
      college_name: request.collegeName || request.college_name,
      college_logo_url: request.collegeLogoUrl || null,
      college_description: request.collegeDescription || null,
      college_admin_username: request.email,
      address: request.address || null,
      city: request.city,
      district: request.district || null,
      state: request.state,
      pincode: request.pinCode || request.pincode || null,
      university_affiliation: request.universityAffiliation || null,
      pci_approval_number: request.pciApprovalNo || null,
      principal_name: request.contactName || request.contact_person,
      principal_mobile: request.mobileNumber || request.mobile_number,
      principal_email: request.email,
      hospital_name: request.hospitalName || request.hospital_name || request.primaryHospitalName || null,
      is_autonomous: Boolean(request.isAutonomous),
      status: 'Active'
    };

    const { data: collegeData, error: collegeErr } = await supabase.from('colleges').insert([collegePayload]).select();
    if (collegeErr) return { success: false, error: collegeErr.message };

    const createdCollege = collegeData[0];

    const subscriptionPayload = {
      college_id: createdCollege.id,
      plan_name: request.subscriptionPlan || 'Professional',
      subscription_start_date: new Date().toISOString().split('T')[0],
      subscription_expiry_date: '2027-08-04',
      maximum_students: parseInt(request.maxStudentsAllowed, 10) || 600,
      status: 'Active'
    };

    const { data: subData } = await supabase.from('subscriptions').insert([subscriptionPayload]).select();
    if (subData && subData[0]) {
      await supabase.from('colleges').update({ subscription_id: subData[0].id }).eq('id', createdCollege.id);
    }

    return { success: true, data: createdCollege };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const rejectCollegeInSupabase = async (requestId, remarks = '') => {
  try {
    const { data, error } = await supabase.from('registration_requests').update({ status: 'Rejected', rejected_at: new Date().toISOString(), remarks: remarks || null }).eq('id', requestId).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data: data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const updateCollegeProfileAndSubscriptionInSupabase = async (collegeId, profileData) => {
  try {
    const collegeUpdatePayload = {
      college_code: profileData.collegeCode,
      college_name: profileData.collegeName,
      college_logo: profileData.collegeLogo || profileData.logoBg || null,
      college_logo_url: profileData.collegeLogoUrl || null,
      college_description: profileData.collegeDescription || null,
      college_admin_username: profileData.principalEmail,
      address: profileData.address || null,
      city: profileData.city,
      district: profileData.district || null,
      state: profileData.state,
      pincode: profileData.pinCode || profileData.pincode || null,
      university_affiliation: profileData.universityAffiliation || null,
      pci_approval_number: profileData.pciApprovalNo || profileData.pci_approval_number || null,
      principal_name: profileData.principalName || null,
      principal_mobile: profileData.principalMobile || null,
      principal_email: profileData.principalEmail || null,
      hospital_name: profileData.hospitalName || null,
      hospital_logo_url: profileData.hospitalLogoUrl || null,
      is_autonomous: Boolean(profileData.isAutonomous),
      status: profileData.subscriptionStatus === 'Active' ? 'Active' : 'Inactive',
      updated_at: new Date().toISOString()
    };

    if (profileData.adminPassword) {
      const passwordHash = await hashPassword(profileData.adminPassword);
      if (passwordHash) collegeUpdatePayload.college_admin_password_hash = passwordHash;
    }

    const { data: updatedCollege, error: updateCollegeErr } = await supabase
      .from('colleges')
      .update(collegeUpdatePayload)
      .eq('id', collegeId)
      .select();

    if (updateCollegeErr) return { success: false, error: updateCollegeErr.message };

    // Update or Upsert Subscription Record
    const subPayload = {
      college_id: collegeId,
      plan_name: profileData.subscriptionPlan || 'Professional',
      subscription_start_date: profileData.subscriptionStartDate || new Date().toISOString().split('T')[0],
      subscription_expiry_date: profileData.subscriptionExpiryDate || '2027-08-04',
      maximum_students: parseInt(profileData.maxStudentsAllowed, 10) || 600,
      status: profileData.subscriptionStatus === 'Active' ? 'Active' : 'Inactive',
      updated_at: new Date().toISOString()
    };

    const { data: existingSub } = await supabase.from('subscriptions').select('id').eq('college_id', collegeId).maybeSingle();
    if (existingSub) {
      await supabase.from('subscriptions').update(subPayload).eq('id', existingSub.id);
    } else {
      await supabase.from('subscriptions').insert([subPayload]);
    }

    // Fetch fresh college record directly from Supabase
    const { data: freshCollege } = await supabase
      .from('colleges')
      .select('*')
      .eq('id', collegeId)
      .maybeSingle();

    return { success: true, college: freshCollege || (updatedCollege ? updatedCollege[0] : null) };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const fetchCollegeByCodeOrIdFromSupabase = async (identifier) => {
  if (!identifier) return { success: false, error: 'Identifier required' };
  try {
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .or(`id.eq.${identifier},college_code.ilike.${identifier},college_admin_username.ilike.${identifier}`)
      .maybeSingle();

    if (error || !data) return { success: false, error: 'College not found' };
    return { success: true, college: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const authenticateCollegeAdminInSupabase = async (username, password, currentCollegeId = null) => {
  try {
    const inputHash = await hashPassword(password);
    if (!inputHash) return { success: false, error: 'Invalid password format' };

    const { data: college, error } = await supabase
      .from('colleges')
      .select('*')
      .or(`college_admin_username.eq.${username},principal_email.eq.${username}`)
      .maybeSingle();

    if (error || !college) return { success: false, error: 'Invalid User ID or Password' };
    if (college.status === 'Inactive' || college.status === 'Disabled') {
      return { success: false, error: 'Your college portal is currently inactive. Please contact the System Administrator.' };
    }
    if (!college.college_admin_password_hash) return { success: false, error: 'College Admin password has not been set by Super Admin.' };
    if (college.college_admin_password_hash !== inputHash) return { success: false, error: 'Invalid User ID or Password' };

    // Dynamic Multi-College Login Isolation Check
    if (currentCollegeId && college.id !== currentCollegeId) {
      return { success: false, error: 'These credentials are not valid for this college.' };
    }

    return { success: true, college };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const updateCollegeStatusInSupabase = async (collegeId, status) => {
  if (!collegeId) return { success: false, error: 'College ID is required' };
  try {
    const { data, error } = await supabase
      .from('colleges')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', collegeId)
      .select();

    // Also update subscriptions table status so subscription record matches college status
    await supabase.from('subscriptions').update({ status, updated_at: new Date().toISOString() }).eq('college_id', collegeId);

    if (error) return { success: false, error: error.message };
    return { success: true, college: data ? data[0] : null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const fetchAllCollegesFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('colleges')
      .select(`*, subscriptions!fk_colleges_subscription(*)`)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: simpleData } = await supabase
        .from('colleges')
        .select('*')
        .order('created_at', { ascending: false });
      return { success: true, data: simpleData || [] };
    }
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
};

export const fetchCollegeStudentCountsFromSupabase = async () => {
  try {
    const { data, error } = await supabase.from('students').select('id, college_id');
    if (error || !Array.isArray(data)) return {};

    const countsMap = {};
    data.forEach(s => {
      if (s.college_id) {
        countsMap[s.college_id] = (countsMap[s.college_id] || 0) + 1;
      }
    });
    return countsMap;
  } catch (err) {
    return {};
  }
};

export const fetchActiveCollegesFromSupabase = async () => {
  try {
    const { data, error } = await supabase.from('colleges').select(`*, subscriptions!fk_colleges_subscription(*)`).eq('status', 'Active').order('created_at', { ascending: false });
    if (error) {
      const { data: simpleData } = await supabase.from('colleges').select('*').eq('status', 'Active').order('created_at', { ascending: false });
      return { success: true, data: simpleData || [] };
    }
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
};

export const deleteCollegeFromSupabase = async (targetId) => {
  try {
    let requestId = targetId;
    let collegeId = targetId;

    const { data: colMatch } = await supabase.from('colleges').select('id, registration_request_id').eq('id', targetId).maybeSingle();
    if (colMatch) {
      collegeId = colMatch.id;
      if (colMatch.registration_request_id) requestId = colMatch.registration_request_id;
    }

    await supabase.from('registration_requests').delete().eq('id', requestId);
    await supabase.from('subscriptions').delete().eq('college_id', collegeId);
    await supabase.from('colleges').delete().eq('id', collegeId);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const deleteMultipleCollegesFromSupabase = async (targetIds) => {
  try {
    const { data: colMatches } = await supabase.from('colleges').select('id, registration_request_id').in('id', targetIds);
    let allRequestIds = [...targetIds];
    let allCollegeIds = [...targetIds];

    if (colMatches && colMatches.length > 0) {
      colMatches.forEach(c => {
        if (c.id) allCollegeIds.push(c.id);
        if (c.registration_request_id) allRequestIds.push(c.registration_request_id);
      });
    }

    await supabase.from('registration_requests').delete().in('id', allRequestIds);
    await supabase.from('subscriptions').delete().in('college_id', allCollegeIds);
    await supabase.from('colleges').delete().in('id', allCollegeIds);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const saveStudentFormSectionInSupabase = async ({
  section_type,
  is_mandatory,
  completion_status,
  payload,
  suspectedMeds = [],
  concomitantMeds = [],
  attachments = []
}) => {
  try {
    let res;
    if (section_type === 'profile') {
      res = await saveOrUpdatePatientProfileInSupabase(payload);
    } else if (section_type === 'counselling') {
      res = await saveOrUpdatePatientCounsellingInSupabase(payload);
    } else if (section_type === 'intervention') {
      res = await saveOrUpdatePharmacistInterventionInSupabase(payload);
    } else if (section_type === 'dir') {
      res = await saveOrUpdateDrugInformationRequestInSupabase(payload);
    } else if (section_type === 'adr') {
      res = await saveOrUpdateADRReportInSupabase(payload, suspectedMeds, concomitantMeds, attachments);
    } else {
      return { success: false, error: `Invalid section type: ${section_type}` };
    }

    if (!res.success) {
      return { success: false, error: res.error };
    }

    let completed = false;
    if (is_mandatory) {
      completed = !!completion_status;
      const caseId = payload.clinical_case_id;
      const updateField = section_type === 'profile' 
        ? { profile_completed: completed } 
        : { counselling_completed: completed };

      const { error: updateErr } = await supabase
        .from('clinical_cases')
        .update(updateField)
        .eq('id', caseId);

      if (updateErr) {
        console.warn(`Could not update completion status for ${section_type} in clinical_cases table:`, updateErr.message);
      }
    }

    // Refetch completion flags directly from backend to ensure single source of truth
    const { data: updatedCase } = await supabase
      .from('clinical_cases')
      .select('profile_completed, counselling_completed')
      .eq('id', payload.clinical_case_id)
      .maybeSingle();

    const profileCompleted = updatedCase && ('profile_completed' in updatedCase)
      ? !!updatedCase.profile_completed
      : (section_type === 'profile' ? (is_mandatory ? !!completion_status : false) : false);

    const counsellingCompleted = updatedCase && ('counselling_completed' in updatedCase)
      ? !!updatedCase.counselling_completed
      : (section_type === 'counselling' ? (is_mandatory ? !!completion_status : false) : false);

    return { 
      success: true, 
      profile_completed: profileCompleted,
      counselling_completed: counsellingCompleted,
      ...res 
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const fetchCaseModuleStatusesMapFromSupabase = async (caseIds = []) => {
  if (!caseIds || caseIds.length === 0) return { success: true, statusesMap: {} };

  try {
    const [casesRes, profilesRes, counsellingRes, interventionRes, dirRes, adrRes] = await Promise.all([
      supabase.from('clinical_cases').select('id, profile_completed, counselling_completed').in('id', caseIds),
      supabase.from('patient_profiles').select('id, clinical_case_id, status, final_diagnosis').in('clinical_case_id', caseIds),
      supabase.from('patient_counselling').select('id, clinical_case_id, status').in('clinical_case_id', caseIds),
      supabase.from('pharmacist_interventions').select('id, clinical_case_id, status').in('clinical_case_id', caseIds),
      supabase.from('drug_information_requests').select('id, clinical_case_id, status').in('clinical_case_id', caseIds),
      supabase.from('adr_reports').select('id, clinical_case_id, approval_status').in('clinical_case_id', caseIds)
    ]);

    const cases = casesRes.data || [];
    const profiles = profilesRes.data || [];
    const counselling = counsellingRes.data || [];
    const interventions = interventionRes.data || [];
    const dirs = dirRes.data || [];
    const adrs = adrRes.data || [];

    const statusesMap = {};

    caseIds.forEach(id => {
      const caseRecord = cases.find(item => item.id === id);
      const p = profiles.find(item => item.clinical_case_id === id);
      const c = counselling.find(item => item.clinical_case_id === id);
      const i = interventions.find(item => item.clinical_case_id === id);
      const d = dirs.find(item => item.clinical_case_id === id);
      const a = adrs.find(item => item.clinical_case_id === id);

      const hasCompletedColumns = caseRecord && ('profile_completed' in caseRecord);

      // ---------------------------------------------------------------
      // COMPLETION FLAGS (for submission gating) — source of truth: DB flags
      // ---------------------------------------------------------------
      const COMPLETED_STATUSES = ['Submitted', 'Completed', 'Approved', 'Reviewed'];

      let isProfileCompleted = false;
      let isCounsellingCompleted = false;

      if (hasCompletedColumns) {
        // Primary: use the DB boolean flag
        // Fallback: child record at a terminal status (backward compat)
        const isProfileRecordSubmitted = p ? COMPLETED_STATUSES.includes(p.status) : false;
        isProfileCompleted = !!caseRecord.profile_completed || isProfileRecordSubmitted;

        const isCounsellingRecordSubmitted = c ? COMPLETED_STATUSES.includes(c.status) : false;
        isCounsellingCompleted = !!caseRecord.counselling_completed || isCounsellingRecordSubmitted;
      } else {
        // Fallback when columns don't exist in DB yet
        isProfileCompleted = p ? COMPLETED_STATUSES.includes(p.status) : false;
        isCounsellingCompleted = c ? COMPLETED_STATUSES.includes(c.status) : false;
      }

      // ---------------------------------------------------------------
      // MODULE DOT STATUS — what color dot to show
      // Grey = No record (Not Started)
      // Amber = Draft record exists
      // Green = Terminal status (Submitted/Completed/Approved/Reviewed)
      // ---------------------------------------------------------------
      const resolveModuleStatus = (record, statusField = 'status') => {
        if (!record) return 'Not Started';
        const effStatus = record[statusField];
        if (!effStatus) return 'Draft';
        if (COMPLETED_STATUSES.includes(effStatus)) return 'Completed';
        if (effStatus === 'Returned') return 'Returned';
        return effStatus;
      };

      // patient_profiles, patient_counselling, pharmacist_interventions, drug_information_requests: use 'status'
      const profileStatusVal = resolveModuleStatus(p, 'status');
      const counsellingStatusVal = resolveModuleStatus(c, 'status');
      const interventionStatusVal = resolveModuleStatus(i, 'status');
      const dirStatusVal = resolveModuleStatus(d, 'status');
      // adr_reports: uses 'approval_status'
      const adrStatusVal = resolveModuleStatus(a, 'approval_status');

      statusesMap[id] = {
        profileStatus: profileStatusVal,
        counsellingStatus: counsellingStatusVal,
        interventionStatus: interventionStatusVal,
        dirStatus: dirStatusVal,
        adrStatus: adrStatusVal,
        finalDiagnosis: p?.final_diagnosis || '',
        hasProfile: Boolean(p),
        hasCounselling: Boolean(c),
        hasIntervention: Boolean(i),
        hasDir: Boolean(d),
        hasAdr: Boolean(a),
        profile_completed: isProfileCompleted,
        counselling_completed: isCounsellingCompleted
      };
    });

    return { success: true, statusesMap };
  } catch (err) {
    return { success: false, error: err.message, statusesMap: {} };
  }
};

export const fetchCaseModuleStatusesFromSupabase = async (clinicalCaseId) => {
  if (!clinicalCaseId) return { success: false, records: {} };

  try {
    // Primary query by 'clinical_case_id'
    const [profileRes1, counsellingRes1, interventionRes1, dirRes1, adrRes1] = await Promise.all([
      supabase.from('patient_profiles').select('*').eq('clinical_case_id', clinicalCaseId).maybeSingle(),
      supabase.from('patient_counselling').select('*').eq('clinical_case_id', clinicalCaseId).maybeSingle(),
      supabase.from('pharmacist_interventions').select('*').eq('clinical_case_id', clinicalCaseId).maybeSingle(),
      supabase.from('drug_information_requests').select('*').eq('clinical_case_id', clinicalCaseId).maybeSingle(),
      supabase.from('adr_reports').select('*').eq('clinical_case_id', clinicalCaseId).maybeSingle()
    ]);

    // Secondary fallback queries by 'case_id' or alternative table names
    const profileData = profileRes1.data || (await supabase.from('patient_profiles').select('*').eq('case_id', clinicalCaseId).maybeSingle()).data || {};
    const counsellingData = counsellingRes1.data || (await supabase.from('patient_counselling').select('*').eq('case_id', clinicalCaseId).maybeSingle()).data || {};
    const interventionData = interventionRes1.data || (await supabase.from('pharmacist_interventions').select('*').eq('case_id', clinicalCaseId).maybeSingle()).data || {};
    const dirData = dirRes1.data || (await supabase.from('drug_information_requests').select('*').eq('case_id', clinicalCaseId).maybeSingle()).data || {};
    const adrData = adrRes1.data || 
                    (await supabase.from('adr_reports').select('*').eq('case_id', clinicalCaseId).maybeSingle()).data || 
                    (await supabase.from('adr_documentation').select('*').eq('clinical_case_id', clinicalCaseId).maybeSingle()).data || {};

    let labs = [];
    let drugs = [];

    const profileId = profileData.id;

    // Fetch Lab Investigations with multi-table & multi-key fallbacks
    const [labRes1, labRes2, drugRes1, drugRes2] = await Promise.all([
      profileId ? supabase.from('patient_lab_investigations').select('*').eq('patient_profile_id', profileId).order('created_at', { ascending: true }) : Promise.resolve({ data: [] }),
      supabase.from('patient_lab_investigations').select('*').eq('clinical_case_id', clinicalCaseId).order('created_at', { ascending: true }),
      profileId ? supabase.from('patient_prescribed_drugs').select('*').eq('patient_profile_id', profileId).order('s_no', { ascending: true }) : Promise.resolve({ data: [] }),
      supabase.from('patient_prescribed_drugs').select('*').eq('clinical_case_id', clinicalCaseId).order('s_no', { ascending: true })
    ]);

    const rawLabs = [...(labRes1.data || []), ...(labRes2.data || [])];
    if (rawLabs.length === 0 && profileData.lab_investigations) {
      if (Array.isArray(profileData.lab_investigations)) rawLabs.push(...profileData.lab_investigations);
      else if (typeof profileData.lab_investigations === 'string') {
        try { rawLabs.push(...JSON.parse(profileData.lab_investigations)); } catch(e) {}
      }
    }

    const seenLab = new Set();
    rawLabs.forEach(l => {
      const key = `${l.category}_${l.parameter_name || l.test_name}_${l.test_value || l.observed_value}`;
      if (!seenLab.has(key)) {
        seenLab.add(key);
        labs.push(l);
      }
    });

    const rawDrugs = [...(drugRes1.data || []), ...(drugRes2.data || [])];
    if (rawDrugs.length === 0 && profileData.prescribed_drugs) {
      if (Array.isArray(profileData.prescribed_drugs)) rawDrugs.push(...profileData.prescribed_drugs);
      else if (typeof profileData.prescribed_drugs === 'string') {
        try { rawDrugs.push(...JSON.parse(profileData.prescribed_drugs)); } catch(e) {}
      }
    }

    const seenDrug = new Set();
    rawDrugs.forEach(d => {
      const key = `${d.trade_name || d.brand_name}_${d.generic_name || d.drug_name}_${d.dose}`;
      if (!seenDrug.has(key)) {
        seenDrug.add(key);
        drugs.push(d);
      }
    });

    return {
      success: true,
      records: {
        profile: profileData,
        counselling: counsellingData,
        intervention: interventionData,
        dir: dirData,
        adr: adrData,
        vitals: profileData.vital_signs || profileData.vitals || [],
        labs,
        drugs
      }
    };
  } catch (err) {
    return { success: false, error: err.message, records: {} };
  }
};


export const submitCompleteClinicalCaseInSupabase = async (clinicalCase, caseModuleStatus) => {
  try {
    const caseId = clinicalCase.id;

    // Fetch parent case record + child statuses directly to check completion (Rule 5 consistency)
    const [caseCheck, profileCheck, counsellingCheck] = await Promise.all([
      supabase.from('clinical_cases').select('profile_completed, counselling_completed').eq('id', caseId).maybeSingle(),
      supabase.from('patient_profiles').select('status').eq('clinical_case_id', caseId).maybeSingle(),
      supabase.from('patient_counselling').select('status').eq('clinical_case_id', caseId).maybeSingle()
    ]);

    const isProfileCompleted = caseCheck.data?.profile_completed || 
      (profileCheck.data?.status && 
       profileCheck.data.status !== 'Draft' && 
       profileCheck.data.status !== 'Not Started');

    const isCounsellingCompleted = caseCheck.data?.counselling_completed || 
      (counsellingCheck.data?.status && 
       counsellingCheck.data.status !== 'Draft' && 
       counsellingCheck.data.status !== 'Not Started');

    if (!isProfileCompleted || !isCounsellingCompleted) {
      return {
        success: false,
        error: '❌ Complete Patient Profile and Patient Counselling before submitting this Clinical Case.'
      };
    }

    // Fetch previous status and student profile details to determine if resubmission
    let isResubmission = false;
    let preceptorId = clinicalCase.preceptor_id;
    let studentId = clinicalCase.student_id;
    let studentName = '';
    let studentRoll = '';

    const { data: currentCase } = await supabase
      .from('clinical_cases')
      .select('status, preceptor_id, student_id, case_id, hospital_name, department, students(full_name, roll_number)')
      .eq('id', caseId)
      .maybeSingle();

    if (currentCase) {
      if (currentCase.status === 'Returned') {
        isResubmission = true;
      }
      preceptorId = currentCase.preceptor_id || preceptorId;
      studentId = currentCase.student_id || studentId;
      if (currentCase.students) {
        studentName = currentCase.students.full_name;
        studentRoll = currentCase.students.roll_number;
      }
    }

    // Auto-lookup preceptor assignment if missing
    if (!preceptorId && studentId) {
      const { data: assign } = await supabase
        .from('student_preceptor_assignments')
        .select('preceptor_id')
        .eq('student_id', studentId)
        .eq('status', 'Active')
        .maybeSingle();
      if (assign && assign.preceptor_id) {
        preceptorId = assign.preceptor_id;
      }
    }

    const nowIso = new Date().toISOString();

    // 1. Update clinical_cases status to 'Submitted'
    const { error: caseErr } = await supabase
      .from('clinical_cases')
      .update({
        status: 'Submitted',
        preceptor_id: preceptorId || null,
        submitted_at: nowIso,
        case_locked: false,
        updated_at: nowIso
      })
      .eq('id', caseId);

    if (caseErr) return { success: false, error: caseErr.message };

    // Try to update completion flags separately so it won't fail if columns missing
    try {
      await supabase
        .from('clinical_cases')
        .update({ profile_completed: true, counselling_completed: true })
        .eq('id', caseId);
    } catch (e) {
      console.warn('Could not update completion flags in clinical_cases:', e);
    }

    // 2. Cascade status update to child tables (only valid columns)
    await Promise.all([
      supabase.from('patient_profiles').update({ status: 'Submitted' }).eq('clinical_case_id', caseId),
      supabase.from('patient_counselling').update({ status: 'Submitted' }).eq('clinical_case_id', caseId),
      supabase.from('pharmacist_interventions').update({ status: 'Submitted' }).eq('clinical_case_id', caseId),
      supabase.from('drug_information_requests').update({ status: 'Submitted' }).eq('clinical_case_id', caseId),
      supabase.from('adr_reports').update({ approval_status: 'Submitted' }).eq('clinical_case_id', caseId)
    ]);

    // 3. Trigger Notification to Preceptor if preceptor_id is available
    if (preceptorId) {
      const nowStr = new Date().toLocaleString();
      if (isResubmission) {
        await createWorkflowNotificationInSupabase({
          recipientUserId: preceptorId,
          recipientRole: 'Preceptor',
          senderUserId: studentId,
          senderRole: 'Student',
          clinicalCaseId: caseId,
          notificationType: 'Case Resubmitted',
          title: 'Clinical Case Resubmitted',
          message: `Student Name: ${studentName}\nRoll Number: ${studentRoll}\nCase ID: ${clinicalCase.case_id}\nResubmitted: ${nowStr}`,
          actionLabel: 'Review Case',
          actionRoute: 'case-review'
        });
      } else {
        await createWorkflowNotificationInSupabase({
          recipientUserId: preceptorId,
          recipientRole: 'Preceptor',
          senderUserId: studentId,
          senderRole: 'Student',
          clinicalCaseId: caseId,
          notificationType: 'Case Submitted',
          title: 'New Clinical Case Submitted',
          message: `Student Name: ${studentName}\nRoll Number: ${studentRoll}\nCase ID: ${clinicalCase.case_id}\nHospital: ${clinicalCase.hospital_name || currentCase?.hospital_name}\nDepartment: ${clinicalCase.department || currentCase?.department}\nSubmitted: ${nowStr}`,
          actionLabel: 'Review Case',
          actionRoute: 'case-review'
        });
      }
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const approveClinicalCaseByPreceptorFromSupabase = async (clinicalCase, preceptorId, comments = '') => {
  try {
    const caseId = clinicalCase.id;
    const now = new Date().toISOString();

    const updatePayload = {
      status: 'Approved',
      overall_case_status: 'Approved',
      approved_at: now,
      approved_by_preceptor_id: preceptorId,
      overall_preceptor_comments: comments ? comments.trim() : null,
      case_locked: true,
      returned_forms: [],
      updated_at: now
    };

    // Update clinical_cases
    const { error: caseErr } = await supabase.from('clinical_cases').update(updatePayload).eq('id', caseId);
    if (caseErr) {
      console.warn('Update error on clinical_cases approve:', caseErr.message);
      await supabase.from('clinical_cases').update({ status: 'Approved', approved_at: now, case_locked: true, updated_at: now }).eq('id', caseId);
    }

    // Cascade approval to child tables
    await Promise.all([
      supabase.from('patient_profiles').update({ status: 'Approved', approval_status: 'Approved', review_status: 'Approved', preceptor_comments: comments, reviewed_at: now }).eq('clinical_case_id', caseId),
      supabase.from('patient_counselling').update({ status: 'Approved', approval_status: 'Approved', review_status: 'Approved', preceptor_comments: comments, reviewed_at: now }).eq('clinical_case_id', caseId),
      supabase.from('pharmacist_interventions').update({ status: 'Approved', approval_status: 'Approved', review_status: 'Approved', preceptor_comments: comments, reviewed_at: now }).eq('clinical_case_id', caseId),
      supabase.from('drug_information_requests').update({ status: 'Approved', review_status: 'Approved', reviewed_at: now }).eq('clinical_case_id', caseId),
      supabase.from('adr_reports').update({ approval_status: 'Approved', review_status: 'Approved', reviewed_at: now }).eq('clinical_case_id', caseId)
    ]);

    // Insert into review history table if available
    try {
      await supabase.from('clinical_case_review_history').insert({
        clinical_case_id: caseId,
        student_id: clinicalCase.student_id,
        preceptor_id: preceptorId,
        action: 'Approved',
        returned_forms: [],
        comments: comments || 'Case approved by preceptor.',
        created_at: now
      });
    } catch (e) {
      // Table creation optional fallback
    }

    // Trigger Notification to Student
    if (clinicalCase.student_id) {
      const nowStr = new Date().toLocaleString();
      let preceptorName = 'Your Preceptor';
      const { data: precData } = await supabase.from('preceptors').select('full_name').eq('id', preceptorId).maybeSingle();
      if (precData) preceptorName = precData.full_name;

      await createWorkflowNotificationInSupabase({
        recipientUserId: clinicalCase.student_id,
        recipientRole: 'Student',
        senderUserId: preceptorId,
        senderRole: 'Preceptor',
        clinicalCaseId: caseId,
        notificationType: 'Case Approved',
        title: 'Clinical Case Approved',
        message: `Case ID: ${clinicalCase.case_id}\nApproved By: ${preceptorName}\nApproved Date & Time: ${nowStr}\n\nYour Clinical Case has been approved. The Official Approved PDF is now available.`,
        actionLabel: 'Download Approved PDF',
        actionRoute: 'my-cases'
      });
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const returnClinicalCaseByPreceptorFromSupabase = async (clinicalCase, preceptorId, returnedForms = [], comments = '') => {
  try {
    if (!comments || !comments.trim()) {
      return { success: false, error: 'Faculty comments are mandatory when returning a Clinical Case for corrections.' };
    }
    if (!returnedForms || returnedForms.length === 0) {
      return { success: false, error: 'Please select at least one form to return for corrections.' };
    }

    const caseId = clinicalCase.id;
    const now = new Date().toISOString();

    // Capture pre-return snapshots of all 5 modules for all-field diff tracking
    let snapshotAtReturn = {};
    try {
      const [profRes, counsRes, interRes, dirRes, adrRes] = await Promise.all([
        supabase.from('patient_profiles').select('*').eq('clinical_case_id', caseId).maybeSingle(),
        supabase.from('patient_counselling').select('*').eq('clinical_case_id', caseId).maybeSingle(),
        supabase.from('pharmacist_interventions').select('*').eq('clinical_case_id', caseId).maybeSingle(),
        supabase.from('drug_information_requests').select('*').eq('clinical_case_id', caseId).maybeSingle(),
        supabase.from('adr_reports').select('*').eq('clinical_case_id', caseId).maybeSingle()
      ]);

      snapshotAtReturn = {
        profile: profRes.data || null,
        counselling: counsRes.data || null,
        intervention: interRes.data || null,
        dir: dirRes.data || null,
        adr: adrRes.data || null,
        returned_at: now
      };
    } catch (e) {
      console.warn('Could not capture pre-return snapshot:', e);
    }

    const updatePayload = {
      status: 'Returned',
      returned_at: now,
      returned_by_preceptor_id: preceptorId,
      overall_preceptor_comments: comments.trim(),
      returned_forms: returnedForms,
      snapshot_at_return: snapshotAtReturn,
      case_locked: false,
      updated_at: now
    };

    let { error: caseErr } = await supabase.from('clinical_cases').update(updatePayload).eq('id', caseId);
    if (caseErr) {
      console.warn('Update error on clinical_cases return (retrying without snapshot_at_return if column missing):', caseErr.message);
      const fallbackPayload = { ...updatePayload };
      delete fallbackPayload.snapshot_at_return;
      await supabase.from('clinical_cases').update(fallbackPayload).eq('id', caseId);
    }

    // Map module key names
    const isProfileReturned = returnedForms.includes('patient_profile') || returnedForms.includes('Patient Profile');
    const isCounsellingReturned = returnedForms.includes('patient_counselling') || returnedForms.includes('Patient Counselling');
    const isInterventionReturned = returnedForms.includes('pharmacist_intervention') || returnedForms.includes('Pharmacist Intervention');
    const isDirReturned = returnedForms.includes('drug_information_request') || returnedForms.includes('Drug Information Request');
    const isAdrReturned = returnedForms.includes('adr_documentation') || returnedForms.includes('ADR Documentation');

    // Update child modules according to return selection
    await Promise.all([
      supabase.from('patient_profiles').update({
        status: isProfileReturned ? 'Returned' : 'Submitted',
        approval_status: isProfileReturned ? 'Returned' : 'Submitted',
        review_status: isProfileReturned ? 'Returned' : 'Submitted',
        preceptor_comments: isProfileReturned ? comments.trim() : null,
        reviewed_at: now
      }).eq('clinical_case_id', caseId),

      supabase.from('patient_counselling').update({
        status: isCounsellingReturned ? 'Returned' : 'Submitted',
        approval_status: isCounsellingReturned ? 'Returned' : 'Submitted',
        review_status: isCounsellingReturned ? 'Returned' : 'Submitted',
        preceptor_comments: isCounsellingReturned ? comments.trim() : null,
        reviewed_at: now
      }).eq('clinical_case_id', caseId),

      supabase.from('pharmacist_interventions').update({
        status: isInterventionReturned ? 'Returned' : 'Submitted',
        approval_status: isInterventionReturned ? 'Returned' : 'Submitted',
        review_status: isInterventionReturned ? 'Returned' : 'Submitted',
        preceptor_comments: isInterventionReturned ? comments.trim() : null,
        reviewed_at: now
      }).eq('clinical_case_id', caseId),

      supabase.from('drug_information_requests').update({
        status: isDirReturned ? 'Returned' : 'Submitted',
        review_status: isDirReturned ? 'Returned' : 'Submitted',
        reviewed_at: now
      }).eq('clinical_case_id', caseId),

      supabase.from('adr_reports').update({
        approval_status: isAdrReturned ? 'Returned' : 'Submitted',
        review_status: isAdrReturned ? 'Returned' : 'Submitted',
        reviewed_at: now
      }).eq('clinical_case_id', caseId)
    ]);

    // Insert into review history table if available
    try {
      await supabase.from('clinical_case_review_history').insert({
        clinical_case_id: caseId,
        student_id: clinicalCase.student_id,
        preceptor_id: preceptorId,
        action: 'Returned',
        returned_forms: returnedForms,
        comments: comments.trim(),
        created_at: now
      });
    } catch (e) {
      // Table creation optional fallback
    }

    // Trigger Notification to Student
    if (clinicalCase.student_id) {
      const nowStr = new Date().toLocaleString();
      let preceptorName = 'Your Preceptor';
      const { data: precData } = await supabase.from('preceptors').select('full_name').eq('id', preceptorId).maybeSingle();
      if (precData) preceptorName = precData.full_name;

      const formattedReturnedForms = returnedForms.map(f => {
        if (f === 'patient_profile' || f === 'Patient Profile') return 'Patient Profile';
        if (f === 'patient_counselling' || f === 'Patient Counselling') return 'Patient Counselling';
        if (f === 'pharmacist_intervention' || f === 'Pharmacist Intervention') return 'Pharmacist Intervention';
        if (f === 'drug_information_request' || f === 'Drug Information Request') return 'Drug Information Request';
        if (f === 'adr_documentation' || f === 'ADR Documentation') return 'ADR Documentation';
        return f;
      }).join(', ');

      await createWorkflowNotificationInSupabase({
        recipientUserId: clinicalCase.student_id,
        recipientRole: 'Student',
        senderUserId: preceptorId,
        senderRole: 'Preceptor',
        clinicalCaseId: caseId,
        notificationType: 'Case Returned',
        title: 'Clinical Case Returned',
        message: `Case ID: ${clinicalCase.case_id}\nReturned By: ${preceptorName}\nReturned Date & Time: ${nowStr}\nReturned Forms: ${formattedReturnedForms}\nFaculty Comments: ${comments.trim()}`,
        actionLabel: 'Open Clinical Case',
        actionRoute: 'my-cases'
      });
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const fetchAllCollegeClinicalCasesFromSupabase = async (collegeId) => {
  try {
    if (!collegeId) return { success: true, data: [] };

    // Fetch cases and college students in parallel to guarantee student full_name & roll_number
    const [casesRes, studentsRes] = await Promise.all([
      supabase.from('clinical_cases').select('*').eq('college_id', collegeId).neq('status', 'Draft').order('created_at', { ascending: false }),
      supabase.from('students').select('*').eq('college_id', collegeId)
    ]);

    const rawCases = (casesRes.data || []).filter(c => c.status !== 'Draft' && c.overall_case_status !== 'Draft');
    const studentList = studentsRes.data || [];
    const studentMap = new Map(studentList.map(s => [s.id, s]));

    const mergedCases = rawCases.map(c => {
      const studentObj = studentMap.get(c.student_id) || {};
      return {
        ...c,
        students: {
          ...studentObj,
          full_name: studentObj.full_name || c.student_name || 'Student Candidate',
          roll_number: studentObj.roll_number || c.roll_number || '—',
          batch: studentObj.batch || c.batch || '',
          academic_year: studentObj.academic_year || c.academic_year || ''
        }
      };
    });

    return { success: true, data: mergedCases };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
};

export const fetchAllPreceptorCasesFromSupabase = async (preceptorId) => {
  try {
    const { data: assignments } = await supabase
      .from('student_preceptor_assignments')
      .select('student_id')
      .eq('preceptor_id', preceptorId)
      .eq('status', 'Active');

    const studentIds = (assignments || []).map(a => a.student_id);
    if (!studentIds.length) return { success: true, data: [] };

    // Fetch cases and student details in parallel to guarantee student full_name & roll_number
    const [casesRes, studentsRes] = await Promise.all([
      supabase.from('clinical_cases').select('*').in('student_id', studentIds).neq('status', 'Draft').order('created_at', { ascending: false }),
      supabase.from('students').select('*').in('id', studentIds)
    ]);

    const rawCases = casesRes.data || [];
    const studentList = studentsRes.data || [];
    const studentMap = new Map(studentList.map(s => [s.id, s]));

    const mergedCases = rawCases.map(c => {
      const studentObj = studentMap.get(c.student_id) || {};
      return {
        ...c,
        students: {
          ...studentObj,
          full_name: studentObj.full_name || c.student_name || 'Student Candidate',
          roll_number: studentObj.roll_number || c.roll_number || '—',
          batch: studentObj.batch || c.batch || '',
          academic_year: studentObj.academic_year || c.academic_year || ''
        }
      };
    });

    return { success: true, data: mergedCases };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
};

export const startReviewingCaseInSupabase = async (caseId, preceptorId) => {
  try {
    const nowIso = new Date().toISOString();
    const { data: currentCase } = await supabase
      .from('clinical_cases')
      .select('status')
      .eq('id', caseId)
      .maybeSingle();

    if (currentCase && currentCase.status === 'Submitted') {
      const { data, error } = await supabase
        .from('clinical_cases')
        .update({
          status: 'Under Review',
          preceptor_id: preceptorId,
          updated_at: nowIso
        })
        .eq('id', caseId)
        .select();

      if (error) return { success: false, error: error.message };
      return { success: true, data: data?.[0] };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const fetchCollegeClinicalCasesFromSupabase = async (collegeId) => {
  try {
    const { data, error } = await supabase
      .from('clinical_cases')
      .select(`
        *,
        students!fk_clinical_cases_student(*),
        preceptors!fk_clinical_cases_preceptor(*)
      `)
      .eq('college_id', collegeId)
      .eq('status', 'Approved')
      .order('created_at', { ascending: false });

    if (error) {
      const { data: simpleData } = await supabase
        .from('clinical_cases')
        .select('*')
        .eq('college_id', collegeId)
        .eq('status', 'Approved')
        .order('created_at', { ascending: false });

      const filteredSimple = (simpleData || []).filter(c => c.status === 'Approved' || c.overall_case_status === 'Approved');
      return { success: true, data: filteredSimple };
    }

    const filtered = (data || []).filter(c => c.status === 'Approved' || c.overall_case_status === 'Approved');
    return { success: true, data: filtered };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
};

export const sendEmailInBackground = async (notificationId, recipientEmail, subject, title, caseId, studentName, timestamp) => {
  // Execute in background
  setTimeout(async () => {
    try {
      console.log(`✉️ [SMTP Send] Initiating email delivery to: ${recipientEmail}`);

      // Simulating a minor network latency for mock SMTP send
      await new Promise(resolve => setTimeout(resolve, 1500));

      const body = `
=========================================================
PharmDVerse Workflow Update
=========================================================

Notification: ${title}
Case ID: ${caseId || 'N/A'}
Student Name: ${studentName || 'N/A'}
Timestamp: ${timestamp}

---------------------------------------------------------
Please click the link below to login to PharmDVerse:
https://pharmdverse.cloud/login
=========================================================
      `.trim();

      console.log(`✉️ [SMTP Send] Mail content:\n${body}`);

      // Update notification record as Sent in DB
      await supabase
        .from('notifications')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          email_delivery_status: 'Sent',
          email_recipient: recipientEmail
        })
        .eq('id', notificationId);
      
      console.log(`✉️ [SMTP Success] Email sent successfully to: ${recipientEmail}`);
    } catch (err) {
      console.error(`✉️ [SMTP Error] Email sending failed:`, err.message);
      // Update notification record as Failed in DB (does not throw or break UI)
      await supabase
        .from('notifications')
        .update({
          email_sent: false,
          email_delivery_status: 'Failed',
          email_error_message: err.message,
          email_recipient: recipientEmail
        })
        .eq('id', notificationId);
    }
  }, 0);
};

export const createWorkflowNotificationInSupabase = async ({
  recipientUserId,
  recipientRole,
  senderUserId,
  senderRole,
  clinicalCaseId,
  notificationType,
  title,
  message,
  actionLabel,
  actionRoute
}) => {
  try {
    let collegeId = null;
    let studentId = null;
    let assignedPreceptorId = null;
    let recipientEmail = null;
    let caseIdStr = 'N/A';
    let studentName = 'N/A';

    // 1. Fetch details from clinical_cases if missing
    if (clinicalCaseId) {
      const { data: caseData } = await supabase
        .from('clinical_cases')
        .select(`
          college_id, 
          student_id, 
          preceptor_id, 
          case_id,
          students(full_name)
        `)
        .eq('id', clinicalCaseId)
        .maybeSingle();

      if (caseData) {
        collegeId = caseData.college_id;
        studentId = caseData.student_id;
        assignedPreceptorId = caseData.preceptor_id;
        caseIdStr = caseData.case_id;
        if (caseData.students) {
          studentName = caseData.students.full_name;
        }
      }
    }

    // 2. Fetch recipient email from appropriate table
    if (recipientRole === 'Student') {
      const { data: stud } = await supabase.from('students').select('email').eq('id', recipientUserId).maybeSingle();
      if (stud) recipientEmail = stud.email;
    } else if (recipientRole === 'Preceptor') {
      const { data: prec } = await supabase.from('preceptors').select('email').eq('id', recipientUserId).maybeSingle();
      if (prec) recipientEmail = prec.email;
    }

    // 3. Insert notification record with status 'Pending'
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        recipient_user_id: recipientUserId,
        recipient_role: recipientRole,
        sender_user_id: senderUserId || null,
        sender_role: senderRole || null,
        clinical_case_id: clinicalCaseId || null,
        notification_type: notificationType,
        title,
        message,
        action_label: actionLabel || null,
        action_route: actionRoute || null,
        college_id: collegeId,
        student_id: studentId,
        assigned_preceptor_id: assignedPreceptorId,
        is_read: false,
        send_email: true,
        email_sent: false,
        email_delivery_status: 'Pending',
        email_recipient: recipientEmail
      }])
      .select();

    if (error) return { success: false, error: error.message };
    const notification = data[0];

    // 4. Trigger Email in Background if recipient email is available
    if (recipientEmail) {
      sendEmailInBackground(
        notification.id,
        recipientEmail,
        `PharmDVerse: ${title}`,
        title,
        caseIdStr,
        studentName,
        new Date().toLocaleString()
      );
    }

    return { success: true, data: notification };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const fetchNotificationsFromSupabase = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
};

export const markNotificationAsReadInSupabase = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const fetchUnreadNotificationsCountFromSupabase = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_user_id', userId)
      .eq('is_read', false);

    if (error) return { success: false, count: 0, error: error.message };
    return { success: true, count: count || 0 };
  } catch (err) {
    return { success: false, count: 0, error: err.message };
  }
};

/**
 * Fetch Standard Clinical Knowledge Records for Laboratory Analysis (Section 3).
 * Reads from public.lab_parameter_knowledge table.
 */
export const fetchLabParameterKnowledgeFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('lab_parameter_knowledge')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching lab_parameter_knowledge from Supabase:', error);
      return { success: false, data: [], error: error.message };
    }
    return { success: true, data: data || [] };
  } catch (err) {
    console.error('Unexpected error fetching lab_parameter_knowledge:', err);
    return { success: false, data: [], error: err.message };
  }
};

/**
 * SECTION 4 — STEP 5A: DRUG KNOWLEDGE SUPABASE RETRIEVAL ENGINE
 */
const DRUG_KNOWLEDGE_CACHE = new Map();

const CONTROLLED_DRUG_SYNONYMS = {
  'adrenaline': 'Adrenaline',
  'epinephrine': 'Adrenaline',
  'adrenaline / epinephrine': 'Adrenaline',
  'epinephrine / adrenaline': 'Adrenaline',

  'noradrenaline': 'Noradrenaline',
  'norepinephrine': 'Noradrenaline',
  'noradrenaline / norepinephrine': 'Noradrenaline',
  'norepinephrine / noradrenaline': 'Noradrenaline',

  'salbutamol': 'Salbutamol',
  'albuterol': 'Salbutamol',
  'salbutamol / albuterol': 'Salbutamol',
  'albuterol / salbutamol': 'Salbutamol',

  'lidocaine': 'Lidocaine',
  'lignocaine': 'Lidocaine',
  'lidocaine / lignocaine': 'Lidocaine',
  'lignocaine / lidocaine': 'Lidocaine',

  'vitamin k': 'Vitamin K',
  'vitamin k1': 'Vitamin K',
  'phytonadione': 'Vitamin K',
  'phytomenadione': 'Vitamin K',

  'normal saline': 'Sodium Chloride 0.9%',
  '0.9% normal saline': 'Sodium Chloride 0.9%',
  'sodium chloride 0.9%': 'Sodium Chloride 0.9%',
  'saline': 'Sodium Chloride 0.9%',

  'paracetamol': 'Paracetamol',
  'acetaminophen': 'Paracetamol',
  'paracetamol (acetaminophen)': 'Paracetamol',

  'hyoscine': 'Hyoscine Butylbromide',
  'buscopan': 'Hyoscine Butylbromide',
  'buscogast': 'Hyoscine Butylbromide',
  'scopolamine butylbromide': 'Hyoscine Butylbromide'
};

export const normalizeDrugSearchInput = (input) => {
  if (!input) return '';
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

/**
 * Fetch a single drug knowledge record from public.drug_knowledge in Supabase.
 * Executes a 3-level controlled search strategy.
 */
export const fetchDrugKnowledgeFromSupabase = async (searchQuery) => {
  const rawTerm = String(searchQuery || '').trim();
  const cleanQuery = normalizeDrugSearchInput(rawTerm);

  if (!cleanQuery) {
    return {
      status: 'EMPTY',
      data: null,
      message: 'No drug name provided for search',
      searchTerm: rawTerm
    };
  }

  // Check in-memory cache
  if (DRUG_KNOWLEDGE_CACHE.has(cleanQuery)) {
    return DRUG_KNOWLEDGE_CACHE.get(cleanQuery);
  }

  try {
    // LEVEL 1: Exact or compound generic_name match
    let { data: level1Data, error: level1Err } = await supabase
      .from('drug_knowledge')
      .select('*')
      .ilike('generic_name', cleanQuery);

    if (level1Err) {
      return {
        status: 'ERROR',
        data: null,
        error: level1Err.message,
        message: 'Unable to connect to drug database',
        searchTerm: rawTerm
      };
    }

    if (!Array.isArray(level1Data) || level1Data.length === 0) {
      const { data: level1SubData, error: level1SubErr } = await supabase
        .from('drug_knowledge')
        .select('*')
        .ilike('generic_name', `%${cleanQuery}%`);
      if (!level1SubErr && Array.isArray(level1SubData)) {
        level1Data = level1SubData;
      }
    }

    if (Array.isArray(level1Data) && level1Data.length > 0) {
      if (level1Data.length === 1) {
        const result = {
          status: 'FOUND',
          data: level1Data[0],
          message: '✓ Drug found in database',
          matchLevel: 'LEVEL 1 (Generic Match)',
          searchTerm: rawTerm
        };
        DRUG_KNOWLEDGE_CACHE.set(cleanQuery, result);
        return result;
      } else {
        const result = {
          status: 'MULTIPLE_MATCHES',
          data: level1Data,
          message: 'Multiple matching drug records found in database',
          matchLevel: 'LEVEL 1 (Multiple Generic Matches)',
          searchTerm: rawTerm
        };
        return result;
      }
    }

    // LEVEL 2: Brand name match
    const { data: level2Data, error: level2Err } = await supabase
      .from('drug_knowledge')
      .select('*')
      .ilike('brand_names', `%${cleanQuery}%`);

    if (level2Err) {
      return {
        status: 'ERROR',
        data: null,
        error: level2Err.message,
        message: 'Unable to connect to drug database',
        searchTerm: rawTerm
      };
    }

    if (Array.isArray(level2Data) && level2Data.length > 0) {
      const exactBrandMatch = level2Data.find(row => {
        if (!row.brand_names) return false;
        const brands = row.brand_names.split(',').map(b => b.trim().toLowerCase());
        return brands.includes(cleanQuery);
      });

      const matchedRecord = exactBrandMatch || level2Data[0];
      if (level2Data.length === 1 || exactBrandMatch) {
        const result = {
          status: 'FOUND',
          data: matchedRecord,
          message: '✓ Drug found in database',
          matchLevel: 'LEVEL 2 (Brand Match)',
          searchTerm: rawTerm
        };
        DRUG_KNOWLEDGE_CACHE.set(cleanQuery, result);
        return result;
      } else {
        const result = {
          status: 'MULTIPLE_MATCHES',
          data: level2Data,
          message: 'Multiple drug records match brand name',
          matchLevel: 'LEVEL 2 (Multiple Brand Matches)',
          searchTerm: rawTerm
        };
        return result;
      }
    }

    // LEVEL 3: Controlled Synonym / Equivalent Name match
    const mappedGeneric = CONTROLLED_DRUG_SYNONYMS[cleanQuery];
    if (mappedGeneric) {
      const { data: level3Data, error: level3Err } = await supabase
        .from('drug_knowledge')
        .select('*')
        .ilike('generic_name', mappedGeneric);

      if (level3Err) {
        return {
          status: 'ERROR',
          data: null,
          error: level3Err.message,
          message: 'Unable to connect to drug database',
          searchTerm: rawTerm
        };
      }

      if (Array.isArray(level3Data) && level3Data.length > 0) {
        const result = {
          status: 'FOUND',
          data: level3Data[0],
          message: '✓ Drug found in database',
          matchLevel: 'LEVEL 3 (Equivalent Name Match)',
          searchTerm: rawTerm
        };
        DRUG_KNOWLEDGE_CACHE.set(cleanQuery, result);
        return result;
      }
    }

    // NOT FOUND
    const notFoundResult = {
      status: 'NOT_FOUND',
      data: null,
      message: 'Drug not found in Drug Knowledge Database',
      searchTerm: rawTerm
    };
    DRUG_KNOWLEDGE_CACHE.set(cleanQuery, notFoundResult);
    return notFoundResult;

  } catch (err) {
    return {
      status: 'ERROR',
      data: null,
      error: err.message,
      message: 'Unable to connect to drug database',
      searchTerm: rawTerm
    };
  }
};

/**
 * Batch lookup for multiple prescribed drugs
 */
export const fetchMultipleDrugKnowledgeFromSupabase = async (drugList = []) => {
  if (!Array.isArray(drugList) || drugList.length === 0) {
    return { success: true, results: [] };
  }

  const results = await Promise.all(
    drugList.map(async (drugItem) => {
      const rawName = drugItem.generic_name || drugItem.trade_name || drugItem.brand_name || drugItem.drug_name || '';
      const lookupRes = await fetchDrugKnowledgeFromSupabase(rawName);
      return {
        prescribedDrug: drugItem,
        searchTerm: rawName,
        status: lookupRes.status,
        data: lookupRes.data,
        message: lookupRes.message,
        matchLevel: lookupRes.matchLevel || null,
        error: lookupRes.error || null
      };
    })
  );

  return { success: true, results };
};

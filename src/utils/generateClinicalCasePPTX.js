import pptxgen from 'pptxgenjs';
import { buildNormalizedApprovedCaseData } from './buildNormalizedApprovedCaseData';

/**
 * Generate and download an editable PowerPoint (.pptx) presentation for a COMPLETE APPROVED CASE.
 * Consumes the central normalized data model from buildNormalizedApprovedCaseData.
 * Precision 16:9 Widescreen layout math (10.0" x 5.625" canvas):
 *  - startX = 0.5", contentW = 9.0" (Right edge = 9.5", 0.5" left & right margins).
 *  - y = 0.85" to 4.8" (0.475" top & bottom margins). Max 4-5 rows per slide.
 * Exact 3-column footer layout (Left text + Date, Center Bold text, Right Slide X of N + dividing line).
 */
export const generateClinicalCasePPTX = async ({
  clinicalCase = {},
  student = {},
  preceptor = {},
  college = {},
  caseModulesData = {},
  pptSettings = {}
}) => {
  const norm = buildNormalizedApprovedCaseData({
    clinicalCase,
    student,
    preceptor,
    college,
    caseModulesData
  });

  const pptx = new pptxgen();

  // Application-Level Fixed PPT Generation Settings (Section 6)
  pptx.layout = 'LAYOUT_16x9'; // 16:9 Widescreen (10.0" x 5.625" pptxgenjs canvas)

  const fontFace = 'Times New Roman'; // Fixed Times New Roman font family
  const titleFontSize = 20;   // 20 pt title
  const headingFontSize = 18; // 18 pt heading
  const bodyFontSize = 14;    // 14 pt body text

  const primaryColor = '0F172A'; // Slate-900
  const emeraldColor = '059669'; // Emerald-600
  const darkBgColor = 'F8FAFC'; // Slate-50

  // 16:9 Widescreen Precision Coordinates (10.0" x 5.625")
  const startX = 0.5;
  const contentW = 9.0;

  const collegeName = norm.collegeName;
  const hospitalName = norm.hospitalName;
  const caseId = norm.caseId;
  const studentName = norm.studentName;
  const rollNumber = norm.studentRoll;
  const preceptorName = norm.preceptorName;
  const preceptorDesig = norm.preceptorDesig;
  const finalDiagnosis = norm.diagnosis.final;

  const formatSpo2 = (val) => {
    if (!val) return '98%';
    const s = String(val).trim();
    return s.endsWith('%') ? s : `${s}%`;
  };

  const slidesList = [];
  const createSlide = () => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slidesList.push(slide);
    return slide;
  };

  // Watermark helper following EXACT format from Admin (Line 1, Line 2, Opacity, Position)
  const addWatermark = (slide) => {
    const isWatermarkEnabled = (pptSettings?.watermark_enabled !== false) && (pptSettings?.show_watermark !== false);
    if (!isWatermarkEnabled) return;

    try {
      const line1 = (pptSettings?.watermark_text_line1 || pptSettings?.watermark_text || college?.college_code || 'PHARMDVERSE').toUpperCase();
      const line2 = (pptSettings?.watermark_text_line2 || pptSettings?.watermark_line_2 || collegeName || 'Clinical Documentation System').toUpperCase();
      
      const position = pptSettings?.watermark_position || 'Center';
      const isDiagonal = String(position).toLowerCase().trim() === 'diagonal';
      const rotate = isDiagonal ? 330 : 0;

      const opacityNum = parseInt(pptSettings?.watermark_opacity ?? 10, 10);
      let watermarkColor = 'CBD5E1'; // Default ~10%
      if (opacityNum <= 8) watermarkColor = 'E2E8F0';
      else if (opacityNum <= 15) watermarkColor = 'CBD5E1';
      else if (opacityNum <= 22) watermarkColor = '94A3B8';
      else watermarkColor = '64748B';

      if (line2 && line2.trim().length > 0) {
        // Line 1
        slide.addText(line1, {
          x: startX, y: isDiagonal ? 1.8 : 2.0, w: contentW, h: 0.6,
          fontFace, fontSize: 24, bold: true, color: watermarkColor,
          align: 'center', rotate
        });
        // Line 2
        slide.addText(line2, {
          x: startX, y: isDiagonal ? 2.5 : 2.6, w: contentW, h: 0.5,
          fontFace, fontSize: 13, bold: true, color: watermarkColor,
          align: 'center', rotate
        });
      } else {
        slide.addText(line1, {
          x: startX, y: 2.2, w: contentW, h: 0.8,
          fontFace, fontSize: 26, bold: true, color: watermarkColor,
          align: 'center', rotate
        });
      }
    } catch (e) {
      console.warn('PPT Watermark render warning:', e);
    }
  };

  // Shared 3-column Footer Helper matching exact screenshot (Horizontal line, Left text + Date, Center Bold text, Right Slide X of N)
  const isFooterEnabled = (pptSettings?.footer_enabled !== false) && (pptSettings?.repeat_footer !== false);
  const showPageNum = pptSettings?.show_page_number !== false;
  const showDateTime = pptSettings?.show_generated_datetime !== false;

  
  let platformName = 'PharmDVerse';
  try {
    const cached = typeof window !== 'undefined' ? window.localStorage.getItem('pharmdverse_platform_settings_cache') : null;
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.platform_name) platformName = parsed.platform_name.trim();
    }
  } catch (e) {}

  let footerLeftText = pptSettings?.footer_left_text || college?.college_code || collegeName || platformName;
  if (footerLeftText === 'PharmDVerse') footerLeftText = platformName;

  const footerCenterText = pptSettings?.footer_center_text || 'Confidential Clinical Documentation';
  const todayStr = new Date().toLocaleDateString('en-GB');

  const addFooterToSlide = (slide, slideNum, totalSlides) => {
    if (!isFooterEnabled) return;
    try {
      // Subtle horizontal dividing line
      slide.addShape('line', {
        x: startX, y: 5.1, w: contentW, h: 0,
        line: { color: 'E2E8F0', width: 0.75 }
      });

      // Left Footer: PharmDVerse • 17/08/2026
      const leftStr = `${footerLeftText}${showDateTime ? ` • ${todayStr}` : ''}`;
      slide.addText(leftStr, {
        x: startX, y: 5.16, w: 3.2, h: 0.3,
        fontFace, fontSize: 9, color: '64748B', align: 'left'
      });

      // Center Footer: Confidential Clinical Documentation (Bold)
      slide.addText(footerCenterText, {
        x: startX + 2.5, y: 5.16, w: 4.0, h: 0.3,
        fontFace, fontSize: 9, bold: true, color: '1E293B', align: 'center'
      });

      // Right Footer: Slide 1 of 2
      if (showPageNum) {
        slide.addText(`Slide ${slideNum} of ${totalSlides}`, {
          x: startX + 6.0, y: 5.16, w: 3.0, h: 0.3,
          fontFace, fontSize: 9, color: '64748B', align: 'right'
        });
      }
    } catch (e) {
      console.warn('PPT Footer render warning:', e);
    }
  };

  // Helper for adding tables with clean pagination (max 4-5 rows per slide)
  const addTableWithPagination = (slideTitle, headers, rows, colW) => {
    const maxRowsPerSlide = 5;
    if (!rows || rows.length === 0) return;

    for (let i = 0; i < rows.length; i += maxRowsPerSlide) {
      const chunk = rows.slice(i, i + maxRowsPerSlide);
      const slide = createSlide();
      addWatermark(slide);

      slide.addText(i === 0 ? slideTitle : `${slideTitle} (Continued)`, {
        x: startX, y: 0.35, w: contentW, h: 0.4,
        fontFace, fontSize: titleFontSize, bold: true, color: primaryColor
      });

      const startY = 0.85;
      const rowH = chunk.length <= 2 ? 0.6 : 0.45;

      slide.addTable([headers, ...chunk], {
        x: startX, y: startY, w: contentW, colW, rowH,
        border: { pt: 1, color: 'CBD5E1' }
      });
    }
  };

  // Helper to split long key-value arrays across multiple slides so NO slide overflows bottom (max 5 rows/slide)
  const addKeyValueSlides = (slideTitle, rows, colW = [2.8, 6.2]) => {
    const maxRowsPerSlide = 5;
    const headerRow = [
      { text: 'Clinical Field', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
      { text: 'Submitted Approved Value', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } }
    ];

    for (let i = 0; i < rows.length; i += maxRowsPerSlide) {
      const chunk = rows.slice(i, i + maxRowsPerSlide);
      const slide = createSlide();
      addWatermark(slide);

      slide.addText(i === 0 ? slideTitle : `${slideTitle} (Continued)`, {
        x: startX, y: 0.35, w: contentW, h: 0.4,
        fontFace, fontSize: titleFontSize, bold: true, color: primaryColor
      });

      const startY = 0.85;
      slide.addTable([headerRow, ...chunk], {
        x: startX, y: startY, w: contentW, colW, rowH: 0.5,
        border: { pt: 1, color: 'CBD5E1' }
      });
    }
  };

  // ====================================================================
  // SLIDE 1: FIRST SLIDE — COLLEGE ADMIN PPT CONFIGURATION & DETAILS
  // (Student and Preceptor details appear ONLY on this first slide)
  // ====================================================================
  const slide1 = createSlide();
  addWatermark(slide1);

  // College Banner Header Box
  slide1.addShape('rect', {
    x: startX, y: 0.3, w: contentW, h: 0.9,
    fill: { color: 'F1F5F9' }, line: { color: '0F172A', width: 1.5 }
  });

  const collegeLogo = college?.college_logo_url || college?.logo_url || '';
  const hospitalLogo = college?.hospital_logo_url || '';
  const showCollegeLogo = pptSettings?.show_college_logo ?? pptSettings?.show_logo ?? true;
  const showHospitalLogo = pptSettings?.show_hospital_logo ?? true;
  const showCollegeName = pptSettings?.show_college_name ?? true;
  const showAutonomous = pptSettings?.show_autonomous ?? true;
  const showHospitalName = pptSettings?.show_hospital_name ?? true;

  if (showCollegeLogo && collegeLogo) {
    try {
      slide1.addImage({ path: collegeLogo, x: startX + 0.1, y: 0.35, w: 0.8, h: 0.8 });
    } catch (e) {}
  }

  if (showHospitalLogo && hospitalLogo) {
    try {
      slide1.addImage({ path: hospitalLogo, x: startX + contentW - 0.9, y: 0.35, w: 0.8, h: 0.8 });
    } catch (e) {}
  }

  if (showCollegeName) {
    slide1.addText(collegeName.toUpperCase(), {
      x: startX + 1.0, y: 0.35, w: contentW - 2.0, h: 0.4,
      fontFace, fontSize: titleFontSize - 3, bold: true, color: primaryColor, align: 'center'
    });
  }

  const subTextParts = [];
  if (showAutonomous && norm.isAutonomous) subTextParts.push('(Autonomous)');
  if (showHospitalName) subTextParts.push(hospitalName);

  if (subTextParts.length > 0) {
    slide1.addText(subTextParts.join(' • '), {
      x: startX + 1.0, y: 0.75, w: contentW - 2.0, h: 0.3,
      fontFace, fontSize: 12, italic: true, color: '475569', align: 'center'
    });
  }

  // Case ID Sub-bar
  slide1.addShape('rect', {
    x: startX, y: 1.3, w: contentW, h: 0.35,
    fill: { color: '0F172A' }
  });

  slide1.addText(`CASE ID : ${caseId}`, {
    x: startX + 0.1, y: 1.32, w: contentW - 0.2, h: 0.3,
    fontFace: 'Courier New', fontSize: bodyFontSize, bold: true, color: 'FFFFFF', align: 'center'
  });

  // Main Presentation Title & Diagnosis
  slide1.addText('CLINICAL CASE PRESENTATION', {
    x: startX + 0.1, y: 1.75, w: contentW - 0.2, h: 0.4,
    fontFace, fontSize: titleFontSize + 2, bold: true, color: emeraldColor, align: 'center'
  });

  slide1.addText(`Final Diagnosis: ${finalDiagnosis}`, {
    x: startX + 0.1, y: 2.15, w: contentW - 0.2, h: 0.4,
    fontFace, fontSize: headingFontSize, bold: true, color: primaryColor, align: 'center'
  });

  // Student & Preceptor Metadata Card (FIRST SLIDE ONLY)
  const showStudentSig = pptSettings?.show_student_signature !== false;
  const showPreceptorSig = pptSettings?.show_preceptor_signature !== false;

  if (showStudentSig || showPreceptorSig) {
    slide1.addShape('rect', {
      x: startX, y: 2.65, w: contentW, h: 1.6,
      fill: { color: darkBgColor }, line: { color: 'CBD5E1', width: 1 }
    });

    if (showStudentSig) {
      slide1.addText([
        { text: 'Submitted / Presented By:\n', options: { bold: true, fontSize: bodyFontSize - 2, color: '64748B' } },
        { text: `${studentName}\n`, options: { bold: true, fontSize: bodyFontSize + 1, color: primaryColor } },
        { text: `Roll No: ${rollNumber}`, options: { fontSize: bodyFontSize - 1, color: '475569' } }
      ], {
        x: startX + 0.3, y: 2.75, w: 4.0, h: 1.4,
        fontFace, align: 'left'
      });
    }

    if (showPreceptorSig) {
      slide1.addText([
        { text: 'Evaluated & Approved By:\n', options: { bold: true, fontSize: bodyFontSize - 2, color: '64748B' } },
        { text: `${preceptorName}\n`, options: { bold: true, fontSize: bodyFontSize + 1, color: emeraldColor } },
        { text: preceptorDesig, options: { fontSize: bodyFontSize - 1, color: '475569' } }
      ], {
        x: startX + 4.7, y: 2.75, w: 4.0, h: 1.4,
        fontFace, align: 'right'
      });
    }
  }

  // ====================================================================
  // FORM 1: PATIENT PROFILE DOCUMENTATION (ONLY IF APPROVED)
  // ====================================================================
  if (norm.isProfileCompleted) {
    // Demographics & Identifiers
    const profileDemoRows = [
      [{ text: 'Patient Name', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.demographics.patientName, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Age / Gender', options: { fontFace, fontSize: 13, bold: true } }, { text: `${norm.demographics.age} Yrs / ${norm.demographics.gender}`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'IP / OP Registration No', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.demographics.ipOpNo, options: { fontFace, fontSize: 13, bold: true } }],
      [{ text: 'Department & Ward / Bed', options: { fontFace, fontSize: 13, bold: true } }, { text: `${norm.demographics.department} (${norm.demographics.wardBed})`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Date of Admission / Discharge', options: { fontFace, fontSize: 13, bold: true } }, { text: `DOA: ${norm.dates.doa} | DOD: ${norm.dates.dod}`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Attending Physician', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.demographics.physician, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Measurements (Ht / Wt / BMI / BSA)', options: { fontFace, fontSize: 13, bold: true } }, { text: `Ht: ${norm.demographics.height} | Wt: ${norm.demographics.weight} | BMI: ${norm.demographics.bmi} | BSA: ${norm.demographics.bsa}`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Allergies (Drug & Food)', options: { fontFace, fontSize: 13, bold: true } }, { text: `Drug: ${norm.demographics.allergyDrugs} | Food: ${norm.demographics.allergyFood}`, options: { fontFace, fontSize: 13, color: 'DC2626', bold: true } }],
      [{ text: 'Social History & Diet', options: { fontFace, fontSize: 13, bold: true } }, { text: `${norm.demographics.socialHistory} | Diet: ${norm.demographics.diet}`, options: { fontFace, fontSize: 13 } }]
    ];

    addKeyValueSlides('1. PATIENT PROFILE DOCUMENTATION', profileDemoRows);

    // Clinical History & Complaints
    const historyRows = [
      [{ text: 'Chief Complaints', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.history.chiefComplaints, options: { fontFace, fontSize: 13 } }],
      ...(norm.history.hpi ? [[{ text: 'History of Present Illness', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.history.hpi, options: { fontFace, fontSize: 13 } }]] : []),
      [{ text: 'Past Medical History', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.history.pastMedicalHistory, options: { fontFace, fontSize: 13 } }],
      ...(norm.history.pastSurgicalHistory ? [[{ text: 'Past Surgical History', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.history.pastSurgicalHistory, options: { fontFace, fontSize: 13 } }]] : []),
      [{ text: 'Past Medication History', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.history.pastMedicationHistory || 'None Reported', options: { fontFace, fontSize: 13 } }],
      [{ text: 'Family History', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.history.familyHistory || 'None Reported', options: { fontFace, fontSize: 13 } }],
      [{ text: 'General Physical Examination', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.history.generalExam, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Systemic Examination', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.history.systemicExam, options: { fontFace, fontSize: 13 } }]
    ];

    addKeyValueSlides('Patient Profile: Clinical History & Complaints', historyRows);

    // Vital Signs Table
    if (norm.vitals.length > 0) {
      const vitalsHeader = [
        { text: 'Date / Time', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Temp (°F)', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'BP (mmHg)', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Pulse (bpm)', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Resp Rate', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'SpO2 (%)', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } }
      ];

      const vitalsRows = norm.vitals.map(v => [
        { text: v.date || v.created_at || norm.dates.doa, options: { fontFace, fontSize: 12 } },
        { text: v.temp || v.temperature || '98.4', options: { fontFace, fontSize: 12 } },
        { text: v.bp || v.blood_pressure || '120/80', options: { fontFace, fontSize: 12, bold: true } },
        { text: v.pr || v.pulse_rate || v.pulse || '72', options: { fontFace, fontSize: 12 } },
        { text: v.rr || v.respiratory_rate || '18', options: { fontFace, fontSize: 12 } },
        { text: formatSpo2(v.spo2), options: { fontFace, fontSize: 12, bold: true } }
      ]);

      addTableWithPagination('Patient Profile: Vital Signs Monitoring Log', vitalsHeader, vitalsRows, [1.8, 1.4, 1.6, 1.4, 1.4, 1.4]);
    }

    // Lab Investigations Table
    if (norm.labs.length > 0) {
      const labsHeader = [
        { text: 'S.No', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Investigation Test Name', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Patient Result', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Normal Range', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Impression / Status', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } }
      ];

      const labsRows = norm.labs.map((l, idx) => [
        { text: `${idx + 1}`, options: { fontFace, fontSize: 12, align: 'center' } },
        { text: l.parameter_name, options: { fontFace, fontSize: 12, bold: true } },
        { text: l.test_value, options: { fontFace, fontSize: 12, bold: true, color: emeraldColor } },
        { text: l.normal_range, options: { fontFace, fontSize: 12 } },
        { text: l.impression, options: { fontFace, fontSize: 12, bold: true, color: l.impression.includes('Abnormal') || l.impression.includes('High') || l.impression.includes('Low') ? 'DC2626' : emeraldColor } }
      ]);

      addTableWithPagination('Patient Profile: Laboratory Investigations', labsHeader, labsRows, [0.6, 3.2, 1.8, 1.8, 1.6]);
    }

    // Prescribed Medications Profile Table (Matches PDF 6-Column Format)
    if (norm.drugs.length > 0) {
      const drugHeader = [
        { text: 'S.No', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Brand Name', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Generic Name', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Dose & Route', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Frequency', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Indication / Duration', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } }
      ];

      const drugRows = norm.drugs.map((d, idx) => [
        { text: `${d.s_no || idx + 1}`, options: { fontFace, fontSize: 12, align: 'center' } },
        { text: d.trade_name, options: { fontFace, fontSize: 12, bold: true } },
        { text: d.generic_name || '—', options: { fontFace, fontSize: 12 } },
        { text: `${d.dose} (${d.route_of_admin})`, options: { fontFace, fontSize: 12 } },
        { text: d.frequency, options: { fontFace, fontSize: 12, bold: true } },
        { text: d.indication, options: { fontFace, fontSize: 12 } }
      ]);

      addTableWithPagination('Patient Profile: Prescribed Medication Profile', drugHeader, drugRows, [0.6, 2.2, 2.2, 1.6, 1.0, 1.4]);
    }

    // Diagnosis & Discharge Summary
    const diagRows = [
      [{ text: 'Provisional Diagnosis', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.diagnosis.provisional || 'None Specified', options: { fontFace, fontSize: 13 } }],
      [{ text: 'Final Diagnosis', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.diagnosis.final, options: { fontFace, fontSize: 13, bold: true, color: emeraldColor } }],
      [{ text: 'Discharge Summary & Instructions', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.diagnosis.dischargeSummary || 'Patient discharged in stable condition with prescribed medication regimen and follow-up advice.', options: { fontFace, fontSize: 13 } }],
      ...(norm.diagnosis.followUpAdvice ? [[{ text: 'Follow-up Advice', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.diagnosis.followUpAdvice, options: { fontFace, fontSize: 13 } }]] : [])
    ];

    addKeyValueSlides('Patient Profile: Diagnosis & Discharge Summary', diagRows);
  }

  // ====================================================================
  // FORM 2: PATIENT COUNSELLING DOCUMENTATION (ONLY IF APPROVED)
  // ====================================================================
  if (norm.isCounsellingCompleted) {
    const counsellingRows1 = [
      [{ text: 'Counselling Date & Time', options: { fontFace, fontSize: 13, bold: true } }, { text: `${norm.counselling.date} ${norm.counselling.time}`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Provided To / Patient Type', options: { fontFace, fontSize: 13, bold: true } }, { text: `${norm.counselling.providedTo} (${norm.counselling.patientType})`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Duration / Representative Reason', options: { fontFace, fontSize: 13, bold: true } }, { text: `${norm.counselling.timeTaken} ${norm.counselling.representativeReasons ? `(${norm.counselling.representativeReasons})` : ''}`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Disease Counselled', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.counselling.diseaseCounselled, options: { fontFace, fontSize: 13, bold: true } }],
      [{ text: 'Medications Counselled', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.counselling.medicationsCounselled || 'All prescribed maintenance & acute medications', options: { fontFace, fontSize: 13 } }],
      [{ text: 'Key Focus Points Covered', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.counselling.pointsCovered, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Major Barriers Identified', options: { fontFace, fontSize: 13, bold: true } }, { text: `${norm.counselling.majorBarriers}${norm.counselling.barrierDetails ? ` — ${norm.counselling.barrierDetails}` : ''}` || 'None Reported', options: { fontFace, fontSize: 13 } }],
      [{ text: 'Barrier Action & Overcome', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.counselling.barrierOvercome || 'Counselled patient on strategies to overcome barriers.', options: { fontFace, fontSize: 13 } }],
      [{ text: 'Aids Used & Materials Provided', options: { fontFace, fontSize: 13, bold: true } }, { text: `Aids: ${norm.counselling.aidsUsed || 'Pill box, visual charts'} | Material: ${norm.counselling.materialProvided || 'Patient Information Leaflet (PIL)'}`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Understanding Ascertained', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.counselling.understandingAscertained, options: { fontFace, fontSize: 13, bold: true, color: emeraldColor } }],
      ...(norm.counselling.studentNotes ? [[{ text: 'Student Notes & Summary', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.counselling.studentNotes, options: { fontFace, fontSize: 13 } }]] : [])
    ];

    addKeyValueSlides('2. PATIENT COUNSELLING DOCUMENTATION', counsellingRows1);
  }

  // ====================================================================
  // FORM 3: PHARMACIST INTERVENTION DOCUMENTATION (ONLY IF APPROVED)
  // ====================================================================
  if (norm.isInterventionCompleted) {
    const interventionRows1 = [
      [{ text: 'Intervention Date', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.intervention.date, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Present Diagnosis', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.intervention.presentDiagnosis, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Problem Identified (DRP)', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.intervention.prescriptionProblems, options: { fontFace, fontSize: 13, bold: true, color: 'DC2626' } }],
      ...(norm.intervention.problemDescription ? [[{ text: 'Problem Description', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.intervention.problemDescription, options: { fontFace, fontSize: 13 } }]] : []),
      [{ text: 'Detailed Action & Recommendations', options: { fontFace, fontSize: 13, bold: true } }, { text: `${norm.intervention.actionsTaken} — ${norm.intervention.recommendations}`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Significance Level', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.intervention.significanceLevel, options: { fontFace, fontSize: 13, bold: true } }],
      [{ text: 'Physician Acceptance Status', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.intervention.physicianAcceptance, options: { fontFace, fontSize: 13, color: emeraldColor, bold: true } }],
      [{ text: 'Outcome & Impact Comments', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.intervention.outcomeComments || 'Physician accepted recommendation; therapy modified accordingly.', options: { fontFace, fontSize: 13 } }],
      [{ text: 'References Consulted', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.intervention.referencesText || 'Clinical Guidelines & Lexicomp', options: { fontFace, fontSize: 13 } }],
      ...(norm.intervention.followUp ? [[{ text: 'Follow-up Advice', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.intervention.followUp, options: { fontFace, fontSize: 13 } }]] : [])
    ];

    addKeyValueSlides('3. PHARMACIST INTERVENTION DOCUMENTATION', interventionRows1);
  }

  // ====================================================================
  // FORM 4: DRUG INFORMATION REQUEST DOCUMENTATION (ONLY IF APPROVED)
  // ====================================================================
  if (norm.isDirCompleted) {
    const dirRows1 = [
      [{ text: 'Query Date & Time', options: { fontFace, fontSize: 13, bold: true } }, { text: `${norm.dir.date} ${norm.dir.time}`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Enquirer Name & Designation', options: { fontFace, fontSize: 13, bold: true } }, { text: `${norm.dir.enquirerName} (${norm.dir.designation} - ${norm.dir.professionalStatus})`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Mode of Enquiry', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.dir.modeOfEnquiry, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Category of Enquiry', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.dir.questionCategory, options: { fontFace, fontSize: 13, bold: true } }],
      [{ text: 'Turnaround Time Needed', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.dir.timeframeNeeded, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Patient Background Details', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.dir.patientBackground, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Details of Enquiry (Question)', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.dir.detailsOfEnquiry, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Information Provided (Response)', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.dir.informationProvided, options: { fontFace, fontSize: 13, bold: true, color: primaryColor } }],
      [{ text: 'Response Mode', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.dir.responseMode, options: { fontFace, fontSize: 13 } }],
      [{ text: 'References Consulted', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.dir.references.length > 0 ? norm.dir.references.join(', ') : 'Micromedex, AHFS Drug Information, Micromedex Solutions', options: { fontFace, fontSize: 13 } }]
    ];

    addKeyValueSlides('4. DRUG INFORMATION REQUEST DOCUMENTATION', dirRows1);
  }

  // ====================================================================
  // FORM 5: ADR DOCUMENTATION LOG (ONLY IF APPROVED)
  // ====================================================================
  if (norm.isAdrCompleted) {
    // Overview Details
    const adrRows1 = [
      [{ text: 'ADR Log No & Onset Date', options: { fontFace, fontSize: 13, bold: true } }, { text: `Log No: ${norm.adr.adrNumber} | Onset: ${norm.adr.onsetDate}`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Reaction Title & Category', options: { fontFace, fontSize: 13, bold: true } }, { text: `${norm.adr.reactionCategory} — ${norm.adr.reactionTitle}`, options: { fontFace, fontSize: 13, bold: true, color: 'DC2626' } }],
      [{ text: 'Detailed Reaction Description', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.adr.reactionDescription, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Reaction Duration & Management', options: { fontFace, fontSize: 13, bold: true } }, { text: `Duration: ${norm.adr.reactionDuration || '3 days'} | Management: ${norm.adr.clinicalManagement || 'Drug stopped & symptomatic care'}`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Current Patient Condition', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.adr.currentCondition, options: { fontFace, fontSize: 13 } }],
      ...(norm.adr.additionalNotes ? [[{ text: 'Additional Clinical Notes', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.adr.additionalNotes, options: { fontFace, fontSize: 13 } }]] : [])
    ];

    addKeyValueSlides('5. ADR DOCUMENTATION LOG', adrRows1);

    // Suspected Medications Table
    if (norm.adr.suspectedMeds && norm.adr.suspectedMeds.length > 0) {
      const suspHeader = [
        { text: 'Brand / Generic Name', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Dose & Route', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Start Date', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Stop Date', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } },
        { text: 'Indication', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 13 } }
      ];

      const suspRows = norm.adr.suspectedMeds.map(m => [
        { text: m.brand_name || m.generic_name || m.drug_name || 'Suspected Drug', options: { fontFace, fontSize: 12, bold: true } },
        { text: `${m.dose || '—'} (${m.route || 'Oral'})`, options: { fontFace, fontSize: 12 } },
        { text: m.start_date || norm.dates.doa, options: { fontFace, fontSize: 12 } },
        { text: m.stop_date || 'Withdrawn', options: { fontFace, fontSize: 12 } },
        { text: m.indication || '—', options: { fontFace, fontSize: 12 } }
      ]);

      addTableWithPagination('ADR Log: Suspected Medication(s)', suspHeader, suspRows, [2.6, 1.8, 1.4, 1.4, 1.8]);
    }

    // Causality Assessment & Severity
    const adrCausalityRows = [
      [{ text: 'Naranjo Causality Opinion & Score', options: { fontFace, fontSize: 13, bold: true } }, { text: `${norm.adr.naranjoCausality} ${norm.adr.causalityScore ? `(Score: ${norm.adr.causalityScore})` : ''}`, options: { fontFace, fontSize: 13, bold: true, color: emeraldColor } }],
      [{ text: 'Reaction Severity & Seriousness', options: { fontFace, fontSize: 13, bold: true } }, { text: `Severity: ${norm.adr.reactionSeverity} | Seriousness: ${norm.adr.reactionSeriousness}`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Action Taken on Suspected Drug', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.adr.actionTakenOnDrug, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Dechallenge & Rechallenge Info', options: { fontFace, fontSize: 13, bold: true } }, { text: `Dechallenge: ${norm.adr.dechallengeInfo} | Rechallenge: ${norm.adr.rechallengeInfo}`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Patient Outcome', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.adr.patientOutcome, options: { fontFace, fontSize: 13, bold: true } }],
      [{ text: 'Renal / Hepatic Status & History', options: { fontFace, fontSize: 13, bold: true } }, { text: `Renal: ${norm.adr.renalStatus} | Hepatic: ${norm.adr.hepaticStatus} | Prev ADR: ${norm.adr.previousAdrHistory}`, options: { fontFace, fontSize: 13 } }],
      [{ text: 'Clinical Review Remarks', options: { fontFace, fontSize: 13, bold: true } }, { text: norm.adr.clinicalRemarks || 'ADR monitored and documented in hospital pharmacovigilance registry.', options: { fontFace, fontSize: 13 } }]
    ];

    addKeyValueSlides('ADR Log: Causality Assessment & Outcome', adrCausalityRows);
  }

  // Iterate all created slides and apply exact 3-column footer with dividing line
  const totalSlides = slidesList.length;
  slidesList.forEach((slide, idx) => {
    addFooterToSlide(slide, idx + 1, totalSlides);
  });

  // Save presentation file directly (Requirement 10)
  const cleanCaseId = String(norm.caseId).replace(/[^A-Za-z0-9_-]/g, '_');
  
  let platformPrefix = 'PHARMDVERSE';
  try {
    const cached = typeof window !== 'undefined' ? window.localStorage.getItem('pharmdverse_platform_settings_cache') : null;
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.platform_name) {
        platformPrefix = parsed.platform_name.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      }
    }
  } catch (e) {}

  const fileName = `${platformPrefix}_${cleanCaseId}_Approved_Case.pptx`;
  await pptx.writeFile({ fileName });
};

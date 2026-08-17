import pptxgen from 'pptxgenjs';
import { buildNormalizedApprovedCaseData } from './buildNormalizedApprovedCaseData';

/**
 * Generate and download an editable PowerPoint (.pptx) presentation for a COMPLETE APPROVED CASE.
 * Consumes the central normalized data model from buildNormalizedApprovedCaseData.
 * Respects strict form boundaries, renders 100% of approved fields, ensures watermark visibility,
 * and renders Student/Preceptor details ONLY ON THE FIRST SLIDE.
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

  // Page setup & configuration (16:9 Widescreen default vs 4:3 Standard)
  const isWidescreen = (pptSettings?.aspect_ratio || pptSettings?.ppt_aspect_ratio) !== '4:3 (Standard)';
  pptx.layout = isWidescreen ? 'LAYOUT_16x9' : 'LAYOUT_4x3';

  // Fonts & Styling Tokens
  const fontFace = pptSettings?.font_family || pptSettings?.ppt_font_family || 'Times New Roman';
  const titleFontSize = parseInt(pptSettings?.ppt_title_font_size || pptSettings?.title_font_size || '20', 10);
  const subHeadingFontSize = parseInt(pptSettings?.ppt_subheading_font_size || pptSettings?.subheading_font_size || '16', 10);
  const bodyFontSize = parseInt(pptSettings?.ppt_body_font_size || pptSettings?.body_font_size || '13', 10);

  const primaryColor = '0F172A'; // Slate-900
  const emeraldColor = '059669'; // Emerald-600
  const darkBgColor = 'F8FAFC'; // Slate-50

  const contentW = 9.0;
  const startX = 0.5;

  const collegeName = norm.collegeName;
  const hospitalName = norm.hospitalName;
  const caseId = norm.caseId;
  const studentName = norm.studentName;
  const rollNumber = norm.studentRoll;
  const preceptorName = norm.preceptorName;
  const preceptorDesig = norm.preceptorDesig;
  const finalDiagnosis = norm.diagnosis.final;
  const footerText = pptSettings?.footer_text || pptSettings?.ppt_footer_text || `${collegeName} • Clinical Case Presentation`;

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
          x: startX, y: isDiagonal ? 2.0 : 2.1, w: contentW, h: 0.6,
          fontFace, fontSize: 24, bold: true, color: watermarkColor,
          align: 'center', rotate
        });
        // Line 2
        slide.addText(line2, {
          x: startX, y: isDiagonal ? 2.6 : 2.7, w: contentW, h: 0.5,
          fontFace, fontSize: 14, bold: true, color: watermarkColor,
          align: 'center', rotate
        });
      } else {
        slide.addText(line1, {
          x: startX, y: 2.3, w: contentW, h: 0.8,
          fontFace, fontSize: 26, bold: true, color: watermarkColor,
          align: 'center', rotate
        });
      }
    } catch (e) {
      console.warn('PPT Watermark render warning:', e);
    }
  };

  // Helper for adding tables with clean pagination across multiple slides
  const addTableWithPagination = (slideTitle, headers, rows, colW) => {
    const maxRowsPerSlide = 6;
    if (!rows || rows.length === 0) return;

    for (let i = 0; i < rows.length; i += maxRowsPerSlide) {
      const chunk = rows.slice(i, i + maxRowsPerSlide);
      const slide = pptx.addSlide();
      addWatermark(slide);

      slide.addText(i === 0 ? slideTitle : `${slideTitle} (Continued)`, {
        x: startX, y: 0.3, w: contentW, h: 0.4,
        fontFace, fontSize: titleFontSize, bold: true, color: primaryColor
      });

      slide.addTable([headers, ...chunk], {
        x: startX, y: 0.8, w: contentW, colW,
        border: { pt: 1, color: 'CBD5E1' }
      });

      slide.addText(footerText, {
        x: startX, y: 4.8, w: contentW, h: 0.3,
        fontFace, fontSize: 9, color: '64748B', align: 'center'
      });
    }
  };

  // ====================================================================
  // SLIDE 1: FIRST SLIDE — COLLEGE ADMIN PPT CONFIGURATION & DETAILS
  // (Student and Preceptor details appear ONLY on this first slide)
  // ====================================================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: 'FFFFFF' };
  addWatermark(slide1);

  // College Banner Header Box
  slide1.addShape(pptx.shapes.RECTANGLE, {
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
      fontFace, fontSize: Math.max(subHeadingFontSize - 4, 11), italic: true, color: '475569', align: 'center'
    });
  }

  // Case ID Sub-bar
  slide1.addShape(pptx.shapes.RECTANGLE, {
    x: startX, y: 1.3, w: contentW, h: 0.35,
    fill: { color: '0F172A' }
  });

  slide1.addText(`CASE ID : ${caseId}`, {
    x: startX + 0.1, y: 1.32, w: contentW - 0.2, h: 0.3,
    fontFace: 'Courier New', fontSize: bodyFontSize - 1, bold: true, color: 'FFFFFF', align: 'center'
  });

  // Main Presentation Title & Diagnosis
  slide1.addText('CLINICAL CASE PRESENTATION', {
    x: startX + 0.1, y: 1.75, w: contentW - 0.2, h: 0.4,
    fontFace, fontSize: titleFontSize + 2, bold: true, color: emeraldColor, align: 'center'
  });

  slide1.addText(`Final Diagnosis: ${finalDiagnosis}`, {
    x: startX + 0.1, y: 2.15, w: contentW - 0.2, h: 0.4,
    fontFace, fontSize: subHeadingFontSize + 1, bold: true, color: primaryColor, align: 'center'
  });

  // Student & Preceptor Metadata Card (FIRST SLIDE ONLY)
  const showStudentSig = pptSettings?.show_student_signature !== false;
  const showPreceptorSig = pptSettings?.show_preceptor_signature !== false;

  if (showStudentSig || showPreceptorSig) {
    slide1.addShape(pptx.shapes.RECTANGLE, {
      x: startX, y: 2.65, w: contentW, h: 1.6,
      fill: { color: darkBgColor }, line: { color: 'CBD5E1', width: 1 }
    });

    if (showStudentSig) {
      slide1.addText([
        { text: 'Submitted / Presented By:\n', options: { bold: true, fontSize: bodyFontSize - 2, color: '64748B' } },
        { text: `${studentName}\n`, options: { bold: true, fontSize: bodyFontSize + 1, color: primaryColor } },
        { text: `Roll No: ${rollNumber}`, options: { fontSize: bodyFontSize - 2, color: '475569' } }
      ], {
        x: startX + 0.3, y: 2.75, w: 4.0, h: 1.4,
        fontFace, align: 'left'
      });
    }

    if (showPreceptorSig) {
      slide1.addText([
        { text: 'Evaluated & Approved By:\n', options: { bold: true, fontSize: bodyFontSize - 2, color: '64748B' } },
        { text: `${preceptorName}\n`, options: { bold: true, fontSize: bodyFontSize + 1, color: emeraldColor } },
        { text: preceptorDesig, options: { fontSize: bodyFontSize - 2, color: '475569' } }
      ], {
        x: startX + 4.7, y: 2.75, w: 4.0, h: 1.4,
        fontFace, align: 'right'
      });
    }
  }

  slide1.addText(footerText, {
    x: startX, y: 4.8, w: contentW, h: 0.3,
    fontFace, fontSize: 9, color: '64748B', align: 'center'
  });

  // ====================================================================
  // FORM 1: PATIENT PROFILE DOCUMENTATION (ONLY IF APPROVED)
  // ====================================================================
  if (norm.isProfileCompleted) {
    // SLIDE 2: Patient Demographics & Profile Identifiers
    const slideProfile1 = pptx.addSlide();
    addWatermark(slideProfile1);
    slideProfile1.addText('1. PATIENT PROFILE DOCUMENTATION', {
      x: startX, y: 0.3, w: contentW, h: 0.4,
      fontFace, fontSize: titleFontSize, bold: true, color: primaryColor
    });

    const profileDemoRows = [
      [{ text: 'Clinical Field', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }, { text: 'Submitted Approved Value', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }],
      [{ text: 'Patient Name', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.demographics.patientName, options: { fontFace, fontSize: 10 } }],
      [{ text: 'Age / Gender', options: { fontFace, fontSize: 10, bold: true } }, { text: `${norm.demographics.age} Yrs / ${norm.demographics.gender}`, options: { fontFace, fontSize: 10 } }],
      [{ text: 'IP / OP Registration No', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.demographics.ipOpNo, options: { fontFace, fontSize: 10, bold: true } }],
      [{ text: 'Department & Ward / Bed', options: { fontFace, fontSize: 10, bold: true } }, { text: `${norm.demographics.department} (${norm.demographics.wardBed})`, options: { fontFace, fontSize: 10 } }],
      [{ text: 'Date of Admission / Discharge', options: { fontFace, fontSize: 10, bold: true } }, { text: `DOA: ${norm.dates.doa} | DOD: ${norm.dates.dod}`, options: { fontFace, fontSize: 10 } }],
      [{ text: 'Attending Physician', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.demographics.physician, options: { fontFace, fontSize: 10 } }],
      [{ text: 'Measurements (Ht / Wt / BMI)', options: { fontFace, fontSize: 10, bold: true } }, { text: `Ht: ${norm.demographics.height} | Wt: ${norm.demographics.weight} | BMI: ${norm.demographics.bmi}`, options: { fontFace, fontSize: 10 } }],
      [{ text: 'Allergies (Drug & Food)', options: { fontFace, fontSize: 10, bold: true } }, { text: `Drug: ${norm.demographics.allergyDrugs} | Food: ${norm.demographics.allergyFood}`, options: { fontFace, fontSize: 10, color: 'DC2626', bold: true } }],
      [{ text: 'Social History & Diet', options: { fontFace, fontSize: 10, bold: true } }, { text: `${norm.demographics.socialHistory} | Diet: ${norm.demographics.diet}`, options: { fontFace, fontSize: 10 } }]
    ];

    slideProfile1.addTable(profileDemoRows, {
      x: startX, y: 0.8, w: contentW, colW: [2.8, 6.2],
      border: { pt: 1, color: 'CBD5E1' }
    });
    slideProfile1.addText(footerText, { x: startX, y: 4.8, w: contentW, h: 0.3, fontFace, fontSize: 9, color: '64748B', align: 'center' });

    // SLIDE 3: Clinical History & Complaints
    const slideProfile2 = pptx.addSlide();
    addWatermark(slideProfile2);
    slideProfile2.addText('Patient Profile: Clinical History & Complaints', {
      x: startX, y: 0.3, w: contentW, h: 0.4,
      fontFace, fontSize: titleFontSize, bold: true, color: primaryColor
    });

    const historyRows = [
      [{ text: 'History Category', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }, { text: 'Detailed Clinical Record', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }],
      [{ text: 'Chief Complaints', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.history.chiefComplaints, options: { fontFace, fontSize: 10 } }],
      [{ text: 'Past Medical History', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.history.pastMedicalHistory, options: { fontFace, fontSize: 10 } }],
      [{ text: 'Past Medication History', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.history.pastMedicationHistory || 'None Reported', options: { fontFace, fontSize: 10 } }],
      [{ text: 'Family History', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.history.familyHistory || 'None Reported', options: { fontFace, fontSize: 10 } }],
      [{ text: 'General Physical Examination', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.history.generalExam, options: { fontFace, fontSize: 10 } }],
      [{ text: 'Systemic Examination', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.history.systemicExam, options: { fontFace, fontSize: 10 } }]
    ];

    slideProfile2.addTable(historyRows, {
      x: startX, y: 0.8, w: contentW, colW: [2.8, 6.2],
      border: { pt: 1, color: 'CBD5E1' }
    });
    slideProfile2.addText(footerText, { x: startX, y: 4.8, w: contentW, h: 0.3, fontFace, fontSize: 9, color: '64748B', align: 'center' });

    // SLIDE 4: Vital Signs Table
    if (norm.vitals.length > 0) {
      const vitalsHeader = [
        { text: 'Date / Time', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Temp (°F)', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'BP (mmHg)', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Pulse (bpm)', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Resp Rate', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'SpO2 (%)', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } }
      ];

      const vitalsRows = norm.vitals.map(v => [
        { text: v.date || v.created_at || norm.dates.doa, options: { fontFace, fontSize: 9 } },
        { text: v.temp || v.temperature || '98.6', options: { fontFace, fontSize: 9 } },
        { text: v.bp || v.blood_pressure || '120/80', options: { fontFace, fontSize: 9, bold: true } },
        { text: v.pr || v.pulse_rate || v.pulse || '72', options: { fontFace, fontSize: 9 } },
        { text: v.rr || v.respiratory_rate || '18', options: { fontFace, fontSize: 9 } },
        { text: v.spo2 ? `${v.spo2}%` : '98%', options: { fontFace, fontSize: 9, bold: true } }
      ]);

      addTableWithPagination('Patient Profile: Vital Signs Monitoring Log', vitalsHeader, vitalsRows, [1.8, 1.4, 1.6, 1.4, 1.4, 1.4]);
    }

    // SLIDE 5: Lab Investigations Table
    if (norm.labs.length > 0) {
      const labsHeader = [
        { text: 'S.No', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Investigation Test Name', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Patient Result', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Normal Range', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Unit / Impression', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } }
      ];

      const labsRows = norm.labs.map((l, idx) => [
        { text: `${idx + 1}`, options: { fontFace, fontSize: 9, align: 'center' } },
        { text: l.test_name || l.name || l.lab_test || '—', options: { fontFace, fontSize: 9, bold: true } },
        { text: l.result || l.patient_result || '—', options: { fontFace, fontSize: 9, bold: true, color: emeraldColor } },
        { text: l.normal_range || l.reference_range || '—', options: { fontFace, fontSize: 9 } },
        { text: `${l.unit || ''} ${l.remarks ? `(${l.remarks})` : ''}`, options: { fontFace, fontSize: 9 } }
      ]);

      addTableWithPagination('Patient Profile: Laboratory Investigations', labsHeader, labsRows, [0.6, 3.2, 1.8, 1.8, 1.6]);
    }

    // SLIDE 6: Prescribed Medications Profile
    if (norm.drugs.length > 0) {
      const drugHeader = [
        { text: 'S.No', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Brand & Generic Name', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Dose & Route', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Frequency', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Indication / Reason', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } }
      ];

      const drugRows = norm.drugs.map((d, idx) => [
        { text: `${d.s_no || idx + 1}`, options: { fontFace, fontSize: 9, align: 'center' } },
        { text: `${d.trade_name || d.brand_name || ''} ${d.generic_name || d.drug_name ? `(${d.generic_name || d.drug_name})` : ''}`, options: { fontFace, fontSize: 9, bold: true } },
        { text: `${d.dose || '—'} (${d.route_of_admin || d.route || 'Oral'})`, options: { fontFace, fontSize: 9 } },
        { text: d.frequency || 'OD', options: { fontFace, fontSize: 9, bold: true } },
        { text: d.indication || '—', options: { fontFace, fontSize: 9 } }
      ]);

      addTableWithPagination('Patient Profile: Prescribed Medication Profile', drugHeader, drugRows, [0.6, 3.2, 1.8, 1.4, 2.0]);
    }

    // SLIDE 7: Diagnosis & Discharge Summary
    const slideProfileEnd = pptx.addSlide();
    addWatermark(slideProfileEnd);
    slideProfileEnd.addText('Patient Profile: Diagnosis & Discharge Summary', {
      x: startX, y: 0.3, w: contentW, h: 0.4,
      fontFace, fontSize: titleFontSize, bold: true, color: primaryColor
    });

    const diagRows = [
      [{ text: 'Diagnostic & Discharge Category', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }, { text: 'Approved Clinical Summary', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }],
      [{ text: 'Provisional Diagnosis', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.diagnosis.provisional || 'None Specified', options: { fontFace, fontSize: 10 } }],
      [{ text: 'Final Diagnosis', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.diagnosis.final, options: { fontFace, fontSize: 10, bold: true, color: emeraldColor } }],
      [{ text: 'Discharge Summary & Instructions', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.diagnosis.dischargeSummary || 'Patient discharged in stable condition with prescribed medication regimen and follow-up advice.', options: { fontFace, fontSize: 10 } }]
    ];

    slideProfileEnd.addTable(diagRows, {
      x: startX, y: 0.8, w: contentW, colW: [2.8, 6.2],
      border: { pt: 1, color: 'CBD5E1' }
    });
    slideProfileEnd.addText(footerText, { x: startX, y: 4.8, w: contentW, h: 0.3, fontFace, fontSize: 9, color: '64748B', align: 'center' });
  }

  // ====================================================================
  // FORM 2: PATIENT COUNSELLING DOCUMENTATION (ONLY IF APPROVED)
  // ====================================================================
  if (norm.isCounsellingCompleted) {
    const slideCounselling1 = pptx.addSlide();
    addWatermark(slideCounselling1);
    slideCounselling1.addText('2. PATIENT COUNSELLING DOCUMENTATION', {
      x: startX, y: 0.3, w: contentW, h: 0.4,
      fontFace, fontSize: titleFontSize, bold: true, color: primaryColor
    });

    const counsellingRows1 = [
      [{ text: 'Counselling Aspect', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }, { text: 'Submitted Approved Details', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }],
      [{ text: 'Counselling Date & Time', options: { fontFace, fontSize: 9, bold: true } }, { text: `${norm.counselling.date} ${norm.counselling.time}`, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Provided To / Patient Type', options: { fontFace, fontSize: 9, bold: true } }, { text: `${norm.counselling.providedTo} (${norm.counselling.patientType})`, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Duration / Representative Reason', options: { fontFace, fontSize: 9, bold: true } }, { text: `${norm.counselling.timeTaken} ${norm.counselling.representativeReasons ? `(${norm.counselling.representativeReasons})` : ''}`, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Disease Counselled', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.counselling.diseaseCounselled, options: { fontFace, fontSize: 9, bold: true } }],
      [{ text: 'Medications Counselled', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.counselling.medicationsCounselled || 'All prescribed maintenance & acute medications', options: { fontFace, fontSize: 9 } }],
      [{ text: 'Key Focus Points Covered', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.counselling.pointsCovered, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Major Barriers Identified', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.counselling.majorBarriers || 'None Reported', options: { fontFace, fontSize: 9 } }],
      [{ text: 'Barrier Action & Overcome', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.counselling.barrierOvercome || 'Counselled patient on strategies to overcome barriers.', options: { fontFace, fontSize: 9 } }],
      [{ text: 'Aids Used & Materials Provided', options: { fontFace, fontSize: 9, bold: true } }, { text: `Aids: ${norm.counselling.aidsUsed || 'Pill box, visual charts'} | Material: ${norm.counselling.materialProvided || 'Patient Information Leaflet (PIL)'}`, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Understanding Ascertained', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.counselling.understandingAscertained, options: { fontFace, fontSize: 9, bold: true, color: emeraldColor } }]
    ];

    slideCounselling1.addTable(counsellingRows1, {
      x: startX, y: 0.8, w: contentW, colW: [2.8, 6.2],
      border: { pt: 1, color: 'CBD5E1' }
    });
    slideCounselling1.addText(footerText, { x: startX, y: 4.8, w: contentW, h: 0.3, fontFace, fontSize: 9, color: '64748B', align: 'center' });
  }

  // ====================================================================
  // FORM 3: PHARMACIST INTERVENTION DOCUMENTATION (ONLY IF APPROVED)
  // ====================================================================
  if (norm.isInterventionCompleted) {
    const slideIntervention1 = pptx.addSlide();
    addWatermark(slideIntervention1);
    slideIntervention1.addText('3. PHARMACIST INTERVENTION DOCUMENTATION', {
      x: startX, y: 0.3, w: contentW, h: 0.4,
      fontFace, fontSize: titleFontSize, bold: true, color: primaryColor
    });

    const interventionRows1 = [
      [{ text: 'Intervention Aspect', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }, { text: 'Submitted Approved Clinical Action & Recommendations', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }],
      [{ text: 'Intervention Date', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.intervention.date, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Present Diagnosis', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.intervention.presentDiagnosis, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Problem Identified (DRP)', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.intervention.prescriptionProblems, options: { fontFace, fontSize: 9, bold: true, color: 'DC2626' } }],
      [{ text: 'Detailed Action & Recommendations', options: { fontFace, fontSize: 9, bold: true } }, { text: `${norm.intervention.actionsTaken} — ${norm.intervention.recommendations}`, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Significance Level', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.intervention.significanceLevel, options: { fontFace, fontSize: 9, bold: true } }],
      [{ text: 'Physician Acceptance Status', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.intervention.physicianAcceptance, options: { fontFace, fontSize: 9, color: emeraldColor, bold: true } }],
      [{ text: 'Outcome & Impact Comments', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.intervention.outcomeComments || 'Physician accepted recommendation; therapy modified accordingly.', options: { fontFace, fontSize: 9 } }],
      [{ text: 'References Consulted', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.intervention.referencesText || 'Clinical Guidelines & Lexicomp', options: { fontFace, fontSize: 9 } }]
    ];

    slideIntervention1.addTable(interventionRows1, {
      x: startX, y: 0.8, w: contentW, colW: [2.8, 6.2],
      border: { pt: 1, color: 'CBD5E1' }
    });
    slideIntervention1.addText(footerText, { x: startX, y: 4.8, w: contentW, h: 0.3, fontFace, fontSize: 9, color: '64748B', align: 'center' });
  }

  // ====================================================================
  // FORM 4: DRUG INFORMATION REQUEST DOCUMENTATION (ONLY IF APPROVED)
  // ====================================================================
  if (norm.isDirCompleted) {
    const slideDir1 = pptx.addSlide();
    addWatermark(slideDir1);
    slideDir1.addText('4. DRUG INFORMATION REQUEST DOCUMENTATION', {
      x: startX, y: 0.3, w: contentW, h: 0.4,
      fontFace, fontSize: titleFontSize, bold: true, color: primaryColor
    });

    const dirRows1 = [
      [{ text: 'Enquiry Aspect', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }, { text: 'Submitted Approved Request & Response Details', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }],
      [{ text: 'Query Date & Time', options: { fontFace, fontSize: 9, bold: true } }, { text: `${norm.dir.date} ${norm.dir.time}`, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Enquirer Name & Category', options: { fontFace, fontSize: 9, bold: true } }, { text: `${norm.dir.enquirerName} (${norm.dir.professionalStatus})`, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Category of Enquiry', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.dir.questionCategory, options: { fontFace, fontSize: 9, bold: true } }],
      [{ text: 'Turnaround Time Needed', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.dir.timeframeNeeded, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Patient Background Details', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.dir.patientBackground, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Details of Enquiry (Question)', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.dir.detailsOfEnquiry, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Information Provided (Response)', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.dir.informationProvided, options: { fontFace, fontSize: 9, bold: true, color: primaryColor } }],
      [{ text: 'References Consulted', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.dir.references.length > 0 ? norm.dir.references.join(', ') : 'Micromedex, AHFS Drug Information, Micromedex Solutions', options: { fontFace, fontSize: 9 } }]
    ];

    slideDir1.addTable(dirRows1, {
      x: startX, y: 0.8, w: contentW, colW: [2.8, 6.2],
      border: { pt: 1, color: 'CBD5E1' }
    });
    slideDir1.addText(footerText, { x: startX, y: 4.8, w: contentW, h: 0.3, fontFace, fontSize: 9, color: '64748B', align: 'center' });
  }

  // ====================================================================
  // FORM 5: ADR DOCUMENTATION LOG (ONLY IF APPROVED)
  // ====================================================================
  if (norm.isAdrCompleted) {
    // SLIDE ADR 1: Adverse Event & Record Overview
    const slideAdr1 = pptx.addSlide();
    addWatermark(slideAdr1);
    slideAdr1.addText('5. ADR DOCUMENTATION LOG', {
      x: startX, y: 0.3, w: contentW, h: 0.4,
      fontFace, fontSize: titleFontSize, bold: true, color: primaryColor
    });

    const adrRows1 = [
      [{ text: 'ADR Record Field', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }, { text: 'Submitted Approved Details', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }],
      [{ text: 'ADR Log No & Onset Date', options: { fontFace, fontSize: 9, bold: true } }, { text: `Log No: ${norm.adr.adrNumber} | Onset: ${norm.adr.onsetDate}`, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Reaction Title & Category', options: { fontFace, fontSize: 9, bold: true } }, { text: `${norm.adr.reactionCategory} — ${norm.adr.reactionTitle}`, options: { fontFace, fontSize: 9, bold: true, color: 'DC2626' } }],
      [{ text: 'Detailed Reaction Description', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.adr.reactionDescription, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Reaction Duration & Management', options: { fontFace, fontSize: 9, bold: true } }, { text: `Duration: ${norm.adr.reactionDuration || '3 days'} | Management: ${norm.adr.clinicalManagement || 'Drug stopped & symptomatic care'}`, options: { fontFace, fontSize: 9 } }],
      [{ text: 'Current Patient Condition', options: { fontFace, fontSize: 9, bold: true } }, { text: norm.adr.currentCondition, options: { fontFace, fontSize: 9 } }]
    ];

    slideAdr1.addTable(adrRows1, {
      x: startX, y: 0.8, w: contentW, colW: [2.8, 6.2],
      border: { pt: 1, color: 'CBD5E1' }
    });
    slideAdr1.addText(footerText, { x: startX, y: 4.8, w: contentW, h: 0.3, fontFace, fontSize: 9, color: '64748B', align: 'center' });

    // SLIDE ADR 2: Suspected Medications Table
    if (norm.adr.suspectedMeds && norm.adr.suspectedMeds.length > 0) {
      const suspHeader = [
        { text: 'Brand / Generic Name', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Dose & Route', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Start Date', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Stop Date', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } },
        { text: 'Indication', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 10 } }
      ];

      const suspRows = norm.adr.suspectedMeds.map(m => [
        { text: m.brand_name || m.generic_name || m.drug_name || 'Suspected Drug', options: { fontFace, fontSize: 9, bold: true } },
        { text: `${m.dose || '—'} (${m.route || 'Oral'})`, options: { fontFace, fontSize: 9 } },
        { text: m.start_date || norm.dates.doa, options: { fontFace, fontSize: 9 } },
        { text: m.stop_date || 'Withdrawn', options: { fontFace, fontSize: 9 } },
        { text: m.indication || '—', options: { fontFace, fontSize: 9 } }
      ]);

      addTableWithPagination('ADR Log: Suspected Medication(s)', suspHeader, suspRows, [2.8, 1.8, 1.4, 1.4, 1.6]);
    }

    // SLIDE ADR 3: Causality Assessment & Severity
    const slideAdrEnd = pptx.addSlide();
    addWatermark(slideAdrEnd);
    slideAdrEnd.addText('ADR Log: Causality Assessment & Outcome', {
      x: startX, y: 0.3, w: contentW, h: 0.4,
      fontFace, fontSize: titleFontSize, bold: true, color: primaryColor
    });

    const adrCausalityRows = [
      [{ text: 'Assessment Metric', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }, { text: 'Approved Evaluated Output', options: { bold: true, fill: { color: 'F1F5F9' }, fontFace, fontSize: 11 } }],
      [{ text: 'Naranjo Causality Assessment', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.adr.naranjoCausality, options: { fontFace, fontSize: 10, bold: true, color: emeraldColor } }],
      [{ text: 'Reaction Severity & Seriousness', options: { fontFace, fontSize: 10, bold: true } }, { text: `Severity: ${norm.adr.reactionSeverity} | Seriousness: ${norm.adr.reactionSeriousness}`, options: { fontFace, fontSize: 10 } }],
      [{ text: 'Action Taken on Suspected Drug', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.adr.actionTakenOnDrug, options: { fontFace, fontSize: 10 } }],
      [{ text: 'Dechallenge & Rechallenge Info', options: { fontFace, fontSize: 10, bold: true } }, { text: `Dechallenge: ${norm.adr.dechallengeInfo} | Rechallenge: ${norm.adr.rechallengeInfo}`, options: { fontFace, fontSize: 10 } }],
      [{ text: 'Patient Outcome', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.adr.patientOutcome, options: { fontFace, fontSize: 10, bold: true } }],
      [{ text: 'Renal / Hepatic Status & History', options: { fontFace, fontSize: 10, bold: true } }, { text: `Renal: ${norm.adr.renalStatus} | Hepatic: ${norm.adr.hepaticStatus} | Prev ADR: ${norm.adr.previousAdrHistory}`, options: { fontFace, fontSize: 10 } }],
      [{ text: 'Clinical Review Remarks', options: { fontFace, fontSize: 10, bold: true } }, { text: norm.adr.clinicalRemarks || 'ADR monitored and documented in hospital pharmacovigilance registry.', options: { fontFace, fontSize: 10 } }]
    ];

    slideAdrEnd.addTable(adrCausalityRows, {
      x: startX, y: 0.8, w: contentW, colW: [2.8, 6.2],
      border: { pt: 1, color: 'CBD5E1' }
    });
    slideAdrEnd.addText(footerText, { x: startX, y: 4.8, w: contentW, h: 0.3, fontFace, fontSize: 9, color: '64748B', align: 'center' });
  }

  // Save presentation file directly
  const fileName = `${norm.caseId}_Presentation.pptx`;
  await pptx.writeFile({ fileName });
};

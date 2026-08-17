import jsPDF from 'jspdf';
import { buildNormalizedApprovedCaseData } from './buildNormalizedApprovedCaseData';

/**
 * Image format detection helper for jsPDF addImage
 */
const getImageFormat = (imgUrl) => {
  if (!imgUrl) return 'PNG';
  if (typeof imgUrl === 'string') {
    if (imgUrl.startsWith('data:image/jpeg') || imgUrl.startsWith('data:image/jpg') || imgUrl.toLowerCase().endsWith('.jpg') || imgUrl.toLowerCase().endsWith('.jpeg')) return 'JPEG';
    if (imgUrl.startsWith('data:image/png') || imgUrl.toLowerCase().endsWith('.png')) return 'PNG';
    if (imgUrl.startsWith('data:image/webp') || imgUrl.toLowerCase().endsWith('.webp')) return 'WEBP';
  }
  return 'PNG';
};

/**
 * STEP 11: PATIENT PROFILE FORM ONLY - High-Precision Vector PDF Generator
 * 
 * 1. SOURCE: Approved Patient Profile form data ONLY.
 * 2. BOXED / TABLE FORMAT: 100% structured boxes & tables for all sections matching original template.
 * 3. WATERMARK ALIGNMENT: Reads watermark_text_line1, watermark_text_line2, opacity, position ('Center' flat vs 'Diagonal' 35°).
 * 4. DYNAMIC ROW HEIGHTS: Calculates line wrapping in table cells (Drugs & Labs) to eliminate row collisions.
 * 5. ALL FIELDS: 100% dynamic extraction of all student-entered Patient Profile fields.
 * 6. SIGNATURES: Student & Preceptor Details/Signatures on final page of Patient Profile section.
 */
export const generateOfficialClinicalCasePDF = ({
  clinicalCase = {},
  student = {},
  preceptor = {},
  college = {},
  caseModulesData = {},
  branding = {}
}) => {
  const norm = buildNormalizedApprovedCaseData({
    clinicalCase,
    student,
    preceptor,
    college,
    caseModulesData
  });

  const profile = caseModulesData?.profile || clinicalCase?.profile || {};

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const contentWidth = 180; // 210 - 30
  const maxY = pageHeight - 15; // 282mm

  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const fontFamily = 'times';
  const titleFontSize = 14;
  const bodyFontSize = 12;

  // FORMAT CONTROLS FROM COLLEGE ADMIN
  const showCollegeLogo = branding?.show_college_logo ?? branding?.show_logo ?? true;
  const showCollegeName = branding?.show_college_name ?? true;
  const showAutonomous = branding?.show_autonomous ?? true;
  const showHospitalLogo = branding?.show_hospital_logo ?? true;
  const showHospitalName = branding?.show_hospital_name ?? true;

  const watermarkEnabled = (branding?.watermark_enabled !== false) && (branding?.show_watermark !== false);
  const watermarkTextLine1 = (branding?.watermark_text_line1 || branding?.watermark_text || college?.college_code || 'PHARMDVERSE').toUpperCase();
  const watermarkTextLine2 = (branding?.watermark_text_line2 || branding?.watermark_line_2 || 'CLINICAL DOCUMENTATION SYSTEM').toUpperCase();
  const watermarkOpacity = Math.min(Math.max(parseFloat(branding?.watermark_opacity ?? 10) / 100, 0.05), 0.30);
  const watermarkPosition = branding?.watermark_position || 'Center';

  const footerLeftText = branding?.footer_left_text || norm.collegeName || 'PharmDVerse';
  const footerCenterText = branding?.footer_center_text || 'Confidential Clinical Documentation';
  const showPageNumber = branding?.show_page_number !== false;
  const showGeneratedDatetime = branding?.show_generated_datetime !== false;

  const repeatHeader = (branding?.repeat_header ?? branding?.header_enabled) !== false;
  const repeatFooter = (branding?.repeat_footer ?? branding?.footer_enabled) !== false;
  const showStudentSignature = branding?.show_student_signature !== false;
  const showPreceptorSignature = branding?.show_preceptor_signature !== false;
  const zebraStriping = branding?.zebra_striping === true;
  const repeatTableHeader = branding?.repeat_table_header !== false;

  // --- HEADER DRAWING ---
  const drawPageHeader = () => {
    doc.saveGraphicsState();
    doc.setDrawColor(15, 23, 42); // slate-900
    doc.setLineWidth(0.5);
    doc.rect(marginX, 10, contentWidth, 20); // Header outer box

    const collegeLogo = college?.college_logo_url || college?.logo_url || branding?.college_logo_url || '';
    const hospitalLogo = college?.hospital_logo_url || college?.hospitalLogoUrl || branding?.hospital_logo_url || '';

    // Left Logo
    if (showCollegeLogo && collegeLogo) {
      try {
        const fmt = getImageFormat(collegeLogo);
        doc.addImage(collegeLogo, fmt, marginX + 2, 11, 18, 18);
      } catch (e) {}
    }

    // Right Logo
    if (showHospitalLogo && hospitalLogo) {
      try {
        const fmt = getImageFormat(hospitalLogo);
        doc.addImage(hospitalLogo, fmt, pageWidth - marginX - 20, 11, 18, 18);
      } catch (e) {}
    }

    // Center Text
    let textY = 15;
    if (showCollegeName) {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(titleFontSize); // 14pt
      doc.setTextColor(15, 23, 42);
      doc.text(norm.collegeName.toUpperCase(), pageWidth / 2, textY, { align: 'center', maxWidth: 135 });
      textY += 4.5;
    }

    if (showAutonomous && norm.isAutonomous) {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(bodyFontSize); // 12pt
      doc.setTextColor(2, 132, 199);
      doc.text('(Autonomous)', pageWidth / 2, textY, { align: 'center' });
      textY += 4;
    }

    if (showHospitalName) {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(bodyFontSize); // 12pt
      doc.setTextColor(15, 23, 42);
      doc.text(norm.hospitalName.toUpperCase(), pageWidth / 2, textY, { align: 'center', maxWidth: 135 });
    }

    // Sub-header Banner Bar
    doc.setFillColor(15, 23, 42);
    doc.rect(marginX, 30.5, contentWidth, 6.5, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`PATIENT DOCUMENTATION FORM  •  CASE ID: ${norm.caseId}`, pageWidth / 2, 35, { align: 'center' });
    doc.restoreGraphicsState();
  };

  // --- FOOTER DRAWING ---
  const drawPageFooter = (pageNum, totalPages) => {
    doc.saveGraphicsState();
    const textY = pageHeight - 8;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginX, textY - 4, pageWidth - marginX, textY - 4);

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(bodyFontSize); // 12pt
    doc.setTextColor(2, 132, 199);

    let leftStr = footerLeftText;
    if (showGeneratedDatetime) {
      leftStr += ` • ${currentDateStr}`;
    }
    doc.text(leftStr, marginX, textY, { maxWidth: 65 });

    doc.text(footerCenterText, pageWidth / 2, textY, { align: 'center', maxWidth: 70 });

    if (showPageNumber) {
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - marginX, textY, { align: 'right' });
    }
    doc.restoreGraphicsState();
  };

  // --- WATERMARK DRAWING ---
  const drawPageWatermark = () => {
    if (!watermarkEnabled) return;

    doc.saveGraphicsState();
    try {
      doc.rect(marginX, 38, contentWidth, pageHeight - 56);
      doc.clip();

      doc.setGState(new doc.GState({ opacity: watermarkOpacity }));
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(titleFontSize); // 14pt
      doc.setTextColor(71, 85, 105);

      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;
      const angle = (watermarkPosition === 'Diagonal' || watermarkPosition === 'diagonal') ? 35 : 0;

      if (watermarkTextLine2) {
        doc.text(watermarkTextLine1, centerX, centerY - 6, { align: 'center', angle, rotationDirection: 0 });
        doc.text(watermarkTextLine2, centerX, centerY + 6, { align: 'center', angle, rotationDirection: 0 });
      } else {
        doc.text(watermarkTextLine1, centerX, centerY, { align: 'center', angle, rotationDirection: 0 });
      }
    } catch (e) {
      console.warn('Watermark render error:', e);
    }
    doc.restoreGraphicsState();
  };

  // --- SIGNATURES BLOCK ---
  const drawDualSignatures = (currentY) => {
    if (!showStudentSignature && !showPreceptorSignature) return currentY;

    let sigY = Math.max(currentY + 6, pageHeight - 48);
    doc.saveGraphicsState();

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(marginX, sigY, pageWidth - marginX, sigY);

    const sigLeftX = marginX + 15;
    const sigRightX = pageWidth - marginX - 65;

    // Student Signature Box (Left)
    if (showStudentSignature) {
      doc.line(sigLeftX, sigY + 12, sigLeftX + 50, sigY + 12);
      doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
      doc.text('Student Signature', sigLeftX + 25, sigY + 16, { align: 'center' });
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize); doc.setTextColor(2, 132, 199);
      doc.text(`${norm.studentName} (${norm.studentRoll})`, sigLeftX + 25, sigY + 21, { align: 'center' });
      doc.setFontSize(10); doc.setTextColor(100, 116, 139);
      doc.text(`Date: ${currentDateStr}`, sigLeftX + 25, sigY + 25, { align: 'center' });
    }

    // Preceptor Signature Box (Right)
    if (showPreceptorSignature) {
      doc.line(sigRightX, sigY + 12, sigRightX + 50, sigY + 12);
      doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
      doc.text('Preceptor Signature', sigRightX + 25, sigY + 16, { align: 'center' });
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize); doc.setTextColor(2, 132, 199);
      doc.text(norm.preceptorName, sigRightX + 25, sigY + 21, { align: 'center' });
      doc.setFontSize(10); doc.setTextColor(100, 116, 139);
      doc.text(norm.preceptorDesig.toUpperCase(), sigRightX + 25, sigY + 25, { align: 'center' });
      doc.setFontSize(10); doc.setTextColor(100, 116, 139);
      doc.text(`Date: ${currentDateStr}`, sigRightX + 25, sigY + 29, { align: 'center' });
    }

    doc.restoreGraphicsState();
    return sigY + 32;
  };

  let y = 42;

  const ensureSpace = (neededHeight) => {
    if (y + neededHeight > maxY - 40) {
      doc.addPage();
      y = 42;
      return true;
    }
    return false;
  };

  // Helper to draw a section box with a heading above it
  const drawSectionBox = (title, contentText, minBoxH = 14) => {
    ensureSpace(minBoxH + 12);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text(title, marginX, y);
    y += 5;

    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
    const lines = doc.splitTextToSize(String(contentText || 'N/A'), contentWidth - 6);
    const actualBoxH = Math.max(lines.length * 5.5 + 4, minBoxH);

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, y, contentWidth, actualBoxH, 'FD');

    doc.text(lines, marginX + 3, y + 5);
    y += actualBoxH + 6;
  };

  // =========================================================================
  // PATIENT PROFILE DOCUMENTATION FORM
  // =========================================================================
  doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
  doc.text('PATIENT PROFILE DOCUMENTATION', marginX, y);
  y += 6;

  // 1. PATIENT DETAILS GRID TABLE (Exact 2-Row Box Frame)
  ensureSpace(22);
  doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
  doc.text('Patient details:', marginX, y);
  y += 4;

  const gridY = y;
  const colW = contentWidth / 6;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);

  // Row 1 Box (Height 9mm)
  doc.rect(marginX, gridY, contentWidth, 9);
  for (let c = 1; c < 6; c++) {
    doc.line(marginX + c * colW, gridY, marginX + c * colW, gridY + 9);
  }

  // Row 2 Box (Height 9mm)
  doc.rect(marginX, gridY + 9, contentWidth, 9);
  for (let c = 1; c < 6; c++) {
    doc.line(marginX + c * colW, gridY + 9, marginX + c * colW, gridY + 18);
  }

  doc.setFontSize(10);
  // Row 1 Values
  doc.setFont(fontFamily, 'normal'); doc.text('Name: ', marginX + 1, gridY + 6);
  doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.patientName), marginX + 13, gridY + 6, { maxWidth: colW - 14 });

  doc.setFont(fontFamily, 'normal'); doc.text('Age/Sex: ', marginX + colW + 1, gridY + 6);
  doc.setFont(fontFamily, 'bold'); doc.text(`${norm.demographics.age}/${norm.demographics.gender}`, marginX + colW + 16, gridY + 6, { maxWidth: colW - 17 });

  doc.setFont(fontFamily, 'normal'); doc.text('I.P No: ', marginX + 2 * colW + 1, gridY + 6);
  doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.ipOpNo), marginX + 2 * colW + 13, gridY + 6, { maxWidth: colW - 14 });

  doc.setFont(fontFamily, 'normal'); doc.text('Height: ', marginX + 3 * colW + 1, gridY + 6);
  doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.height), marginX + 3 * colW + 13, gridY + 6, { maxWidth: colW - 14 });

  doc.setFont(fontFamily, 'normal'); doc.text('Weight: ', marginX + 4 * colW + 1, gridY + 6);
  doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.weight), marginX + 4 * colW + 14, gridY + 6, { maxWidth: colW - 15 });

  doc.setFont(fontFamily, 'normal'); doc.text('BMI: ', marginX + 5 * colW + 1, gridY + 6);
  doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.bmi), marginX + 5 * colW + 10, gridY + 6, { maxWidth: colW - 11 });

  // Row 2 Values
  doc.setFont(fontFamily, 'normal'); doc.text('Ward: ', marginX + 1, gridY + 15);
  doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.wardBed), marginX + 12, gridY + 15, { maxWidth: colW - 13 });

  doc.setFont(fontFamily, 'normal'); doc.text('Dept: ', marginX + colW + 1, gridY + 15);
  doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.department), marginX + colW + 11, gridY + 15, { maxWidth: colW - 12 });

  doc.setFont(fontFamily, 'normal'); doc.text('DOA: ', marginX + 2 * colW + 1, gridY + 15);
  doc.setFont(fontFamily, 'bold'); doc.text(String(norm.dates.doa), marginX + 2 * colW + 11, gridY + 15, { maxWidth: colW - 12 });

  doc.setFont(fontFamily, 'normal'); doc.text('DOC: ', marginX + 3 * colW + 1, gridY + 15);
  doc.setFont(fontFamily, 'bold'); doc.text(String(norm.dates.doc), marginX + 3 * colW + 11, gridY + 15, { maxWidth: colW - 12 });

  doc.setFont(fontFamily, 'normal'); doc.text('DOD: ', marginX + 4 * colW + 1, gridY + 15);
  doc.setFont(fontFamily, 'bold'); doc.text(String(norm.dates.dod), marginX + 4 * colW + 11, gridY + 15, { maxWidth: colW - 12 });

  doc.setFont(fontFamily, 'normal'); doc.text('Physician: ', marginX + 5 * colW + 1, gridY + 15);
  doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.physician), marginX + 5 * colW + 17, gridY + 15, { maxWidth: colW - 18 });

  y = gridY + 23;

  // 2. CHIEF COMPLAINTS BOX
  drawSectionBox('Chief Complaints:', profile?.chief_complaints || 'N/A', 14);

  // 3. PAST MEDICAL HISTORY BOX
  drawSectionBox('Past Medical History:', profile?.past_medical_history || profile?.history_of_present_illness || 'N/A', 14);

  // 4. PAST MEDICATION HISTORY BOX
  drawSectionBox('Past Medication History:', profile?.past_medication_history || 'N/A', 14);

  // 5. FAMILY MEDICAL HISTORY BOX
  drawSectionBox('Family Medical History:', profile?.family_history || 'N/A', 12);

  // 6. SOCIAL HISTORY TABLE BOX
  ensureSpace(28);
  doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
  doc.text('Social history:', marginX, y);
  y += 5;

  const socY = y;
  const socColW = contentWidth / 4;
  doc.setDrawColor(15, 23, 42);
  doc.setFillColor(248, 250, 252);
  doc.rect(marginX, socY, contentWidth, 20, 'FD');
  for (let c = 1; c < 4; c++) {
    doc.line(marginX + c * socColW, socY, marginX + c * socColW, socY + 20);
  }

  doc.setFontSize(10);
  // Col 1: Smoker
  doc.setFont(fontFamily, 'bold'); doc.text('Smoker:', marginX + 2, socY + 5);
  doc.setFont(fontFamily, 'normal'); doc.text(`Pack/day: ${profile?.smoker_pack_day || '—'}`, marginX + 2, socY + 10);
  doc.text(`Duration: ${profile?.smoker_duration || '—'}`, marginX + 2, socY + 15);

  // Col 2: Alcoholic
  doc.setFont(fontFamily, 'bold'); doc.text('Alcoholic:', marginX + socColW + 2, socY + 5);
  doc.setFont(fontFamily, 'normal'); doc.text(`Amount/day: ${profile?.alcoholic_amount_day || '—'}`, marginX + socColW + 2, socY + 10);
  doc.text(`Duration: ${profile?.alcoholic_duration || '—'}`, marginX + socColW + 2, socY + 15);

  // Col 3: Allergies
  doc.setFont(fontFamily, 'bold'); doc.text('Allergies:', marginX + 2 * socColW + 2, socY + 5);
  doc.setFont(fontFamily, 'normal'); doc.text(`Food: ${profile?.allergy_food || 'None'}`, marginX + 2 * socColW + 2, socY + 10);
  doc.setTextColor(190, 18, 60); doc.text(`Drugs: ${profile?.allergy_drugs || profile?.allergies || 'None'}`, marginX + 2 * socColW + 2, socY + 15); doc.setTextColor(15, 23, 42);

  // Col 4: Marital & Social
  doc.setFont(fontFamily, 'bold'); doc.text('Marital status:', marginX + 3 * socColW + 2, socY + 5);
  doc.setFont(fontFamily, 'normal'); doc.text(String(profile?.marital_status || 'Single'), marginX + 3 * socColW + 2, socY + 10);
  if (profile?.personal_social_history) {
    doc.setFontSize(9);
    doc.text(String(profile.personal_social_history), marginX + 3 * socColW + 2, socY + 15, { maxWidth: socColW - 4 });
  }

  y = socY + 25;

  // 7. PHYSICAL EXAMINATION BOX
  ensureSpace(28);
  doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
  doc.text('Physical Examination:', marginX, y);
  y += 5;

  const physY = y;
  doc.setDrawColor(15, 23, 42);
  doc.setFillColor(248, 250, 252);
  doc.rect(marginX, physY, contentWidth, 20, 'FD');
  doc.line(marginX, physY + 9, marginX + contentWidth, physY + 9);

  doc.setFontSize(11);
  // Row 1: Cyanosis, Icterus, Pallor
  doc.setFont(fontFamily, 'normal'); doc.text(`Cyanosis: `, marginX + 4, physY + 6); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.cyanosis || 'Absent'), marginX + 22, physY + 6);
  doc.setFont(fontFamily, 'normal'); doc.text(`Icterus: `, marginX + 64, physY + 6); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.icterus || 'Absent'), marginX + 80, physY + 6);
  doc.setFont(fontFamily, 'normal'); doc.text(`Pallor: `, marginX + 124, physY + 6); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.pallor || 'Absent'), marginX + 138, physY + 6);

  // Row 2: CVS, GI, RS, CNS
  doc.setFont(fontFamily, 'normal'); doc.text(`CVS: `, marginX + 4, physY + 15); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.cvs || 'Normal'), marginX + 16, physY + 15, { maxWidth: 30 });
  doc.setFont(fontFamily, 'normal'); doc.text(`GI: `, marginX + 48, physY + 15); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.gi || 'Normal'), marginX + 58, physY + 15, { maxWidth: 32 });
  doc.setFont(fontFamily, 'normal'); doc.text(`RS: `, marginX + 94, physY + 15); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.rs || 'Normal'), marginX + 104, physY + 15, { maxWidth: 32 });
  doc.setFont(fontFamily, 'normal'); doc.text(`CNS: `, marginX + 140, physY + 15); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.cns || 'Normal'), marginX + 152, physY + 15, { maxWidth: 24 });

  y = physY + 25;

  // 8. PROVISIONAL DIAGNOSIS BOX
  drawSectionBox('Provisional Diagnosis:', profile?.provisional_diagnosis || 'N/A', 12);

  // 9. VITAL SIGNS TABLE BOX
  ensureSpace(28);
  doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
  doc.text('VITAL SIGNS LOG CHART', marginX, y);
  y += 5.5;

  const vitalsList = norm.vitals.length > 0 ? norm.vitals : [{ date: norm.dates.doa, temp: profile?.temperature_f || '98.6', bp: profile?.bp_sys ? `${profile.bp_sys}/${profile.bp_dia}` : '120/80', pr: profile?.pulse_rate || '72', rr: profile?.respiratory_rate || '18', spo2: profile?.spo2 || '98' }];

  const drawVitalsTableHeader = (atY) => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.rect(marginX, atY, contentWidth, 7, 'FD');

    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Date', marginX + 5, atY + 5);
    doc.text('TEMP [°F]', marginX + 38, atY + 5);
    doc.text('BP [mmHg]', marginX + 68, atY + 5);
    doc.text('PR [bpm]', marginX + 105, atY + 5);
    doc.text('RR [cpm]', marginX + 138, atY + 5);
    doc.text('SPO2 [%]', marginX + 162, atY + 5);
  };

  drawVitalsTableHeader(y);
  y += 7;

  doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
  vitalsList.forEach((v, idx) => {
    if (ensureSpace(7)) {
      if (repeatTableHeader) {
        drawVitalsTableHeader(y);
        y += 7;
      }
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
    }
    if (zebraStriping && idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, y, contentWidth, 7, 'FD');
    } else {
      doc.rect(marginX, y, contentWidth, 7, 'D');
    }
    doc.text(String(v.date || 'N/A'), marginX + 5, y + 5);
    doc.text(String(v.temp || v.temperature || '98.6'), marginX + 38, y + 5);
    doc.text(String(v.bp || '120/80'), marginX + 68, y + 5);
    doc.text(String(v.pr || v.pulse || '72'), marginX + 105, y + 5);
    doc.text(String(v.rr || v.respiratory_rate || '18'), marginX + 138, y + 5);
    doc.text(String(v.spo2 ? `${v.spo2}%` : '98%'), marginX + 162, y + 5);
    y += 7;
  });
  y += 6;

  // 10. LABORATORY INVESTIGATIONS TABLE BOX
  ensureSpace(28);
  doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
  doc.text('LABORATORY INVESTIGATIONS', marginX, y);
  y += 5.5;

  const labsList = norm.labs;

  const drawLabsTableHeader = (atY) => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.rect(marginX, atY, contentWidth, 7, 'FD');

    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Category', marginX + 2, atY + 5);
    doc.text('Investigation Parameter', marginX + 34, atY + 5);
    doc.text('Observed Value', marginX + 80, atY + 5);
    doc.text('Reference Range', marginX + 118, atY + 5);
    doc.text('Clinical Inference', marginX + 150, atY + 5);
  };

  drawLabsTableHeader(y);
  y += 7;

  if (labsList.length > 0) {
    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    labsList.forEach((lab, idx) => {
      const catLines = doc.splitTextToSize(String(lab.category || lab.lab_category || 'General'), 30);
      const paramLines = doc.splitTextToSize(String(lab.parameter_name || lab.test_name || 'N/A'), 42);
      const valStr = lab.test_value || lab.observed_value ? `${lab.test_value || lab.observed_value} ${lab.unit || ''}` : 'N/A';
      const valLines = doc.splitTextToSize(String(valStr), 34);
      const refLines = doc.splitTextToSize(String(lab.reference_range || lab.normal_range || 'N/A'), 30);
      const infLines = doc.splitTextToSize(String(lab.clinical_inference || 'Normal'), 26);

      const maxLines = Math.max(catLines.length, paramLines.length, valLines.length, refLines.length, infLines.length, 1);
      const rowH = Math.max(maxLines * 5 + 2, 7);

      if (ensureSpace(rowH)) {
        if (repeatTableHeader) {
          drawLabsTableHeader(y);
          y += 7;
        }
        doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
      }

      if (zebraStriping && idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, contentWidth, rowH, 'FD');
      } else {
        doc.rect(marginX, y, contentWidth, rowH, 'D');
      }

      doc.text(catLines, marginX + 2, y + 5);
      doc.text(paramLines, marginX + 34, y + 5);
      doc.text(valLines, marginX + 80, y + 5);
      doc.text(refLines, marginX + 118, y + 5);
      doc.text(infLines, marginX + 150, y + 5);
      y += rowH;
    });
  } else {
    doc.rect(marginX, y, contentWidth, 7, 'D');
    doc.setFont(fontFamily, 'italic'); doc.setFontSize(bodyFontSize); doc.setTextColor(100, 116, 139);
    doc.text('No laboratory investigations logged.', pageWidth / 2, y + 5, { align: 'center' });
    y += 7;
  }
  y += 6;

  // 11. OTHER INVESTIGATIONS BOX
  if (profile?.other_investigations) {
    drawSectionBox('Other Investigations:', profile.other_investigations, 14);
  }

  // 12. PRESCRIBED MEDICATION PROFILE TABLE BOX
  ensureSpace(28);
  doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
  doc.text('PRESCRIBED MEDICATION PROFILE', marginX, y);
  y += 5.5;

  doc.setDrawColor(5, 150, 105);
  doc.setFillColor(236, 253, 245);
  doc.rect(marginX, y, contentWidth, 10, 'FD');
  doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(5, 150, 105);
  doc.text(`OFFICIAL DIAGNOSIS: ${norm.diagnosis.final.toUpperCase()}`, pageWidth / 2, y + 7, { align: 'center' });

  y += 14;

  const drugsList = norm.drugs.length > 0 ? norm.drugs : [{ drug_name: 'Symptomatic Medication', dose: 'As prescribed', route: 'Oral', frequency: 'OD', indication: 'Symptomatic Management' }];

  const drawDrugsTableHeader = (atY) => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.rect(marginX, atY, contentWidth, 7, 'FD');

    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('S.No', marginX + 2, atY + 5);
    doc.text('Brand & Generic Name', marginX + 16, atY + 5);
    doc.text('Dose & Route', marginX + 78, atY + 5);
    doc.text('Frequency', marginX + 118, atY + 5);
    doc.text('Therapeutic Indication', marginX + 143, atY + 5);
  };

  drawDrugsTableHeader(y);
  y += 7;

  doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
  drugsList.forEach((d, idx) => {
    const nameStr = d.trade_name || d.brand_name ? `${d.trade_name || d.brand_name} ${d.generic_name || d.drug_name ? `(${d.generic_name || d.drug_name})` : ''}` : String(d.generic_name || d.drug_name || 'N/A');
    const nameLines = doc.splitTextToSize(nameStr, 58);
    const doseLines = doc.splitTextToSize(`${d.dose || 'N/A'} (${d.route_of_admin || d.route || 'Oral'})`, 36);
    const freqLines = doc.splitTextToSize(String(d.frequency || 'OD'), 22);
    const indLines = doc.splitTextToSize(String(d.indication || 'Symptomatic Management'), 34);

    const maxLines = Math.max(nameLines.length, doseLines.length, freqLines.length, indLines.length, 1);
    const rowH = Math.max(maxLines * 5.2 + 2, 7);

    if (ensureSpace(rowH)) {
      if (repeatTableHeader) {
        drawDrugsTableHeader(y);
        y += 7;
      }
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
    }

    if (zebraStriping && idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, y, contentWidth, rowH, 'FD');
    } else {
      doc.rect(marginX, y, contentWidth, rowH, 'D');
    }

    doc.text(String(d.s_no || idx + 1), marginX + 2, y + 5);
    doc.text(nameLines, marginX + 16, y + 5);
    doc.text(doseLines, marginX + 78, y + 5);
    doc.text(freqLines, marginX + 118, y + 5);
    doc.text(indLines, marginX + 143, y + 5);
    y += rowH;
  });
  y += 6;

  // 13. DISCHARGE SUMMARY & INSTRUCTIONS BOX
  if (norm.diagnosis.dischargeSummary) {
    drawSectionBox('Discharge Summary & Instructions:', norm.diagnosis.dischargeSummary, 16);
  }

  // 14. END OF PATIENT PROFILE FORM: Student & Preceptor Details / Signatures on FINAL PAGE
  drawDualSignatures(y);

  // Stamp headers, footers, and watermark across all pages
  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageWatermark();
    if (repeatHeader || i === 1) {
      drawPageHeader();
    }
    if (repeatFooter || i === totalPages) {
      drawPageFooter(i, totalPages);
    }
  }

  // DIRECT PDF FILE DOWNLOAD
  doc.save(`${norm.caseId}_Patient_Profile.pdf`);
};

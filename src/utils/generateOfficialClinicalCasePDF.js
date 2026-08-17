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

const ALL_COUNSELLING_CHECKLIST_POINTS = [
  'Name and purpose of medication',
  'Dosage regimen',
  'Advice on missed dose',
  'Potential side effects',
  'Significant interactions (Drug-Drug, Drug-food, drug-Disease)',
  'Precautions to be taken',
  'Storage recommendations',
  'Benefits of completing case',
  'Life style modifications'
];

/**
 * High-Precision Vector PDF Generator for PharmDVerse Approved Clinical Cases.
 * 
 * STEP 13: PHARMACIST INTERVENTION DOCUMENTATION ONLY (Individual PDF)
 */
export const generateOfficialClinicalCasePDF = ({
  clinicalCase = {},
  student = {},
  preceptor = {},
  college = {},
  caseModulesData = {},
  branding = {},
  selectedForm = 'profile' // 'profile' | 'counselling' | 'intervention' | 'dir' | 'adr'
}) => {
  const norm = buildNormalizedApprovedCaseData({
    clinicalCase,
    student,
    preceptor,
    college,
    caseModulesData
  });

  const profile = caseModulesData?.profile || clinicalCase?.profile || {};
  const counselling = caseModulesData?.counselling || clinicalCase?.counselling || norm.counselling || {};
  const intervention = caseModulesData?.intervention || clinicalCase?.intervention || norm.intervention || {};
  const dir = caseModulesData?.dir || clinicalCase?.dir || norm.dir || {};
  const adr = caseModulesData?.adr || clinicalCase?.adr || norm.adr || {};

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

  // Form title banner lookup
  const getFormTitleBanner = () => {
    switch (selectedForm) {
      case 'counselling': return 'PATIENT COUNSELLING DOCUMENTATION';
      case 'intervention': return 'PHARMACIST INTERVENTION DOCUMENTATION';
      case 'dir': return 'DRUG INFORMATION REQUEST DOCUMENTATION';
      case 'adr': return 'ADR DOCUMENTATION LOG';
      case 'profile':
      default: return 'PATIENT DOCUMENTATION FORM';
    }
  };

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
    doc.text(`${getFormTitleBanner()}  •  CASE ID: ${norm.caseId}`, pageWidth / 2, 35, { align: 'center' });
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
      const angle = (watermarkPosition === 'Diagonal' || watermarkPosition === 'diagonal') ? -35 : 0;

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
  // 1. PATIENT PROFILE FORM ONLY
  // =========================================================================
  if (selectedForm === 'profile') {
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text(`PATIENT PROFILE DOCUMENTATION  (CASE ID: ${norm.caseId})`, marginX, y);
    y += 6;

    // PATIENT DETAILS GRID TABLE (3 Rows maintaining exact original field sequence with tuned cell widths)
    ensureSpace(32);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Patient details:', marginX, y);
    y += 4;

    const gridY = y;

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);

    // Outer Box (27mm height: 3 rows x 9mm height)
    doc.rect(marginX, gridY, contentWidth, 27);
    doc.line(marginX, gridY + 9, marginX + contentWidth, gridY + 9);
    doc.line(marginX, gridY + 18, marginX + contentWidth, gridY + 18);

    // Row 1 Column Dividers: Name (40mm), Age/Sex (36mm), I.P No (52mm), Height (52mm)
    const r1X = [marginX, marginX + 40, marginX + 76, marginX + 128, marginX + 180];
    for (let c = 1; c < 4; c++) {
      doc.line(r1X[c], gridY, r1X[c], gridY + 9);
    }

    // Row 2 Column Dividers: Weight (36mm), BMI (32mm), Ward (58mm), Dept (54mm)
    const r2X = [marginX, marginX + 36, marginX + 68, marginX + 126, marginX + 180];
    for (let c = 1; c < 4; c++) {
      doc.line(r2X[c], gridY + 9, r2X[c], gridY + 18);
    }

    // Row 3 Column Dividers: DOA (40mm), DOC (40mm), DOD (40mm), Physician (60mm)
    const r3X = [marginX, marginX + 40, marginX + 80, marginX + 120, marginX + 180];
    for (let c = 1; c < 4; c++) {
      doc.line(r3X[c], gridY + 18, r3X[c], gridY + 27);
    }

    doc.setFontSize(9);

    // Row 1 Values (Original sequence: Name, Age/Sex, I.P No, Height)
    doc.setFont(fontFamily, 'normal'); doc.text('Name: ', r1X[0] + 1.5, gridY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.patientName), r1X[0] + 12.5, gridY + 6, { maxWidth: 26 });

    doc.setFont(fontFamily, 'normal'); doc.text('Age/Sex: ', r1X[1] + 1.5, gridY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(`${norm.demographics.age}/${norm.demographics.gender}`, r1X[1] + 15, gridY + 6, { maxWidth: 19 });

    doc.setFont(fontFamily, 'normal'); doc.text('I.P No: ', r1X[2] + 1.5, gridY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.ipOpNo), r1X[2] + 12.5, gridY + 6, { maxWidth: 38 });

    doc.setFont(fontFamily, 'normal'); doc.text('Height: ', r1X[3] + 1.5, gridY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.height), r1X[3] + 13, gridY + 6, { maxWidth: 37 });

    // Row 2 Values (Original sequence: Weight, BMI, Ward, Dept)
    doc.setFont(fontFamily, 'normal'); doc.text('Weight: ', r2X[0] + 1.5, gridY + 15);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.weight), r2X[0] + 14, gridY + 15, { maxWidth: 20 });

    doc.setFont(fontFamily, 'normal'); doc.text('BMI: ', r2X[1] + 1.5, gridY + 15);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.bmi), r2X[1] + 10, gridY + 15, { maxWidth: 20 });

    doc.setFont(fontFamily, 'normal'); doc.text('Ward: ', r2X[2] + 1.5, gridY + 15);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.wardBed), r2X[2] + 11.5, gridY + 15, { maxWidth: 45 });

    doc.setFont(fontFamily, 'normal'); doc.text('Dept: ', r2X[3] + 1.5, gridY + 15);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.department), r2X[3] + 11, gridY + 15, { maxWidth: 41 });

    // Row 3 Values (Original sequence: DOA, DOC, DOD, Physician)
    doc.setFont(fontFamily, 'normal'); doc.text('DOA: ', r3X[0] + 1.5, gridY + 24);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.dates.doa), r3X[0] + 11, gridY + 24, { maxWidth: 27.5 });

    doc.setFont(fontFamily, 'normal'); doc.text('DOC: ', r3X[1] + 1.5, gridY + 24);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.dates.doc), r3X[1] + 11, gridY + 24, { maxWidth: 27.5 });

    doc.setFont(fontFamily, 'normal'); doc.text('DOD: ', r3X[2] + 1.5, gridY + 24);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.dates.dod), r3X[2] + 11, gridY + 24, { maxWidth: 27.5 });

    doc.setFont(fontFamily, 'normal'); doc.text('Physician: ', r3X[3] + 1.5, gridY + 24);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.physician), r3X[3] + 16, gridY + 24, { maxWidth: 42 });

    y = gridY + 33;

    drawSectionBox('Chief Complaints:', profile?.chief_complaints || 'N/A', 14);
    drawSectionBox('Past Medical History:', profile?.past_medical_history || profile?.history_of_present_illness || 'N/A', 14);
    drawSectionBox('Past Medication History:', profile?.past_medication_history || 'N/A', 14);
    drawSectionBox('Family Medical History:', profile?.family_history || 'N/A', 12);

    // SOCIAL HISTORY TABLE BOX
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
    doc.setFont(fontFamily, 'bold'); doc.text('Smoker:', marginX + 2, socY + 5);
    doc.setFont(fontFamily, 'normal'); doc.text(`Pack/day: ${profile?.smoker_pack_day || '—'}`, marginX + 2, socY + 10);
    doc.text(`Duration: ${profile?.smoker_duration || '—'}`, marginX + 2, socY + 15);

    doc.setFont(fontFamily, 'bold'); doc.text('Alcoholic:', marginX + socColW + 2, socY + 5);
    doc.setFont(fontFamily, 'normal'); doc.text(`Amount/day: ${profile?.alcoholic_amount_day || '—'}`, marginX + socColW + 2, socY + 10);
    doc.text(`Duration: ${profile?.alcoholic_duration || '—'}`, marginX + socColW + 2, socY + 15);

    doc.setFont(fontFamily, 'bold'); doc.text('Allergies:', marginX + 2 * socColW + 2, socY + 5);
    doc.setFont(fontFamily, 'normal'); doc.text(`Food: ${profile?.allergy_food || 'None'}`, marginX + 2 * socColW + 2, socY + 10);
    doc.setTextColor(190, 18, 60); doc.text(`Drugs: ${profile?.allergy_drugs || profile?.allergies || 'None'}`, marginX + 2 * socColW + 2, socY + 15); doc.setTextColor(15, 23, 42);

    doc.setFont(fontFamily, 'bold'); doc.text('Marital status:', marginX + 3 * socColW + 2, socY + 5);
    doc.setFont(fontFamily, 'normal'); doc.text(String(profile?.marital_status || 'Single'), marginX + 3 * socColW + 2, socY + 10);

    y = socY + 25;

    // PHYSICAL EXAMINATION BOX
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
    doc.setFont(fontFamily, 'normal'); doc.text(`Cyanosis: `, marginX + 4, physY + 6); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.cyanosis || 'Absent'), marginX + 22, physY + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(`Icterus: `, marginX + 64, physY + 6); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.icterus || 'Absent'), marginX + 80, physY + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(`Pallor: `, marginX + 124, physY + 6); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.pallor || 'Absent'), marginX + 138, physY + 6);

    doc.setFont(fontFamily, 'normal'); doc.text(`CVS: `, marginX + 4, physY + 15); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.cvs || 'Normal'), marginX + 16, physY + 15, { maxWidth: 30 });
    doc.setFont(fontFamily, 'normal'); doc.text(`GI: `, marginX + 48, physY + 15); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.gi || 'Normal'), marginX + 58, physY + 15, { maxWidth: 32 });
    doc.setFont(fontFamily, 'normal'); doc.text(`RS: `, marginX + 94, physY + 15); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.rs || 'Normal'), marginX + 104, physY + 15, { maxWidth: 32 });
    doc.setFont(fontFamily, 'normal'); doc.text(`CNS: `, marginX + 140, physY + 15); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.cns || 'Normal'), marginX + 152, physY + 15, { maxWidth: 24 });

    y = physY + 25;

    drawSectionBox('Provisional Diagnosis:', profile?.provisional_diagnosis || 'N/A', 12);

    // VITAL SIGNS TABLE
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

    // LABORATORY INVESTIGATIONS TABLE (Clean Border Margins)
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

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      doc.text('Category', marginX + 2, atY + 5);
      doc.text('Investigation Parameter', marginX + 38, atY + 5);
      doc.text('Observed Value', marginX + 86, atY + 5);
      doc.text('Reference Range', marginX + 120, atY + 5);
      doc.text('Clinical Inference', marginX + 152, atY + 5);
    };

    drawLabsTableHeader(y);
    y += 7;

    if (labsList.length > 0) {
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      labsList.forEach((lab, idx) => {
        const catLines = doc.splitTextToSize(String(lab.category || lab.lab_category || 'General'), 34);
        const paramLines = doc.splitTextToSize(String(lab.parameter_name || lab.test_name || 'N/A'), 44);
        const valStr = lab.test_value || lab.observed_value ? `${lab.test_value || lab.observed_value} ${lab.unit || ''}` : 'N/A';
        const valLines = doc.splitTextToSize(String(valStr), 32);
        const refLines = doc.splitTextToSize(String(lab.reference_range || lab.normal_range || 'N/A'), 30);
        const infLines = doc.splitTextToSize(String(lab.clinical_inference || 'Normal'), 25);

        const maxLines = Math.max(catLines.length, paramLines.length, valLines.length, refLines.length, infLines.length, 1);
        const rowH = Math.max(maxLines * 5 + 2, 7);

        if (ensureSpace(rowH)) {
          if (repeatTableHeader) {
            drawLabsTableHeader(y);
            y += 7;
          }
          doc.setFont(fontFamily, 'normal'); doc.setFontSize(10);
        }

        if (zebraStriping && idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(marginX, y, contentWidth, rowH, 'FD');
        } else {
          doc.rect(marginX, y, contentWidth, rowH, 'D');
        }

        doc.text(catLines, marginX + 2, y + 5);
        doc.text(paramLines, marginX + 38, y + 5);
        doc.text(valLines, marginX + 86, y + 5);
        doc.text(refLines, marginX + 120, y + 5);
        doc.text(infLines, marginX + 152, y + 5);
        y += rowH;
      });
    } else {
      doc.rect(marginX, y, contentWidth, 7, 'D');
      doc.setFont(fontFamily, 'italic'); doc.setFontSize(10); doc.setTextColor(100, 116, 139);
      doc.text('No laboratory investigations logged.', pageWidth / 2, y + 5, { align: 'center' });
      y += 7;
    }
    y += 6;

    if (profile?.other_investigations) {
      drawSectionBox('Other Investigations:', profile.other_investigations, 14);
    }

    // PRESCRIBED MEDICATION PROFILE TABLE (EXACT 8 COLUMNS MATCHING STUDENT FORM)
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

    const drugsList = norm.drugs;

    // 8 Exact Columns: S.No (10mm), Brand/Trade (34mm), Generic (38mm), Route (16mm), Dose (18mm), Freq (16mm), Start Date (24mm), Stop Date (24mm) = 180mm
    const drawDrugsTableHeader = (atY) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.rect(marginX, atY, contentWidth, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      doc.text('S.No', marginX + 1, atY + 5);
      doc.text('Brand / Trade Name', marginX + 11, atY + 5);
      doc.text('Generic Name', marginX + 45, atY + 5);
      doc.text('Route', marginX + 83, atY + 5);
      doc.text('Dose', marginX + 99, atY + 5);
      doc.text('Freq', marginX + 117, atY + 5);
      doc.text('Start Date', marginX + 133, atY + 5);
      doc.text('Stop Date', marginX + 157, atY + 5);
    };

    drawDrugsTableHeader(y);
    y += 7;

    if (drugsList.length > 0) {
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      drugsList.forEach((d, idx) => {
        const brandLines = doc.splitTextToSize(String(d.trade_name || d.brand_name || 'N/A'), 32);
        const genericLines = doc.splitTextToSize(String(d.generic_name || d.drug_name || 'N/A'), 36);
        const routeLines = doc.splitTextToSize(String(d.route_of_admin || d.route || 'Oral'), 14);
        const doseLines = doc.splitTextToSize(String(d.dose || 'N/A'), 16);
        const freqLines = doc.splitTextToSize(String(d.frequency || 'OD'), 14);
        const startLines = doc.splitTextToSize(String(d.start_date || 'N/A'), 22);
        const stopLines = doc.splitTextToSize(String(d.stop_date || 'N/A'), 22);

        const maxLines = Math.max(brandLines.length, genericLines.length, routeLines.length, doseLines.length, freqLines.length, startLines.length, stopLines.length, 1);
        const rowH = Math.max(maxLines * 5 + 2, 7);

        if (ensureSpace(rowH)) {
          if (repeatTableHeader) {
            drawDrugsTableHeader(y);
            y += 7;
          }
          doc.setFont(fontFamily, 'normal'); doc.setFontSize(10);
        }

        if (zebraStriping && idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(marginX, y, contentWidth, rowH, 'FD');
        } else {
          doc.rect(marginX, y, contentWidth, rowH, 'D');
        }

        doc.text(String(d.s_no || idx + 1), marginX + 2, y + 5);
        doc.text(brandLines, marginX + 11, y + 5);
        doc.text(genericLines, marginX + 45, y + 5);
        doc.text(routeLines, marginX + 83, y + 5);
        doc.text(doseLines, marginX + 99, y + 5);
        doc.text(freqLines, marginX + 117, y + 5);
        doc.text(startLines, marginX + 133, y + 5);
        doc.text(stopLines, marginX + 157, y + 5);
        y += rowH;
      });
    } else {
      doc.rect(marginX, y, contentWidth, 7, 'D');
      doc.setFont(fontFamily, 'italic'); doc.setFontSize(10); doc.setTextColor(100, 116, 139);
      doc.text('No prescribed medications logged.', pageWidth / 2, y + 5, { align: 'center' });
      y += 7;
    }
    y += 6;

    if (norm.diagnosis.dischargeSummary) {
      drawSectionBox('Discharge Summary & Instructions:', norm.diagnosis.dischargeSummary, 16);
    }
  }

  // =========================================================================
  // 2. PATIENT COUNSELLING DOCUMENTATION FORM ONLY (STEP 12)
  // =========================================================================
  if (selectedForm === 'counselling') {
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text(`PATIENT COUNSELLING DOCUMENTATION  (CASE ID: ${norm.caseId})`, marginX, y);
    y += 6;

    // 1. SESSION OVERVIEW BOX
    ensureSpace(24);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('1. Session Overview:', marginX, y);
    y += 4;

    const cSessY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, cSessY, contentWidth, 22, 'FD');
    doc.line(marginX, cSessY + 7, marginX + contentWidth, cSessY + 7);
    doc.line(marginX, cSessY + 14, marginX + contentWidth, cSessY + 14);

    doc.setFontSize(9.5);
    // Row 1: Patient Initials, Age/Sex, Date, Time
    doc.setFont(fontFamily, 'normal'); doc.text('Patient Initials: ', marginX + 2, cSessY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.patient_name || norm.demographics.patientName || 'N/A'), marginX + 24, cSessY + 5, { maxWidth: 22 });

    doc.setFont(fontFamily, 'normal'); doc.text('Age/Sex: ', marginX + 48, cSessY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(`${counselling.age || norm.demographics.age} Yrs / ${counselling.sex || norm.demographics.gender}`, marginX + 62, cSessY + 5, { maxWidth: 26 });

    doc.setFont(fontFamily, 'normal'); doc.text('Date: ', marginX + 94, cSessY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.counselling_date || norm.dates.counsellingDate), marginX + 104, cSessY + 5);

    doc.setFont(fontFamily, 'normal'); doc.text('Time: ', marginX + 140, cSessY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.counselling_time || norm.dates.counsellingTime), marginX + 150, cSessY + 5);

    // Row 2: IP/OP No, Type, Ward/Unit, Department
    doc.setFont(fontFamily, 'normal'); doc.text('IP/OP No: ', marginX + 2, cSessY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.ip_op_number || norm.demographics.ipOpNo), marginX + 16, cSessY + 12, { maxWidth: 30 });

    doc.setFont(fontFamily, 'normal'); doc.text('Type: ', marginX + 48, cSessY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.patient_type || 'Inpatient'), marginX + 57, cSessY + 12, { maxWidth: 30 });

    doc.setFont(fontFamily, 'normal'); doc.text('Ward/Unit: ', marginX + 94, cSessY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.unit_ward || norm.demographics.wardBed), marginX + 110, cSessY + 12, { maxWidth: 28 });

    doc.setFont(fontFamily, 'normal'); doc.text('Dept: ', marginX + 140, cSessY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.department || norm.demographics.department), marginX + 149, cSessY + 12, { maxWidth: 28 });

    // Row 3: Known Allergies
    doc.setFont(fontFamily, 'normal'); doc.text('Known Allergies: ', marginX + 2, cSessY + 19);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(190, 18, 60);
    doc.text(String(counselling.allergies || norm.demographics.allergyDrugs || 'None'), marginX + 27, cSessY + 19, { maxWidth: 150 });
    doc.setTextColor(15, 23, 42);

    y = cSessY + 28;

    // 2. CLINICAL FOCUS BOXES
    drawSectionBox('2. Disease Condition Counselled:', counselling.disease_counselled || counselling.disease_condition || norm.diagnosis.final || 'N/A', 12);
    drawSectionBox('3. Medications Counselled:', counselling.medications_counselled || 'N/A', 14);

    // 4. COUNSELLING POINTS COVERED CHECKLIST (9 STANDARDIZED POINTS)
    ensureSpace(42);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('4. Counselling Points Covered Checklist:', marginX, y);
    y += 5;

    const checkY = y;
    const pointsCoveredList = Array.isArray(counselling.points_covered) ? counselling.points_covered : (typeof counselling.points_covered === 'string' ? counselling.points_covered.split(',') : []);

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, checkY, contentWidth, 34, 'FD');

    doc.setFontSize(9.5);
    ALL_COUNSELLING_CHECKLIST_POINTS.forEach((point, idx) => {
      const isChecked = pointsCoveredList.some(p => String(p).trim().toLowerCase() === point.toLowerCase());
      const col = idx % 2 === 0 ? marginX + 4 : marginX + 94;
      const rowOffset = Math.floor(idx / 2) * 6.5 + 5;

      if (isChecked) {
        doc.setFont(fontFamily, 'bold'); doc.setTextColor(2, 132, 199);
        doc.text('[ ✓ ]', col, checkY + rowOffset);
        doc.setFont(fontFamily, 'bold'); doc.setTextColor(15, 23, 42);
        doc.text(point, col + 8, checkY + rowOffset, { maxWidth: 80 });
      } else {
        doc.setFont(fontFamily, 'normal'); doc.setTextColor(148, 163, 184);
        doc.text('[   ]', col, checkY + rowOffset);
        doc.setTextColor(100, 116, 139);
        doc.text(point, col + 8, checkY + rowOffset, { maxWidth: 80 });
      }
    });
    doc.setTextColor(15, 23, 42);
    y = checkY + 39;

    // 5. BARRIERS TO COMPLIANCE & RESOLUTION BOX
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('5. Barriers to Compliance & Resolution:', marginX, y);
    y += 5;

    const barY = y;
    const hasBarriers = Boolean(counselling.major_barriers_involved);
    const barrierOvercome = Boolean(counselling.barrier_overcome);

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, barY, contentWidth, hasBarriers ? 22 : 12, 'FD');

    doc.setFontSize(10);
    doc.setFont(fontFamily, 'normal'); doc.text('Major Barriers Involved: ', marginX + 3, barY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(hasBarriers ? 'Yes' : 'No', marginX + 40, barY + 6);

    doc.setFont(fontFamily, 'normal'); doc.text('Barrier Overcome Rightly: ', marginX + 90, barY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(barrierOvercome ? 'Yes' : 'No / N/A', marginX + 130, barY + 6);

    if (hasBarriers) {
      doc.line(marginX, barY + 9, marginX + contentWidth, barY + 9);
      doc.setFont(fontFamily, 'normal'); doc.text('Details of Barrier: ', marginX + 3, barY + 15);
      doc.setFont(fontFamily, 'italic');
      doc.text(String(counselling.barrier_details || counselling.barriers_identified || 'None specified.'), marginX + 32, barY + 15, { maxWidth: 144 });
    }

    y = barY + (hasBarriers ? 27 : 17);

    // 6. DURATION & RECIPIENT BOX
    ensureSpace(22);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('6. Session Duration & Recipient:', marginX, y);
    y += 5;

    const durY = y;
    const providedTo = counselling.counselling_provided_to || counselling.provided_to || 'Patient';
    const repReasons = Array.isArray(counselling.representative_reasons) ? counselling.representative_reasons.join(', ') : (counselling.representative_reasons || '');
    const repOther = counselling.representative_other_reason ? ` (${counselling.representative_other_reason})` : '';

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, durY, contentWidth, providedTo === 'Patient representative' ? 18 : 10, 'FD');

    doc.setFontSize(10);
    doc.setFont(fontFamily, 'normal'); doc.text('Session Duration: ', marginX + 3, durY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.time_taken || counselling.duration_minutes || '10 to 20 min.'), marginX + 32, durY + 6);

    doc.setFont(fontFamily, 'normal'); doc.text('Counselled To: ', marginX + 90, durY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(providedTo), marginX + 116, durY + 6);

    if (providedTo === 'Patient representative') {
      doc.line(marginX, durY + 9, marginX + contentWidth, durY + 9);
      doc.setFont(fontFamily, 'normal'); doc.text('Representative Reason: ', marginX + 3, durY + 14);
      doc.setFont(fontFamily, 'bold'); doc.text(`${repReasons}${repOther}`, marginX + 40, durY + 14, { maxWidth: 135 });
    }

    y = durY + (providedTo === 'Patient representative' ? 23 : 15);

    // 7. LEAFLETS & VISUAL AIDS PROVIDED BOX
    drawSectionBox('7. Aids Used:', counselling.counselling_aids_used || 'None', 12);
    drawSectionBox('8. Educational Material Provided:', counselling.counselling_material_provided || counselling.educational_materials_used || 'None', 12);

    ensureSpace(14);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
    doc.text(`Patient Understanding Ascertained:  ${counselling.understanding_ascertained !== false ? 'YES (Ascertained)' : 'NO'}`, marginX, y);
    y += 8;
  }

  // =========================================================================
  // 3. PHARMACIST INTERVENTION DOCUMENTATION FORM ONLY (STEP 13)
  // =========================================================================
  if (selectedForm === 'intervention') {
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text(`PHARMACIST INTERVENTION DOCUMENTATION  (CASE ID: ${norm.caseId})`, marginX, y);
    y += 6;

    // 1. PATIENT INFORMATION BOX
    ensureSpace(24);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('1. Patient Information:', marginX, y);
    y += 4;

    const iSessY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, iSessY, contentWidth, 22, 'FD');
    doc.line(marginX, iSessY + 7, marginX + contentWidth, iSessY + 7);
    doc.line(marginX, iSessY + 14, marginX + contentWidth, iSessY + 14);

    doc.setFontSize(9.5);
    // Row 1: Patient Initials, Age/Sex, Date of Intervention, IP/OP No
    doc.setFont(fontFamily, 'normal'); doc.text('Patient Initials: ', marginX + 2, iSessY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.patient_name || norm.demographics.patientName || 'N/A'), marginX + 24, iSessY + 5, { maxWidth: 22 });

    doc.setFont(fontFamily, 'normal'); doc.text('Age/Sex: ', marginX + 48, iSessY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(`${intervention.age || norm.demographics.age} Yrs / ${intervention.sex || norm.demographics.gender}`, marginX + 62, iSessY + 5, { maxWidth: 26 });

    doc.setFont(fontFamily, 'normal'); doc.text('Date: ', marginX + 94, iSessY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.date_of_intervention || norm.dates.interventionDate), marginX + 104, iSessY + 5);

    doc.setFont(fontFamily, 'normal'); doc.text('IP/OP No: ', marginX + 140, iSessY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.ip_op_no || norm.demographics.ipOpNo), marginX + 154, iSessY + 5, { maxWidth: 24 });

    // Row 2: Ward/Unit, Department, Physician
    doc.setFont(fontFamily, 'normal'); doc.text('Ward/Unit: ', marginX + 2, iSessY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.ward || norm.demographics.wardBed), marginX + 18, iSessY + 12, { maxWidth: 28 });

    doc.setFont(fontFamily, 'normal'); doc.text('Dept: ', marginX + 48, iSessY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.department || norm.demographics.department), marginX + 57, iSessY + 12, { maxWidth: 35 });

    doc.setFont(fontFamily, 'normal'); doc.text('Physician: ', marginX + 94, iSessY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.physician || norm.demographics.physician), marginX + 110, iSessY + 12, { maxWidth: 68 });

    // Row 3: Known Allergies
    doc.setFont(fontFamily, 'normal'); doc.text('Known Allergies: ', marginX + 2, iSessY + 19);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(190, 18, 60);
    doc.text(String(intervention.allergies || norm.demographics.allergyDrugs || 'None'), marginX + 27, iSessY + 19, { maxWidth: 150 });
    doc.setTextColor(15, 23, 42);

    y = iSessY + 28;

    // 2. PRESENT DIAGNOSIS BOX
    drawSectionBox('2. Present Diagnosis:', intervention.present_diagnosis || norm.diagnosis.final || 'N/A', 12);

    // 3. PRESCRIPTION DETAILS TABLE
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('3. Prescription Details:', marginX, y);
    y += 5;

    const rxDetailsList = Array.isArray(intervention.prescription_details) && intervention.prescription_details.length > 0 ? intervention.prescription_details : [];

    const drawRxTableHeader = (atY) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.rect(marginX, atY, contentWidth, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      doc.text('S.No', marginX + 2, atY + 5);
      doc.text('Name of the Drug', marginX + 16, atY + 5);
      doc.text('Dose & Frequency', marginX + 112, atY + 5);
    };

    drawRxTableHeader(y);
    y += 7;

    if (rxDetailsList.length > 0) {
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      rxDetailsList.forEach((rx, idx) => {
        const drugLines = doc.splitTextToSize(String(rx.drug_name || 'N/A'), 94);
        const doseLines = doc.splitTextToSize(String(rx.dose_frequency || `${rx.dose || ''} ${rx.frequency || ''}`.trim() || 'N/A'), 66);
        const maxLines = Math.max(drugLines.length, doseLines.length, 1);
        const rowH = Math.max(maxLines * 5 + 2, 7);

        if (ensureSpace(rowH)) {
          if (repeatTableHeader) {
            drawRxTableHeader(y);
            y += 7;
          }
          doc.setFont(fontFamily, 'normal'); doc.setFontSize(10);
        }

        if (zebraStriping && idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(marginX, y, contentWidth, rowH, 'FD');
        } else {
          doc.rect(marginX, y, contentWidth, rowH, 'D');
        }

        doc.text(String(rx.s_no || idx + 1), marginX + 3, y + 5);
        doc.text(drugLines, marginX + 16, y + 5);
        doc.text(doseLines, marginX + 112, y + 5);
        y += rowH;
      });
    } else {
      doc.rect(marginX, y, contentWidth, 7, 'D');
      doc.setFont(fontFamily, 'italic'); doc.setFontSize(10); doc.setTextColor(100, 116, 139);
      doc.text('No prescription details logged.', pageWidth / 2, y + 5, { align: 'center' });
      y += 7;
    }
    y += 6;

    // 4. IDENTIFIED PRESCRIPTION PROBLEMS
    const rxProbList = Array.isArray(intervention.prescription_problems) ? intervention.prescription_problems : (typeof intervention.prescription_problems === 'string' ? [intervention.prescription_problems] : []);
    const probStr = rxProbList.join(', ') + (intervention.prescription_problem_other ? ` (${intervention.prescription_problem_other})` : '');
    drawSectionBox('4. Identified Prescription Problems:', probStr || 'None specified.', 12);

    // 5. DESCRIPTION OF PROBLEM
    drawSectionBox('5. Description of Problem:', intervention.description_of_problem || 'N/A', 14);

    // 6. ACTION TAKEN & 7. RECOMMENDATIONS
    const actList = Array.isArray(intervention.action_taken) ? intervention.action_taken : (typeof intervention.action_taken === 'string' ? [intervention.action_taken] : []);
    const actStr = actList.join(', ') + (intervention.action_taken_other ? ` (${intervention.action_taken_other})` : '');

    const recList = Array.isArray(intervention.recommendations) ? intervention.recommendations : (typeof intervention.recommendations === 'string' ? [intervention.recommendations] : []);
    const recStr = recList.join(', ') + (intervention.recommendation_other ? ` (${intervention.recommendation_other})` : '');

    drawSectionBox('6. Action Taken:', actStr || 'None specified.', 12);
    drawSectionBox('7. Recommendations:', recStr || 'None specified.', 12);

    // 8. ASSESSMENT & OUTCOME BOX
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('8. Assessment & Outcome:', marginX, y);
    y += 5;

    const evalY = y;
    const hasReasons = Boolean(intervention.reasons_if_no || intervention.outcome_comments);

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, evalY, contentWidth, hasReasons ? 28 : 20, 'FD');
    doc.line(marginX, evalY + 7, marginX + contentWidth, evalY + 7);
    doc.line(marginX, evalY + 14, marginX + contentWidth, evalY + 14);

    doc.setFontSize(9.5);
    // Row 1: Discussed with Physician, Suggestions at Right Time
    doc.setFont(fontFamily, 'normal'); doc.text('Discussed with Physician: ', marginX + 3, evalY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(intervention.discussed_with_physician !== false ? 'YES' : 'NO', marginX + 42, evalY + 5);

    doc.setFont(fontFamily, 'normal'); doc.text('Suggestions at Right Time: ', marginX + 90, evalY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(intervention.suggestions_appropriate_time !== false ? 'YES' : 'NO', marginX + 132, evalY + 5);

    // Row 2: Accepted, Changed
    doc.setFont(fontFamily, 'normal'); doc.text('Physician Accepted: ', marginX + 3, evalY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(intervention.accepted !== false ? 'YES' : 'NO', marginX + 34, evalY + 12);

    doc.setFont(fontFamily, 'normal'); doc.text('Prescription Changed: ', marginX + 90, evalY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(intervention.changed !== false ? 'YES' : 'NO', marginX + 126, evalY + 12);

    // Row 3: Significance Level, Outcome
    doc.setFont(fontFamily, 'normal'); doc.text('Significance Level: ', marginX + 3, evalY + 19);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.significance_of_intervention || intervention.significance_level || 'Moderate'), marginX + 32, evalY + 19);

    doc.setFont(fontFamily, 'normal'); doc.text('Intervention Outcome: ', marginX + 90, evalY + 19);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.outcome || intervention.intervention_outcome || 'Positive'), marginX + 126, evalY + 19);

    if (hasReasons) {
      doc.line(marginX, evalY + 21, marginX + contentWidth, evalY + 21);
      doc.setFont(fontFamily, 'normal'); doc.text('Outcome Notes / Reasons: ', marginX + 3, evalY + 26);
      doc.setFont(fontFamily, 'italic'); doc.text(String(intervention.reasons_if_no || intervention.outcome_comments), marginX + 42, evalY + 26, { maxWidth: 134 });
    }

    y = evalY + (hasReasons ? 33 : 25);

    // 9. FOLLOW-UP NOTES & REFERENCES
    if (intervention.follow_up) {
      drawSectionBox('9. Follow-Up Notes:', intervention.follow_up, 14);
    }
    if (intervention.references_text) {
      drawSectionBox('10. References Consulted:', intervention.references_text, 12);
    }
  }

  // =========================================================================
  // 4. DRUG INFORMATION REQUEST DOCUMENTATION FORM ONLY
  // =========================================================================
  if (selectedForm === 'dir') {
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text(`DRUG INFORMATION REQUEST DOCUMENTATION  (CASE ID: ${norm.caseId})`, marginX, y);
    y += 6;

    drawSectionBox('Enquiry Date & Time:', `${dir.date || 'N/A'} ${dir.time || ''}`, 12);
    drawSectionBox('Enquirer Details:', `${dir.enquirerName || 'Physician'} (${dir.professionalStatus || 'Doctor'})`, 12);
    drawSectionBox('Category of Enquiry & Turnaround Time:', `${dir.questionCategory || 'Therapeutic Dosing'} (Needed: ${dir.timeframeNeeded || 'Immediate'})`, 12);
    drawSectionBox('Patient Background:', dir.patientBackground || 'N/A', 14);
    drawSectionBox('Details of Query:', dir.detailsOfEnquiry || 'N/A', 16);
    drawSectionBox('Response Provided:', dir.informationProvided || 'N/A', 18);
  }

  // =========================================================================
  // 5. ADR DOCUMENTATION LOG FORM ONLY
  // =========================================================================
  if (selectedForm === 'adr') {
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text(`ADR DOCUMENTATION LOG  (CASE ID: ${norm.caseId})`, marginX, y);
    y += 6;

    drawSectionBox('ADR Log Number & Dates:', `Log #: ${adr.adrNumber || 'ADR-LOG-001'} | Reported: ${adr.reportingDate || 'N/A'} | Onset: ${adr.onsetDate || 'N/A'}`, 12);
    drawSectionBox('Suspected Drug:', adr.suspectedMeds ? (Array.isArray(adr.suspectedMeds) ? adr.suspectedMeds.map(m => `${m.medicine_name || m.generic_name} (${m.dose || ''})`).join(', ') : adr.suspectedMeds) : 'N/A', 14);
    drawSectionBox('Reaction Category & Description:', `${adr.reactionCategory || 'Dermatological'} — ${adr.reactionTitle || 'N/A'}`, 14);
    drawSectionBox('Naranjo Causality Assessment:', adr.naranjoCausality || 'Probable', 12);
    drawSectionBox('Severity & Seriousness:', `${adr.reactionSeverity || 'Moderate'} (${adr.reactionSeriousness || 'Hospitalization'})`, 12);
    drawSectionBox('Dechallenge & Rechallenge:', `Dechallenge: ${adr.dechallengeInfo || 'Positive'} | Rechallenge: ${adr.rechallengeInfo || 'Not Done'}`, 12);
    drawSectionBox('Clinical Management & Outcome:', adr.clinicalManagement || adr.patientOutcome || 'Recovering', 14);
  }

  // Dual Signatures on final page of selected form
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

  // DIRECT PDF FILE DOWNLOAD PER FORM TYPE
  const formSuffix = selectedForm.toUpperCase();
  doc.save(`${norm.caseId}_${formSuffix}_Documentation.pdf`);
};

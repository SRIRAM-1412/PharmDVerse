import jsPDF from 'jspdf';
import { buildNormalizedApprovedCaseData, formatDisplayDate as importedFormatDisplayDate } from './buildNormalizedApprovedCaseData';

/**
 * Safe Date Formatting Helper for PDF output
 */
export const formatDisplayDate = (val) => {
  if (typeof importedFormatDisplayDate === 'function') {
    return importedFormatDisplayDate(val);
  }
  if (!val || val === '—' || val === 'N/A' || val === 'null' || val === 'undefined') return '—';
  const str = String(val).trim();
  if (str.includes('T')) {
    const datePart = str.split('T')[0];
    if (datePart && datePart.length === 10) return datePart;
  }
  return str;
};

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
 * Includes 100% container safety, dynamic row expansion, protected headers/footers,
 * and clean dual signature placement across all 5 forms.
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
  const footerAreaTop = pageHeight - 20; // 277mm limit for content

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

    const neededSigHeight = 34; // Total height reserved for signature block
    const maxSigBottom = pageHeight - 18; // Protected footer starts at pageHeight - 14

    let sigY = currentY + 6;

    // If signature block exceeds printable page area above footer, move to new page
    if (sigY + neededSigHeight > maxSigBottom) {
      doc.addPage();
      sigY = 42;
    }

    doc.saveGraphicsState();

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(marginX, sigY, pageWidth - marginX, sigY);

    const sigLeftX = marginX + 15;
    const sigRightX = pageWidth - marginX - 65;

    // Student Signature Box (Left)
    if (showStudentSignature) {
      doc.line(sigLeftX, sigY + 10, sigLeftX + 50, sigY + 10);
      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10.5); doc.setTextColor(15, 23, 42);
      doc.text('Student Signature', sigLeftX + 25, sigY + 14, { align: 'center' });
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(10.0); doc.setTextColor(2, 132, 199);
      doc.text(`${norm.studentName} (${norm.studentRoll})`, sigLeftX + 25, sigY + 19, { align: 'center', maxWidth: 55 });
      doc.setFontSize(9.5); doc.setTextColor(100, 116, 139);
      doc.text(`Date: ${currentDateStr}`, sigLeftX + 25, sigY + 23.5, { align: 'center' });
    }

    // Preceptor Signature Box (Right)
    if (showPreceptorSignature) {
      doc.line(sigRightX, sigY + 10, sigRightX + 50, sigY + 10);
      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10.5); doc.setTextColor(15, 23, 42);
      doc.text('Preceptor Signature', sigRightX + 25, sigY + 14, { align: 'center' });
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(10.0); doc.setTextColor(2, 132, 199);
      doc.text(norm.preceptorName, sigRightX + 25, sigY + 19, { align: 'center', maxWidth: 55 });
      doc.setFontSize(9.0); doc.setTextColor(100, 116, 139);
      doc.text(String(norm.preceptorDesig || '').toUpperCase(), sigRightX + 25, sigY + 23, { align: 'center', maxWidth: 55 });
      doc.setFontSize(9.5); doc.setTextColor(100, 116, 139);
      doc.text(`Date: ${currentDateStr}`, sigRightX + 25, sigY + 27.5, { align: 'center' });
    }

    doc.restoreGraphicsState();
    return sigY + neededSigHeight;
  };

  let y = 42;

  const ensureSpace = (neededHeight) => {
    if (y + neededHeight > footerAreaTop) {
      doc.addPage();
      y = 42;
      return true;
    }
    return false;
  };

  // Helper to draw a section box with heading & automatic dynamic row expansion
  const drawSectionBox = (title, contentText, minBoxH = 14) => {
    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
    const lines = doc.splitTextToSize(String(contentText || 'N/A'), contentWidth - 6);
    const actualBoxH = Math.max(lines.length * 5.2 + 4, minBoxH);

    ensureSpace(actualBoxH + 12);

    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text(title, marginX + 1, y);
    y += 5.5;

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, y, contentWidth, actualBoxH, 'FD');

    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text(lines, marginX + 3, y + 5);
    y += actualBoxH + 6;
  };

  // =========================================================================
  // 1. PATIENT PROFILE FORM ONLY
  // =========================================================================
  if (selectedForm === 'profile') {
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(11.5); doc.setTextColor(15, 23, 42);
    doc.text('PATIENT PROFILE DOCUMENTATION', marginX + 1, y);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(10.5); doc.setTextColor(3, 105, 161);
    doc.text(`(CASE ID: ${norm.caseId})`, pageWidth - marginX, y, { align: 'right' });
    y += 6;

    // PATIENT DETAILS GRID TABLE (3 Rows with tuned cell widths & boundary guards)
    ensureSpace(32);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Patient details:', marginX + 1, y);
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

    // Row 1 Values
    doc.setFont(fontFamily, 'normal'); doc.text('Name: ', r1X[0] + 1.5, gridY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.patientName), r1X[0] + 12.5, gridY + 6, { maxWidth: 26 });

    doc.setFont(fontFamily, 'normal'); doc.text('Age/Sex: ', r1X[1] + 1.5, gridY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(`${norm.demographics.age}/${norm.demographics.gender}`, r1X[1] + 15, gridY + 6, { maxWidth: 19 });

    doc.setFont(fontFamily, 'normal'); doc.text('I.P No: ', r1X[2] + 1.5, gridY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.ipOpNo), r1X[2] + 12.5, gridY + 6, { maxWidth: 38 });

    doc.setFont(fontFamily, 'normal'); doc.text('Height: ', r1X[3] + 1.5, gridY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.height), r1X[3] + 13, gridY + 6, { maxWidth: 37 });

    // Row 2 Values
    doc.setFont(fontFamily, 'normal'); doc.text('Weight: ', r2X[0] + 1.5, gridY + 15);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.weight), r2X[0] + 14, gridY + 15, { maxWidth: 20 });

    doc.setFont(fontFamily, 'normal'); doc.text('BMI: ', r2X[1] + 1.5, gridY + 15);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.bmi), r2X[1] + 10, gridY + 15, { maxWidth: 20 });

    doc.setFont(fontFamily, 'normal'); doc.text('Ward: ', r2X[2] + 1.5, gridY + 15);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.wardBed), r2X[2] + 11.5, gridY + 15, { maxWidth: 45 });

    doc.setFont(fontFamily, 'normal'); doc.text('Dept: ', r2X[3] + 1.5, gridY + 15);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.demographics.department), r2X[3] + 11, gridY + 15, { maxWidth: 41 });

    // Row 3 Values
    doc.setFont(fontFamily, 'normal'); doc.text('DOA: ', r3X[0] + 1.5, gridY + 24);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.dates.doa), r3X[0] + 11, gridY + 24, { maxWidth: 27.5 });

    doc.setFont(fontFamily, 'normal'); doc.text('DOC: ', r3X[1] + 1.5, gridY + 24);
    doc.setFont(fontFamily, 'bold'); doc.text(String(norm.dates.doc), r3X[1] + 24, gridY + 24, { maxWidth: 27.5 });

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
    doc.text('Social history:', marginX + 1, y);
    y += 5;

    const socY = y;
    const socColW = contentWidth / 4;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, socY, contentWidth, 20, 'FD');
    for (let c = 1; c < 4; c++) {
      doc.line(marginX + c * socColW, socY, marginX + c * socColW, socY + 20);
    }

    doc.setFontSize(9.5);
    doc.setFont(fontFamily, 'bold'); doc.text('Smoker:', marginX + 2, socY + 5);
    doc.setFont(fontFamily, 'normal'); doc.text(`Pack/day: ${profile?.smoker_pack_day || '—'}`, marginX + 2, socY + 10, { maxWidth: socColW - 4 });
    doc.text(`Duration: ${profile?.smoker_duration || '—'}`, marginX + 2, socY + 15, { maxWidth: socColW - 4 });

    doc.setFont(fontFamily, 'bold'); doc.text('Alcoholic:', marginX + socColW + 2, socY + 5);
    doc.setFont(fontFamily, 'normal'); doc.text(`Amount/day: ${profile?.alcoholic_amount_day || '—'}`, marginX + socColW + 2, socY + 10, { maxWidth: socColW - 4 });
    doc.text(`Duration: ${profile?.alcoholic_duration || '—'}`, marginX + socColW + 2, socY + 15, { maxWidth: socColW - 4 });

    doc.setFont(fontFamily, 'bold'); doc.text('Allergies:', marginX + 2 * socColW + 2, socY + 5);
    doc.setFont(fontFamily, 'normal'); doc.text(`Food: ${profile?.allergy_food || 'None'}`, marginX + 2 * socColW + 2, socY + 10, { maxWidth: socColW - 4 });
    doc.setTextColor(190, 18, 60); doc.text(`Drugs: ${profile?.allergy_drugs || profile?.allergies || 'None'}`, marginX + 2 * socColW + 2, socY + 15, { maxWidth: socColW - 4 }); doc.setTextColor(15, 23, 42);

    doc.setFont(fontFamily, 'bold'); doc.text('Marital status:', marginX + 3 * socColW + 2, socY + 5);
    doc.setFont(fontFamily, 'normal'); doc.text(String(profile?.marital_status || 'Single'), marginX + 3 * socColW + 2, socY + 10, { maxWidth: socColW - 4 });

    y = socY + 25;

    // PHYSICAL EXAMINATION BOX
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Physical Examination:', marginX + 1, y);
    y += 5;

    const physY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, physY, contentWidth, 20, 'FD');
    doc.line(marginX, physY + 9, marginX + contentWidth, physY + 9);

    doc.setFontSize(10);
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
    doc.text('VITAL SIGNS LOG CHART', marginX + 1, y);
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
    doc.text('LABORATORY INVESTIGATIONS', marginX + 1, y);
    y += 5.5;

    const labsList = norm.labs;

    const drawLabsTableHeader = (atY) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.rect(marginX, atY, contentWidth, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      doc.text('Category', marginX + 3, atY + 5);
      doc.text('Investigation Parameter', marginX + 39, atY + 5);
      doc.text('Observed Value', marginX + 87, atY + 5);
      doc.text('Reference Range', marginX + 121, atY + 5);
      doc.text('Clinical Inference', marginX + 153, atY + 5);
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
        const infLines = doc.splitTextToSize(String(lab.clinical_inference || lab.impression || 'Normal'), 25);

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

        doc.text(catLines, marginX + 3, y + 5);
        doc.text(paramLines, marginX + 39, y + 5);
        doc.text(valLines, marginX + 87, y + 5);
        doc.text(refLines, marginX + 121, y + 5);
        doc.text(infLines, marginX + 153, y + 5);
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
    doc.text('PRESCRIBED MEDICATION PROFILE', marginX + 1, y);
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
      doc.text('S.No', marginX + 2, atY + 5);
      doc.text('Brand / Trade Name', marginX + 12, atY + 5);
      doc.text('Generic Name', marginX + 46, atY + 5);
      doc.text('Route', marginX + 84, atY + 5);
      doc.text('Dose', marginX + 100, atY + 5);
      doc.text('Freq', marginX + 118, atY + 5);
      doc.text('Start Date', marginX + 134, atY + 5);
      doc.text('Stop Date', marginX + 158, atY + 5);
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
        doc.text(brandLines, marginX + 12, y + 5);
        doc.text(genericLines, marginX + 46, y + 5);
        doc.text(routeLines, marginX + 84, y + 5);
        doc.text(doseLines, marginX + 100, y + 5);
        doc.text(freqLines, marginX + 118, y + 5);
        doc.text(startLines, marginX + 134, y + 5);
        doc.text(stopLines, marginX + 158, y + 5);
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
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(11.5); doc.setTextColor(15, 23, 42);
    doc.text('PATIENT COUNSELLING DOCUMENTATION', marginX + 1, y);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(10.5); doc.setTextColor(3, 105, 161);
    doc.text(`(CASE ID: ${norm.caseId})`, pageWidth - marginX, y, { align: 'right' });
    y += 6;

    // 1. SESSION OVERVIEW BOX
    ensureSpace(24);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('1. Session Overview:', marginX + 1, y);
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
    doc.setFont(fontFamily, 'bold'); doc.text(formatDisplayDate(counselling.counselling_date || norm.dates.counsellingDate), marginX + 104, cSessY + 5);

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
    doc.text('4. Counselling Points Covered Checklist:', marginX + 1, y);
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
    const barrierDetailsStr = String(counselling.barrier_details || counselling.barriers_identified || 'None specified.');
    const barrierLines = doc.splitTextToSize(barrierDetailsStr, 144);
    const hasBarriers = Boolean(counselling.major_barriers_involved);
    const barrierOvercome = Boolean(counselling.barrier_overcome);

    const barBoxH = hasBarriers ? Math.max(barrierLines.length * 5 + 10, 22) : 12;

    ensureSpace(barBoxH + 10);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('5. Barriers to Compliance & Resolution:', marginX + 1, y);
    y += 5;

    const barY = y;

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, barY, contentWidth, barBoxH, 'FD');

    doc.setFontSize(10);
    doc.setFont(fontFamily, 'normal'); doc.text('Major Barriers Involved: ', marginX + 3, barY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(hasBarriers ? 'Yes' : 'No', marginX + 40, barY + 6);

    doc.setFont(fontFamily, 'normal'); doc.text('Barrier Overcome Rightly: ', marginX + 90, barY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(barrierOvercome ? 'Yes' : 'No / N/A', marginX + 130, barY + 6);

    if (hasBarriers) {
      doc.line(marginX, barY + 9, marginX + contentWidth, barY + 9);
      doc.setFont(fontFamily, 'normal'); doc.text('Details of Barrier: ', marginX + 3, barY + 15);
      doc.setFont(fontFamily, 'italic');
      doc.text(barrierLines, marginX + 32, barY + 15);
    }

    y = barY + barBoxH + 6;

    // 6. DURATION & RECIPIENT BOX
    ensureSpace(22);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('6. Session Duration & Recipient:', marginX + 1, y);
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
    doc.text(`Patient Understanding Ascertained:  ${counselling.understanding_ascertained !== false ? 'YES (Ascertained)' : 'NO'}`, marginX + 1, y);
    y += 8;
  }

  // =========================================================================
  // 3. PHARMACIST INTERVENTION DOCUMENTATION FORM ONLY (STEP 13)
  // =========================================================================
  if (selectedForm === 'intervention') {
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(11.5); doc.setTextColor(15, 23, 42);
    doc.text('PHARMACIST INTERVENTION DOCUMENTATION', marginX + 1, y);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(10.5); doc.setTextColor(3, 105, 161);
    doc.text(`(CASE ID: ${norm.caseId})`, pageWidth - marginX, y, { align: 'right' });
    y += 6;

    // 1. PATIENT INFORMATION BOX
    ensureSpace(24);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('1. Patient Information:', marginX + 1, y);
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
    doc.setFont(fontFamily, 'bold'); doc.text(formatDisplayDate(intervention.date_of_intervention || norm.dates.interventionDate), marginX + 104, iSessY + 5);

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
    doc.text('3. Prescription Details:', marginX + 1, y);
    y += 5;

    const rxDetailsList = Array.isArray(intervention.prescription_details) && intervention.prescription_details.length > 0 ? intervention.prescription_details : [];

    const drawRxTableHeader = (atY) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.rect(marginX, atY, contentWidth, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      doc.text('S.No', marginX + 3, atY + 5);
      doc.text('Name of the Drug', marginX + 17, atY + 5);
      doc.text('Dose & Frequency', marginX + 113, atY + 5);
    };

    drawRxTableHeader(y);
    y += 7;

    if (rxDetailsList.length > 0) {
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      rxDetailsList.forEach((rx, idx) => {
        const drugLines = doc.splitTextToSize(String(rx.drug_name || 'N/A'), 92);
        const doseLines = doc.splitTextToSize(String(rx.dose_frequency || `${rx.dose || ''} ${rx.frequency || ''}`.trim() || 'N/A'), 64);
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
        doc.text(drugLines, marginX + 17, y + 5);
        doc.text(doseLines, marginX + 113, y + 5);
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

    const recList = Array.isArray(intervention.recommendations) ? intervention.recommendations : (typeof intervention.recommendations === 'string' ? [intervention.recommendation_other] : []);
    const recStr = recList.join(', ') + (intervention.recommendation_other ? ` (${intervention.recommendation_other})` : '');

    drawSectionBox('6. Action Taken:', actStr || 'None specified.', 12);
    drawSectionBox('7. Recommendations:', recStr || 'None specified.', 12);

    // 8. ASSESSMENT & OUTCOME BOX
    const notesStr = String(intervention.reasons_if_no || intervention.outcome_comments || '');
    const notesLines = doc.splitTextToSize(notesStr, 134);
    const hasReasons = Boolean(notesStr);
    const evalBoxH = hasReasons ? Math.max(notesLines.length * 5 + 23, 28) : 20;

    ensureSpace(evalBoxH + 10);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('8. Assessment & Outcome:', marginX + 1, y);
    y += 5;

    const evalY = y;

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, evalY, contentWidth, evalBoxH, 'FD');
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
      doc.setFont(fontFamily, 'italic'); doc.text(notesLines, marginX + 42, evalY + 26);
    }

    y = evalY + evalBoxH + 6;

    // 9. FOLLOW-UP NOTES & REFERENCES
    if (intervention.follow_up) {
      drawSectionBox('9. Follow-Up Notes:', intervention.follow_up, 14);
    }
    if (intervention.references_text) {
      drawSectionBox('10. References Consulted:', intervention.references_text, 12);
    }
  }

  // =========================================================================
  // 4. DRUG INFORMATION REQUEST DOCUMENTATION FORM ONLY (STEP 14)
  // =========================================================================
  if (selectedForm === 'dir') {
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(11.5); doc.setTextColor(15, 23, 42);
    doc.text('DRUG INFORMATION REQUEST DOCUMENTATION', marginX + 1, y);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(10.5); doc.setTextColor(3, 105, 161);
    doc.text(`(CASE ID: ${norm.caseId})`, pageWidth - marginX, y, { align: 'right' });
    y += 6;

    // 1. SESSION & ENQUIRER OVERVIEW BOX
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('1. Enquirer & Session Overview:', marginX + 1, y);
    y += 4;

    const dirSessY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, dirSessY, contentWidth, 22, 'FD');
    doc.line(marginX, dirSessY + 7, marginX + contentWidth, dirSessY + 7);
    doc.line(marginX, dirSessY + 14, marginX + contentWidth, dirSessY + 14);

    doc.setFontSize(9.5);
    // Row 1: Date, Time, Mode of Request, Answer Needed Timeframe
    doc.setFont(fontFamily, 'normal'); doc.text('Date: ', marginX + 2, dirSessY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(formatDisplayDate(dir.request_date || norm.dates.queryDate), marginX + 12, dirSessY + 5);

    doc.setFont(fontFamily, 'normal'); doc.text('Time: ', marginX + 48, dirSessY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.request_time || norm.dates.queryTime || '11:00 AM'), marginX + 58, dirSessY + 5);

    doc.setFont(fontFamily, 'normal'); doc.text('Mode of Request: ', marginX + 94, dirSessY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.mode_of_request || 'Direct'), marginX + 122, dirSessY + 5, { maxWidth: 20 });

    doc.setFont(fontFamily, 'normal'); doc.text('Turnaround: ', marginX + 144, dirSessY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.timeframe_needed || dir.answer_needed || 'Immediately'), marginX + 162, dirSessY + 5, { maxWidth: 17 });

    // Row 2: Enquirer Name, Designation, Phone No, Unit/Ward
    doc.setFont(fontFamily, 'normal'); doc.text('Enquirer: ', marginX + 2, dirSessY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.enquirer_name || dir.enquirer_select || 'Resident Physician'), marginX + 16, dirSessY + 12, { maxWidth: 30 });

    doc.setFont(fontFamily, 'normal'); doc.text('Designation: ', marginX + 48, dirSessY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.designation || 'Doctor'), marginX + 66, dirSessY + 12, { maxWidth: 26 });

    doc.setFont(fontFamily, 'normal'); doc.text('Phone No: ', marginX + 94, dirSessY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.phone_no || '—'), marginX + 110, dirSessY + 12, { maxWidth: 32 });

    doc.setFont(fontFamily, 'normal'); doc.text('Ward/Unit: ', marginX + 144, dirSessY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.unit_ward || norm.demographics.wardBed), marginX + 160, dirSessY + 12, { maxWidth: 19 });

    // Row 3: Professional Status & Question Category
    doc.setFont(fontFamily, 'normal'); doc.text('Professional Status: ', marginX + 2, dirSessY + 19);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.professional_status || 'Physician'), marginX + 30, dirSessY + 19, { maxWidth: 45 });

    doc.setFont(fontFamily, 'normal'); doc.text('Question Category: ', marginX + 94, dirSessY + 19);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(2, 132, 199);
    doc.text(String(dir.question_category || 'Therapeutic Use'), marginX + 124, dirSessY + 19, { maxWidth: 55 });
    doc.setTextColor(15, 23, 42);

    y = dirSessY + 28;

    // 2. DETAILS OF ENQUIRY (QUESTION) BOX
    drawSectionBox('2. Details of Enquiry (Clinical Question):', dir.details_of_enquiry || 'N/A', 16);

    // 3. PATIENT BACKGROUND INFORMATION BOX GRID
    ensureSpace(30);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('3. Patient Background Information:', marginX + 1, y);
    y += 5;

    const bgY = y;
    const isPreg = Boolean(dir.is_pregnant_lactating);

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, bgY, contentWidth, 26, 'FD');
    doc.line(marginX, bgY + 6.5, marginX + contentWidth, bgY + 6.5);
    doc.line(marginX, bgY + 13, marginX + contentWidth, bgY + 13);
    doc.line(marginX, bgY + 19.5, marginX + contentWidth, bgY + 19.5);

    doc.setFontSize(9.5);
    // Row 1: Age/Sex, Weight, Known Allergies
    doc.setFont(fontFamily, 'normal'); doc.text('Age/Sex: ', marginX + 2, bgY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(`${dir.age || norm.demographics.age} Yrs / ${dir.sex || norm.demographics.gender}`, marginX + 16, bgY + 5, { maxWidth: 30 });

    doc.setFont(fontFamily, 'normal'); doc.text('Weight: ', marginX + 54, bgY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.weight_kg ? `${dir.weight_kg} kg` : norm.demographics.weight), marginX + 67, bgY + 5, { maxWidth: 25 });

    doc.setFont(fontFamily, 'normal'); doc.text('Allergies: ', marginX + 94, bgY + 5);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(190, 18, 60);
    doc.text(String(dir.allergies || norm.demographics.allergyDrugs || 'None'), marginX + 109, bgY + 5, { maxWidth: 70 });
    doc.setTextColor(15, 23, 42);

    // Row 2: Current Medical Problem
    doc.setFont(fontFamily, 'normal'); doc.text('Current Diagnosis/Problem: ', marginX + 2, bgY + 11.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.current_medical_problem || norm.diagnosis.final || 'N/A'), marginX + 42, bgY + 11.5, { maxWidth: 135 });

    // Row 3: Pregnancy/Lactation & Other Investigations
    doc.setFont(fontFamily, 'normal'); doc.text('Pregnancy/Lactation: ', marginX + 2, bgY + 18);
    doc.setFont(fontFamily, 'bold'); doc.text(isPreg ? `YES ${dir.pregnancy_lactation_details ? `(${dir.pregnancy_lactation_details})` : ''}` : 'NO', marginX + 34, bgY + 18, { maxWidth: 55 });

    doc.setFont(fontFamily, 'normal'); doc.text('Other Investigations: ', marginX + 94, bgY + 18);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.other_investigations || 'N/A'), marginX + 124, bgY + 18, { maxWidth: 55 });

    // Row 4: Drug Therapy
    doc.setFont(fontFamily, 'normal'); doc.text('Current Drug Therapy: ', marginX + 2, bgY + 24.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.drug_therapy || 'N/A'), marginX + 36, bgY + 24.5, { maxWidth: 141 });

    y = bgY + 32;

    // 4. INFORMATION PROVIDED (RESPONSE) BOX
    drawSectionBox('4. Information Provided (Clinical Response):', dir.information_provided || 'N/A', 22);

    // 5. TIMELINE & MODE OF REPLY BOX
    const delayStr = String(dir.reason_for_delay || '');
    const delayLines = doc.splitTextToSize(delayStr, 146);
    const hasDelay = Boolean(delayStr);
    const repBoxH = hasDelay ? Math.max(delayLines.length * 5 + 10, 16) : 10;

    ensureSpace(repBoxH + 10);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('5. Reply & Timeline Details:', marginX + 1, y);
    y += 5;

    const repY = y;

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, repY, contentWidth, repBoxH, 'FD');

    doc.setFontSize(9.5);
    doc.setFont(fontFamily, 'normal'); doc.text('Answer Given Timeframe: ', marginX + 3, repY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.answer_given_timeframe || dir.timeframe_needed || 'Immediately'), marginX + 42, repY + 6);

    doc.setFont(fontFamily, 'normal'); doc.text('Mode of Reply: ', marginX + 94, repY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.mode_of_reply || 'Written'), marginX + 118, repY + 6);

    if (hasDelay) {
      doc.line(marginX, repY + 8.5, marginX + contentWidth, repY + 8.5);
      doc.setFont(fontFamily, 'normal'); doc.text('Reason for Delay: ', marginX + 3, repY + 13.5);
      doc.setFont(fontFamily, 'italic'); doc.text(delayLines, marginX + 30, repY + 13.5);
    }

    y = repY + repBoxH + 6;

    // 6. REFERENCES CONSULTED BOX
    const refList = Array.isArray(dir.references) && dir.references.length > 0
      ? dir.references.map(r => `[${r.type || 'Ref'}]: ${r.source || 'N/A'}`)
      : [dir.ref_textbooks, dir.ref_journals, dir.ref_micromedex, dir.ref_website].filter(Boolean);

    const refStr = refList.length > 0 ? refList.join('\n') : '1. Micromedex Clinical Knowledge Database\n2. Lexicomp Drug Information Handbook';
    const refLines = doc.splitTextToSize(refStr, contentWidth - 6);
    const refBoxH = Math.max(refLines.length * 5 + 4, 14);

    ensureSpace(refBoxH + 12);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('6. References Consulted:', marginX + 1, y);
    y += 5;

    const refY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, refY, contentWidth, refBoxH, 'FD');
    doc.setFontSize(9.5);
    doc.setFont(fontFamily, 'normal');
    doc.text(refLines, marginX + 3, refY + 5);

    y = refY + refBoxH + 6;
  }

  // =========================================================================
  // 5. ADR DOCUMENTATION LOG FORM ONLY (STEP 15)
  // =========================================================================
  if (selectedForm === 'adr') {
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(11.5); doc.setTextColor(15, 23, 42);
    doc.text('ADR DOCUMENTATION LOG', marginX + 1, y);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(10.5); doc.setTextColor(3, 105, 161);
    doc.text(`(CASE ID: ${norm.caseId})`, pageWidth - marginX, y, { align: 'right' });
    y += 6;

    // 1. GENERAL RECORD INFORMATION BOX
    ensureSpace(24);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('1. General Record Information:', marginX + 1, y);
    y += 4;

    const adrGenY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, adrGenY, contentWidth, 16, 'FD');
    doc.line(marginX, adrGenY + 8, marginX + contentWidth, adrGenY + 8);

    doc.setFontSize(9.5);
    // Row 1: ADR Record No, Reporting Date, Reported By
    doc.setFont(fontFamily, 'normal'); doc.text('ADR Record No: ', marginX + 2, adrGenY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(180, 83, 9);
    doc.text(String(adr.adr_number || adr.adrNumber || 'ADR-2026-000001'), marginX + 26, adrGenY + 5.5, { maxWidth: 35 });
    doc.setTextColor(15, 23, 42);

    doc.setFont(fontFamily, 'normal'); doc.text('Reporting Date: ', marginX + 68, adrGenY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(formatDisplayDate(adr.reporting_date || adr.reportingDate || norm.dates.adrReportingDate), marginX + 91, adrGenY + 5.5);

    doc.setFont(fontFamily, 'normal'); doc.text('Status: ', marginX + 140, adrGenY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(5, 150, 105);
    doc.text(String(adr.approval_status || 'Approved').toUpperCase(), marginX + 152, adrGenY + 5.5);
    doc.setTextColor(15, 23, 42);

    // Row 2: Preceptor Name, Student Name
    doc.setFont(fontFamily, 'normal'); doc.text('Assigned Preceptor: ', marginX + 2, adrGenY + 13.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.assigned_preceptor_name || norm.preceptorName), marginX + 32, adrGenY + 13.5, { maxWidth: 50 });

    doc.setFont(fontFamily, 'normal'); doc.text('Student Pharmacist: ', marginX + 94, adrGenY + 13.5);
    doc.setFont(fontFamily, 'bold'); doc.text(`${norm.studentName} (${norm.studentRoll})`, marginX + 124, adrGenY + 13.5, { maxWidth: 50 });

    y = adrGenY + 22;

    // 2. PATIENT OVERVIEW BOX
    ensureSpace(26);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('2. Patient Overview:', marginX + 1, y);
    y += 4;

    const adrPatY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, adrPatY, contentWidth, 18, 'FD');
    doc.line(marginX, adrPatY + 9, marginX + contentWidth, adrPatY + 9);

    doc.setFontSize(9.0);
    // Row 1: Initials, Reg No, Age/Sex, Weight
    doc.setFont(fontFamily, 'normal'); doc.text('Initials: ', marginX + 2, adrPatY + 6.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.patient_initials || norm.demographics.patientName), marginX + 14, adrPatY + 6.0, { maxWidth: 25 });

    doc.setFont(fontFamily, 'normal'); doc.text('Reg No: ', marginX + 42, adrPatY + 6.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.hospital_reg_number || norm.demographics.ipOpNo), marginX + 55, adrPatY + 6.0, { maxWidth: 32 });

    doc.setFont(fontFamily, 'normal'); doc.text('Age/Sex: ', marginX + 92, adrPatY + 6.0);
    doc.setFont(fontFamily, 'bold'); doc.text(`${adr.age || norm.demographics.age} Yrs / ${adr.gender || norm.demographics.gender}`, marginX + 106, adrPatY + 6.0, { maxWidth: 30 });

    doc.setFont(fontFamily, 'normal'); doc.text('Weight: ', marginX + 142, adrPatY + 6.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.weight ? `${adr.weight} kg` : norm.demographics.weight), marginX + 155, adrPatY + 6.0, { maxWidth: 22 });

    // Row 2: Department, Ward/Unit, Primary Diagnosis
    doc.setFont(fontFamily, 'normal'); doc.text('Department: ', marginX + 2, adrPatY + 14.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.department || norm.demographics.department), marginX + 22, adrPatY + 14.5, { maxWidth: 30 });

    doc.setFont(fontFamily, 'normal'); doc.text('Ward/Unit: ', marginX + 54, adrPatY + 14.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.ward || norm.demographics.wardBed), marginX + 70, adrPatY + 14.5, { maxWidth: 44 });

    doc.setFont(fontFamily, 'normal'); doc.text('Primary Diagnosis: ', marginX + 116, adrPatY + 14.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.primary_diagnosis || norm.diagnosis.final || 'N/A'), marginX + 144, adrPatY + 14.5, { maxWidth: 34 });

    y = adrPatY + 24;

    // 3. ADVERSE REACTION OVERVIEW BOX
    ensureSpace(32);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('3. Adverse Reaction Overview:', marginX + 1, y);
    y += 4;

    const reactY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, reactY, contentWidth, 22, 'FD');
    doc.line(marginX, reactY + 7, marginX + contentWidth, reactY + 7);
    doc.line(marginX, reactY + 14, marginX + contentWidth, reactY + 14);

    doc.setFontSize(9.0);
    // Row 1: Reaction Title, Category
    doc.setFont(fontFamily, 'normal'); doc.text('Reaction Title: ', marginX + 2, reactY + 5);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(225, 29, 72);
    doc.text(String(adr.reaction_title || adr.reactionTitle || 'N/A'), marginX + 24, reactY + 5, { maxWidth: 78 });
    doc.setTextColor(15, 23, 42);

    doc.setFont(fontFamily, 'normal'); doc.text('Category: ', marginX + 106, reactY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.reaction_category || adr.reactionCategory || 'General'), marginX + 122, reactY + 5, { maxWidth: 55 });

    // Row 2: Started At, Ended At, Duration
    doc.setFont(fontFamily, 'normal'); doc.text('Started At: ', marginX + 2, reactY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(formatDisplayDate(adr.reaction_started_at || norm.dates.adrOnsetDate), marginX + 19, reactY + 12);

    doc.setFont(fontFamily, 'normal'); doc.text('Ended At: ', marginX + 64, reactY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(formatDisplayDate(adr.reaction_ended_at || norm.dates.adrEndedAt), marginX + 80, reactY + 12);

    doc.setFont(fontFamily, 'normal'); doc.text('Duration: ', marginX + 124, reactY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.reaction_duration || 'N/A'), marginX + 139, reactY + 12, { maxWidth: 38 });

    // Row 3: Current Patient Condition
    doc.setFont(fontFamily, 'normal'); doc.text('Patient Condition: ', marginX + 2, reactY + 19);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.current_patient_condition || adr.reaction_outcome || 'Recovering'), marginX + 30, reactY + 19, { maxWidth: 145 });

    y = reactY + 28;

    drawSectionBox('Clinical Description of Reaction:', adr.reaction_description || adr.reactionTitle || 'N/A', 14);
    if (adr.clinical_management_provided || adr.clinicalManagement) {
      drawSectionBox('Clinical Management Provided:', adr.clinical_management_provided || adr.clinicalManagement, 12);
    }

    // 4. SUSPECTED MEDICATION(S) TABLE
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(180, 83, 9);
    doc.text('4. Suspected Medication(s)', marginX + 1, y);
    y += 5;

    const suspectedMedsList = Array.isArray(adr.suspected_drugs) && adr.suspected_drugs.length > 0 ? adr.suspected_drugs : (Array.isArray(adr.suspectedMeds) ? adr.suspectedMeds : []);

    const drawSuspectedTableHeader = (atY) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.rect(marginX, atY, contentWidth, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      doc.text('Brand Name', marginX + 3, atY + 5);
      doc.text('Generic Name', marginX + 37, atY + 5);
      doc.text('Dose & Route', marginX + 75, atY + 5);
      doc.text('Therapy Dates', marginX + 113, atY + 5);
      doc.text('Indication', marginX + 149, atY + 5);
    };

    drawSuspectedTableHeader(y);
    y += 7;

    if (suspectedMedsList.length > 0) {
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(9.5); doc.setTextColor(15, 23, 42);
      suspectedMedsList.forEach((m, idx) => {
        const brandLines = doc.splitTextToSize(String(m.medicine_name || m.brand_name || 'N/A'), 32);
        const genericLines = doc.splitTextToSize(String(m.generic_name || 'N/A'), 36);
        const doseLines = doc.splitTextToSize(`${m.dose || ''} (${m.route || 'Oral'} / ${m.frequency || ''})`.trim(), 36);
        const startDateStr = formatDisplayDate(m.start_date);
        const stopDateStr = formatDisplayDate(m.stop_date);
        const dateLines = doc.splitTextToSize(`${startDateStr !== '—' ? startDateStr : '—'} to ${stopDateStr !== '—' ? stopDateStr : 'Ongoing'}`, 34);
        const indLines = doc.splitTextToSize(String(m.clinical_indication || 'N/A'), 30);

        const maxLines = Math.max(brandLines.length, genericLines.length, doseLines.length, dateLines.length, indLines.length, 1);
        const rowH = Math.max(maxLines * 4.5 + 2, 7);

        if (ensureSpace(rowH)) {
          if (repeatTableHeader) {
            drawSuspectedTableHeader(y);
            y += 7;
          }
          doc.setFont(fontFamily, 'normal'); doc.setFontSize(9.5);
        }

        if (zebraStriping && idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(marginX, y, contentWidth, rowH, 'FD');
        } else {
          doc.rect(marginX, y, contentWidth, rowH, 'D');
        }

        doc.text(brandLines, marginX + 3, y + 4.5);
        doc.text(genericLines, marginX + 37, y + 4.5);
        doc.text(doseLines, marginX + 75, y + 4.5);
        doc.text(dateLines, marginX + 113, y + 4.5);
        doc.text(indLines, marginX + 149, y + 4.5);
        y += rowH;
      });
    } else {
      doc.rect(marginX, y, contentWidth, 7, 'D');
      doc.setFont(fontFamily, 'italic'); doc.setFontSize(10); doc.setTextColor(100, 116, 139);
      doc.text('No suspected medications recorded.', pageWidth / 2, y + 5, { align: 'center' });
      y += 7;
    }
    y += 6;

    // 5. OTHER CONCURRENT (CONCOMITANT) MEDICATIONS TABLE
    const concomitantMedsList = Array.isArray(adr.concomitant_drugs) && adr.concomitant_drugs.length > 0 ? adr.concomitant_drugs : (Array.isArray(adr.concomitantMeds) ? adr.concomitantMeds : []);
    if (concomitantMedsList.length > 0) {
      ensureSpace(28);
      doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
      doc.text('5. Other Concurrent Medications', marginX + 1, y);
      y += 5;

      const drawConcomitantTableHeader = (atY) => {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.3);
        doc.rect(marginX, atY, contentWidth, 7, 'FD');

        doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
        doc.text('Medicine Name', marginX + 3, atY + 5);
        doc.text('Dose & Freq', marginX + 49, atY + 5);
        doc.text('Purpose', marginX + 93, atY + 5);
        doc.text('Therapy Dates', marginX + 137, atY + 5);
      };

      drawConcomitantTableHeader(y);
      y += 7;

      doc.setFont(fontFamily, 'normal'); doc.setFontSize(9.5); doc.setTextColor(15, 23, 42);
      concomitantMedsList.forEach((m, idx) => {
        const nameLines = doc.splitTextToSize(String(m.medicine_name || 'N/A'), 44);
        const doseLines = doc.splitTextToSize(`${m.dose || ''} (${m.frequency || ''})`.trim(), 42);
        const purpLines = doc.splitTextToSize(String(m.purpose || 'N/A'), 42);
        const startDateStr = formatDisplayDate(m.start_date);
        const stopDateStr = formatDisplayDate(m.stop_date);
        const dateLines = doc.splitTextToSize(`${startDateStr !== '—' ? startDateStr : '—'} to ${stopDateStr !== '—' ? stopDateStr : 'Ongoing'}`, 42);

        const maxLines = Math.max(nameLines.length, doseLines.length, purpLines.length, dateLines.length, 1);
        const rowH = Math.max(maxLines * 4.5 + 2, 7);

        if (ensureSpace(rowH)) {
          if (repeatTableHeader) {
            drawConcomitantTableHeader(y);
            y += 7;
          }
          doc.setFont(fontFamily, 'normal'); doc.setFontSize(9.5);
        }

        if (zebraStriping && idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(marginX, y, contentWidth, rowH, 'FD');
        } else {
          doc.rect(marginX, y, contentWidth, rowH, 'D');
        }

        doc.text(nameLines, marginX + 3, y + 4.5);
        doc.text(doseLines, marginX + 49, y + 4.5);
        doc.text(purpLines, marginX + 93, y + 4.5);
        doc.text(dateLines, marginX + 137, y + 4.5);
        y += rowH;
      });
      y += 6;
    }

    // 6. CLINICAL BACKGROUND & 7. REACTION ASSESSMENT
    ensureSpace(34);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('6. Clinical Background & 7. Reaction Assessment:', marginX + 1, y);
    y += 5;

    const adrEvalY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, adrEvalY, contentWidth, 32, 'FD');
    doc.line(marginX, adrEvalY + 8, marginX + contentWidth, adrEvalY + 8);
    doc.line(marginX, adrEvalY + 16, marginX + contentWidth, adrEvalY + 16);
    doc.line(marginX, adrEvalY + 24, marginX + contentWidth, adrEvalY + 24);

    doc.setFontSize(9.5);
    // Row 1: Drug Allergy History, Previous ADR History
    doc.setFont(fontFamily, 'normal'); doc.text('Allergy History: ', marginX + 2, adrEvalY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.drug_allergy_history || norm.demographics.allergyDrugs), marginX + 27, adrEvalY + 5.5, { maxWidth: 60 });

    doc.setFont(fontFamily, 'normal'); doc.text('Previous ADR: ', marginX + 94, adrEvalY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.previous_adr_history || 'None'), marginX + 118, adrEvalY + 5.5, { maxWidth: 60 });

    // Row 2: Severity, Seriousness, Outcome
    doc.setFont(fontFamily, 'normal'); doc.text('Severity Level: ', marginX + 2, adrEvalY + 13.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.reaction_severity || adr.reactionSeverity || 'Moderate'), marginX + 24, adrEvalY + 13.5, { maxWidth: 25 });

    doc.setFont(fontFamily, 'normal'); doc.text('Seriousness: ', marginX + 54, adrEvalY + 13.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.reaction_seriousness || adr.reactionSeriousness || 'Hospitalization'), marginX + 74, adrEvalY + 13.5, { maxWidth: 35 });

    doc.setFont(fontFamily, 'normal'); doc.text('Patient Outcome: ', marginX + 114, adrEvalY + 13.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.patient_outcome || adr.patientOutcome || 'Recovered'), marginX + 142, adrEvalY + 13.5, { maxWidth: 36 });

    // Row 3: Action Taken, Dechallenge, Rechallenge
    doc.setFont(fontFamily, 'normal'); doc.text('Action Taken: ', marginX + 2, adrEvalY + 21.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.action_taken_on_suspected_drug || 'Drug Withdrawn'), marginX + 24, adrEvalY + 21.5, { maxWidth: 45 });

    doc.setFont(fontFamily, 'normal'); doc.text('Dechallenge: ', marginX + 74, adrEvalY + 21.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.dechallenge_information || adr.dechallengeInfo || 'Positive'), marginX + 94, adrEvalY + 21.5, { maxWidth: 25 });

    doc.setFont(fontFamily, 'normal'); doc.text('Rechallenge: ', marginX + 124, adrEvalY + 21.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.rechallenge_information || adr.rechallengeInfo || 'Not Done'), marginX + 144, adrEvalY + 21.5, { maxWidth: 34 });

    // Row 4: Causality Assessment (Naranjo / WHO)
    doc.setFont(fontFamily, 'normal'); doc.text('Causality Assessment (Naranjo/WHO): ', marginX + 2, adrEvalY + 29.5);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(2, 132, 199);
    doc.text(String(adr.initial_causality_opinion || adr.naranjoCausality || 'Probable'), marginX + 65, adrEvalY + 29.5, { maxWidth: 110 });
    doc.setTextColor(15, 23, 42);

    y = adrEvalY + 38;

    // 8. REVIEW INFORMATION & REMARKS
    if (adr.student_remarks || adr.preceptor_review || adr.faculty_comments) {
      const remarksStr = [
        adr.student_remarks ? `Student Remarks: ${adr.student_remarks}` : null,
        adr.preceptor_review ? `Preceptor Review: ${adr.preceptor_review}` : null,
        adr.faculty_comments ? `Faculty Comments: ${adr.faculty_comments}` : null
      ].filter(Boolean).join('\n');
      drawSectionBox('8. Review Remarks & Observations:', remarksStr, 14);
    }
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

  // DIRECT PDF FILE DOWNLOAD PER FORM TYPE (Requirement 10)
  const cleanCaseId = String(norm.caseId).replace(/[^A-Za-z0-9_-]/g, '_');
  const formSuffix = selectedForm ? selectedForm.toUpperCase() : 'APPROVED_CASE';
  const outFileName = (selectedForm === 'all' || selectedForm === 'complete')
    ? `PHARMDVERSE_${cleanCaseId}_Approved_Case.pdf`
    : `PHARMDVERSE_${cleanCaseId}_${formSuffix}.pdf`;
  doc.save(outFileName);
};

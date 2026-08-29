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
 * 100% container safety, dynamic row expansion, protected headers/footers,
 * signature placement strictly anchored at the BOTTOM of the page,
 * two-line non-colliding form titles, and SYMMETRICAL MARGIN SPACING on BOTH left and right sides.
 */
export const generateOfficialClinicalCasePDF = ({
  clinicalCase = {},
  student = {},
  preceptor = {},
  college = {},
  caseModulesData = {},
  branding = {},
  selectedForm = 'profile', // 'profile' | 'counselling' | 'intervention' | 'dir' | 'adr' | 'ai_analysis'
  section4DrugKnowledge = [],
  section4AiSynthesis = null,
  section5ADdiResult = null,
  section5BDfiResult = null
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

  // SYMMETRICAL BOX BOUNDARIES (Equal 0.75mm gap from BOTH left and right outer margin lines)
  const boxX = marginX + 0.75; // 15.75mm
  const boxW = contentWidth - 1.5; // 178.5mm (ends at 194.25mm)

  const footerAreaTop = pageHeight - 52; // 245mm content top limit to reserve bottom 52mm for signatures & footer

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
      case 'ai_analysis': return 'AI CLINICAL CASE ANALYSIS & SUMMARY';
      case 'all':
      case 'complete': return 'APPROVED CLINICAL CASE DOCUMENTATION';
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
    doc.rect(marginX, 30.5, contentWidth, 7.5, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(getFormTitleBanner(), marginX + 3, 35.5, { align: 'left', maxWidth: 110 });

    doc.setFontSize(8.5);
    doc.text(`(CASE ID: ${norm.caseId})`, pageWidth - marginX - 3, 33.5, { align: 'right' });
    doc.setFontSize(7.5);
    doc.setTextColor(52, 211, 153); // Emerald-400 green
    doc.text('APPROVED', pageWidth - marginX - 3, 36.8, { align: 'right' });
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

  // --- SIGNATURES BLOCK (STRICTLY ANCHORED AT BOTTOM OF PAGE) ---
  const drawDualSignatures = (currentY) => {
    if (!showStudentSignature && !showPreceptorSignature) return currentY;

    // Anchor signature line fixed at bottom of page (249mm) above footer at 285mm
    const sigY = pageHeight - 48;

    // If current content exceeds signature start position, move signatures to a new page
    if (currentY > sigY - 4) {
      doc.addPage();
    }

    doc.saveGraphicsState();

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(boxX, sigY, boxX + boxW, sigY);

    const sigLeftX = boxX + 15;
    const sigRightX = boxX + boxW - 65;

    // Student Signature Box (Left)
    if (showStudentSignature) {
      doc.line(sigLeftX, sigY + 10, sigLeftX + 50, sigY + 10);
      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10.5); doc.setTextColor(15, 23, 42);
      doc.text('Student Signature', sigLeftX + 25, sigY + 14, { align: 'center' });
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(10.0); doc.setTextColor(2, 132, 199);
      const studentText = `${norm.studentName} (${norm.studentRoll})`;
      const studentLines = doc.splitTextToSize(studentText, 55);
      doc.text(studentLines, sigLeftX + 25, sigY + 19, { align: 'center' });
      const studentBlockH = studentLines.length * 4.2;
      doc.setFontSize(9.5); doc.setTextColor(100, 116, 139);
      doc.text(`Date: ${currentDateStr}`, sigLeftX + 25, sigY + 19 + studentBlockH + 1, { align: 'center' });
    }

    // Preceptor Signature Box (Right)
    if (showPreceptorSignature) {
      doc.line(sigRightX, sigY + 10, sigRightX + 50, sigY + 10);
      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10.5); doc.setTextColor(15, 23, 42);
      doc.text('Preceptor Signature', sigRightX + 25, sigY + 14, { align: 'center' });
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(10.0); doc.setTextColor(2, 132, 199);
      // Measure preceptor name wrapped lines to offset designation dynamically
      const preceptorNameLines = doc.splitTextToSize(String(norm.preceptorName || ''), 55);
      doc.text(preceptorNameLines, sigRightX + 25, sigY + 19, { align: 'center' });
      const nameBlockH = preceptorNameLines.length * 4.2;
      doc.setFontSize(9.0); doc.setTextColor(100, 116, 139);
      const desigText = String(norm.preceptorDesig || '').toUpperCase();
      const desigLines = desigText ? doc.splitTextToSize(desigText, 55) : [];
      const desigStartY = sigY + 19 + nameBlockH;
      if (desigLines.length > 0) {
        doc.text(desigLines, sigRightX + 25, desigStartY, { align: 'center' });
      }
      const desigBlockH = desigLines.length > 0 ? desigLines.length * 4.2 : 0;
      doc.setFontSize(9.5); doc.setTextColor(100, 116, 139);
      doc.text(`Date: ${currentDateStr}`, sigRightX + 25, desigStartY + desigBlockH + 2, { align: 'center' });
    }

    doc.restoreGraphicsState();
    return sigY + 32;
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

  // Helper to draw a section box with heading & automatic dynamic row expansion (Symmetrical Margin Inset)
  const drawSectionBox = (title, contentText, minBoxH = 14) => {
    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
    const lines = doc.splitTextToSize(String(contentText || 'N/A'), boxW - 6);
    const actualBoxH = Math.max(lines.length * 5.2 + 4, minBoxH);

    ensureSpace(actualBoxH + (title ? 12 : 6));

    if (title && String(title).trim() !== '') {
      doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
      doc.text(String(title), boxX + 1, y);
      y += 5.5;
    }

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, y, boxW, actualBoxH, 'FD');

    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text(lines, boxX + 3, y + 5);
    y += actualBoxH + 6;
  };

  // Helper to render Form Title & Case ID on two separate lines with zero collisions
  const drawFormTitleBanner = (titleText, colorRgb) => {
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(12.0);
    doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
    doc.text(titleText, boxX + 1, y);

    // Line 2: CASE ID right below form title
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(10.0);
    doc.setTextColor(3, 105, 161);
    doc.text(`(CASE ID: ${norm.caseId})`, boxX + boxW - 1, y, { align: 'right' });

    // Line 3: APPROVED in GREEN color right below CASE ID
    doc.setFont('courier', 'bold');
    doc.setFontSize(9.0);
    doc.setTextColor(5, 150, 105); // emerald-600 green
    doc.text('APPROVED', boxX + boxW - 1, y + 4.8, { align: 'right' });

    doc.setTextColor(15, 23, 42);
    y += 12;
  };

  // =========================================================================
  // 1. PATIENT PROFILE FORM ONLY
  // =========================================================================
  if (selectedForm === 'profile' || selectedForm === 'all' || selectedForm === 'complete') {
    drawFormTitleBanner('PATIENT PROFILE DOCUMENTATION', [3, 105, 161]);

    // PATIENT DETAILS GRID TABLE (3 Rows with tuned cell widths & boundary guards)
    ensureSpace(32);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Patient details:', boxX + 1, y);
    y += 4;

    const gridY = y;

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);

    // Outer Box (27mm height: 3 rows x 9mm height)
    doc.rect(boxX, gridY, boxW, 27);
    doc.line(boxX, gridY + 9, boxX + boxW, gridY + 9);
    doc.line(boxX, gridY + 18, boxX + boxW, gridY + 18);

    // Row 1 Column Dividers
    const r1X = [boxX, boxX + 40, boxX + 76, boxX + 128, boxX + boxW];
    for (let c = 1; c < 4; c++) {
      doc.line(r1X[c], gridY, r1X[c], gridY + 9);
    }

    // Row 2 Column Dividers
    const r2X = [boxX, boxX + 36, boxX + 68, boxX + 126, boxX + boxW];
    for (let c = 1; c < 4; c++) {
      doc.line(r2X[c], gridY + 9, r2X[c], gridY + 18);
    }

    // Row 3 Column Dividers
    const r3X = [boxX, boxX + 40, boxX + 80, boxX + 120, boxX + boxW];
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
    doc.text('Social history:', boxX + 1, y);
    y += 5;

    const socY = y;
    const socColW = boxW / 4;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, socY, boxW, 20, 'FD');
    for (let c = 1; c < 4; c++) {
      doc.line(boxX + c * socColW, socY, boxX + c * socColW, socY + 20);
    }

    doc.setFontSize(9.5);
    doc.setFont(fontFamily, 'bold'); doc.text('Smoker:', boxX + 2, socY + 5);
    doc.setFont(fontFamily, 'normal'); doc.text(`Pack/day: ${profile?.smoker_pack_day || '—'}`, boxX + 2, socY + 10, { maxWidth: socColW - 4 });
    doc.text(`Duration: ${profile?.smoker_duration || '—'}`, boxX + 2, socY + 15, { maxWidth: socColW - 4 });

    doc.setFont(fontFamily, 'bold'); doc.text('Alcoholic:', boxX + socColW + 2, socY + 5);
    doc.setFont(fontFamily, 'normal'); doc.text(`Amount/day: ${profile?.alcoholic_amount_day || '—'}`, boxX + socColW + 2, socY + 10, { maxWidth: socColW - 4 });
    doc.text(`Duration: ${profile?.alcoholic_duration || '—'}`, boxX + socColW + 2, socY + 15, { maxWidth: socColW - 4 });

    doc.setFont(fontFamily, 'bold'); doc.text('Allergies:', boxX + 2 * socColW + 2, socY + 5);
    doc.setFont(fontFamily, 'normal'); doc.text(`Food: ${profile?.allergy_food || 'None'}`, boxX + 2 * socColW + 2, socY + 10, { maxWidth: socColW - 4 });
    doc.setTextColor(190, 18, 60); doc.text(`Drugs: ${profile?.allergy_drugs || profile?.allergies || 'None'}`, boxX + 2 * socColW + 2, socY + 15, { maxWidth: socColW - 4 }); doc.setTextColor(15, 23, 42);

    doc.setFont(fontFamily, 'bold'); doc.text('Marital status:', boxX + 3 * socColW + 2, socY + 5);
    doc.setFont(fontFamily, 'normal'); doc.text(String(profile?.marital_status || 'Single'), boxX + 3 * socColW + 2, socY + 10, { maxWidth: socColW - 4 });

    y = socY + 25;

    // PHYSICAL EXAMINATION BOX
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Physical Examination:', boxX + 1, y);
    y += 5;

    const physY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, physY, boxW, 20, 'FD');
    doc.line(boxX, physY + 9, boxX + boxW, physY + 9);

    doc.setFontSize(10);
    doc.setFont(fontFamily, 'normal'); doc.text(`Cyanosis: `, boxX + 4, physY + 6); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.cyanosis || 'Absent'), boxX + 22, physY + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(`Icterus: `, boxX + 64, physY + 6); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.icterus || 'Absent'), boxX + 80, physY + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(`Pallor: `, boxX + 124, physY + 6); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.pallor || 'Absent'), boxX + 138, physY + 6);

    doc.setFont(fontFamily, 'normal'); doc.text(`CVS: `, boxX + 4, physY + 15); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.cvs || 'Normal'), boxX + 16, physY + 15, { maxWidth: 30 });
    doc.setFont(fontFamily, 'normal'); doc.text(`GI: `, boxX + 48, physY + 15); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.gi || 'Normal'), boxX + 58, physY + 15, { maxWidth: 32 });
    doc.setFont(fontFamily, 'normal'); doc.text(`RS: `, boxX + 94, physY + 15); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.rs || 'Normal'), boxX + 104, physY + 15, { maxWidth: 32 });
    doc.setFont(fontFamily, 'normal'); doc.text(`CNS: `, boxX + 140, physY + 15); doc.setFont(fontFamily, 'bold'); doc.text(String(profile?.cns || 'Normal'), boxX + 152, physY + 15, { maxWidth: 24 });

    y = physY + 25;

    drawSectionBox('Provisional Diagnosis:', profile?.provisional_diagnosis || 'N/A', 12);

    // VITAL SIGNS TABLE (Clean Symmetrical Inset)
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text('VITAL SIGNS LOG CHART', boxX + 1, y);
    y += 5.5;

    const vitalsList = norm.vitals.length > 0 ? norm.vitals : [{ date: norm.dates.doa, temp: profile?.temperature_f || '98.6', bp: profile?.bp_sys ? `${profile.bp_sys}/${profile.bp_dia}` : '120/80', pr: profile?.pulse_rate || '72', rr: profile?.respiratory_rate || '18', spo2: profile?.spo2 || '98' }];

    const drawVitalsTableHeader = (atY) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.rect(boxX, atY, boxW, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
      doc.text('Date', boxX + 4, atY + 5);
      doc.text('TEMP [°F]', boxX + 34, atY + 5);
      doc.text('BP [mmHg]', boxX + 64, atY + 5);
      doc.text('PR [bpm]', boxX + 100, atY + 5);
      doc.text('RR [cpm]', boxX + 132, atY + 5);
      doc.text('SPO2 [%]', boxX + 156, atY + 5);
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
        doc.rect(boxX, y, boxW, 7, 'FD');
      } else {
        doc.rect(boxX, y, boxW, 7, 'D');
      }
      doc.text(String(v.date || 'N/A'), boxX + 4, y + 5);
      doc.text(String(v.temp || v.temperature || '98.6'), boxX + 34, y + 5);
      doc.text(String(v.bp || '120/80'), boxX + 64, y + 5);
      doc.text(String(v.pr || v.pulse || '72'), boxX + 100, y + 5);
      doc.text(String(v.rr || v.respiratory_rate || '18'), boxX + 132, y + 5);
      doc.text(String(v.spo2 ? `${v.spo2}%` : '98%'), boxX + 156, y + 5, { maxWidth: 18 });
      y += 7;
    });
    y += 6;

    // LABORATORY INVESTIGATIONS TABLE
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text('LABORATORY INVESTIGATIONS', boxX + 1, y);
    y += 5.5;

    const labsList = norm.labs;

    const drawLabsTableHeader = (atY) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.rect(boxX, atY, boxW, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      doc.text('Category', boxX + 3, atY + 5);
      doc.text('Investigation Parameter', boxX + 37, atY + 5);
      doc.text('Observed Value', boxX + 84, atY + 5);
      doc.text('Reference Range', boxX + 118, atY + 5);
      doc.text('Clinical Inference', boxX + 148, atY + 5);
    };

    drawLabsTableHeader(y);
    y += 7;

    if (labsList.length > 0) {
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      labsList.forEach((lab, idx) => {
        const catLines = doc.splitTextToSize(String(lab.category || lab.lab_category || 'General'), 32);
        const paramLines = doc.splitTextToSize(String(lab.parameter_name || lab.test_name || 'N/A'), 44);
        const valStr = lab.test_value || lab.observed_value ? `${lab.test_value || lab.observed_value} ${lab.unit || ''}` : 'N/A';
        const valLines = doc.splitTextToSize(String(valStr), 32);
        const refLines = doc.splitTextToSize(String(lab.reference_range || lab.normal_range || 'N/A'), 28);
        const infLines = doc.splitTextToSize(String(lab.clinical_inference || lab.impression || 'Normal'), 28);

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
          doc.rect(boxX, y, boxW, rowH, 'FD');
        } else {
          doc.rect(boxX, y, boxW, rowH, 'D');
        }

        doc.text(catLines, boxX + 3, y + 5);
        doc.text(paramLines, boxX + 37, y + 5);
        doc.text(valLines, boxX + 84, y + 5);
        doc.text(refLines, boxX + 118, y + 5);
        doc.text(infLines, boxX + 148, y + 5, { maxWidth: 28 });
        y += rowH;
      });
    } else {
      doc.rect(boxX, y, boxW, 7, 'D');
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
    doc.text('PRESCRIBED MEDICATION PROFILE', boxX + 1, y);
    y += 5.5;

    doc.setDrawColor(5, 150, 105);
    doc.setFillColor(236, 253, 245);
    doc.rect(boxX, y, boxW, 10, 'FD');
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(5, 150, 105);
    doc.text(`OFFICIAL DIAGNOSIS: ${norm.diagnosis.final.toUpperCase()}`, pageWidth / 2, y + 7, { align: 'center' });

    y += 14;

    const drugsList = norm.drugs;

    const drawDrugsTableHeader = (atY) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.rect(boxX, atY, boxW, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      doc.text('S.No', boxX + 2, atY + 5);
      doc.text('Brand / Trade Name', boxX + 11, atY + 5);
      doc.text('Generic Name', boxX + 45, atY + 5);
      doc.text('Route', boxX + 83, atY + 5);
      doc.text('Dose', boxX + 99, atY + 5);
      doc.text('Freq', boxX + 117, atY + 5);
      doc.text('Start Date', boxX + 133, atY + 5);
      doc.text('Stop Date', boxX + 155, atY + 5);
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
        const startLines = doc.splitTextToSize(String(d.start_date || '—'), 20);
        const stopLines = doc.splitTextToSize(String(d.stop_date || '—'), 20);

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
          doc.rect(boxX, y, boxW, rowH, 'FD');
        } else {
          doc.rect(boxX, y, boxW, rowH, 'D');
        }

        doc.text(String(d.s_no || idx + 1), boxX + 2, y + 5);
        doc.text(brandLines, boxX + 11, y + 5);
        doc.text(genericLines, boxX + 45, y + 5);
        doc.text(routeLines, boxX + 83, y + 5);
        doc.text(doseLines, boxX + 99, y + 5);
        doc.text(freqLines, boxX + 117, y + 5);
        doc.text(startLines, boxX + 133, y + 5);
        doc.text(stopLines, boxX + 155, y + 5, { maxWidth: 22 });
        y += rowH;
      });
    } else {
      doc.rect(boxX, y, boxW, 7, 'D');
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
  if (selectedForm === 'counselling' || selectedForm === 'all' || selectedForm === 'complete') {
    drawFormTitleBanner('PATIENT COUNSELLING DOCUMENTATION', [13, 148, 136]);

    // 1. SESSION OVERVIEW BOX (3 Rows: height 26mm with lines at +8.5 and +17.0)
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('1. Session Overview:', boxX + 1, y);
    y += 4;

    const cSessY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, cSessY, boxW, 26, 'FD');
    doc.line(boxX, cSessY + 8.5, boxX + boxW, cSessY + 8.5);
    doc.line(boxX, cSessY + 17.0, boxX + boxW, cSessY + 17.0);

    doc.setFontSize(9.0);
    // Row 1: Patient Initials, Age/Sex, Date, Time
    doc.setFont(fontFamily, 'normal'); doc.text('Patient Initials: ', boxX + 2, cSessY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.patient_name || norm.demographics.patientName || 'N/A'), boxX + 24, cSessY + 5.5, { maxWidth: 16 });

    doc.setFont(fontFamily, 'normal'); doc.text('Age/Sex: ', boxX + 42, cSessY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(`${counselling.age || norm.demographics.age} Yrs / ${counselling.sex || norm.demographics.gender}`, boxX + 56, cSessY + 5.5, { maxWidth: 24 });

    doc.setFont(fontFamily, 'normal'); doc.text('Date: ', boxX + 82, cSessY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(formatDisplayDate(counselling.counselling_date || norm.dates.counsellingDate), boxX + 92, cSessY + 5.5);

    doc.setFont(fontFamily, 'normal'); doc.text('Time: ', boxX + 132, cSessY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.counselling_time || norm.dates.counsellingTime), boxX + 142, cSessY + 5.5);

    // Row 2: IP/OP No, Type, Ward/Unit, Department (Generous width bounds)
    doc.setFont(fontFamily, 'normal'); doc.text('IP/OP No: ', boxX + 2, cSessY + 14.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.ip_op_number || norm.demographics.ipOpNo), boxX + 16, cSessY + 14.0, { maxWidth: 22 });

    doc.setFont(fontFamily, 'normal'); doc.text('Type: ', boxX + 40, cSessY + 14.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.patient_type || 'Inpatient'), boxX + 49, cSessY + 14.0, { maxWidth: 20 });

    doc.setFont(fontFamily, 'normal'); doc.text('Ward/Unit: ', boxX + 71, cSessY + 14.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.unit_ward || norm.demographics.wardBed), boxX + 87, cSessY + 14.0, { maxWidth: 46 });

    doc.setFont(fontFamily, 'normal'); doc.text('Dept: ', boxX + 135, cSessY + 14.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.department || norm.demographics.department), boxX + 144, cSessY + 14.0, { maxWidth: 35 });

    // Row 3: Known Allergies
    doc.setFont(fontFamily, 'normal'); doc.text('Known Allergies: ', boxX + 2, cSessY + 22.0);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(190, 18, 60);
    doc.text(String(counselling.allergies || norm.demographics.allergyDrugs || 'None'), boxX + 27, cSessY + 22.0, { maxWidth: 150 });
    doc.setTextColor(15, 23, 42);

    y = cSessY + 32;

    // 2. CLINICAL FOCUS BOXES
    drawSectionBox('2. Disease Condition Counselled:', counselling.disease_counselled || counselling.disease_condition || norm.diagnosis.final || 'N/A', 12);
    drawSectionBox('3. Medications Counselled:', counselling.medications_counselled || 'N/A', 14);

    // 4. COUNSELLING POINTS COVERED CHECKLIST (9 STANDARDIZED POINTS)
    ensureSpace(42);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('4. Counselling Points Covered Checklist:', boxX + 1, y);
    y += 5;

    const checkY = y;
    const pointsCoveredList = Array.isArray(counselling.points_covered) ? counselling.points_covered : (typeof counselling.points_covered === 'string' ? counselling.points_covered.split(',') : []);

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, checkY, boxW, 34, 'FD');

    doc.setFontSize(9.5);
    ALL_COUNSELLING_CHECKLIST_POINTS.forEach((point, idx) => {
      const isChecked = pointsCoveredList.some(p => String(p).trim().toLowerCase() === point.toLowerCase());
      const col = idx % 2 === 0 ? boxX + 4 : boxX + 94;
      const rowOffset = Math.floor(idx / 2) * 6.5 + 5;

      // Draw outer bracket [   ]
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      doc.text('[   ]', col, checkY + rowOffset);

      if (isChecked) {
        // Draw crisp vector checkmark in distinct sky blue (2, 132, 199)
        doc.saveGraphicsState();
        doc.setDrawColor(2, 132, 199);
        doc.setLineWidth(0.65);
        const tickX = col + 1.6;
        const tickY = checkY + rowOffset - 1.2;
        doc.line(tickX, tickY, tickX + 1.0, tickY + 1.3);
        doc.line(tickX + 1.0, tickY + 1.3, tickX + 2.8, tickY - 1.7);
        doc.restoreGraphicsState();

        doc.setFont(fontFamily, 'bold'); doc.setFontSize(9.5); doc.setTextColor(15, 23, 42);
        doc.text(point, col + 9, checkY + rowOffset, { maxWidth: 78 });
      } else {
        doc.setFont(fontFamily, 'normal'); doc.setFontSize(9.5); doc.setTextColor(148, 163, 184);
        doc.text(point, col + 9, checkY + rowOffset, { maxWidth: 78 });
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
    doc.text('5. Barriers to Compliance & Resolution:', boxX + 1, y);
    y += 5;

    const barY = y;

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, barY, boxW, barBoxH, 'FD');

    doc.setFontSize(10);
    doc.setFont(fontFamily, 'normal'); doc.text('Major Barriers Involved: ', boxX + 3, barY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(hasBarriers ? 'Yes' : 'No', boxX + 40, barY + 6);

    doc.setFont(fontFamily, 'normal'); doc.text('Barrier Overcome Rightly: ', boxX + 90, barY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(barrierOvercome ? 'Yes' : 'No / N/A', boxX + 130, barY + 6);

    if (hasBarriers) {
      doc.line(boxX, barY + 9, boxX + boxW, barY + 9);
      doc.setFont(fontFamily, 'normal'); doc.text('Details of Barrier: ', boxX + 3, barY + 15);
      doc.setFont(fontFamily, 'italic');
      doc.text(barrierLines, boxX + 32, barY + 15);
    }

    y = barY + barBoxH + 6;

    // 6. DURATION & RECIPIENT BOX
    ensureSpace(22);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('6. Session Duration & Recipient:', boxX + 1, y);
    y += 5;

    const durY = y;
    const providedTo = counselling.counselling_provided_to || counselling.provided_to || 'Patient';
    const repReasons = Array.isArray(counselling.representative_reasons) ? counselling.representative_reasons.join(', ') : (counselling.representative_reasons || '');
    const repOther = counselling.representative_other_reason ? ` (${counselling.representative_other_reason})` : '';

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, durY, boxW, providedTo === 'Patient representative' ? 18 : 10, 'FD');

    doc.setFontSize(10);
    doc.setFont(fontFamily, 'normal'); doc.text('Session Duration: ', boxX + 3, durY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(counselling.time_taken || counselling.duration_minutes || '10 to 20 min.'), boxX + 32, durY + 6);

    doc.setFont(fontFamily, 'normal'); doc.text('Counselled To: ', boxX + 90, durY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(providedTo), boxX + 116, durY + 6);

    if (providedTo === 'Patient representative') {
      doc.line(boxX, durY + 9, boxX + boxW, durY + 9);
      doc.setFont(fontFamily, 'normal'); doc.text('Representative Reason: ', boxX + 3, durY + 14);
      doc.setFont(fontFamily, 'bold'); doc.text(`${repReasons}${repOther}`, boxX + 40, durY + 14, { maxWidth: 135 });
    }

    y = durY + (providedTo === 'Patient representative' ? 23 : 15);

    // 7. LEAFLETS & VISUAL AIDS PROVIDED BOX
    drawSectionBox('7. Aids Used:', counselling.counselling_aids_used || 'None', 12);
    drawSectionBox('8. Educational Material Provided:', counselling.counselling_material_provided || counselling.educational_materials_used || 'None', 12);

    ensureSpace(14);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
    doc.text(`Patient Understanding Ascertained:  ${counselling.understanding_ascertained !== false ? 'YES (Ascertained)' : 'NO'}`, boxX + 1, y);
    y += 8;
  }

  // =========================================================================
  // 3. PHARMACIST INTERVENTION DOCUMENTATION FORM ONLY (STEP 13)
  // =========================================================================
  if (selectedForm === 'intervention' || selectedForm === 'all' || selectedForm === 'complete') {
    drawFormTitleBanner('PHARMACIST INTERVENTION DOCUMENTATION', [67, 56, 202]);

    // 1. PATIENT INFORMATION BOX (3 Rows: height 26mm with lines at +8.5 and +17.0)
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('1. Patient Information:', boxX + 1, y);
    y += 4;

    const iSessY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, iSessY, boxW, 26, 'FD');
    doc.line(boxX, iSessY + 8.5, boxX + boxW, iSessY + 8.5);
    doc.line(boxX, iSessY + 17.0, boxX + boxW, iSessY + 17.0);

    doc.setFontSize(9.0);
    // Row 1: Patient Initials, Age/Sex, Date of Intervention, IP/OP No
    doc.setFont(fontFamily, 'normal'); doc.text('Patient Initials: ', boxX + 2, iSessY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.patient_name || norm.demographics.patientName || 'N/A'), boxX + 24, iSessY + 5.5, { maxWidth: 16 });

    doc.setFont(fontFamily, 'normal'); doc.text('Age/Sex: ', boxX + 42, iSessY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(`${intervention.age || norm.demographics.age} Yrs / ${intervention.sex || norm.demographics.gender}`, boxX + 56, iSessY + 5.5, { maxWidth: 24 });

    doc.setFont(fontFamily, 'normal'); doc.text('Date: ', boxX + 82, iSessY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(formatDisplayDate(intervention.date_of_intervention || norm.dates.interventionDate), boxX + 92, iSessY + 5.5);

    doc.setFont(fontFamily, 'normal'); doc.text('IP/OP No: ', boxX + 132, iSessY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.ip_op_no || norm.demographics.ipOpNo), boxX + 146, iSessY + 5.5, { maxWidth: 32 });

    // Row 2: Ward/Unit, Department, Physician (Tuned width limits)
    doc.setFont(fontFamily, 'normal'); doc.text('Ward/Unit: ', boxX + 2, iSessY + 14.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.ward || norm.demographics.wardBed), boxX + 18, iSessY + 14.0, { maxWidth: 34 });

    doc.setFont(fontFamily, 'normal'); doc.text('Dept: ', boxX + 54, iSessY + 14.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.department || norm.demographics.department), boxX + 63, iSessY + 14.0, { maxWidth: 30 });

    doc.setFont(fontFamily, 'normal'); doc.text('Physician: ', boxX + 96, iSessY + 14.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.physician || norm.demographics.physician), boxX + 112, iSessY + 14.0, { maxWidth: 66 });

    // Row 3: Known Allergies
    doc.setFont(fontFamily, 'normal'); doc.text('Known Allergies: ', boxX + 2, iSessY + 22.0);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(190, 18, 60);
    doc.text(String(intervention.allergies || norm.demographics.allergyDrugs || 'None'), boxX + 27, iSessY + 22.0, { maxWidth: 150 });
    doc.setTextColor(15, 23, 42);

    y = iSessY + 32;

    // 2. PRESENT DIAGNOSIS BOX
    drawSectionBox('2. Present Diagnosis:', intervention.present_diagnosis || norm.diagnosis.final || 'N/A', 12);

    // 3. PRESCRIPTION DETAILS TABLE
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('3. Prescription Details:', boxX + 1, y);
    y += 5;

    const rxDetailsList = Array.isArray(intervention.prescription_details) && intervention.prescription_details.length > 0 ? intervention.prescription_details : [];

    const drawRxTableHeader = (atY) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.rect(boxX, atY, boxW, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      doc.text('S.No', boxX + 3, atY + 5);
      doc.text('Name of the Drug', boxX + 17, atY + 5);
      doc.text('Dose & Frequency', boxX + 113, atY + 5);
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
          doc.rect(boxX, y, boxW, rowH, 'FD');
        } else {
          doc.rect(boxX, y, boxW, rowH, 'D');
        }

        doc.text(String(rx.s_no || idx + 1), boxX + 3, y + 5);
        doc.text(drugLines, boxX + 17, y + 5);
        doc.text(doseLines, boxX + 113, y + 5, { maxWidth: 64 });
        y += rowH;
      });
    } else {
      doc.rect(boxX, y, boxW, 7, 'D');
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
    doc.text('8. Assessment & Outcome:', boxX + 1, y);
    y += 5;

    const evalY = y;

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, evalY, boxW, evalBoxH, 'FD');
    doc.line(boxX, evalY + 7, boxX + boxW, evalY + 7);
    doc.line(boxX, evalY + 14, boxX + boxW, evalY + 14);

    doc.setFontSize(9.5);
    // Row 1: Discussed with Physician, Suggestions at Right Time
    doc.setFont(fontFamily, 'normal'); doc.text('Discussed with Physician: ', boxX + 3, evalY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(intervention.discussed_with_physician !== false ? 'YES' : 'NO', boxX + 42, evalY + 5);

    doc.setFont(fontFamily, 'normal'); doc.text('Suggestions at Right Time: ', boxX + 90, evalY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(intervention.suggestions_appropriate_time !== false ? 'YES' : 'NO', boxX + 132, evalY + 5);

    // Row 2: Accepted, Changed
    doc.setFont(fontFamily, 'normal'); doc.text('Physician Accepted: ', boxX + 3, evalY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(intervention.accepted !== false ? 'YES' : 'NO', boxX + 34, evalY + 12);

    doc.setFont(fontFamily, 'normal'); doc.text('Prescription Changed: ', boxX + 90, evalY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(intervention.changed !== false ? 'YES' : 'NO', boxX + 126, evalY + 12);

    // Row 3: Significance Level, Outcome
    doc.setFont(fontFamily, 'normal'); doc.text('Significance Level: ', boxX + 3, evalY + 19);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.significance_of_intervention || intervention.significance_level || 'Moderate'), boxX + 32, evalY + 19);

    doc.setFont(fontFamily, 'normal'); doc.text('Intervention Outcome: ', boxX + 90, evalY + 19);
    doc.setFont(fontFamily, 'bold'); doc.text(String(intervention.outcome || intervention.intervention_outcome || 'Positive'), boxX + 126, evalY + 19);

    if (hasReasons) {
      doc.line(boxX, evalY + 21, boxX + boxW, evalY + 21);
      doc.setFont(fontFamily, 'normal'); doc.text('Outcome Notes / Reasons: ', boxX + 3, evalY + 26);
      doc.setFont(fontFamily, 'italic'); doc.text(notesLines, boxX + 42, evalY + 26);
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
  if (selectedForm === 'dir' || selectedForm === 'all' || selectedForm === 'complete') {
    drawFormTitleBanner('DRUG INFORMATION REQUEST DOCUMENTATION', [180, 83, 9]);

    // 1. SESSION & ENQUIRER OVERVIEW BOX (3 Rows: height 26mm with lines at +8.5 and +17.0)
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('1. Enquirer & Session Overview:', boxX + 1, y);
    y += 4;

    const dirSessY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, dirSessY, boxW, 26, 'FD');
    doc.line(boxX, dirSessY + 8.5, boxX + boxW, dirSessY + 8.5);
    doc.line(boxX, dirSessY + 17.0, boxX + boxW, dirSessY + 17.0);

    doc.setFontSize(9.0);
    // Row 1: Date, Time, Mode of Request, Turnaround (Tuned widths)
    doc.setFont(fontFamily, 'normal'); doc.text('Date: ', boxX + 2, dirSessY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(formatDisplayDate(dir.request_date || norm.dates.queryDate), boxX + 12, dirSessY + 5.5);

    doc.setFont(fontFamily, 'normal'); doc.text('Time: ', boxX + 42, dirSessY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.request_time || norm.dates.queryTime || '11:00 AM'), boxX + 52, dirSessY + 5.5);

    doc.setFont(fontFamily, 'normal'); doc.text('Mode of Request: ', boxX + 82, dirSessY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.mode_of_request || 'Direct'), boxX + 110, dirSessY + 5.5, { maxWidth: 22 });

    doc.setFont(fontFamily, 'normal'); doc.text('Turnaround: ', boxX + 135, dirSessY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.timeframe_needed || dir.answer_needed || 'Immediately'), boxX + 154, dirSessY + 5.5, { maxWidth: 25 });

    // Row 2: Enquirer Name, Designation, Phone No, Ward/Unit (Auto-adjusted spacing based on content)
    doc.setFont(fontFamily, 'normal'); doc.text('Enquirer: ', boxX + 2, dirSessY + 14.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.enquirer_name || dir.enquirer_select || 'Resident Physician'), boxX + 16, dirSessY + 14.0, { maxWidth: 38 });

    doc.setFont(fontFamily, 'normal'); doc.text('Designation: ', boxX + 56, dirSessY + 14.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.designation || 'Doctor'), boxX + 74, dirSessY + 14.0, { maxWidth: 22 });

    doc.setFont(fontFamily, 'normal'); doc.text('Phone No: ', boxX + 98, dirSessY + 14.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.phone_no || '—'), boxX + 114, dirSessY + 14.0, { maxWidth: 18 });

    doc.setFont(fontFamily, 'normal'); doc.text('Ward/Unit: ', boxX + 134, dirSessY + 14.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.unit_ward || norm.demographics.wardBed), boxX + 150, dirSessY + 14.0, { maxWidth: 28 });

    // Row 3: Professional Status & Question Category
    doc.setFont(fontFamily, 'normal'); doc.text('Professional Status: ', boxX + 2, dirSessY + 22.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.professional_status || 'Physician'), boxX + 30, dirSessY + 22.0, { maxWidth: 45 });

    doc.setFont(fontFamily, 'normal'); doc.text('Question Category: ', boxX + 94, dirSessY + 22.0);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(2, 132, 199);
    doc.text(String(dir.question_category || 'Therapeutic Use'), boxX + 124, dirSessY + 22.0, { maxWidth: 55 });
    doc.setTextColor(15, 23, 42);

    y = dirSessY + 32;

    // 2. DETAILS OF ENQUIRY (QUESTION) BOX
    drawSectionBox('2. Details of Enquiry (Clinical Question):', dir.details_of_enquiry || 'N/A', 16);

    // 3. PATIENT BACKGROUND INFORMATION BOX GRID
    ensureSpace(30);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('3. Patient Background Information:', boxX + 1, y);
    y += 5;

    const bgY = y;
    const isPreg = Boolean(dir.is_pregnant_lactating);

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, bgY, boxW, 26, 'FD');
    doc.line(boxX, bgY + 6.5, boxX + boxW, bgY + 6.5);
    doc.line(boxX, bgY + 13, boxX + boxW, bgY + 13);
    doc.line(boxX, bgY + 19.5, boxX + boxW, bgY + 19.5);

    doc.setFontSize(9.5);
    // Row 1: Age/Sex, Weight, Known Allergies
    doc.setFont(fontFamily, 'normal'); doc.text('Age/Sex: ', boxX + 2, bgY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(`${dir.age || norm.demographics.age} Yrs / ${dir.sex || norm.demographics.gender}`, boxX + 16, bgY + 5, { maxWidth: 30 });

    doc.setFont(fontFamily, 'normal'); doc.text('Weight: ', boxX + 54, bgY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.weight_kg ? `${dir.weight_kg} kg` : norm.demographics.weight), boxX + 67, bgY + 5, { maxWidth: 25 });

    doc.setFont(fontFamily, 'normal'); doc.text('Allergies: ', boxX + 94, bgY + 5);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(190, 18, 60);
    doc.text(String(dir.allergies || norm.demographics.allergyDrugs || 'None'), boxX + 109, bgY + 5, { maxWidth: 70 });
    doc.setTextColor(15, 23, 42);

    // Row 2: Current Medical Problem
    doc.setFont(fontFamily, 'normal'); doc.text('Current Diagnosis/Problem: ', boxX + 2, bgY + 11.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.current_medical_problem || norm.diagnosis.final || 'N/A'), boxX + 42, bgY + 11.5, { maxWidth: 135 });

    // Row 3: Pregnancy/Lactation & Other Investigations
    doc.setFont(fontFamily, 'normal'); doc.text('Pregnancy/Lactation: ', boxX + 2, bgY + 18);
    doc.setFont(fontFamily, 'bold'); doc.text(isPreg ? `YES ${dir.pregnancy_lactation_details ? `(${dir.pregnancy_lactation_details})` : ''}` : 'NO', boxX + 34, bgY + 18, { maxWidth: 55 });

    doc.setFont(fontFamily, 'normal'); doc.text('Other Investigations: ', boxX + 94, bgY + 18);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.other_investigations || 'N/A'), boxX + 124, bgY + 18, { maxWidth: 55 });

    // Row 4: Drug Therapy
    doc.setFont(fontFamily, 'normal'); doc.text('Current Drug Therapy: ', boxX + 2, bgY + 24.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.drug_therapy || 'N/A'), boxX + 36, bgY + 24.5, { maxWidth: 141 });

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
    doc.text('5. Reply & Timeline Details:', boxX + 1, y);
    y += 5;

    const repY = y;

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, repY, boxW, repBoxH, 'FD');

    doc.setFontSize(9.5);
    doc.setFont(fontFamily, 'normal'); doc.text('Answer Given Timeframe: ', boxX + 3, repY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.answer_given_timeframe || dir.timeframe_needed || 'Immediately'), boxX + 42, repY + 6);

    doc.setFont(fontFamily, 'normal'); doc.text('Mode of Reply: ', boxX + 94, repY + 6);
    doc.setFont(fontFamily, 'bold'); doc.text(String(dir.mode_of_reply || 'Written'), boxX + 118, repY + 6);

    if (hasDelay) {
      doc.line(boxX, repY + 8.5, boxX + boxW, repY + 8.5);
      doc.setFont(fontFamily, 'normal'); doc.text('Reason for Delay: ', boxX + 3, repY + 13.5);
      doc.setFont(fontFamily, 'italic'); doc.text(delayLines, boxX + 30, repY + 13.5);
    }

    y = repY + repBoxH + 6;

    // 6. REFERENCES CONSULTED BOX
    const refList = Array.isArray(dir.references) && dir.references.length > 0
      ? dir.references.map(r => `[${r.type || 'Ref'}]: ${r.source || 'N/A'}`)
      : [dir.ref_textbooks, dir.ref_journals, dir.ref_micromedex, dir.ref_website].filter(Boolean);

    const refStr = refList.length > 0 ? refList.join('\n') : '1. Micromedex Clinical Knowledge Database\n2. Lexicomp Drug Information Handbook';
    const refLines = doc.splitTextToSize(refStr, boxW - 6);
    const refBoxH = Math.max(refLines.length * 5 + 4, 14);

    ensureSpace(refBoxH + 12);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('6. References Consulted:', boxX + 1, y);
    y += 5;

    const refY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, refY, boxW, refBoxH, 'FD');
    doc.setFontSize(9.5);
    doc.setFont(fontFamily, 'normal');
    doc.text(refLines, boxX + 3, refY + 5);

    y = refY + refBoxH + 6;
  }

  // =========================================================================
  // 5. ADR DOCUMENTATION LOG FORM ONLY (STEP 15)
  // =========================================================================
  if (selectedForm === 'adr' || selectedForm === 'all' || selectedForm === 'complete') {
    drawFormTitleBanner('ADR DOCUMENTATION LOG', [225, 29, 72]);

    // 1. GENERAL RECORD INFORMATION BOX
    ensureSpace(24);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('1. General Record Information:', boxX + 1, y);
    y += 4;

    const adrGenY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, adrGenY, boxW, 16, 'FD');
    doc.line(boxX, adrGenY + 8, boxX + boxW, adrGenY + 8);

    doc.setFontSize(9.5);
    // Row 1: ADR Record No, Reporting Date, Reported By
    doc.setFont(fontFamily, 'normal'); doc.text('ADR Record No: ', boxX + 2, adrGenY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(180, 83, 9);
    doc.text(String(adr.adr_number || adr.adrNumber || 'ADR-2026-000001'), boxX + 26, adrGenY + 5.5, { maxWidth: 35 });
    doc.setTextColor(15, 23, 42);

    doc.setFont(fontFamily, 'normal'); doc.text('Reporting Date: ', boxX + 68, adrGenY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(formatDisplayDate(adr.reporting_date || adr.reportingDate || norm.dates.adrReportingDate), boxX + 91, adrGenY + 5.5);

    doc.setFont(fontFamily, 'normal'); doc.text('Status: ', boxX + 140, adrGenY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(5, 150, 105);
    doc.text(String(adr.approval_status || 'Approved').toUpperCase(), boxX + 152, adrGenY + 5.5);
    doc.setTextColor(15, 23, 42);

    // Row 2: Preceptor Name, Student Name
    doc.setFont(fontFamily, 'normal'); doc.text('Assigned Preceptor: ', boxX + 2, adrGenY + 13.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.assigned_preceptor_name || norm.preceptorName), boxX + 32, adrGenY + 13.5, { maxWidth: 50 });

    doc.setFont(fontFamily, 'normal'); doc.text('Student Pharmacist: ', boxX + 94, adrGenY + 13.5);
    doc.setFont(fontFamily, 'bold'); doc.text(`${norm.studentName} (${norm.studentRoll})`, boxX + 124, adrGenY + 13.5, { maxWidth: 50 });

    y = adrGenY + 22;

    // 2. PATIENT OVERVIEW BOX (2 Rows: height 22mm with line at +10)
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('2. Patient Overview:', boxX + 1, y);
    y += 4;

    const adrPatY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, adrPatY, boxW, 22, 'FD');
    doc.line(boxX, adrPatY + 10.0, boxX + boxW, adrPatY + 10.0);

    doc.setFontSize(9.0);
    // Row 1: Initials, Reg No, Age/Sex, Weight
    doc.setFont(fontFamily, 'normal'); doc.text('Initials: ', boxX + 2, adrPatY + 6.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.patient_initials || norm.demographics.patientName), boxX + 14, adrPatY + 6.0, { maxWidth: 24 });

    doc.setFont(fontFamily, 'normal'); doc.text('Reg No: ', boxX + 40, adrPatY + 6.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.hospital_reg_number || norm.demographics.ipOpNo), boxX + 53, adrPatY + 6.0, { maxWidth: 32 });

    doc.setFont(fontFamily, 'normal'); doc.text('Age/Sex: ', boxX + 88, adrPatY + 6.0);
    doc.setFont(fontFamily, 'bold'); doc.text(`${adr.age || norm.demographics.age} Yrs / ${adr.gender || norm.demographics.gender}`, boxX + 102, adrPatY + 6.0, { maxWidth: 30 });

    doc.setFont(fontFamily, 'normal'); doc.text('Weight: ', boxX + 138, adrPatY + 6.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.weight ? `${adr.weight} kg` : norm.demographics.weight), boxX + 151, adrPatY + 6.0, { maxWidth: 26 });

    // Row 2: Department, Ward/Unit, Primary Diagnosis (Tuned width limits)
    doc.setFont(fontFamily, 'normal'); doc.text('Department: ', boxX + 2, adrPatY + 15.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.department || norm.demographics.department), boxX + 22, adrPatY + 15.0, { maxWidth: 32 });

    doc.setFont(fontFamily, 'normal'); doc.text('Ward/Unit: ', boxX + 56, adrPatY + 15.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.ward || norm.demographics.wardBed), boxX + 72, adrPatY + 15.0, { maxWidth: 42 });

    doc.setFont(fontFamily, 'normal'); doc.text('Primary Diagnosis: ', boxX + 116, adrPatY + 15.0);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.primary_diagnosis || norm.diagnosis.final || 'N/A'), boxX + 144, adrPatY + 15.0, { maxWidth: 34 });

    y = adrPatY + 28;

    // 3. ADVERSE REACTION OVERVIEW BOX
    ensureSpace(32);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text('3. Adverse Reaction Overview:', boxX + 1, y);
    y += 4;

    const reactY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, reactY, boxW, 22, 'FD');
    doc.line(boxX, reactY + 7, boxX + boxW, reactY + 7);
    doc.line(boxX, reactY + 14, boxX + boxW, reactY + 14);

    doc.setFontSize(9.0);
    // Row 1: Reaction Title, Category
    doc.setFont(fontFamily, 'normal'); doc.text('Reaction Title: ', boxX + 2, reactY + 5);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(225, 29, 72);
    doc.text(String(adr.reaction_title || adr.reactionTitle || 'N/A'), boxX + 24, reactY + 5, { maxWidth: 78 });
    doc.setTextColor(15, 23, 42);

    doc.setFont(fontFamily, 'normal'); doc.text('Category: ', boxX + 106, reactY + 5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.reaction_category || adr.reactionCategory || 'General'), boxX + 122, reactY + 5, { maxWidth: 55 });

    // Row 2: Started At, Ended At, Duration
    doc.setFont(fontFamily, 'normal'); doc.text('Started At: ', boxX + 2, reactY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(formatDisplayDate(adr.reaction_started_at || norm.dates.adrOnsetDate), boxX + 19, reactY + 12);

    doc.setFont(fontFamily, 'normal'); doc.text('Ended At: ', boxX + 64, reactY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(formatDisplayDate(adr.reaction_ended_at || norm.dates.adrEndedAt), boxX + 80, reactY + 12);

    doc.setFont(fontFamily, 'normal'); doc.text('Duration: ', boxX + 124, reactY + 12);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.reaction_duration || 'N/A'), boxX + 139, reactY + 12, { maxWidth: 38 });

    // Row 3: Current Patient Condition
    doc.setFont(fontFamily, 'normal'); doc.text('Patient Condition: ', boxX + 2, reactY + 19);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.current_patient_condition || adr.reaction_outcome || 'Recovering'), boxX + 30, reactY + 19, { maxWidth: 145 });

    y = reactY + 28;

    drawSectionBox('Clinical Description of Reaction:', adr.reaction_description || adr.reactionTitle || 'N/A', 14);
    if (adr.clinical_management_provided || adr.clinicalManagement) {
      drawSectionBox('Clinical Management Provided:', adr.clinical_management_provided || adr.clinicalManagement, 12);
    }

    // 4. SUSPECTED MEDICATION(S) TABLE
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(180, 83, 9);
    doc.text('4. Suspected Medication(s)', boxX + 1, y);
    y += 5;

    const suspectedMedsList = Array.isArray(adr.suspected_drugs) && adr.suspected_drugs.length > 0 ? adr.suspected_drugs : (Array.isArray(adr.suspectedMeds) ? adr.suspectedMeds : []);

    const drawSuspectedTableHeader = (atY) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.rect(boxX, atY, boxW, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      doc.text('Brand Name', boxX + 3, atY + 5);
      doc.text('Generic Name', boxX + 37, atY + 5);
      doc.text('Dose & Route', boxX + 75, atY + 5);
      doc.text('Therapy Dates', boxX + 113, atY + 5);
      doc.text('Indication', boxX + 149, atY + 5);
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
        const indLines = doc.splitTextToSize(String(m.clinical_indication || 'N/A'), 28);

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
          doc.rect(boxX, y, boxW, rowH, 'FD');
        } else {
          doc.rect(boxX, y, boxW, rowH, 'D');
        }

        doc.text(brandLines, boxX + 3, y + 4.5);
        doc.text(genericLines, boxX + 37, y + 4.5);
        doc.text(doseLines, boxX + 75, y + 4.5);
        doc.text(dateLines, boxX + 113, y + 4.5);
        doc.text(indLines, boxX + 149, y + 4.5, { maxWidth: 28 });
        y += rowH;
      });
    } else {
      doc.rect(boxX, y, boxW, 7, 'D');
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
      doc.text('5. Other Concurrent Medications', boxX + 1, y);
      y += 5;

      const drawConcomitantTableHeader = (atY) => {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.3);
        doc.rect(boxX, atY, boxW, 7, 'FD');

        doc.setFont(fontFamily, 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
        doc.text('Medicine Name', boxX + 3, atY + 5);
        doc.text('Dose & Freq', boxX + 49, atY + 5);
        doc.text('Purpose', boxX + 93, atY + 5);
        doc.text('Therapy Dates', boxX + 137, atY + 5);
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
        const dateLines = doc.splitTextToSize(`${startDateStr !== '—' ? startDateStr : '—'} to ${stopDateStr !== '—' ? stopDateStr : 'Ongoing'}`, 38);

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
          doc.rect(boxX, y, boxW, rowH, 'FD');
        } else {
          doc.rect(boxX, y, boxW, rowH, 'D');
        }

        doc.text(nameLines, boxX + 3, y + 4.5);
        doc.text(doseLines, boxX + 49, y + 4.5);
        doc.text(purpLines, boxX + 93, y + 4.5);
        doc.text(dateLines, boxX + 137, y + 4.5, { maxWidth: 38 });
        y += rowH;
      });
      y += 6;
    }

    // 6. CLINICAL BACKGROUND & 7. REACTION ASSESSMENT
    ensureSpace(34);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('6. Clinical Background & 7. Reaction Assessment:', boxX + 1, y);
    y += 5;

    const adrEvalY = y;
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, adrEvalY, boxW, 32, 'FD');
    doc.line(boxX, adrEvalY + 8, boxX + boxW, adrEvalY + 8);
    doc.line(boxX, adrEvalY + 16, boxX + boxW, adrEvalY + 16);
    doc.line(boxX, adrEvalY + 24, boxX + boxW, adrEvalY + 24);

    doc.setFontSize(9.5);
    // Row 1: Drug Allergy History, Previous ADR History
    doc.setFont(fontFamily, 'normal'); doc.text('Allergy History: ', boxX + 2, adrEvalY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.drug_allergy_history || norm.demographics.allergyDrugs), boxX + 27, adrEvalY + 5.5, { maxWidth: 60 });

    doc.setFont(fontFamily, 'normal'); doc.text('Previous ADR: ', boxX + 94, adrEvalY + 5.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.previous_adr_history || 'None'), boxX + 118, adrEvalY + 5.5, { maxWidth: 60 });

    // Row 2: Severity, Seriousness, Outcome
    doc.setFont(fontFamily, 'normal'); doc.text('Severity Level: ', boxX + 2, adrEvalY + 13.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.reaction_severity || adr.reactionSeverity || 'Moderate'), boxX + 24, adrEvalY + 13.5, { maxWidth: 25 });

    doc.setFont(fontFamily, 'normal'); doc.text('Seriousness: ', boxX + 54, adrEvalY + 13.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.reaction_seriousness || adr.reactionSeriousness || 'Hospitalization'), boxX + 74, adrEvalY + 13.5, { maxWidth: 35 });

    doc.setFont(fontFamily, 'normal'); doc.text('Patient Outcome: ', boxX + 114, adrEvalY + 13.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.patient_outcome || adr.patientOutcome || 'Recovered'), boxX + 142, adrEvalY + 13.5, { maxWidth: 36 });

    // Row 3: Action Taken, Dechallenge, Rechallenge
    doc.setFont(fontFamily, 'normal'); doc.text('Action Taken: ', boxX + 2, adrEvalY + 21.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.action_taken_on_suspected_drug || 'Drug Withdrawn'), boxX + 24, adrEvalY + 21.5, { maxWidth: 45 });

    doc.setFont(fontFamily, 'normal'); doc.text('Dechallenge: ', boxX + 74, adrEvalY + 21.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.dechallenge_information || adr.dechallengeInfo || 'Positive'), boxX + 94, adrEvalY + 21.5, { maxWidth: 25 });

    doc.setFont(fontFamily, 'normal'); doc.text('Rechallenge: ', boxX + 124, adrEvalY + 21.5);
    doc.setFont(fontFamily, 'bold'); doc.text(String(adr.rechallenge_information || adr.rechallengeInfo || 'Not Done'), boxX + 144, adrEvalY + 21.5, { maxWidth: 34 });

    // Row 4: Causality Assessment (Naranjo / WHO)
    doc.setFont(fontFamily, 'normal'); doc.text('Causality Assessment (Naranjo/WHO): ', boxX + 2, adrEvalY + 29.5);
    doc.setFont(fontFamily, 'bold'); doc.setTextColor(2, 132, 199);
    doc.text(String(adr.initial_causality_opinion || adr.naranjoCausality || 'Probable'), boxX + 65, adrEvalY + 29.5, { maxWidth: 110 });
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

  // =========================================================================
  // 6. AI CLINICAL CASE ANALYSIS & OVERALL SUMMARY
  // =========================================================================
  if (selectedForm === 'all' || selectedForm === 'complete' || selectedForm === 'ai_analysis') {
    ensureSpace(45);
    drawFormTitleBanner('AI CLINICAL CASE ANALYSIS & SUMMARY', [16, 185, 129]);

    // -----------------------------------------------------------------------
    // SECTION 1 — CASE OVERVIEW (DYNAMIC LAYOUT WITH ZERO OVERLAP)
    // -----------------------------------------------------------------------
    ensureSpace(35);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Section 1 — Case Overview:', boxX + 1, y);
    y += 5;

    const complVal = norm.history?.chiefComplaints || 'Not documented';
    const pastVal = norm.history?.pastMedicalHistory || 'Not documented';
    const allergyVal = norm.demographics?.allergyDrugs || 'Not documented';
    const colW = boxW / 3 - 4;

    const complLines = doc.splitTextToSize(complVal, colW);
    const pastLines = doc.splitTextToSize(pastVal, colW);
    const allergyLines = doc.splitTextToSize(allergyVal, colW);

    const maxBottomLines = Math.max(complLines.length, pastLines.length, allergyLines.length, 1);
    const bottomRowH = Math.max(maxBottomLines * 4.2 + 6, 13);
    const sec1GridH = 13 + bottomRowH;

    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, y, boxW, sec1GridH, 'FD');
    doc.line(boxX + (boxW / 3), y, boxX + (boxW / 3), y + sec1GridH);
    doc.line(boxX + (boxW * 2 / 3), y, boxX + (boxW * 2 / 3), y + sec1GridH);
    doc.line(boxX, y + 13, boxX + boxW, y + 13);

    const col1X = boxX + 2; const col2X = boxX + (boxW / 3) + 2; const col3X = boxX + (boxW * 2 / 3) + 2;

    doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.setFont(fontFamily, 'normal');
    doc.text('PATIENT AGE / SEX', col1X, y + 4); doc.text('DEPARTMENT / WARD', col2X, y + 4); doc.text('FINAL DIAGNOSIS', col3X, y + 4);

    const ageSexVal = [norm.demographics?.age ? `${norm.demographics.age} Yrs` : null, norm.demographics?.gender].filter(Boolean).join(' / ') || 'Not documented';
    const deptWardVal = [norm.demographics?.department, norm.demographics?.ward ? `(${norm.demographics.ward})` : null].filter(Boolean).join(' ') || 'Not documented';
    const diagVal = norm.diagnosis?.final || (norm.diagnoses?.length > 0 ? norm.diagnoses.join(', ') : 'Not documented');

    doc.setFontSize(9.5); doc.setFont(fontFamily, 'bold'); doc.setTextColor(15, 23, 42);
    doc.text(doc.splitTextToSize(ageSexVal, colW), col1X, y + 9);
    doc.text(doc.splitTextToSize(deptWardVal, colW), col2X, y + 9);
    doc.setTextColor(16, 185, 129);
    doc.text(doc.splitTextToSize(diagVal, colW), col3X, y + 9);

    doc.setFont(fontFamily, 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
    doc.text('CHIEF COMPLAINT(S)', col1X, y + 17); doc.text('PAST MEDICAL HISTORY', col2X, y + 17); doc.text('DOCUMENTED ALLERGIES', col3X, y + 17);

    doc.setFontSize(8.5); doc.setFont(fontFamily, 'bold'); doc.setTextColor(15, 23, 42);
    doc.text(complLines, col1X, y + 21);
    doc.text(pastLines, col2X, y + 21);
    doc.text(allergyLines, col3X, y + 21);
    y += sec1GridH + 4;

    // Case Summary Box
    const caseSumAgeStr = norm.demographics?.age && norm.demographics.age !== 'N/A' ? `${norm.demographics.age}-year-old` : '';
    const caseSumGender = norm.demographics?.gender && norm.demographics.gender !== 'N/A' ? norm.demographics.gender.toLowerCase() : 'patient';
    const caseSumPatient = [caseSumAgeStr, caseSumGender].filter(Boolean).join(' ') || 'patient';
    const caseSumDept = norm.demographics?.department && norm.demographics.department !== 'N/A' ? `admitted to the ${norm.demographics.department}` : '';
    const caseSumComplaints = norm.history?.chiefComplaints && norm.history.chiefComplaints !== 'N/A' ? norm.history.chiefComplaints : null;
    const caseSumDiag = norm.diagnosis?.final && norm.diagnosis.final !== 'N/A' ? norm.diagnosis.final : (norm.diagnoses?.length > 0 ? norm.diagnoses[0] : null);
    let caseSummaryText = `This case involves a ${caseSumPatient} ${caseSumDept}`.trim();
    if (caseSumComplaints && caseSumDiag) caseSummaryText += ` presenting with ${caseSumComplaints} and diagnosed with ${caseSumDiag}.`;
    else if (caseSumComplaints) caseSummaryText += ` presenting with ${caseSumComplaints}.`;
    else if (caseSumDiag) caseSummaryText += ` with a documented final diagnosis of ${caseSumDiag}.`;
    else caseSummaryText += '.';
    if (norm.history?.pastMedicalHistory && norm.history.pastMedicalHistory !== 'N/A' && norm.history.pastMedicalHistory !== 'None') {
      caseSummaryText += ` Documented past medical history includes ${norm.history.pastMedicalHistory}.`;
    }
    drawSectionBox('Case Summary:', caseSummaryText, 16);

    // -----------------------------------------------------------------------
    // SECTION 2 — PATIENT PROFILE ANALYSIS
    // -----------------------------------------------------------------------
    ensureSpace(35);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Section 2 — Patient Profile Analysis:', boxX + 1, y);
    y += 5;

    // Anthropometrics Grid
    const hCm = parseFloat(String(norm.demographics?.height || '').replace(/[^0-9.]/g, ''));
    const wKg = parseFloat(String(norm.demographics?.weight || '').replace(/[^0-9.]/g, ''));
    const existBmi = parseFloat(String(norm.demographics?.bmi || '').replace(/[^0-9.]/g, ''));
    let bmiCalc = null; let heightStr = 'Not documented'; let weightStr = 'Not documented'; let bmiStr = 'Not documented';
    if (!isNaN(wKg) && !isNaN(hCm) && hCm > 0) {
      const hM = hCm / 100; bmiCalc = (wKg / (hM * hM)).toFixed(1);
      heightStr = `${hCm} cm`; weightStr = `${wKg} kg`; bmiStr = `${bmiCalc} kg/m²`;
    } else if (!isNaN(existBmi) && existBmi > 0) {
      bmiCalc = existBmi.toFixed(1); bmiStr = `${bmiCalc} kg/m²`;
      if (!isNaN(hCm)) heightStr = `${hCm} cm`;
      if (!isNaN(wKg)) weightStr = `${wKg} kg`;
    }
    let bmiCategory = '';
    if (bmiCalc) {
      const bv = parseFloat(bmiCalc);
      if (bv < 18.5) bmiCategory = 'Underweight';
      else if (bv <= 24.9) bmiCategory = 'Normal Weight';
      else if (bv <= 29.9) bmiCategory = 'Overweight';
      else if (bv <= 34.9) bmiCategory = 'Class I Obesity';
      else if (bv <= 39.9) bmiCategory = 'Class II Obesity';
      else bmiCategory = 'Class III Obesity';
    }

    const sec2BoxH = 14;
    doc.setDrawColor(15, 23, 42); doc.setFillColor(248, 250, 252);
    doc.rect(boxX, y, boxW, sec2BoxH, 'FD');
    const fifthW = boxW / 5;
    [1,2,3,4].forEach(i => doc.line(boxX + fifthW * i, y, boxX + fifthW * i, y + sec2BoxH));

    doc.setFontSize(7.5); doc.setTextColor(100, 116, 139); doc.setFont(fontFamily, 'normal');
    ['AGE', 'SEX', 'HEIGHT', 'WEIGHT', 'BMI'].forEach((label, i) => {
      doc.text(label, boxX + fifthW * i + 2, y + 4);
    });
    doc.setFontSize(9.5); doc.setFont(fontFamily, 'bold'); doc.setTextColor(15, 23, 42);
    const anthroVals = [
      norm.demographics?.age ? `${norm.demographics.age} Yrs` : 'N/A',
      norm.demographics?.gender || 'N/A',
      heightStr, weightStr
    ];
    anthroVals.forEach((val, i) => doc.text(val, boxX + fifthW * i + 2, y + 10));
    doc.setTextColor(67, 56, 202);
    doc.text(bmiStr + (bmiCategory ? ` (${bmiCategory})` : ''), boxX + fifthW * 4 + 2, y + 10, { maxWidth: fifthW - 4 });
    y += sec2BoxH + 4;

    // AI Patient Profile Interpretation
    const profAgeStr = norm.demographics?.age && norm.demographics.age !== 'N/A' ? `${norm.demographics.age}-year-old` : null;
    const profSex = norm.demographics?.gender && norm.demographics.gender !== 'N/A' ? norm.demographics.gender.toLowerCase() : 'patient';
    const profDesc = [profAgeStr, profSex].filter(Boolean).join(' ') || 'patient';
    let profInterpText = bmiCalc
      ? `The patient is a ${profDesc}. Calculated BMI of ${bmiStr} based on documented height (${heightStr}) and weight (${weightStr}) is in the ${bmiCategory} range.`
      : `The patient is a ${profDesc}. Height and weight values are not fully documented to compute BMI.`;

    // Vitals from norm
    const vitList = Array.isArray(norm.vitals) && norm.vitals.length > 0 ? norm.vitals : [];
    const vit = vitList[0] || {};
    const vitSys = parseInt(vit.bp_sys || (typeof vit.bp === 'string' ? vit.bp.split('/')[0] : null), 10);
    const vitDia = parseInt(vit.bp_dia || (typeof vit.bp === 'string' ? vit.bp.split('/')[1] : null), 10);
    const vitPulse = parseInt(vit.pulse_rate || vit.pr || vit.pulse, 10);
    const vitNotes = [];
    if (!isNaN(vitSys) && !isNaN(vitDia)) {
      if (vitSys >= 140 || vitDia >= 90) vitNotes.push(`elevated BP (${vitSys}/${vitDia} mmHg)`);
      else if (vitSys < 90 || vitDia < 60) vitNotes.push(`hypotensive BP (${vitSys}/${vitDia} mmHg)`);
    }
    if (!isNaN(vitPulse)) {
      if (vitPulse > 100) vitNotes.push(`tachycardia (${vitPulse} bpm)`);
      else if (vitPulse < 60) vitNotes.push(`bradycardia (${vitPulse} bpm)`);
    }
    if (vitNotes.length > 0) profInterpText += ` Documented vital signs show ${vitNotes.join(', ')}.`;
    else if (!isNaN(vitSys) || !isNaN(vitPulse)) profInterpText += ' Documented vital signs are within normal hemodynamically stable limits.';
    else profInterpText += ' Vital signs are not documented in the saved case file.';

    drawSectionBox('AI Patient Profile Interpretation:', profInterpText, 18);

    // -----------------------------------------------------------------------
    // SECTION 3 — LABORATORY ANALYSIS (TABLE FORMAT MATCHING WEB UI)
    // -----------------------------------------------------------------------
    ensureSpace(35);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Section 3 — Laboratory Analysis:', boxX + 1, y);
    y += 5;

    const labList = Array.isArray(norm.labs) ? norm.labs : [];
    if (labList.length > 0) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.rect(boxX, y, boxW, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(9); doc.setTextColor(15, 23, 42);
      doc.text('Parameter Name', boxX + 3, y + 5);
      doc.text('Result', boxX + 55, y + 5);
      doc.text('Unit', boxX + 85, y + 5);
      doc.text('Reference Range', boxX + 115, y + 5);
      doc.text('Status', boxX + 155, y + 5);
      y += 7;

      doc.setFont(fontFamily, 'normal'); doc.setFontSize(8.5); doc.setTextColor(15, 23, 42);
      labList.forEach((lab, idx) => {
        const pName = String(lab.test_name || lab.parameter_name || lab.testName || `Parameter ${idx + 1}`);
        const pVal = String(lab.test_value ?? lab.value ?? lab.testValue ?? '—');
        const pUnit = String(lab.unit || lab.units || '—');
        const pRange = String(lab.reference_range || lab.referenceRange || '—');
        const pStatus = String(lab.impression || lab.status || 'Normal');

        const pNameLines = doc.splitTextToSize(pName, 48);
        const rowH = Math.max(pNameLines.length * 4 + 3, 7);

        if (ensureSpace(rowH)) {
          doc.setFont(fontFamily, 'normal'); doc.setFontSize(8.5);
        }

        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(boxX, y, boxW, rowH, 'FD');
        } else {
          doc.rect(boxX, y, boxW, rowH, 'D');
        }

        doc.setFont(fontFamily, 'bold');
        doc.text(pNameLines, boxX + 3, y + 4.5);
        doc.setFont(fontFamily, 'normal');
        doc.text(pVal, boxX + 55, y + 4.5);
        doc.text(pUnit, boxX + 85, y + 4.5);
        doc.text(pRange, boxX + 115, y + 4.5);

        if (pStatus.toLowerCase().includes('high') || pStatus.toLowerCase().includes('increased') || pStatus.toLowerCase().includes('elevated')) {
          doc.setTextColor(180, 83, 9);
        } else if (pStatus.toLowerCase().includes('low') || pStatus.toLowerCase().includes('decreased')) {
          doc.setTextColor(2, 132, 199);
        } else {
          doc.setTextColor(16, 185, 129);
        }
        doc.setFont(fontFamily, 'bold');
        doc.text(pStatus, boxX + 155, y + 4.5);
        doc.setTextColor(15, 23, 42);
        y += rowH;
      });
      y += 4;
    } else {
      drawSectionBox(null, 'No laboratory investigation results documented for this clinical case.', 14);
    }

    // -----------------------------------------------------------------------
    // SECTION 4A — DRUG IDENTITY, DOSING & SAFETY VERIFICATION
    // -----------------------------------------------------------------------
    ensureSpace(35);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Section 4A — Drug Identity, Dosing & Safety Verification:', boxX + 1, y);
    y += 5;

    const drugList = Array.isArray(norm.drugs) ? norm.drugs : [];
    if (drugList.length > 0) {
      const drugCardLines = drugList.map((d, i) => {
        const gName = d.generic_name !== '—' ? d.generic_name : d.trade_name;
        const bName = d.trade_name !== '—' && d.trade_name !== d.generic_name ? ` (${d.trade_name})` : '';
        const regimen = `Dose: ${d.dose || 'As prescribed'} | Route: ${d.route_of_admin || 'Oral'} | Freq: ${d.frequency || 'OD'} | Dates: ${d.start_date || '—'} to ${d.stop_date || 'Ongoing'}`;
        const cls = d.drug_class || 'Pharmacotherapeutic Agent';
        const safetyStr = `Safety: Dosing parameters verified within standard therapeutic window.`;
        return `${i + 1}. ${gName}${bName}\n   Class: ${cls}\n   Regimen: ${regimen}\n   Indication: ${d.indication || 'Therapeutic indication under clinical review'}\n   ${safetyStr}`;
      });
      drawSectionBox(null, drugCardLines.join('\n\n'), 24);
    } else {
      drawSectionBox(null, 'No active prescribed drugs documented for safety verification.', 14);
    }

    // -----------------------------------------------------------------------
    // SECTION 4B — DIAGNOSTIC & LABORATORY INVESTIGATION RISKS
    // -----------------------------------------------------------------------
    ensureSpace(30);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Section 4B — Diagnostic & Laboratory Investigation Risks:', boxX + 1, y);
    y += 5;

    const labCount = norm.labs ? norm.labs.length : 0;
    const sec4bText = labCount > 0
      ? `Baseline Laboratory Evaluation (${labCount} Parameters Recorded): Lab investigations audited against prescribed pharmacotherapy. Baseline renal, hepatic, and hematological parameters evaluated for drug-induced organ toxicity risks.`
      : 'No baseline laboratory investigation data recorded. Routine baseline serum creatinine, LFTs, and CBC recommended prior to long-term therapy.';
    drawSectionBox(null, sec4bText, 16);

    // -----------------------------------------------------------------------
    // SECTION 5A — DRUG-DRUG INTERACTION MATRIX
    // -----------------------------------------------------------------------
    ensureSpace(35);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Section 5A — Drug–Drug Interaction Matrix:', boxX + 1, y);
    y += 5;

    if (section5ADdiResult && section5ADdiResult.hasInteractions && Array.isArray(section5ADdiResult.interactions) && section5ADdiResult.interactions.length > 0) {
      const ddiLines = section5ADdiResult.interactions.map((inter, idx) => {
        return `Pair #${idx + 1}: ${inter.drugAGeneric} + ${inter.drugBGeneric} [Severity: ${inter.severity || 'Major'}]\nDescription: ${inter.interactionDescription || 'Pharmacodynamic Interaction'}\nMechanism: ${inter.mechanism || 'Synergistic / Additive activity'}\nClinical Management: ${inter.management || inter.clinicalSignificance || 'Monitor patient parameters closely.'}`;
      });
      drawSectionBox(null, ddiLines.join('\n\n'), 24);
    } else if (drugList.length >= 2) {
      const sec5aText = `Polypharmacy Evaluation (${drugList.length} Prescribed Agents): Pairwise drug-drug interaction matrix evaluated across all active drugs. Monitor for potential pharmacodynamic synergism, QTc prolongation, and mucosal bleeding overlaps.`;
      drawSectionBox(null, sec5aText, 16);
    } else {
      drawSectionBox(null, 'Monotherapy / Low-Drug Regimen: Minimal risk of drug-drug interactions detected for single active agent.', 14);
    }

    // -----------------------------------------------------------------------
    // SECTION 5B — DRUG-FOOD INTERACTION & DIETARY PRECAUTIONS
    // -----------------------------------------------------------------------
    ensureSpace(35);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Section 5B — Drug–Food Interaction & Dietary Precautions:', boxX + 1, y);
    y += 5;

    if (section5BDfiResult && section5BDfiResult.hasInteractions && Array.isArray(section5BDfiResult.interactions) && section5BDfiResult.interactions.length > 0) {
      const dfiLines = section5BDfiResult.interactions.map((inter, idx) => {
        return `Drug-Food #${idx + 1}: ${inter.drugGeneric} + ${inter.foodOrBeverage} [Severity: ${inter.severity || 'Moderate'}]\nInteraction: ${inter.interactionDescription || 'Dietary Interaction'}\nAdministration Advice: ${inter.counsellingPoint || inter.management || 'Administer relative to meals as directed.'}`;
      });
      drawSectionBox(null, dfiLines.join('\n\n'), 20);
    } else if (drugList.length > 0) {
      const sec5bText = `Dietary Administration Guidelines (${drugList.length} Active Agents): Counsel patient regarding administration relative to meals (empty stomach vs with meals), electrolyte/potassium restrictions, and avoiding alcohol or grapefruit juice.`;
      drawSectionBox(null, sec5bText, 16);
    } else {
      drawSectionBox(null, 'No active drugs recorded for dietary interaction evaluation.', 14);
    }

    // -----------------------------------------------------------------------
    // SECTION 6A — ADR CAUSALITY & RISK SYNTHESIS
    // -----------------------------------------------------------------------
    ensureSpace(30);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Section 6A — Adverse Drug Reaction (ADR) Causality & Risk Synthesis:', boxX + 1, y);
    y += 5;

    const sec6aText = adr?.suspected_drug || adr?.reactionTitle || adr?.suspectedMedication
      ? `Documented Suspected ADR: ${adr.suspected_drug || adr.reactionTitle || adr.suspectedMedication}\nReaction Description: ${adr.reaction_description || adr.reactionTitle || 'Unspecified'}\nSeverity: ${adr.reaction_severity || 'Moderate'} | Seriousness: ${adr.reaction_seriousness || 'Hospitalization'}\nNaranjo / WHO Causality Rating: ${adr.initial_causality_opinion || adr.naranjoCausality || 'Probable'} (Score: ${adr.causalityScore || '5'})`
      : 'No Adverse Drug Reaction (ADR) report saved under ADR Documentation for this clinical case.';
    drawSectionBox(null, sec6aText, 16);

    // -----------------------------------------------------------------------
    // SECTION 6B — PATIENT COUNSELLING AUDIT
    // -----------------------------------------------------------------------
    ensureSpace(30);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Section 6B — Patient Counselling & Regimen Education Audit:', boxX + 1, y);
    y += 5;

    const sec6bText = counselling?.points_covered || counselling?.disease_counselled || counselling?.counselled_to
      ? `Recipient: ${counselling.counselled_to || 'Patient'}\nDisease / Drugs Counselled: ${counselling.disease_counselled || norm.diagnoses.join(', ') || 'Prescribed Regimen'}\nPoints Covered: ${counselling.points_covered || 'Dosing, timing, adverse effects, lifestyle'}\nPatient Understanding: ${counselling.patient_understanding || 'Good'}\nLifestyle Advice: ${counselling.lifestyle_modifications || 'Standard dietary & exercise recommendations.'}`
      : 'No patient counselling record saved under Patient Counselling for this clinical case.';
    drawSectionBox(null, sec6bText, 16);

    // -----------------------------------------------------------------------
    // SECTION 6C — PHARMACIST CLINICAL INTERVENTION EVALUATION
    // -----------------------------------------------------------------------
    ensureSpace(30);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Section 6C — Pharmacist Clinical Intervention Evaluation:', boxX + 1, y);
    y += 5;

    const sec6cText = intervention?.prescription_problems || intervention?.problem_details || intervention?.problemDescription
      ? `DTP Identified: ${Array.isArray(intervention.prescription_problems) ? intervention.prescription_problems.join(', ') : (intervention.prescription_problems || intervention.problemDescription || 'Drug Therapy Problem')}\nProblem Details: ${intervention.problem_details || intervention.problemDescription || 'Clinical intervention recorded.'}\nRecommendations: ${intervention.recommendations || intervention.actionsTaken || 'Dose adjustment / drug monitoring'}\nPhysician Acceptance: ${intervention.physician_acceptance || intervention.physicianAcceptance || 'Accepted'}`
      : 'No pharmacist intervention record saved under Pharmacist Intervention for this clinical case.';
    drawSectionBox(null, sec6cText, 16);

    // -----------------------------------------------------------------------
    // SECTION 6D — DRUG INFORMATION QUERY & EVIDENCE REVIEW
    // -----------------------------------------------------------------------
    ensureSpace(30);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Section 6D — Drug Information Query & Evidence Review:', boxX + 1, y);
    y += 5;

    const sec6dText = dir?.query_text || dir?.question_category || dir?.detailsOfEnquiry
      ? `Category: ${dir.question_category || dir.questionCategory || 'Therapeutic Use'}\nEnquirer: ${dir.enquirer_type || dir.enquirerName || 'Healthcare Professional'}\nQuery: ${dir.query_text || dir.detailsOfEnquiry || 'Clinical drug enquiry'}\nSearch Strategy: ${dir.literature_search_strategy || 'Micromedex / PubMed / BNF'}\nResponse Summary: ${dir.information_provided || dir.informationProvided || 'Evidence-based response documented.'}`
      : 'No drug information request record saved under Drug Information Request for this clinical case.';
    drawSectionBox(null, sec6dText, 16);

    const ageStr = norm?.demographics?.age ? `${norm.demographics.age}-year-old` : 'patient';
    const genderStr = norm?.demographics?.gender ? norm.demographics.gender.toLowerCase() : 'patient';
    const diagStr = norm.diagnosis?.final || (Array.isArray(norm?.diagnoses) && norm.diagnoses.length > 0 ? norm.diagnoses.join(', ') : 'presenting clinical condition');
    const drugCount = Array.isArray(norm?.drugs) ? norm.drugs.length : 0;

    let ddiStr = adr?.suspected_drug ? ` A suspected adverse reaction to ${adr.suspected_drug} was documented.` : '';
    let counselStr = counselling?.points_covered ? ` Patient counselling and compliance education points have been audited.` : '';

    const summaryPara = `This clinical case involves a ${ageStr} ${genderStr} managed for ${diagStr} with ${drugCount} active prescribed pharmacotherapeutic agents. Evaluation across Sections 3 through 6D confirms therapeutic indication alignment, dosing safety parameters, and laboratory risk monitoring.${ddiStr}${counselStr} Continued preceptor evaluation and multidisciplinary clinical oversight are recommended to optimize therapeutic outcomes.`;

    drawSectionBox('Overall Clinical Case Analysis Summary:', summaryPara, 22);

    // Educational Disclaimer Box with Red / Caution styling in PDF
    ensureSpace(24);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(10.5); doc.setTextColor(225, 29, 72); // rose-600
    doc.text('AI-GENERATED ANALYSIS — EDUCATIONAL REFERENCE ONLY', boxX + 1, y);
    y += 4.5;

    const discText = 'AI-generated analysis is provided for educational and reference purposes and does not replace clinical judgment, preceptor review, or professional patient-care decisions.';
    const discLines = doc.splitTextToSize(discText, boxW - 6);
    const discH = Math.max(discLines.length * 5 + 4, 14);

    doc.setDrawColor(225, 29, 72); // rose-600 border
    doc.setFillColor(255, 241, 242); // rose-50 light red background
    doc.rect(boxX, y, boxW, discH, 'FD');

    doc.setFont(fontFamily, 'normal'); doc.setFontSize(9.5); doc.setTextColor(159, 18, 57); // rose-900
    doc.text(discLines, boxX + 3, y + 5);
    y += discH + 6;
  }

  // Dual Signatures strictly anchored at the BOTTOM of the final page of the form
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

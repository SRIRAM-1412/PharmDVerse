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
 * Clean & High-Precision PDF Generator for PharmDVerse Approved Clinical Cases.
 * 
 * FIXED MEASUREMENTS:
 * - Paper size: A4 (210mm x 297mm)
 * - Font: Times New Roman ('times' in jsPDF)
 * - Font sizes: 14pt (Titles / Main Headers) and 12pt (Subheadings / Body Content / Table Cells)
 * - Margins: Normal (15mm top, 15mm bottom, 15mm left, 15mm right — content width 180mm)
 * 
 * FORMAT CONTROLS FROM COLLEGE ADMIN ONLY:
 * - Header switches: show_college_logo, show_college_name, show_autonomous, show_hospital_logo, show_hospital_name
 * - Watermark settings: watermark_enabled, watermark_text_line1, watermark_text_line2, watermark_opacity, watermark_position
 * - Footer settings: footer_left_text, footer_center_text, show_page_number, show_generated_datetime
 * - Multi-page & Signatures: repeat_header, repeat_footer, show_student_signature, show_preceptor_signature, zebra_striping, repeat_table_header
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

  // FIXED MEASUREMENTS: A4, Normal Margins (15mm)
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

  const col1X = marginX + 3;
  const col2X = marginX + 93;
  const maxColWidth = 84;

  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // FIXED FONT: Times New Roman ('times' in jsPDF)
  const fontFamily = 'times';
  const titleFontSize = 14;
  const bodyFontSize = 12;

  // FORMAT CONTROLS FROM COLLEGE ADMIN ONLY
  const showCollegeLogo = branding?.show_college_logo ?? branding?.show_logo ?? true;
  const showCollegeName = branding?.show_college_name ?? true;
  const showAutonomous = branding?.show_autonomous ?? true;
  const showHospitalLogo = branding?.show_hospital_logo ?? true;
  const showHospitalName = branding?.show_hospital_name ?? true;

  const watermarkEnabled = (branding?.watermark_enabled !== false) && (branding?.show_watermark !== false);
  const watermarkTextLine1 = (branding?.watermark_text_line1 || branding?.watermark_text || college?.college_code || 'PHARMDVERSE').toUpperCase();
  const watermarkTextLine2 = (branding?.watermark_text_line2 || branding?.watermark_line_2 || '').toUpperCase();
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
    doc.rect(marginX, 10, contentWidth, 20); // Header outer box matching preview

    const collegeLogo = college?.college_logo_url || college?.logo_url || branding?.college_logo_url || '';
    const hospitalLogo = college?.hospital_logo_url || college?.hospitalLogoUrl || branding?.hospital_logo_url || '';

    // Left Logo: College Logo
    if (showCollegeLogo && collegeLogo) {
      try {
        const fmt = getImageFormat(collegeLogo);
        doc.addImage(collegeLogo, fmt, marginX + 2, 11, 18, 18);
      } catch (e) {
        console.warn('College Logo image render error:', e);
      }
    }

    // Right Logo: Hospital Logo
    if (showHospitalLogo && hospitalLogo) {
      try {
        const fmt = getImageFormat(hospitalLogo);
        doc.addImage(hospitalLogo, fmt, pageWidth - marginX - 20, 11, 18, 18);
      } catch (e) {
        console.warn('Hospital Logo image render error:', e);
      }
    }

    // Center Text: College Name, (Autonomous), Hospital Name
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
    doc.text(`OFFICIAL CLINICAL CASE LOGBOOK RECORD  •  CASE ID: ${norm.caseId}`, pageWidth / 2, 35, { align: 'center' });
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
    doc.setTextColor(2, 132, 199); // Blue text matching preview

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
      const angle = watermarkPosition === 'Diagonal' ? 35 : 0;

      if (watermarkTextLine2) {
        doc.text(watermarkTextLine1, centerX, centerY - 6, { align: 'center', angle, rotationDirection: 0 });
        doc.text(watermarkTextLine2, centerX, centerY + 6, { align: 'center', angle, rotationDirection: 0 });
      } else {
        doc.text(watermarkTextLine1, centerX, centerY, { align: 'center', angle, rotationDirection: 0 });
      }
    } catch (e) {
      console.warn('Watermark render warning:', e);
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

  let formCounter = 1;

  // ==========================================
  // FORM 1: PATIENT PROFILE DOCUMENTATION
  // ==========================================
  if (norm.isProfileCompleted) {
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text(`${formCounter++}. PATIENT PROFILE DOCUMENTATION`, marginX, y);
    y += 6;

    // Structured 2-Column Demographics Box
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, y, contentWidth, 50, 'FD');

    doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);

    doc.setFont(fontFamily, 'bold'); doc.text('Patient Name:', col1X, y + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.demographics.patientName, col1X + 26, y + 6, { maxWidth: maxColWidth - 26 });

    doc.setFont(fontFamily, 'bold'); doc.text('Age / Gender:', col2X, y + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(`${norm.demographics.age} Yrs / ${norm.demographics.gender}`, col2X + 26, y + 6, { maxWidth: maxColWidth - 26 });

    doc.setFont(fontFamily, 'bold'); doc.text('IP/OP No:', col1X, y + 13);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.demographics.ipOpNo, col1X + 26, y + 13, { maxWidth: maxColWidth - 26 });

    doc.setFont(fontFamily, 'bold'); doc.text('Ward / Bed:', col2X, y + 13);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.demographics.wardBed, col2X + 26, y + 13, { maxWidth: maxColWidth - 26 });

    doc.setFont(fontFamily, 'bold'); doc.text('Department:', col1X, y + 20);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.demographics.department, col1X + 26, y + 20, { maxWidth: maxColWidth - 26 });

    doc.setFont(fontFamily, 'bold'); doc.text('Attending Physician:', col2X, y + 20);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.demographics.physician, col2X + 36, y + 20, { maxWidth: maxColWidth - 36 });

    doc.setFont(fontFamily, 'bold'); doc.text('Date of Admission:', col1X, y + 27);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.dates.doa, col1X + 32, y + 27);

    doc.setFont(fontFamily, 'bold'); doc.text('Date of Discharge:', col2X, y + 27);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.dates.dod, col2X + 32, y + 27);

    doc.setFont(fontFamily, 'bold'); doc.text('Physical Measurements:', col1X, y + 34);
    doc.setFont(fontFamily, 'normal'); doc.text(`Ht: ${norm.demographics.height} | Wt: ${norm.demographics.weight} | BMI: ${norm.demographics.bmi}`, col1X + 38, y + 34, { maxWidth: maxColWidth - 38 });

    doc.setFont(fontFamily, 'bold'); doc.text('Allergies:', col2X, y + 34);
    doc.setFont(fontFamily, 'normal'); doc.text(`Drug: ${norm.demographics.allergyDrugs} | Food: ${norm.demographics.allergyFood}`, col2X + 20, y + 34, { maxWidth: maxColWidth - 20 });

    doc.setFont(fontFamily, 'bold'); doc.text('Social History:', col1X, y + 41);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.demographics.socialHistory, col1X + 26, y + 41, { maxWidth: maxColWidth - 26 });

    doc.setFont(fontFamily, 'bold'); doc.text('Diet & Lifestyle:', col2X, y + 41);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.demographics.diet, col2X + 26, y + 41, { maxWidth: maxColWidth - 26 });

    y += 55;

    // History & Clinical Exam
    if (norm.history.chiefComplaints) {
      ensureSpace(14);
      doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
      doc.text('Chief Complaints & Presenting History:', marginX, y);
      y += 5;
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
      doc.text(norm.history.chiefComplaints, marginX + 3, y, { maxWidth: contentWidth - 6 });
      y += 10;
    }

    if (norm.history.pastMedicalHistory) {
      ensureSpace(14);
      doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
      doc.text('Past Medical & Medication History:', marginX, y);
      y += 5;
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
      const pastMed = norm.history.pastMedicationHistory ? ` (Meds: ${norm.history.pastMedicationHistory})` : '';
      doc.text(`${norm.history.pastMedicalHistory}${pastMed}`, marginX + 3, y, { maxWidth: contentWidth - 6 });
      y += 10;
    }

    if (norm.history.generalExam || norm.history.systemicExam) {
      ensureSpace(16);
      doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
      doc.text('General & Systemic Examinations:', marginX, y);
      y += 5;
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
      const genExam = norm.history.generalExam ? `General Exam: ${norm.history.generalExam}` : '';
      const sysExam = norm.history.systemicExam ? `Systemic Exam: ${norm.history.systemicExam}` : '';
      doc.text([genExam, sysExam].filter(Boolean).join('\n'), marginX + 3, y, { maxWidth: contentWidth - 6 });
      y += 12;
    }

    // Vital Signs Table
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text('VITAL SIGNS LOG CHART', marginX, y);
    y += 5;

    const vitalsList = norm.vitals.length > 0 ? norm.vitals : [{ date: norm.dates.doa, temp: '98.6', bp: '120/80', pr: '72', rr: '18', spo2: '98' }];

    const drawVitalsTableHeader = (atY) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.rect(marginX, atY, contentWidth, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
      doc.text('Recorded Date', marginX + 2, atY + 5);
      doc.text('Temp (°F)', marginX + 35, atY + 5);
      doc.text('Blood Pressure (mmHg)', marginX + 62, atY + 5);
      doc.text('Pulse Rate (bpm)', marginX + 110, atY + 5);
      doc.text('Resp Rate (/min)', marginX + 142, atY + 5);
      doc.text('SpO2 (%)', marginX + 165, atY + 5);
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
      doc.text(String(v.date || 'N/A'), marginX + 2, y + 5);
      doc.text(String(v.temp || v.temperature || '98.6'), marginX + 35, y + 5);
      doc.text(String(v.bp || '120/80'), marginX + 62, y + 5);
      doc.text(String(v.pr || v.pulse || '72'), marginX + 110, y + 5);
      doc.text(String(v.rr || v.respiratory_rate || '18'), marginX + 142, y + 5);
      doc.text(String(v.spo2 ? `${v.spo2}%` : '98%'), marginX + 165, y + 5);
      y += 7;
    });
    y += 5;

    // Laboratory Investigations Table
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text('LABORATORY INVESTIGATIONS', marginX, y);
    y += 5;

    const labsList = norm.labs;

    const drawLabsTableHeader = (atY) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.rect(marginX, atY, contentWidth, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
      doc.text('Category', marginX + 2, atY + 5);
      doc.text('Investigation Parameter', marginX + 32, atY + 5);
      doc.text('Observed Value', marginX + 78, atY + 5);
      doc.text('Reference Range', marginX + 115, atY + 5);
      doc.text('Clinical Inference', marginX + 150, atY + 5);
    };

    drawLabsTableHeader(y);
    y += 7;

    if (labsList.length > 0) {
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
      labsList.forEach((lab, idx) => {
        if (ensureSpace(7)) {
          if (repeatTableHeader) {
            drawLabsTableHeader(y);
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
        doc.text(String(lab.category || lab.lab_category || 'General'), marginX + 2, y + 5);
        doc.text(String(lab.parameter_name || lab.test_name || 'N/A'), marginX + 32, y + 5, { maxWidth: 42 });
        const valStr = lab.test_value || lab.observed_value ? `${lab.test_value || lab.observed_value} ${lab.unit || ''}` : 'N/A';
        doc.text(String(valStr), marginX + 78, y + 5);
        doc.text(String(lab.reference_range || lab.normal_range || 'N/A'), marginX + 115, y + 5);
        doc.text(String(lab.clinical_inference || 'Normal'), marginX + 150, y + 5);
        y += 7;
      });
    } else {
      doc.rect(marginX, y, contentWidth, 7, 'D');
      doc.setFont(fontFamily, 'italic'); doc.setFontSize(bodyFontSize); doc.setTextColor(100, 116, 139);
      doc.text('No laboratory investigations logged.', pageWidth / 2, y + 5, { align: 'center' });
      y += 7;
    }
    y += 5;

    // Prescribed Medication Profile Table
    ensureSpace(28);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text('PRESCRIBED MEDICATION PROFILE', marginX, y);
    y += 5;

    doc.setDrawColor(5, 150, 105);
    doc.setFillColor(236, 253, 245);
    doc.rect(marginX, y, contentWidth, 10, 'FD');
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(5, 150, 105);
    doc.text(`OFFICIAL DIAGNOSIS: ${norm.diagnosis.final.toUpperCase()}`, pageWidth / 2, y + 7, { align: 'center' });

    y += 14;

    const drugsList = norm.drugs.length > 0 ? norm.drugs : [{ drug_name: 'Symptomatic Medication', dose: 'As prescribed', route: 'Oral', frequency: 'OD', indication: 'Symptomatic Management' }];

    const drawDrugsTableHeader = (atY) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.rect(marginX, atY, contentWidth, 7, 'FD');

      doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
      doc.text('S.No', marginX + 2, atY + 5);
      doc.text('Brand & Generic Name', marginX + 18, atY + 5);
      doc.text('Dose & Route', marginX + 78, atY + 5);
      doc.text('Frequency', marginX + 118, atY + 5);
      doc.text('Therapeutic Indication', marginX + 143, atY + 5);
    };

    drawDrugsTableHeader(y);
    y += 7;

    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    drugsList.forEach((d, idx) => {
      if (ensureSpace(7)) {
        if (repeatTableHeader) {
          drawDrugsTableHeader(y);
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
      doc.text(String(d.s_no || idx + 1), marginX + 2, y + 5);
      const nameStr = d.trade_name || d.brand_name ? `${d.trade_name || d.brand_name} ${d.generic_name || d.drug_name ? `(${d.generic_name || d.drug_name})` : ''}` : String(d.generic_name || d.drug_name || 'N/A');
      doc.text(nameStr, marginX + 18, y + 5, { maxWidth: 56 });
      doc.text(`${d.dose || 'N/A'} (${d.route_of_admin || d.route || 'Oral'})`, marginX + 78, y + 5, { maxWidth: 36 });
      doc.text(String(d.frequency || 'OD'), marginX + 118, y + 5);
      doc.text(String(d.indication || 'Symptomatic Management'), marginX + 143, y + 5, { maxWidth: 35 });
      y += 7;
    });
    y += 5;

    if (norm.diagnosis.dischargeSummary) {
      ensureSpace(18);
      doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
      doc.text('Discharge Summary & Instructions:', marginX, y);
      y += 5;
      doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
      doc.text(norm.diagnosis.dischargeSummary, marginX + 3, y, { maxWidth: contentWidth - 6 });
      y += 10;
    }

    drawDualSignatures(y);
  }

  // ==========================================
  // FORM 2: PATIENT COUNSELLING DOCUMENTATION
  // ==========================================
  if (norm.isCounsellingCompleted) {
    doc.addPage();
    y = 42;

    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text(`${formCounter++}. PATIENT COUNSELLING DOCUMENTATION`, marginX, y);
    y += 6;

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, y, contentWidth, 44, 'FD');

    doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);

    doc.setFont(fontFamily, 'bold'); doc.text('Counselling Date / Time:', col1X, y + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(`${norm.counselling.date} ${norm.counselling.time}`, col1X + 42, y + 6, { maxWidth: maxColWidth - 42 });

    doc.setFont(fontFamily, 'bold'); doc.text('Provided To / Type:', col2X, y + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(`${norm.counselling.providedTo} (${norm.counselling.patientType})`, col2X + 34, y + 6, { maxWidth: maxColWidth - 34 });

    doc.setFont(fontFamily, 'bold'); doc.text('Duration & Representative:', col1X, y + 13);
    doc.setFont(fontFamily, 'normal'); doc.text(`${norm.counselling.timeTaken} ${norm.counselling.representativeReasons ? `(${norm.counselling.representativeReasons})` : ''}`, col1X + 46, y + 13, { maxWidth: maxColWidth - 46 });

    doc.setFont(fontFamily, 'bold'); doc.text('Understanding Ascertained:', col2X, y + 13);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.counselling.understandingAscertained, col2X + 42, y + 13, { maxWidth: maxColWidth - 42 });

    doc.setFont(fontFamily, 'bold'); doc.text('Disease Counselled:', col1X, y + 20);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.counselling.diseaseCounselled, col1X + 34, y + 20, { maxWidth: maxColWidth - 34 });

    doc.setFont(fontFamily, 'bold'); doc.text('Key Focus Points:', col1X, y + 27);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.counselling.pointsCovered, col1X + 30, y + 27, { maxWidth: contentWidth - 34 });

    if (norm.counselling.majorBarriers || norm.counselling.barrierOvercome) {
      doc.setFont(fontFamily, 'bold'); doc.text('Barriers & Action Taken:', col1X, y + 34);
      doc.setFont(fontFamily, 'normal'); doc.text(`${norm.counselling.majorBarriers} ${norm.counselling.barrierOvercome ? `— ${norm.counselling.barrierOvercome}` : ''}`, col1X + 38, y + 34, { maxWidth: contentWidth - 42 });
    }

    y += 50;
    drawDualSignatures(y);
  }

  // ==========================================
  // FORM 3: PHARMACIST INTERVENTION DOCUMENTATION
  // ==========================================
  if (norm.isInterventionCompleted) {
    doc.addPage();
    y = 42;

    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text(`${formCounter++}. PHARMACIST INTERVENTION DOCUMENTATION`, marginX, y);
    y += 6;

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, y, contentWidth, 44, 'FD');

    doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);

    doc.setFont(fontFamily, 'bold'); doc.text('Intervention Date:', col1X, y + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.intervention.date, col1X + 30, y + 6, { maxWidth: maxColWidth - 30 });

    doc.setFont(fontFamily, 'bold'); doc.text('Reporting Date:', col2X, y + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.intervention.reportingDate, col2X + 26, y + 6, { maxWidth: maxColWidth - 26 });

    doc.setFont(fontFamily, 'bold'); doc.text('Problem Identified:', col1X, y + 13);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.intervention.prescriptionProblems, col1X + 32, y + 13, { maxWidth: contentWidth - 36 });

    doc.setFont(fontFamily, 'bold'); doc.text('Action & Recommendation:', col1X, y + 20);
    doc.setFont(fontFamily, 'normal'); doc.text(`${norm.intervention.actionsTaken} — ${norm.intervention.recommendations}`, col1X + 46, y + 20, { maxWidth: contentWidth - 50 });

    doc.setFont(fontFamily, 'bold'); doc.text('Significance Level:', col1X, y + 27);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.intervention.significanceLevel, col1X + 32, y + 27, { maxWidth: maxColWidth - 32 });

    doc.setFont(fontFamily, 'bold'); doc.text('Physician Acceptance:', col2X, y + 27);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.intervention.physicianAcceptance, col2X + 36, y + 27, { maxWidth: maxColWidth - 36 });

    if (norm.intervention.referencesText) {
      doc.setFont(fontFamily, 'bold'); doc.text('References Consulted:', col1X, y + 34);
      doc.setFont(fontFamily, 'normal'); doc.text(norm.intervention.referencesText, col1X + 34, y + 34, { maxWidth: contentWidth - 38 });
    }

    y += 50;
    drawDualSignatures(y);
  }

  // ==========================================
  // FORM 4: DRUG INFORMATION REQUEST DOCUMENTATION
  // ==========================================
  if (norm.isDirCompleted) {
    doc.addPage();
    y = 42;

    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text(`${formCounter++}. DRUG INFORMATION REQUEST DOCUMENTATION`, marginX, y);
    y += 6;

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, y, contentWidth, 44, 'FD');

    doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);

    doc.setFont(fontFamily, 'bold'); doc.text('Query Date / Time:', col1X, y + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(`${norm.dir.date} ${norm.dir.time}`, col1X + 32, y + 6, { maxWidth: maxColWidth - 32 });

    doc.setFont(fontFamily, 'bold'); doc.text('Enquirer Name & Status:', col2X, y + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(`${norm.dir.enquirerName} (${norm.dir.professionalStatus})`, col2X + 38, y + 6, { maxWidth: maxColWidth - 38 });

    doc.setFont(fontFamily, 'bold'); doc.text('Category of Enquiry:', col1X, y + 13);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.dir.questionCategory, col1X + 34, y + 13, { maxWidth: maxColWidth - 34 });

    doc.setFont(fontFamily, 'bold'); doc.text('Turnaround Time:', col2X, y + 13);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.dir.timeframeNeeded, col2X + 30, y + 13, { maxWidth: maxColWidth - 30 });

    doc.setFont(fontFamily, 'bold'); doc.text('Patient Background:', col1X, y + 20);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.dir.patientBackground, col1X + 32, y + 20, { maxWidth: contentWidth - 36 });

    doc.setFont(fontFamily, 'bold'); doc.text('Details of Query:', col1X, y + 27);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.dir.detailsOfEnquiry, col1X + 28, y + 27, { maxWidth: contentWidth - 32 });

    doc.setFont(fontFamily, 'bold'); doc.text('Response Provided:', col1X, y + 34);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.dir.informationProvided, col1X + 32, y + 34, { maxWidth: contentWidth - 36 });

    y += 50;
    drawDualSignatures(y);
  }

  // ==========================================
  // FORM 5: ADR DOCUMENTATION LOG
  // ==========================================
  if (norm.isAdrCompleted) {
    doc.addPage();
    y = 42;

    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
    doc.text(`${formCounter++}. ADR DOCUMENTATION LOG`, marginX, y);
    y += 6;

    doc.setDrawColor(252, 211, 77);
    doc.setFillColor(254, 252, 232);
    doc.rect(marginX, y, contentWidth, 44, 'FD');

    doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);

    doc.setFont(fontFamily, 'bold'); doc.text('ADR Log Number:', col1X, y + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.adr.adrNumber, col1X + 30, y + 6, { maxWidth: maxColWidth - 30 });

    doc.setFont(fontFamily, 'bold'); doc.text('Reporting / Onset Date:', col2X, y + 6);
    doc.setFont(fontFamily, 'normal'); doc.text(`${norm.adr.reportingDate} / ${norm.adr.onsetDate}`, col2X + 36, y + 6, { maxWidth: maxColWidth - 36 });

    doc.setFont(fontFamily, 'bold'); doc.text('Suspected Drug:', col1X, y + 13);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.adr.suspectedMeds.length > 0 ? norm.adr.suspectedMeds.map(m => `${m.medicine_name || m.generic_name} (${m.dose || ''})`).join(', ') : (norm.adr.reactionTitle || 'N/A'), col1X + 28, y + 13, { maxWidth: contentWidth - 32 });

    doc.setFont(fontFamily, 'bold'); doc.text('Reaction Category & Title:', col1X, y + 20);
    doc.setFont(fontFamily, 'normal'); doc.text(`${norm.adr.reactionCategory} — ${norm.adr.reactionTitle}`, col1X + 38, y + 20, { maxWidth: contentWidth - 42 });

    doc.setFont(fontFamily, 'bold'); doc.text('Causality (Naranjo):', col1X, y + 27);
    doc.setFont(fontFamily, 'normal'); doc.text(norm.adr.naranjoCausality, col1X + 34, y + 27, { maxWidth: maxColWidth - 34 });

    doc.setFont(fontFamily, 'bold'); doc.text('Severity / Seriousness:', col2X, y + 27);
    doc.setFont(fontFamily, 'normal'); doc.text(`${norm.adr.reactionSeverity} (${norm.adr.reactionSeriousness})`, col2X + 36, y + 27, { maxWidth: maxColWidth - 36 });

    doc.setFont(fontFamily, 'bold'); doc.text('Dechallenge / Rechallenge:', col1X, y + 34);
    doc.setFont(fontFamily, 'normal'); doc.text(`Dechallenge: ${norm.adr.dechallengeInfo} | Rechallenge: ${norm.adr.rechallengeInfo}`, col1X + 40, y + 34, { maxWidth: contentWidth - 44 });

    y += 50;
    drawDualSignatures(y);
  }

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
  doc.save(`${norm.caseId}_Clinical_Documentation.pdf`);
};

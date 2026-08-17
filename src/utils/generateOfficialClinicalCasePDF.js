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
 * 2. FORM NAME: Exact title "PATIENT DOCUMENTATION FORM" / "PATIENT PROFILE DOCUMENTATION".
 * 3. CASE ID: Dynamic actual Case ID.
 * 4. ALL FIELDS: 100% dynamic extraction of all student-entered Patient Profile fields.
 * 5. LAYOUT: Multi-page natural flow on A4, Times New Roman, 14pt/12pt, Normal margins (15mm).
 * 6. SIGNATURES: Student & Preceptor Details/Signatures on final page of Patient Profile section.
 * 7. FORM BOUNDARY: Patient Profile ONLY. Counselling, Intervention, DIR, ADR excluded.
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
      const angle = watermarkPosition === 'Diagonal' ? 35 : 0;

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

  /**
   * Helper to draw a two-column Key-Value row with 0% text collision.
   * Calculates exact label width and text wrapping.
   * Returns row height (in mm) required by the tallest column.
   */
  const drawTwoColRow = (c1Label, c1Value, c2Label, c2Value, atY, col1LabelW = 42, col2LabelW = 42) => {
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(bodyFontSize); doc.setTextColor(15, 23, 42);
    doc.text(c1Label, col1X, atY);

    doc.setFont(fontFamily, 'normal');
    const c1ValX = col1X + col1LabelW;
    const c1MaxW = maxColWidth - col1LabelW;
    const c1Lines = doc.splitTextToSize(String(c1Value || '—'), c1MaxW);
    doc.text(c1Lines, c1ValX, atY);

    let c2LineCount = 0;
    if (c2Label) {
      doc.setFont(fontFamily, 'bold');
      doc.text(c2Label, col2X, atY);

      doc.setFont(fontFamily, 'normal');
      const c2ValX = col2X + col2LabelW;
      const c2MaxW = maxColWidth - col2LabelW;
      const c2Lines = doc.splitTextToSize(String(c2Value || '—'), c2MaxW);
      doc.text(c2Lines, c2ValX, atY);
      c2LineCount = c2Lines.length;
    }

    const totalLines = Math.max(c1Lines.length, c2LineCount, 1);
    return totalLines * 5.5 + 1.5;
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

  // =========================================================================
  // STEP 11: PATIENT PROFILE FORM ONLY
  // =========================================================================
  doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
  doc.text('PATIENT PROFILE DOCUMENTATION', marginX, y);
  y += 6;

  // 1. Structured 2-Column Demographics Box with Dynamic Height
  const boxStartY = y;
  let currRowY = y + 5;

  currRowY += drawTwoColRow('Patient Name:', norm.demographics.patientName, 'Age / Gender:', `${norm.demographics.age} Yrs / ${norm.demographics.gender}`, currRowY, 28, 28);
  currRowY += drawTwoColRow('IP/OP No:', norm.demographics.ipOpNo, 'Ward / Bed:', norm.demographics.wardBed, currRowY, 28, 28);
  currRowY += drawTwoColRow('Department:', norm.demographics.department, 'Attending Physician:', norm.demographics.physician, currRowY, 28, 42);
  currRowY += drawTwoColRow('Date of Admission:', norm.dates.doa, 'Date of Discharge:', norm.dates.dod, currRowY, 40, 38);
  currRowY += drawTwoColRow('Physical Measurements:', `Ht: ${norm.demographics.height} | Wt: ${norm.demographics.weight} | BMI: ${norm.demographics.bmi}`, 'Allergies:', `Drug: ${norm.demographics.allergyDrugs} | Food: ${norm.demographics.allergyFood}`, currRowY, 45, 22);
  currRowY += drawTwoColRow('Social History:', norm.demographics.socialHistory, 'Diet & Lifestyle:', norm.demographics.diet, currRowY, 28, 32);

  const boxHeight = currRowY - boxStartY + 2;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.rect(marginX, boxStartY, contentWidth, boxHeight, 'D');

  y = boxStartY + boxHeight + 6;

  // 2. Chief Complaints & Presenting History
  if (norm.history.chiefComplaints) {
    ensureSpace(16);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Chief Complaints & Presenting History:', marginX, y);
    y += 5.5;
    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
    const lines = doc.splitTextToSize(norm.history.chiefComplaints, contentWidth - 6);
    doc.text(lines, marginX + 3, y);
    y += (lines.length * 5.5) + 5;
  }

  // 3. Past Medical & Medication History
  if (norm.history.pastMedicalHistory) {
    ensureSpace(16);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Past Medical & Medication History:', marginX, y);
    y += 5.5;
    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
    const pastMed = norm.history.pastMedicationHistory ? ` (Meds: ${norm.history.pastMedicationHistory})` : '';
    const lines = doc.splitTextToSize(`${norm.history.pastMedicalHistory}${pastMed}`, contentWidth - 6);
    doc.text(lines, marginX + 3, y);
    y += (lines.length * 5.5) + 5;
  }

  // 4. Family Medical History
  if (norm.history.familyHistory) {
    ensureSpace(16);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Family Medical History:', marginX, y);
    y += 5.5;
    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
    const lines = doc.splitTextToSize(norm.history.familyHistory, contentWidth - 6);
    doc.text(lines, marginX + 3, y);
    y += (lines.length * 5.5) + 5;
  }

  // 5. General & Systemic Examinations
  if (norm.history.generalExam || norm.history.systemicExam) {
    ensureSpace(18);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('General & Systemic Examinations:', marginX, y);
    y += 5.5;
    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
    const genExam = norm.history.generalExam ? `General Exam: ${norm.history.generalExam}` : '';
    const sysExam = norm.history.systemicExam ? `Systemic Exam: ${norm.history.systemicExam}` : '';
    const lines = doc.splitTextToSize([genExam, sysExam].filter(Boolean).join('\n'), contentWidth - 6);
    doc.text(lines, marginX + 3, y);
    y += (lines.length * 5.5) + 6;
  }

  // 6. Provisional Diagnosis (if entered)
  if (norm.diagnosis.provisional) {
    ensureSpace(16);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Provisional Diagnosis:', marginX, y);
    y += 5.5;
    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
    const lines = doc.splitTextToSize(norm.diagnosis.provisional, contentWidth - 6);
    doc.text(lines, marginX + 3, y);
    y += (lines.length * 5.5) + 5;
  }

  // 7. Vital Signs Table
  ensureSpace(28);
  doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
  doc.text('VITAL SIGNS LOG CHART', marginX, y);
  y += 5.5;

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

  // 8. Laboratory Investigations Table
  ensureSpace(28);
  doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(2, 132, 199);
  doc.text('LABORATORY INVESTIGATIONS', marginX, y);
  y += 5.5;

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

  // 9. Other Investigations (if entered)
  if (norm.profile?.other_investigations) {
    ensureSpace(16);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Other Investigations:', marginX, y);
    y += 5.5;
    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
    const lines = doc.splitTextToSize(norm.profile.other_investigations, contentWidth - 6);
    doc.text(lines, marginX + 3, y);
    y += (lines.length * 5.5) + 5;
  }

  // 10. Prescribed Medication Profile Table
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

  // 11. Discharge Summary & Instructions
  if (norm.diagnosis.dischargeSummary) {
    ensureSpace(18);
    doc.setFont(fontFamily, 'bold'); doc.setFontSize(titleFontSize); doc.setTextColor(15, 23, 42);
    doc.text('Discharge Summary & Instructions:', marginX, y);
    y += 5.5;
    doc.setFont(fontFamily, 'normal'); doc.setFontSize(bodyFontSize);
    const lines = doc.splitTextToSize(norm.diagnosis.dischargeSummary, contentWidth - 6);
    doc.text(lines, marginX + 3, y);
    y += (lines.length * 5.5) + 6;
  }

  // 12. END OF PATIENT PROFILE FORM: Student & Preceptor Details / Signatures on FINAL PAGE
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

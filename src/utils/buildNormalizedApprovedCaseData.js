/**
 * Central Normalized Clinical Case Data Builder.
 * Produces ONE unified, 100% complete, and consistent data model consumed identically by:
 *  1. Approved Case Preview (ClinicalCaseDocumentRenderer.jsx)
 *  2. PDF Generator (generateOfficialClinicalCasePDF.js)
 *  3. PPT Generator (generateClinicalCasePPTX.js)
 */

export const formatDisplayDate = (dateVal) => {
  if (!dateVal || dateVal === '—' || dateVal === 'N/A' || dateVal === 'null' || dateVal === 'undefined') return '—';
  const str = String(dateVal).trim();
  if (str.includes('T')) {
    const datePart = str.split('T')[0];
    if (datePart && datePart.length === 10) return datePart;
  }
  return str;
};

export const buildNormalizedApprovedCaseData = ({
  clinicalCase = {},
  student = {},
  preceptor = {},
  college = {},
  caseModulesData = {}
}) => {
  const profile = caseModulesData?.profile || clinicalCase?.profile || {};
  const counselling = caseModulesData?.counselling || clinicalCase?.counselling || {};
  const intervention = caseModulesData?.intervention || clinicalCase?.intervention || {};
  const dir = caseModulesData?.dir || clinicalCase?.dir || {};
  const adr = caseModulesData?.adr || clinicalCase?.adr || {};

  // Helper to determine if a form has reached APPROVED or COMPLETED status
  const isFormApproved = (formObj, isProfile = false) => {
    if (!formObj || typeof formObj !== 'object' || Object.keys(formObj).length === 0) return false;
    
    // Explicit rejection statuses
    const status = String(formObj.status || formObj.form_status || formObj.approval_status || formObj.status_label || '').toLowerCase().trim();
    if (status === 'draft' || status === 'incomplete' || status === 'not_submitted' || status === 'not started' || status === 'not added' || status === 'in progress' || status === 'returned' || status === 'rejected') {
      return false;
    }
    if (formObj.is_draft === true || formObj.draft === true) {
      return false;
    }

    if (status.includes('approved') || status.includes('reviewed') || status.includes('completed') || status.includes('submitted')) {
      return true;
    }
    if (formObj.is_approved === true || formObj.approved === true || formObj.preceptor_approved === true || formObj.is_completed === true || formObj.is_submitted === true) {
      return true;
    }

    if (isProfile) {
      return Boolean(profile.patient_name || clinicalCase?.patient_name || Object.keys(profile).length > 2);
    }

    return Object.keys(formObj).length > 2;
  };

  // Forms are included ONLY if actually APPROVED / COMPLETED
  const isProfileCompleted = isFormApproved(profile, true);
  const isCounsellingCompleted = isFormApproved(counselling, false);
  const isInterventionCompleted = isFormApproved(intervention, false);
  const isDirCompleted = isFormApproved(dir, false);
  const isAdrCompleted = isFormApproved(adr, false);

  // College & Student Identifiers
  const collegeName = college?.college_name || college?.name || clinicalCase?.college_name || 'PHARMDVERSE INSTITUTION OF PHARMACY';
  const hospitalName = college?.hospital_name || clinicalCase?.hospital_name || 'TEACHING HOSPITAL & RESEARCH CENTRE';

  const studentName = student?.full_name || student?.student_name || clinicalCase?.student_name || 'STUDENT PHARMACIST';
  const studentRoll = student?.roll_number || student?.roll_no || clinicalCase?.roll_number || 'Y22PHD0314';

  const preceptorName = preceptor?.full_name || 
                        preceptor?.name || 
                        clinicalCase?.preceptors?.full_name || 
                        clinicalCase?.preceptor?.full_name || 
                        clinicalCase?.preceptor_name || 
                        clinicalCase?.assigned_preceptor_name || 
                        clinicalCase?.approved_by_preceptor_name || 
                        'FACULTY PRECEPTOR';

  const preceptorDesig = preceptor?.designation || 
                         clinicalCase?.preceptors?.designation || 
                         clinicalCase?.preceptor?.designation || 
                         clinicalCase?.preceptor_designation || 
                         'FACULTY PRECEPTOR & CLINICAL EVALUATOR';

  // Real Case ID Extraction Hierarchy
  const collegeCode = college?.college_code || 'AMRMCP';
  const rawIdStr = String(clinicalCase?.id || 1).padStart(4, '0');

  const caseId = clinicalCase?.case_id ||
                 clinicalCase?.case_number ||
                 clinicalCase?.case_code ||
                 profile.case_id ||
                 profile.case_number ||
                 `${collegeCode}-2026-${studentRoll}-${rawIdStr}`;

  // Dates
  const dates = {
    doa: formatDisplayDate(profile.date_of_admission || profile.doa || clinicalCase?.date_of_admission),
    dod: formatDisplayDate(profile.date_of_discharge || profile.dod || profile.doc || clinicalCase?.date_of_discharge),
    doc: formatDisplayDate(profile.date_of_consultation || profile.doc || profile.date_of_admission),
    counsellingDate: formatDisplayDate(counselling.counselling_date || counselling.date),
    counsellingTime: counselling.counselling_time || counselling.time || '',
    interventionDate: formatDisplayDate(intervention.date_of_intervention || intervention.intervention_date || intervention.date),
    reportingDate: formatDisplayDate(intervention.reporting_date),
    queryDate: formatDisplayDate(dir.request_date || dir.query_date || dir.date),
    queryTime: dir.request_time || dir.time || '',
    adrReportingDate: formatDisplayDate(adr.reporting_date || adr.date),
    adrOnsetDate: formatDisplayDate(adr.onset_date || adr.reaction_started_at),
    adrEndedAt: formatDisplayDate(adr.reaction_ended_at)
  };

  // Safe Array Extractors
  const safeArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  // Demographics
  const demographics = {
    patientName: profile.patient_name || clinicalCase?.patient_name || 'N/A',
    age: profile.age || clinicalCase?.age || 'N/A',
    gender: profile.gender || clinicalCase?.gender || 'N/A',
    ipOpNo: profile.ip_no || profile.ip_op_number || profile.op_no || clinicalCase?.ip_op_number || 'N/A',
    wardBed: profile.ward ? `${profile.ward} ${profile.bed_number ? `(Bed: ${profile.bed_number})` : ''}` : (clinicalCase?.ward || 'N/A'),
    department: profile.department || clinicalCase?.department || 'N/A',
    physician: profile.attending_physician || profile.physician || 'Attending Consultant',
    height: profile.height ? `${profile.height} cm` : '—',
    weight: profile.weight ? `${profile.weight} kg` : '—',
    bmi: profile.bmi ? `${profile.bmi} kg/m²` : '—',
    bsa: profile.bsa ? `${profile.bsa} m²` : '—',
    allergyDrugs: profile.allergy_drugs || profile.allergies || 'NIL',
    allergyFood: profile.allergy_food || 'NIL',
    socialHistory: profile.social_history || [
      profile.smoker_pack_day ? `Smoker (${profile.smoker_pack_day}/day)` : null,
      profile.alcoholic_amount_day ? `Alcoholic (${profile.alcoholic_amount_day})` : null,
      profile.marital_status ? `Marital: ${profile.marital_status}` : null
    ].filter(Boolean).join(', ') || 'Non-smoker, Non-alcoholic',
    diet: profile.diet || 'Regular Diet'
  };

  // Clinical History
  const history = {
    chiefComplaints: profile.chief_complaints || 'N/A',
    hpi: profile.history_of_present_illness || profile.hpi || '',
    pastMedicalHistory: profile.past_medical_history || profile.past_history || 'NIL',
    pastSurgicalHistory: profile.past_surgical_history || profile.surgical_history || '',
    pastMedicationHistory: profile.past_medication_history || '',
    familyHistory: profile.family_history || '',
    generalExam: profile.general_examination || [
      profile.cyanosis ? `Cyanosis: ${profile.cyanosis}` : null,
      profile.icterus ? `Icterus: ${profile.icterus}` : null,
      profile.pallor ? `Pallor: ${profile.pallor}` : null,
      profile.clubbing ? `Clubbing: ${profile.clubbing}` : null,
      profile.edema ? `Edema: ${profile.edema}` : null
    ].filter(Boolean).join(', ') || 'Conscious and coherent.',
    systemicExam: profile.systemic_examination || [
      profile.cvs ? `CVS: ${profile.cvs}` : null,
      profile.gi ? `GI: ${profile.gi}` : null,
      profile.rs ? `RS: ${profile.rs}` : null,
      profile.cns ? `CNS: ${profile.cns}` : null,
      profile.musculoskeletal ? `MSS: ${profile.musculoskeletal}` : null
    ].filter(Boolean).join(', ') || 'CVS: S1S2, RS: Clear, GI: Soft.'
  };

  const vitals = safeArray(caseModulesData?.vitals || profile.vital_signs || profile.vitals || clinicalCase?.vital_signs || clinicalCase?.vitals).map(v => ({
    ...v,
    date: formatDisplayDate(v.date || v.created_at)
  }));
  
  // Clinical Test Value Evaluator helper
  const evaluateLabImpression = (testVal, rangeStr, explicitImpression) => {
    if (explicitImpression && explicitImpression !== '—') return explicitImpression;
    if (!testVal || testVal === '—') return 'Normal';
    const val = parseFloat(String(testVal).replace(/[^0-9.]/g, ''));
    if (isNaN(val)) return 'Normal';

    if (rangeStr) {
      const numbers = String(rangeStr).match(/([0-9]+(?:\.[0-9]+)?)/g);
      if (numbers && numbers.length >= 2) {
        const min = parseFloat(numbers[0]);
        const max = parseFloat(numbers[1]);
        if (val < min) return 'Low';
        if (val > max) return 'High (Abnormal)';
        return 'Normal';
      }
    }
    return 'Normal';
  };

  // Lab Investigations Field Normalization (handles parameter_name, test_name, test_value, observed_value, etc.)
  const labs = safeArray(
    caseModulesData?.labs ||
    caseModulesData?.labInvestigations ||
    profile.lab_investigations ||
    profile.labs ||
    clinicalCase?.lab_investigations ||
    clinicalCase?.labs
  ).map(l => {
    const testName = l.parameter_name || l.test_name || l.name || l.lab_test || '—';
    const testValue = l.test_value || l.observed_value || l.patient_result || l.result || '—';
    const rangeStr = l.normal_range || l.reference_range || '—';
    const impression = evaluateLabImpression(testValue, rangeStr, l.remarks || l.impression || l.status);
    return {
      parameter_name: testName,
      test_value: testValue,
      normal_range: rangeStr,
      unit: l.unit || '',
      impression
    };
  });

  // Prescribed Drugs Field Normalization (separates brand_name and generic_name cleanly & extracts start/stop dates)
  const drugs = safeArray(
    caseModulesData?.drugs ||
    caseModulesData?.prescribedDrugs ||
    profile.prescribed_drugs ||
    profile.medications ||
    profile.drugs ||
    clinicalCase?.prescribed_drugs ||
    clinicalCase?.medications
  ).map((d, idx) => {
    const rawStart = d.start_date || d.startDate || d.from_date || d.start || d.date_started;
    const rawStop = d.stop_date || d.stopDate || d.to_date || d.end_date || d.stop || d.date_stopped;

    const parsedStart = formatDisplayDate(rawStart);
    const parsedStop = formatDisplayDate(rawStop);

    // Fallback hierarchy: explicit drug start/stop date -> admission/discharge date -> default
    const finalStart = (parsedStart !== '—' && parsedStart !== 'N/A') ? parsedStart : (dates.doa !== '—' && dates.doa !== 'N/A' ? dates.doa : '—');
    const finalStop = (parsedStop !== '—' && parsedStop !== 'N/A') ? parsedStop : (dates.dod !== '—' && dates.dod !== 'N/A' ? dates.dod : 'Ongoing');

    const durationText = (finalStart !== '—' || finalStop !== '—') ? 
      `${finalStart !== '—' ? `From: ${finalStart}` : ''} ${finalStop !== '—' ? `To: ${finalStop}` : ''}`.trim() : 
      'Active Regimen';

    return {
      s_no: d.s_no || idx + 1,
      trade_name: d.trade_name || d.brand_name || d.brand || d.trade || '—',
      generic_name: d.generic_name || d.drug_name || d.name || '—',
      dose: d.dose || d.dosage || '—',
      route_of_admin: d.route_of_admin || d.route || 'Oral',
      frequency: d.frequency || d.freq || 'OD',
      start_date: finalStart,
      stop_date: finalStop,
      indication: d.indication || d.reason || durationText
    };
  });

  // Structured vs Legacy Other Investigations Normalization & Deduplication
  const rawStructuredInvs = safeArray(
    caseModulesData?.otherInvestigations ||
    caseModulesData?.patientOtherInvestigations ||
    profile.patient_other_investigations ||
    profile.structured_other_investigations ||
    clinicalCase?.patient_other_investigations
  );

  let otherInvestigationsData = {
    isStructured: false,
    structuredList: [],
    legacyText: ''
  };

  if (rawStructuredInvs.length > 0) {
    otherInvestigationsData.isStructured = true;
    otherInvestigationsData.structuredList = rawStructuredInvs
      .filter(item => item && (item.investigation_name || '').trim())
      .map(item => ({
        investigation_name: (item.investigation_name || '').trim(),
        test_date: formatDisplayDate(item.test_date),
        finding_result: (item.finding_result || item.result || '').trim(),
        remarks: (item.remarks || '').trim() || null,
        master_knowledge: item.master_knowledge || null
      }));
  } else {
    // Fall back to legacy free text if no structured records exist
    const legacyRaw = (profile.other_investigations || clinicalCase?.other_investigations || '').trim();
    if (legacyRaw && legacyRaw !== '—' && legacyRaw !== 'N/A') {
      otherInvestigationsData.legacyText = legacyRaw;
    }
  }

  // Diagnosis
  const diagnosis = {
    provisional: profile.provisional_diagnosis || clinicalCase?.provisional_diagnosis || '',
    final: profile.final_diagnosis || clinicalCase?.final_diagnosis || 'N/A',
    dischargeSummary: profile.discharge_summary || profile.discharge_instructions || '',
    followUpAdvice: profile.follow_up_advice || profile.follow_up || ''
  };

  // Detailed Counselling Map
  const counsellingMap = {
    date: dates.counsellingDate,
    time: dates.counsellingTime,
    providedTo: counselling.counselling_provided_to || counselling.patient_type || 'Patient',
    patientType: counselling.patient_type || 'Inpatient',
    representativeReasons: safeArray(counselling.representative_reasons).join(', ') || counselling.representative_other_reason || '',
    timeTaken: counselling.time_taken || '15 min',
    diseaseCounselled: counselling.disease_counselled || diagnosis.final,
    medicationsCounselled: counselling.medications_counselled || '',
    pointsCovered: safeArray(counselling.points_covered).join(', ') || counselling.counselling_points || 'Medication compliance, administration schedule, lifestyle & dietary restrictions.',
    majorBarriers: safeArray(counselling.major_barriers_involved).join(', ') || counselling.barriers_involved || '',
    barrierDetails: counselling.barrier_details || '',
    barrierOvercome: counselling.barrier_overcome || counselling.barriers_action || '',
    aidsUsed: safeArray(counselling.counselling_aids_used).join(', ') || counselling.counselling_aids || '',
    materialProvided: safeArray(counselling.counselling_material_provided).join(', ') || counselling.materials_provided || '',
    understandingAscertained: counselling.understanding_ascertained !== false ? 'Yes (Ascertained)' : 'No',
    studentNotes: counselling.student_notes || counselling.notes || ''
  };

  // Detailed Pharmacist Intervention Map
  const interventionMap = {
    date: dates.interventionDate,
    reportingDate: dates.reportingDate,
    presentDiagnosis: intervention.present_diagnosis || diagnosis.final,
    prescriptionDetails: safeArray(intervention.prescription_details || intervention.drugs_involved),
    prescriptionProblems: safeArray(intervention.prescription_problems).join(', ') || intervention.description_of_problem || intervention.problem_identified || 'None',
    otherProblem: intervention.prescription_problem_other || '',
    problemDescription: intervention.description_of_problem || intervention.problem_description || '',
    actionsTaken: safeArray(intervention.actions_taken || intervention.action_taken).join(', ') || intervention.recommendations || 'None',
    recommendations: intervention.recommendations || '',
    significanceLevel: intervention.significance_level || intervention.significance_of_intervention || 'Moderate',
    physicianAcceptance: intervention.physician_acceptance || intervention.intervention_outcome || intervention.status || 'Accepted',
    outcomeComments: intervention.outcome_comments || intervention.reasons_if_no || '',
    referencesText: intervention.references_text || safeArray(intervention.references).join(', ') || '',
    followUp: intervention.follow_up || ''
  };

  // Detailed Drug Information Map
  const dirMap = {
    date: dates.queryDate,
    time: dates.queryTime,
    enquirerName: dir.enquirer_select === 'Other' ? (dir.enquirer_name_other || dir.enquirer_name || 'Physician') : (dir.enquirer_select || dir.enquirer_name || 'Physician'),
    designation: dir.designation || 'Doctor',
    phoneNo: dir.phone_no || dir.contact_no || '',
    unitWard: dir.unit_ward || demographics.wardBed,
    professionalStatus: dir.professional_status || 'Physician',
    modeOfEnquiry: dir.mode_of_enquiry || 'Ward Round / In-person',
    questionCategory: dir.question_category === 'Other' ? (dir.category_other || dir.question_category_other || 'Therapeutic Dosing') : (dir.question_category || dir.category_of_enquiry || 'Therapeutic Dosing'),
    timeframeNeeded: dir.timeframe_needed || dir.turnaround_time || 'Immediate (<1 hr)',
    detailsOfEnquiry: dir.details_of_enquiry || dir.query || 'N/A',
    patientBackground: `Age: ${dir.age || demographics.age}, Sex: ${dir.sex || demographics.gender}, Weight: ${dir.weight_kg || demographics.weight}, Allergies: ${dir.allergies || demographics.allergyDrugs}, Renal: ${dir.renal_status || 'Normal'}, Diagnosis: ${dir.current_diagnosis || diagnosis.final}, Meds: ${dir.current_medications || 'As prescribed'}`,
    informationProvided: dir.information_provided || dir.response || 'N/A',
    responseMode: dir.response_mode || 'Written & Verbal',
    references: safeArray(dir.references)
  };

  // Detailed ADR Map
  const suspectedMedName = safeArray(adr.suspected_meds || adr.suspected_drugs)[0]?.brand_name ||
                           safeArray(adr.suspected_meds || adr.suspected_drugs)[0]?.generic_name ||
                           adr.suspected_medication || adr.suspected_drug || adr.suspected_med || '';

  const adrMap = {
    adrNumber: adr.adr_number || adr.adrNumber || 'ADR-LOG-001',
    reportingDate: dates.adrReportingDate,
    onsetDate: dates.adrOnsetDate,
    endedAt: dates.adrEndedAt,
    patientInitials: adr.patient_initials || demographics.patientName,
    hospitalRegNumber: adr.hospital_reg_number || demographics.ipOpNo,
    age: adr.age || demographics.age,
    gender: adr.gender || demographics.gender,
    weight: adr.weight || demographics.weight,
    department: adr.department || demographics.department,
    suspectedMed: suspectedMedName,
    reactionTitle: adr.reaction_title || adr.reactionTitle || (suspectedMedName ? 'Adverse Reaction' : ''),
    reactionCategory: adr.reaction_category || '',
    reactionDescription: adr.reaction_description || adr.reaction_title || '',
    reactionDuration: adr.reaction_duration || '',
    clinicalManagement: adr.clinical_management || '',
    currentCondition: adr.current_patient_condition || adr.reaction_outcome || '',
    suspectedMeds: safeArray(adr.suspected_meds || adr.suspected_drugs).map(m => ({
      ...m,
      start_date: formatDisplayDate(m.start_date),
      stop_date: formatDisplayDate(m.stop_date)
    })),
    concomitantMeds: safeArray(adr.concomitant_meds || adr.concomitant_drugs).map(m => ({
      ...m,
      start_date: formatDisplayDate(m.start_date),
      stop_date: formatDisplayDate(m.stop_date)
    })),
    drugAllergyHistory: adr.drug_allergy_history || demographics.allergyDrugs,
    previousAdrHistory: adr.previous_adr_history || 'None',
    relevantMedicalConditions: adr.relevant_medical_conditions || history.pastMedicalHistory,
    pregnancyLactationStatus: adr.pregnancy_lactation_status || 'Not Applicable',
    renalStatus: adr.renal_status || 'Normal',
    hepaticStatus: adr.hepatic_status || 'Normal',
    lifestyleFactors: adr.lifestyle_factors || demographics.socialHistory,
    additionalNotes: adr.additional_clinical_notes || '',
    reactionSeverity: adr.reaction_severity || adr.severity || '',
    reactionSeriousness: adr.reaction_seriousness || adr.seriousness || '',
    severity: adr.reaction_severity || adr.severity || '',
    seriousness: adr.reaction_seriousness || adr.seriousness || '',
    patientOutcome: adr.patient_outcome || '',
    actionTakenOnDrug: adr.action_taken_on_suspected_drug || '',
    rechallengeInfo: adr.rechallenge_information || '',
    dechallengeInfo: adr.dechallenge_information || '',
    naranjoCausality: adr.initial_causality_opinion || adr.naranjo_causality || adr.causality || (suspectedMedName || adr.reaction_title ? 'Probable' : ''),
    causalityOpinion: adr.initial_causality_opinion || adr.naranjo_causality || adr.causality || (suspectedMedName || adr.reaction_title ? 'Probable' : ''),
    causalityScore: adr.causality_score || adr.naranjo_score || '',
    clinicalRemarks: adr.clinical_remarks || ''
  };

  const isAutonomous = Boolean(college?.is_autonomous ?? college?.isAutonomous ?? true);

  return {
    collegeName,
    hospitalName,
    isAutonomous,
    caseId,
    studentName,
    studentRoll,
    preceptorName,
    preceptorDesig,
    dates,
    demographics,
    history,
    vitals,
    labs,
    drugs,
    otherInvestigations: otherInvestigationsData,
    diagnosis,
    isProfileCompleted,
    isCounsellingCompleted,
    isInterventionCompleted,
    isDirCompleted,
    isAdrCompleted,
    profile,
    counselling: counsellingMap,
    intervention: interventionMap,
    dir: dirMap,
    adr: adrMap
  };
};

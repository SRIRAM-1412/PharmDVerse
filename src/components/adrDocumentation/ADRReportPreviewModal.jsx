import React, { useState, useEffect } from 'react';
import { X, Printer, ShieldAlert } from 'lucide-react';
import { fetchDocumentBrandingSettingsFromSupabase } from '../../services/supabaseService';
import { PharmDVerseBrandedDocumentContainer } from '../branding/PharmDVerseBrandedDocumentContainer';

export const ADRReportPreviewModal = ({ isOpen, onClose, clinicalCase, student, report, suspectedMeds, concomitantMeds, attachments }) => {
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    const loadBranding = async () => {
      if (student?.college_id) {
        const res = await fetchDocumentBrandingSettingsFromSupabase(student.college_id);
        if (res.success && res.settings) {
          setBranding(res.settings);
        }
      }
    };
    if (isOpen) loadBranding();
  }, [isOpen, student]);

  if (!isOpen) return null;

  const college = student?.colleges;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL ACTION BAR */}
        <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-extrabold tracking-tight">PharmDVerse ADR Documentation (2-Page A4 PDF Preview)</h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MULTI-PAGE PDF DOCUMENT WRAPPER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 font-serif text-slate-900 space-y-8 print:p-0 print:bg-white">
          
          {/* ================= PAGE 1: GENERAL RECORD, PATIENT OVERVIEW, REACTION & MEDICATION TABLES ================= */}
          <PharmDVerseBrandedDocumentContainer
            college={college}
            branding={branding}
            documentTitle="ADR Documentation"
            caseId={clinicalCase?.case_id}
            student={student}
            preceptorName={report?.assigned_preceptor_name}
            pageNumber="1 of 2"
            showSignatures={false}
          >
            {/* SECTION 1: GENERAL RECORD */}
            <div className="border border-slate-900 p-3 bg-slate-50/30 space-y-2 text-xs">
              <strong className="block font-bold uppercase border-b border-slate-900 pb-1 text-amber-900">
                1. General Record Information
              </strong>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-bold">
                <div>ADR Record No: <span className="font-mono underline text-amber-700">{report?.adr_number || 'ADR-2026-000001'}</span></div>
                <div>Reporting Date: <span className="font-mono underline">{report?.reporting_date || '—'}</span></div>
                <div>Reported By: <span className="underline">{student?.full_name} ({student?.roll_number})</span></div>
                <div>Preceptor: <span className="underline">{report?.assigned_preceptor_name || 'Faculty Preceptor'}</span></div>
                <div>Status: <span className="uppercase underline font-mono text-emerald-800">{report?.approval_status || 'Draft'}</span></div>
              </div>
            </div>

            {/* SECTION 2: PATIENT OVERVIEW */}
            <div className="border border-slate-900 p-3 bg-slate-50/30 space-y-2 text-xs">
              <strong className="block font-bold uppercase border-b border-slate-900 pb-1 text-slate-900">
                2. Patient Overview
              </strong>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-bold">
                <div>Initials: <span className="underline">{report?.patient_initials || '—'}</span></div>
                <div>Reg No: <span className="font-mono underline">{report?.hospital_reg_number || '—'}</span></div>
                <div>Age / Gender: <span className="underline">{report?.age} yrs / {report?.gender}</span></div>
                <div>Weight: <span className="font-mono underline">{report?.weight} kg</span></div>
                <div>Department: <span className="underline">{report?.department}</span></div>
                <div>Ward / Unit: <span className="underline">{report?.ward}</span></div>
                <div className="col-span-2">Primary Diagnosis: <span className="underline italic">{report?.primary_diagnosis || 'N/A'}</span></div>
              </div>
            </div>

            {/* SECTION 3: REACTION DETAILS */}
            <div className="border border-slate-900 p-3 bg-slate-50/30 space-y-2 text-xs">
              <strong className="block font-bold uppercase border-b border-slate-900 pb-1 text-rose-900">
                3. Adverse Reaction Overview
              </strong>
              <div className="grid grid-cols-2 gap-2 font-bold">
                <div className="col-span-2">Reaction Title: <span className="underline text-rose-800 text-sm font-extrabold">{report?.reaction_title || 'N/A'}</span></div>
                <div>Category: <span className="underline">{report?.reaction_category || 'General'}</span></div>
                <div>Patient Condition: <span className="underline">{report?.current_patient_condition || 'Recovering'}</span></div>
                <div>Started At: <span className="font-mono underline">{report?.reaction_started_at || '—'}</span></div>
                <div>Ended At: <span className="font-mono underline">{report?.reaction_ended_at || '—'}</span></div>
                <div>Duration: <span className="underline">{report?.reaction_duration || '—'}</span></div>
              </div>
              <div className="pt-1">
                <strong className="block font-bold">Clinical Description:</strong>
                <p className="p-2 border border-slate-900 bg-white font-serif italic text-slate-900">
                  {report?.reaction_description || 'N/A'}
                </p>
              </div>
              {report?.clinical_management_provided && (
                <div className="font-bold pt-1">
                  Management Provided: <span className="underline font-normal">{report.clinical_management_provided}</span>
                </div>
              )}
            </div>

            {/* SECTION 4: SUSPECTED MEDICATION TABLE */}
            <div className="space-y-2 text-xs">
              <strong className="block font-bold uppercase border-b border-slate-900 pb-1 text-amber-900">
                4. Suspected Medication(s)
              </strong>
              <table className="w-full text-left border-2 border-slate-900 border-collapse">
                <thead className="bg-slate-200 font-bold uppercase text-[10px] border-b border-slate-900">
                  <tr>
                    <th className="p-2 border-r border-slate-900">Brand Name</th>
                    <th className="p-2 border-r border-slate-900">Generic</th>
                    <th className="p-2 border-r border-slate-900">Dose & Route</th>
                    <th className="p-2 border-r border-slate-900">Therapy Dates</th>
                    <th className="p-2">Indication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-serif">
                  {suspectedMeds && suspectedMeds.length > 0 ? (
                    suspectedMeds.map((m, i) => (
                      <tr key={i} className="border-b border-slate-900">
                        <td className="p-2 border-r border-slate-900 font-bold">{m.medicine_name}</td>
                        <td className="p-2 border-r border-slate-900">{m.generic_name || '—'}</td>
                        <td className="p-2 border-r border-slate-900 font-mono">{m.dose} ({m.route} / {m.frequency})</td>
                        <td className="p-2 border-r border-slate-900 font-mono text-[10px]">{m.start_date} to {m.stop_date || 'Ongoing'}</td>
                        <td className="p-2">{m.clinical_indication || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="p-3 text-center italic text-slate-500">No suspected medications recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* SECTION 5: CONCOMITANT MEDICATIONS */}
            {concomitantMeds && concomitantMeds.length > 0 && (
              <div className="space-y-2 text-xs">
                <strong className="block font-bold uppercase border-b border-slate-900 pb-1">
                  5. Other Concurrent Medications
                </strong>
                <table className="w-full text-left border border-slate-900 border-collapse">
                  <thead className="bg-slate-100 font-bold uppercase text-[10px] border-b border-slate-900">
                    <tr>
                      <th className="p-1.5 border-r border-slate-900">Medicine</th>
                      <th className="p-1.5 border-r border-slate-900">Dose & Freq</th>
                      <th className="p-1.5 border-r border-slate-900">Purpose</th>
                      <th className="p-1.5">Therapy Dates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-serif">
                    {concomitantMeds.map((m, i) => (
                      <tr key={i} className="border-b border-slate-900">
                        <td className="p-1.5 border-r border-slate-900 font-bold">{m.medicine_name}</td>
                        <td className="p-1.5 border-r border-slate-900 font-mono">{m.dose} ({m.frequency})</td>
                        <td className="p-1.5 border-r border-slate-900">{m.purpose || '—'}</td>
                        <td className="p-1.5 font-mono text-[10px]">{m.start_date} to {m.stop_date || 'Ongoing'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PharmDVerseBrandedDocumentContainer>

          {/* ================= PAGE 2: CLINICAL BACKGROUND, CAUSALITY & REMARKS ================= */}
          <PharmDVerseBrandedDocumentContainer
            college={college}
            branding={branding}
            documentTitle="ADR Documentation (Continued)"
            caseId={clinicalCase?.case_id}
            student={student}
            preceptorName={report?.assigned_preceptor_name}
            pageNumber="2 of 2"
            isLastPage={true}
          >
            {/* SECTIONS 6 & 7: CLINICAL BACKGROUND & REACTION ASSESSMENT */}
            <div className="grid grid-cols-2 gap-3 border border-slate-900 p-3 bg-slate-50/30 text-xs">
              <div className="space-y-1 font-bold">
                <strong className="block border-b border-slate-900 pb-1 uppercase text-slate-900">
                  6. Clinical Background
                </strong>
                <div>Allergies: <span className="underline text-rose-700">{report?.drug_allergy_history || 'None'}</span></div>
                <div>Previous ADR: <span className="underline">{report?.previous_adr_history || 'None'}</span></div>
                <div>Medical Conditions: <span className="underline">{report?.relevant_medical_conditions || 'None'}</span></div>
                <div>Pregnancy/Lactation: <span className="underline">{report?.pregnancy_lactation_status || 'N/A'}</span></div>
                <div>Renal / Hepatic: <span className="underline">{report?.renal_status} / {report?.hepatic_status}</span></div>
                <div>Lifestyle Factors: <span className="underline">{report?.lifestyle_factors || 'N/A'}</span></div>
                {report?.additional_clinical_notes && (
                  <div>Additional Notes: <span className="font-normal italic">{report.additional_clinical_notes}</span></div>
                )}
              </div>

              <div className="space-y-1 font-bold border-l border-slate-900 pl-3">
                <strong className="block border-b border-slate-900 pb-1 uppercase text-indigo-900">
                  7. Reaction Assessment
                </strong>
                <div>Severity: <span className="underline text-indigo-800">{report?.reaction_severity || 'Moderate'}</span></div>
                <div>Seriousness: <span className="underline">{report?.reaction_seriousness || 'Non-serious'}</span></div>
                <div>Outcome: <span className="underline text-emerald-800">{report?.patient_outcome || 'Recovered'}</span></div>
                <div>Action Taken: <span className="underline">{report?.action_taken_on_suspected_drug || 'Drug Withdrawn'}</span></div>
                <div>Rechallenge Info: <span className="underline">{report?.rechallenge_information || 'N/A'}</span></div>
                <div>Dechallenge Info: <span className="underline">{report?.dechallenge_information || 'N/A'}</span></div>
                <div>Causality Opinion: <span className="underline text-indigo-900">{report?.initial_causality_opinion || 'Probable/Likely'}</span></div>
              </div>
            </div>

            {/* SECTION 8: REMARKS & ATTACHMENTS */}
            <div className="border border-slate-900 p-3 bg-slate-50/20 text-xs space-y-2">
              <strong className="block border-b border-slate-900 pb-1 uppercase font-bold text-slate-900">
                8. Review Information & Remarks
              </strong>
              {report?.student_remarks && <div><strong>Student Remarks:</strong> <p className="italic">{report.student_remarks}</p></div>}
              {report?.preceptor_review && <div><strong>Preceptor Review:</strong> <p className="italic font-bold">{report.preceptor_review}</p></div>}
              {report?.faculty_comments && <div><strong>Faculty Comments:</strong> <p className="italic">{report.faculty_comments}</p></div>}
              {attachments && attachments.length > 0 && (
                <div className="font-mono text-[11px] pt-1 border-t border-slate-900">
                  <strong>Supporting Attachments ({attachments.length}):</strong>{' '}
                  {attachments.map(a => a.file_name).join(', ')}
                </div>
              )}
            </div>
          </PharmDVerseBrandedDocumentContainer>

        </div>

      </div>
    </div>
  );
};

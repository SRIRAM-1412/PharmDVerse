import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Filter, Plus, Edit3, Trash2, Eye, Send, ChevronLeft, ChevronRight, Loader2, Save, X, AlertTriangle, Stethoscope, HeartHandshake, ShieldAlert, FileSearch, Download, RotateCcw } from 'lucide-react';
import { fetchStudentCasesFromSupabase, updateClinicalCaseInSupabase, deleteClinicalCaseFromSupabase, fetchCaseModuleStatusesMapFromSupabase, submitCompleteClinicalCaseInSupabase } from '../../services/supabaseService';
import { ModalWrapper } from '../modals/ModalWrapper';
import { InlineActionNotification } from '../common/InlineActionNotification';
import { useInlineNotification } from '../../hooks/useInlineNotification';
import { OfficialClinicalCasePDFModal } from '../modals/OfficialClinicalCasePDFModal';

export const MyClinicalCasesView = ({ student, initialFilter = 'All', targetCaseId = null, onClearTargetCase, onAddNew, onOpenPatientProfile, onOpenPatientCounselling, onOpenPharmacistIntervention, onOpenDrugInformationRequest, onOpenADRDocumentation, isExpired }) => {
  const [cases, setCases] = useState([]);
  const [moduleStatuses, setModuleStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCaseForPDF, setSelectedCaseForPDF] = useState(null);

  // Inline Notification
  const { notification: actionNotify, showNotification: showActionNotify, clearNotification: clearActionNotify } = useInlineNotification();
  const [activeCaseNotifyId, setActiveCaseNotifyId] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter || 'All');

  useEffect(() => {
    if (initialFilter) {
      setStatusFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (targetCaseId && cases.length > 0) {
      const found = cases.find(c => c.id === targetCaseId || c.case_id === targetCaseId);
      if (found) {
        if (found.status === 'Approved' || found.overall_case_status === 'Approved') {
          setSelectedCaseForPDF(found);
        } else {
          setSelectedCase(found);
          setIsViewModalOpen(true);
        }
        if (onClearTargetCase) onClearTargetCase();
      }
    }
  }, [targetCaseId, cases]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // View / Edit / Delete Modals
  const [selectedCase, setSelectedCase] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleTriggerAction = (e, actionFn, caseObj, moduleName) => {
    e.stopPropagation();
    clearActionNotify();
    setActiveCaseNotifyId(caseObj.id);

    try {
      if (typeof actionFn === 'function') {
        actionFn(caseObj);
      } else {
        showActionNotify({ type: 'error', message: `❌ Unable to open ${moduleName}.` });
      }
    } catch (err) {
      showActionNotify({ type: 'error', message: `❌ Unable to open ${moduleName}.` });
    }
  };

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    hospitalName: '',
    department: '',
    wardUnit: '',
    ipOpType: 'IP',
    dateOfAdmission: '',
    dateOfCollection: '',
    status: 'Draft'
  });

  const loadStudentCases = async () => {
    if (!student) return;
    setLoading(true);
    const res = await fetchStudentCasesFromSupabase(student.id);
    if (res.success) {
      const fetchedCases = res.data || [];
      setCases(fetchedCases);

      const caseIds = fetchedCases.map(c => c.id);
      const statusesRes = await fetchCaseModuleStatusesMapFromSupabase(caseIds);
      if (statusesRes.success) {
        setModuleStatuses(statusesRes.statusesMap || {});
      }
    } else {
      setCases([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStudentCases();
  }, [student]);

  // Filtered Cases
  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.case_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.hospital_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ward_unit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ip_op_type?.toLowerCase().includes(searchQuery.toLowerCase());

    const caseStatus = c.status || c.overall_case_status || 'Draft';
    const matchesStatus = statusFilter === 'All' || caseStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage) || 1;
  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenEditModal = (caseRecord) => {
    setSelectedCase(caseRecord);
    setEditFormError('');
    setEditFormSuccess('');
    setEditFieldErrors({});
    setEditFormData({
      hospitalName: caseRecord.hospital_name || '',
      department: caseRecord.department || '',
      wardUnit: caseRecord.ward_unit || '',
      ipOpType: caseRecord.ip_op_type || 'IP',
      dateOfAdmission: caseRecord.date_of_admission || '',
      dateOfCollection: caseRecord.date_of_collection || caseRecord.date_of_admission || '',
      finalDiagnosis: caseRecord.final_diagnosis || moduleStatuses[caseRecord.id]?.finalDiagnosis || '',
      status: caseRecord.status
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    setEditFormError('');
    setEditFormSuccess('');
    const errors = {};

    if (!editFormData.hospitalName.trim()) errors.hospitalName = 'Hospital name is required.';
    if (!editFormData.department.trim()) errors.department = 'Department is required.';
    if (!editFormData.wardUnit.trim()) errors.wardUnit = 'Ward/Unit is required.';
    if (!editFormData.dateOfAdmission) errors.dateOfAdmission = 'Date of admission is required.';
    if (!editFormData.finalDiagnosis.trim()) errors.finalDiagnosis = 'Final diagnosis is required.';

    if (Object.keys(errors).length > 0) {
      setEditFieldErrors(errors);
      setEditFormError('Please complete all required fields highlighted in red.');
      return;
    }
    setEditFieldErrors({});

    setActionLoading(true);
    const res = await updateClinicalCaseInSupabase(selectedCase.id, editFormData);
    setActionLoading(false);

    if (res.success) {
      setEditFormSuccess('Clinical case updated successfully!');
      setTimeout(async () => {
        setEditFormSuccess('');
        setIsEditModalOpen(false);
        await loadStudentCases();
      }, 1200);
    } else {
      setEditFormError(res.error || 'Failed to update clinical case.');
    }
  };

  const handleSubmitCase = async (caseRecord) => {
    clearActionNotify();
    setActiveCaseNotifyId(caseRecord.id);

    setActionLoading(true);
    // Real-time re-fetch of case module statuses to guarantee consistency
    const statusesRes = await fetchCaseModuleStatusesMapFromSupabase([caseRecord.id]);
    setActionLoading(false);

    let caseStatusInfo = moduleStatuses[caseRecord.id];
    if (statusesRes.success && statusesRes.statusesMap[caseRecord.id]) {
      caseStatusInfo = statusesRes.statusesMap[caseRecord.id];
      // Update local state so UI reflects the change immediately
      setModuleStatuses(prev => ({
        ...prev,
        [caseRecord.id]: caseStatusInfo
      }));
    }

    const isProfileCompleted = !!caseStatusInfo?.profile_completed;
    const isCounsellingCompleted = !!caseStatusInfo?.counselling_completed;

    if (!isProfileCompleted || !isCounsellingCompleted) {
      showActionNotify({
        type: 'error',
        message: '❌ Complete Patient Profile and Patient Counselling before submitting this Clinical Case.'
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to SUBMIT complete Clinical Case ${caseRecord.case_id} for Preceptor Review?`)) return;

    setActionLoading(true);
    const res = await submitCompleteClinicalCaseInSupabase(caseRecord, caseStatusInfo);
    setActionLoading(false);

    if (res.success) {
      showActionNotify({
        type: 'success',
        message: '✅ Clinical Case submitted successfully for Preceptor Review!'
      });
      await loadStudentCases();
    } else {
      showActionNotify({
        type: 'error',
        message: res.error || '❌ Failed to submit Clinical Case.'
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!caseToDelete) return;
    setDeleteError(null);
    setActionLoading(true);
    try {
      const res = await deleteClinicalCaseFromSupabase(caseToDelete.id);
      if (res && res.error) {
        setDeleteError(res.error.message || 'Failed to delete draft case.');
      } else {
        setCaseToDelete(null);
        await loadStudentCases();
      }
    } catch (err) {
      setDeleteError('Failed to delete draft case.');
    } finally {
      setActionLoading(false);
    }
  };

  const isFormReturned = (c, formKey, formTitle) => {
    if (!c || c.status !== 'Returned') return false;
    const returnedArr = c.returned_forms || [];
    if (!Array.isArray(returnedArr)) return false;
    return returnedArr.some(f =>
      f === formKey ||
      f === formTitle ||
      f?.toLowerCase() === formKey?.toLowerCase() ||
      f?.toLowerCase() === formTitle?.toLowerCase()
    );
  };

  const renderModuleDot = (statusStr) => {
    if (statusStr === 'Completed' || statusStr === 'Submitted' || statusStr === 'Approved' || statusStr === 'Reviewed') {
      return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" title="Completed / Submitted" />;
    }
    if (statusStr === 'Returned') {
      return <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" title="Returned" />;
    }
    if (statusStr === 'Draft') {
      return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" title="Draft" />;
    }
    return <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" title="Not Started" />;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>My Clinical Patient Cases</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
            Student logbook patient cases created by <strong className="text-slate-800 dark:text-slate-200">{student?.full_name}</strong>.
          </p>
        </div>

        <button
          onClick={onAddNew}
          disabled={isExpired}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xs hover:shadow-md transition-all ${isExpired ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'}`}
        >
          <FilePlus2 className="w-4 h-4" />
          <span>Add New Case</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Case ID, hospital, department..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {['All', 'Draft', 'Submitted', 'Under Review', 'Returned', 'Approved'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABLE DIRECTORY */}
      {loading ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">Loading Clinical Cases...</p>
        </div>
      ) : paginatedCases.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <ClipboardList className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No clinical cases found.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'All'
              ? 'No cases matched your search query.'
              : 'You have not added any clinical cases yet. Click "Add New Case" above.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Case ID</th>
                  <th className="py-3.5 px-5">Hospital Name</th>
                  <th className="py-3.5 px-5">Final Diagnosis</th>
                  <th className="py-3.5 px-5">Date of Admission</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {paginatedCases.map((c) => {
                  const diag = c.final_diagnosis || moduleStatuses[c.id]?.finalDiagnosis || '—';
                  return (
                    <React.Fragment key={c.id}>
                      {/* ROW 1 — CASE DETAILS */}
                      <tr className="transition-colors bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-5 font-mono font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                          {c.case_id}
                        </td>

                        <td className="py-3 px-5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <div>{c.hospital_name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{c.department} • Unit: {c.ward_unit}</div>
                        </td>

                        <td className="py-3 px-5 text-slate-800 dark:text-slate-200 font-semibold max-w-[220px] truncate" title={diag}>
                          {diag}
                        </td>

                        <td className="py-3 px-5 font-mono text-slate-800 dark:text-slate-200 font-bold whitespace-nowrap">
                          {c.date_of_admission}
                        </td>

                        <td className="py-3 px-5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            c.status === 'Approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : c.status === 'Returned'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : c.status === 'Under Review'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : c.status === 'Submitted'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {c.status || 'Draft'}
                          </span>
                        </td>

                        {/* ROW 1 ACTIONS (View, Edit, Delete, Approved PDF) */}
                        <td className="py-3 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            {/* Open Details Modal */}
                            <button
                              onClick={() => {
                                setSelectedCase(c);
                                setIsViewModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="View Clinical Case"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Approved PDF button (only if Approved) */}
                            {(c.status === 'Approved' || c.overall_case_status === 'Approved') && (
                              <button
                                onClick={() => setSelectedCaseForPDF(c)}
                                className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all"
                                title="Download Approved Official PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit & Delete (only if Draft or Returned) */}
                            {(c.status === 'Draft' || c.status === 'Returned') && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(c)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                                  title="Edit Case Details"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => setCaseToDelete(c)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                                  title="Delete Case"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* ROW 2 — CLINICAL DOCUMENTATION */}
                      <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b-2 border-slate-200/80 dark:border-slate-800">
                        <td colSpan={6} className="px-5 py-2.5 relative">
                          {activeCaseNotifyId === c.id && (
                            <InlineActionNotification notification={actionNotify} onClose={clearActionNotify} position="inline" />
                          )}

                          {/* RETURNED CASE PRECEPTOR FEEDBACK BANNER */}
                          {c.status === 'Returned' && (
                            <div className="mb-3 p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 space-y-1.5 shadow-xs">
                              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-extrabold text-xs">
                                <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                                <span>Returned by Preceptor for Corrections</span>
                              </div>

                              {c.overall_preceptor_comments && (
                                <div className="text-xs text-slate-800 dark:text-slate-200 font-medium pl-6">
                                  <strong className="font-bold text-slate-900 dark:text-white">Faculty Comments: </strong>
                                  <span className="italic font-semibold text-rose-950 dark:text-rose-100">"{c.overall_preceptor_comments}"</span>
                                </div>
                              )}

                              {c.returned_forms && Array.isArray(c.returned_forms) && c.returned_forms.length > 0 && (
                                <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 pl-6 flex flex-wrap items-center gap-1.5 mt-1">
                                  <span>Forms requiring correction:</span>
                                  {c.returned_forms.map((f, idx) => {
                                    let label = f;
                                    if (f === 'patient_profile' || f === 'Patient Profile') label = 'Patient Profile';
                                    else if (f === 'patient_counselling' || f === 'Patient Counselling') label = 'Patient Counselling';
                                    else if (f === 'pharmacist_intervention' || f === 'Pharmacist Intervention') label = 'Pharmacist Intervention';
                                    else if (f === 'drug_information_request' || f === 'Drug Information Request') label = 'Drug Info Request';
                                    else if (f === 'adr_documentation' || f === 'ADR Documentation') label = 'ADR Documentation';
                                    return (
                                      <span key={idx} className="px-2 py-0.5 rounded-md bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 border border-rose-400 dark:border-rose-700 text-[10px] font-extrabold">
                                        ⚠️ {label}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
                                Clinical Documentation:
                              </span>

                              {/* Open Patient Profile */}
                              <button
                                onClick={(e) => handleTriggerAction(e, onOpenPatientProfile, c, 'Patient Profile')}
                                className={`px-2 py-1 rounded-xl text-[10px] font-extrabold border flex items-center gap-1.5 transition-all ${
                                  isFormReturned(c, 'patient_profile', 'Patient Profile')
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-400 ring-2 ring-rose-500/40'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                }`}
                                title={`Profile – ${moduleStatuses[c.id]?.profileStatus || 'Not Started'}`}
                              >
                                {renderModuleDot(moduleStatuses[c.id]?.profileStatus)}
                                <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Profile</span>
                                {isFormReturned(c, 'patient_profile', 'Patient Profile') && (
                                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[9px] font-black uppercase">Needs Fix</span>
                                )}
                              </button>

                              {/* Open Patient Counselling */}
                              <button
                                onClick={(e) => handleTriggerAction(e, onOpenPatientCounselling, c, 'Patient Counselling')}
                                className={`px-2 py-1 rounded-xl text-[10px] font-extrabold border flex items-center gap-1.5 transition-all ${
                                  isFormReturned(c, 'patient_counselling', 'Patient Counselling')
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-400 ring-2 ring-rose-500/40'
                                    : 'bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                                }`}
                                title={`Counselling – ${moduleStatuses[c.id]?.counsellingStatus || 'Not Started'}`}
                              >
                                {renderModuleDot(moduleStatuses[c.id]?.counsellingStatus)}
                                <HeartHandshake className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                <span>Counselling</span>
                                {isFormReturned(c, 'patient_counselling', 'Patient Counselling') && (
                                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[9px] font-black uppercase">Needs Fix</span>
                                )}
                              </button>

                              {/* Open Pharmacist Intervention */}
                              <button
                                onClick={(e) => handleTriggerAction(e, onOpenPharmacistIntervention, c, 'Pharmacist Intervention')}
                                className={`px-2 py-1 rounded-xl text-[10px] font-extrabold border flex items-center gap-1.5 transition-all ${
                                  isFormReturned(c, 'pharmacist_intervention', 'Pharmacist Intervention')
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-400 ring-2 ring-rose-500/40'
                                    : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                }`}
                                title={`Intervention – ${moduleStatuses[c.id]?.interventionStatus || 'Not Added'}`}
                              >
                                {renderModuleDot(moduleStatuses[c.id]?.interventionStatus)}
                                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>Intervention</span>
                                {isFormReturned(c, 'pharmacist_intervention', 'Pharmacist Intervention') && (
                                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[9px] font-black uppercase">Needs Fix</span>
                                )}
                              </button>

                              {/* Open Drug Information Request */}
                              <button
                                onClick={(e) => handleTriggerAction(e, onOpenDrugInformationRequest, c, 'Drug Information Request')}
                                className={`px-2 py-1 rounded-xl text-[10px] font-extrabold border flex items-center gap-1.5 transition-all ${
                                  isFormReturned(c, 'drug_information_request', 'Drug Information Request')
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-400 ring-2 ring-rose-500/40'
                                    : 'bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                                }`}
                                title={`Drug Information Request – ${moduleStatuses[c.id]?.dirStatus || 'Not Started'}`}
                              >
                                {renderModuleDot(moduleStatuses[c.id]?.dirStatus)}
                                <FileSearch className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                <span>Drug Info</span>
                                {isFormReturned(c, 'drug_information_request', 'Drug Information Request') && (
                                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[9px] font-black uppercase">Needs Fix</span>
                                )}
                              </button>

                              {/* Open ADR Documentation */}
                              <button
                                onClick={(e) => handleTriggerAction(e, onOpenADRDocumentation, c, 'ADR Documentation')}
                                className={`px-2 py-1 rounded-xl text-[10px] font-extrabold border flex items-center gap-1.5 transition-all ${
                                  isFormReturned(c, 'adr_documentation', 'ADR Documentation')
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-400 ring-2 ring-rose-500/40'
                                    : 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}
                                title={`ADR Documentation – ${moduleStatuses[c.id]?.adrStatus || 'Not Started'}`}
                              >
                                {renderModuleDot(moduleStatuses[c.id]?.adrStatus)}
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>ADR Log</span>
                                {isFormReturned(c, 'adr_documentation', 'ADR Documentation') && (
                                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[9px] font-black uppercase">Needs Fix</span>
                                )}
                              </button>
                            </div>

                            {/* SUBMIT ACTION (aligned right) */}
                            {(c.status === 'Draft' || c.status === 'Returned') && (
                              <button
                                onClick={() => handleSubmitCase(c)}
                                disabled={actionLoading}
                                className={`px-3.5 py-1.5 rounded-xl font-extrabold text-[11px] flex items-center gap-1.5 shadow-xs transition-all text-white ${
                                  actionLoading ? 'opacity-50 cursor-not-allowed bg-slate-400' :
                                  c.status === 'Returned'
                                    ? 'bg-violet-600 hover:bg-violet-700'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                                title={c.status === 'Returned' ? 'Resubmit Clinical Case with Corrections' : 'Submit Clinical Case'}
                              >
                                {actionLoading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                <span>{actionLoading ? 'Submitting...' : (c.status === 'Returned' ? '⚡ Resubmit Case' : 'Submit Case')}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing <strong className="text-slate-800 dark:text-slate-200">{paginatedCases.length}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredCases.length}</strong> cases
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-800 dark:text-slate-200 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* VIEW CASE MODAL */}
      {isViewModalOpen && selectedCase && (
        <ModalWrapper
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Clinical Case ${selectedCase.case_id}`}
          subtitle={`Hospital: ${selectedCase.hospital_name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Case ID:</span>
                <strong className="font-mono text-slate-900 dark:text-white font-extrabold">{selectedCase.case_id}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Hospital:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCase.hospital_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCase.department} ({selectedCase.ward_unit})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Category:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedCase.ip_op_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Date of Admission:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedCase.date_of_admission}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Date of Collection:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedCase.date_of_collection}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Final Diagnosis:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCase.final_diagnosis || moduleStatuses[selectedCase.id]?.finalDiagnosis || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Status:</span>
                <span className={`font-bold ${
                  selectedCase.status === 'Approved' ? 'text-emerald-600 dark:text-emerald-400' :
                  selectedCase.status === 'Returned' ? 'text-rose-600 dark:text-rose-400' :
                  selectedCase.status === 'Under Review' ? 'text-amber-600 dark:text-amber-400' :
                  selectedCase.status === 'Submitted' ? 'text-blue-600 dark:text-blue-400' :
                  'text-slate-600 dark:text-slate-400'
                }`}>
                  {selectedCase.status || 'Draft'}
                </span>
              </div>

              {selectedCase.status === 'Returned' && (
                <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs space-y-1.5">
                  <div className="font-extrabold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Faculty Return Feedback</span>
                  </div>
                  {selectedCase.overall_preceptor_comments && (
                    <p className="text-slate-700 dark:text-slate-300 italic font-medium">
                      "{selectedCase.overall_preceptor_comments}"
                    </p>
                  )}
                  {selectedCase.returned_forms && Array.isArray(selectedCase.returned_forms) && selectedCase.returned_forms.length > 0 && (
                    <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 pt-1 border-t border-rose-200 dark:border-rose-900/60 flex flex-wrap gap-1">
                      <span>Forms to update:</span>
                      {selectedCase.returned_forms.map((f, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-extrabold text-[10px]">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* EDIT CASE MODAL */}
      {isEditModalOpen && selectedCase && (
        <ModalWrapper
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Case ${selectedCase.case_id}`}
          subtitle="Update hospital and clinical ward details"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hospital Name *</label>
              <input
                type="text"
                required
                value={editFormData.hospitalName}
                onChange={(e) => { setEditFormData({ ...editFormData, hospitalName: e.target.value }); setEditFieldErrors(prev => ({ ...prev, hospitalName: '' })); }}
                className={`w-full h-[44px] px-3 rounded-xl border text-slate-900 dark:text-white transition-all ${
                  editFieldErrors.hospitalName
                    ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
                }`}
              />
              {editFieldErrors.hospitalName && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{editFieldErrors.hospitalName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department *</label>
              <input
                type="text"
                required
                value={editFormData.department}
                onChange={(e) => { setEditFormData({ ...editFormData, department: e.target.value }); setEditFieldErrors(prev => ({ ...prev, department: '' })); }}
                className={`w-full h-[44px] px-3 rounded-xl border text-slate-900 dark:text-white transition-all ${
                  editFieldErrors.department
                    ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
                }`}
              />
              {editFieldErrors.department && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{editFieldErrors.department}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ward / Unit *</label>
              <input
                type="text"
                required
                value={editFormData.wardUnit}
                onChange={(e) => { setEditFormData({ ...editFormData, wardUnit: e.target.value }); setEditFieldErrors(prev => ({ ...prev, wardUnit: '' })); }}
                className={`w-full h-[44px] px-3 rounded-xl border text-slate-900 dark:text-white transition-all ${
                  editFieldErrors.wardUnit
                    ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
                }`}
              />
              {editFieldErrors.wardUnit && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{editFieldErrors.wardUnit}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">IP/OP Category</label>
              <select
                value={editFormData.ipOpType}
                onChange={(e) => setEditFormData({ ...editFormData, ipOpType: e.target.value })}
                className="w-full h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
              >
                <option value="IP">In-Patient (IP)</option>
                <option value="OP">Out-Patient (OP)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Admission</label>
                <input
                  type="date"
                  required
                  value={editFormData.dateOfAdmission}
                  onChange={(e) => { setEditFormData({ ...editFormData, dateOfAdmission: e.target.value }); setEditFieldErrors(prev => ({ ...prev, dateOfAdmission: '' })); }}
                  className={`w-full h-[44px] px-3 rounded-xl border text-slate-900 dark:text-white font-mono transition-all ${
                    editFieldErrors.dateOfAdmission
                      ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
                  }`}
                />
                {editFieldErrors.dateOfAdmission && (
                  <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{editFieldErrors.dateOfAdmission}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Collection</label>
                <input
                  type="date"
                  required
                  value={editFormData.dateOfCollection}
                  onChange={(e) => setEditFormData({ ...editFormData, dateOfCollection: e.target.value })}
                  className="w-full h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Final Diagnosis *</label>
              <input
                type="text"
                required
                value={editFormData.finalDiagnosis || ''}
                onChange={(e) => { setEditFormData({ ...editFormData, finalDiagnosis: e.target.value }); setEditFieldErrors(prev => ({ ...prev, finalDiagnosis: '' })); }}
                placeholder="Enter final diagnosis"
                className={`w-full h-[44px] px-3 rounded-xl border text-slate-900 dark:text-white transition-all ${
                  editFieldErrors.finalDiagnosis
                    ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
                }`}
              />
              {editFieldErrors.finalDiagnosis && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{editFieldErrors.finalDiagnosis}</span>
                </p>
              )}
            </div>

            {/* ACTION FEEDBACK NEAR SAVE BUTTON */}
            {editFormError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{editFormError}</span>
              </div>
            )}

            {editFormSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{editFormSuccess}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Case</span>
                )}
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* DELETE DRAFT CONFIRMATION MODAL */}
      {caseToDelete && (
        <ModalWrapper
          isOpen={Boolean(caseToDelete)}
          onClose={() => { setCaseToDelete(null); setDeleteError(null); }}
          title="Delete Draft Case"
          subtitle={`Delete ${caseToDelete.case_id}?`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this draft case entry? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => { setCaseToDelete(null); setDeleteError(null); }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* OFFICIAL APPROVED PDF MODAL */}
      {selectedCaseForPDF && (
        <OfficialClinicalCasePDFModal
          isOpen={Boolean(selectedCaseForPDF)}
          onClose={() => setSelectedCaseForPDF(null)}
          clinicalCase={selectedCaseForPDF}
          student={student}
          preceptor={selectedCaseForPDF.preceptors}
          college={student?.colleges}
        />
      )}

    </div>
  );
};

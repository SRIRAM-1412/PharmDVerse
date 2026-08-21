import React, { useState, useEffect } from 'react';
import { 
  Pill, Search, Plus, Edit, Eye, AlertTriangle, CheckCircle2, 
  Loader2, X, RefreshCw, BookOpen, ShieldAlert, Activity, FileText, FileSpreadsheet, Upload
} from 'lucide-react';
import { 
  fetchAllDrugKnowledgeFromSupabase, 
  addDrugKnowledgeToSupabase, 
  updateDrugKnowledgeInSupabase,
  checkGenericDrugExistsInSupabase
} from '../../services/supabaseService';
import { downloadMasterExcelTemplate } from '../../services/masterDataImportService';
import { ModalWrapper } from '../modals/ModalWrapper';
import { MasterBulkImportModal } from './MasterBulkImportModal';

export const DrugKnowledgeManagementView = () => {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [activeDrug, setActiveDrug] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    generic_name: '',
    brand_names: '',
    drug_class: '',
    established_uses: '',
    mechanism_of_action: '',
    normal_dose_range: '',
    contraindications: '',
    side_effects_adverse_effects: '',
    monitoring_parameters: ''
  });

  const loadDrugs = async () => {
    setLoading(true);
    const res = await fetchAllDrugKnowledgeFromSupabase();
    setLoading(false);
    if (res.success) {
      setDrugs(res.data || []);
    } else {
      setErrorMsg('Failed to load drug knowledge master records.');
    }
  };

  useEffect(() => {
    loadDrugs();
  }, []);

  const resetForm = () => {
    setFormData({
      generic_name: '',
      brand_names: '',
      drug_class: '',
      established_uses: '',
      mechanism_of_action: '',
      normal_dose_range: '',
      contraindications: '',
      side_effects_adverse_effects: '',
      monitoring_parameters: ''
    });
    setDuplicateWarning(null);
    setErrorMsg('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (drug) => {
    resetForm();
    setActiveDrug(drug);
    setFormData({
      generic_name: drug.generic_name || '',
      brand_names: drug.brand_names || '',
      drug_class: drug.drug_class || '',
      established_uses: drug.established_uses || '',
      mechanism_of_action: drug.mechanism_of_action || '',
      normal_dose_range: drug.normal_dose_range || '',
      contraindications: drug.contraindications || '',
      side_effects_adverse_effects: drug.side_effects_adverse_effects || '',
      monitoring_parameters: drug.monitoring_parameters || ''
    });
    setShowEditModal(true);
  };

  const handleOpenViewModal = (drug) => {
    setActiveDrug(drug);
    setShowViewModal(true);
  };

  // Real-time duplicate check when typing Generic Name in Add Form
  const handleGenericNameChange = async (val) => {
    setFormData(prev => ({ ...prev, generic_name: val }));
    if (duplicateWarning) setDuplicateWarning(null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setDuplicateWarning(null);

    const cleanGeneric = formData.generic_name.trim();
    if (!cleanGeneric) {
      setErrorMsg('Generic Name is required.');
      return;
    }

    setSaving(true);
    const checkRes = await checkGenericDrugExistsInSupabase(cleanGeneric);
    if (checkRes.exists) {
      setSaving(false);
      setDuplicateWarning(checkRes.drug);
      setErrorMsg('Drug already exists.');
      return;
    }

    const res = await addDrugKnowledgeToSupabase(formData);
    setSaving(false);

    if (res.success) {
      setSuccessMsg(`✅ Successfully added ${cleanGeneric} to public.drug_knowledge master!`);
      setShowAddModal(false);
      resetForm();
      loadDrugs();
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(res.error || 'Failed to insert drug knowledge record.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!activeDrug || !activeDrug.id) return;
    const cleanGeneric = formData.generic_name.trim();
    if (!cleanGeneric) {
      setErrorMsg('Generic Name is required.');
      return;
    }

    setSaving(true);
    const res = await updateDrugKnowledgeInSupabase(activeDrug.id, formData);
    setSaving(false);

    if (res.success) {
      setSuccessMsg(`✅ Successfully updated ${cleanGeneric} in public.drug_knowledge master!`);
      setShowEditModal(false);
      resetForm();
      loadDrugs();
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(res.error || 'Failed to update drug knowledge record.');
    }
  };

  // Filter drugs
  const filteredDrugs = drugs.filter(d => {
    const q = searchQuery.toLowerCase();
    return (
      (d.generic_name || '').toLowerCase().includes(q) ||
      (d.brand_names || '').toLowerCase().includes(q) ||
      (d.drug_class || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER TITLE & STATS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-inner">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Drug Knowledge Master</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Single Source of Truth
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Centralized generic drug database serving Section 4A & 4B Clinical Modules (`public.drug_knowledge`)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-nowrap shrink-0 whitespace-nowrap overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={loadDrugs}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
            title="Reload Master Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => downloadMasterExcelTemplate('drug_knowledge')}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Download Drug Knowledge Excel Template"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Download Excel Template</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Bulk Import Drug Knowledge Records"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Bulk Import</span>
          </button>
          
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add New Generic Drug</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && !showAddModal && !showEditModal && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STATS METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Master Drugs</span>
            <strong className="text-lg font-black text-slate-900 dark:text-white">{drugs.length}</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Filter Matches</span>
            <strong className="text-lg font-black text-slate-900 dark:text-white">{filteredDrugs.length}</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Database Status</span>
            <strong className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">100% Active & Connected</strong>
          </div>
        </div>
      </div>

      {/* SEARCH & CONTROL BAR */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search master drugs by generic name, brand names, or primary drug class..."
            className="w-full h-10 pl-10 pr-4 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* DRUG KNOWLEDGE TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-xs font-bold">Loading Drug Knowledge Master Database...</span>
          </div>
        ) : filteredDrugs.length === 0 ? (
          <div className="p-12 text-center space-y-3 text-slate-400">
            <Pill className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No drug records match your search query.</p>
            <p className="text-[11px]">Try adjusting your search criteria or add a new generic drug.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 z-10">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">1. Generic Name</th>
                  <th className="py-3 px-4">2. Brand/Trade Names</th>
                  <th className="py-3 px-4">3 & 4. Drug Class</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredDrugs.map((drug, idx) => (
                  <tr key={drug.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{idx + 1}</td>
                    
                    <td className="py-3 px-4">
                      <strong className="font-extrabold text-slate-900 dark:text-white block text-xs">
                        {drug.generic_name}
                      </strong>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate block" title={drug.brand_names || 'N/A'}>
                        {drug.brand_names || '—'}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold truncate block" title={drug.drug_class || 'N/A'}>
                        {drug.drug_class || '—'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenViewModal(drug)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          title="View Complete Knowledge Card"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(drug)}
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                          title="Edit Master Record"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. ADD NEW DRUG MODAL */}
      {/* ========================================================= */}
      <ModalWrapper
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="max-w-2xl"
        title="Add New Verified Generic Drug Knowledge"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {duplicateWarning && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Drug already exists: "{duplicateWarning.generic_name}"</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                A master record for this generic drug is already registered in `public.drug_knowledge`. To prevent duplicates, please edit the existing record.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  handleOpenEditModal(duplicateWarning);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Existing Record Now</span>
              </button>
            </div>
          )}

          {errorMsg && !duplicateWarning && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                A. Generic Name *
              </label>
              <input
                type="text"
                required
                value={formData.generic_name}
                onChange={(e) => handleGenericNameChange(e.target.value)}
                placeholder="e.g. Paracetamol or Amikacin"
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                B. Trade / Brand Names (CSV / Comma Separated)
              </label>
              <input
                type="text"
                value={formData.brand_names}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_names: e.target.value }))}
                placeholder="e.g. Dolo, Crocin, Calpol, Pacimol"
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
              C & D. Primary & Additional Drug Classes
            </label>
            <input
              type="text"
              value={formData.drug_class}
              onChange={(e) => setFormData(prev => ({ ...prev, drug_class: e.target.value }))}
              placeholder="e.g. Analgesic / Antipyretic (Additional: Non-opioid analgesic)"
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                E. Established Clinical Uses
              </label>
              <textarea
                rows={3}
                value={formData.established_uses}
                onChange={(e) => setFormData(prev => ({ ...prev, established_uses: e.target.value }))}
                placeholder="e.g. Mild to moderate pain; fever reduction..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                F. Mechanism of Action
              </label>
              <textarea
                rows={3}
                value={formData.mechanism_of_action}
                onChange={(e) => setFormData(prev => ({ ...prev, mechanism_of_action: e.target.value }))}
                placeholder="e.g. Central inhibition of prostaglandin synthesis..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                G. Normal Reference Dose Range
              </label>
              <textarea
                rows={2}
                value={formData.normal_dose_range}
                onChange={(e) => setFormData(prev => ({ ...prev, normal_dose_range: e.target.value }))}
                placeholder="e.g. Oral 500-1000 mg every 4-6 hours max 4000 mg/day"
                className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                H. Contraindications
              </label>
              <textarea
                rows={2}
                value={formData.contraindications}
                onChange={(e) => setFormData(prev => ({ ...prev, contraindications: e.target.value }))}
                placeholder="e.g. Severe hepatic impairment or active liver disease..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                I. Side Effects / Adverse Effects
              </label>
              <textarea
                rows={2}
                value={formData.side_effects_adverse_effects}
                onChange={(e) => setFormData(prev => ({ ...prev, side_effects_adverse_effects: e.target.value }))}
                placeholder="e.g. Nausea, rash, elevated transaminases..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                J. Monitoring Parameters
              </label>
              <textarea
                rows={2}
                value={formData.monitoring_parameters}
                onChange={(e) => setFormData(prev => ({ ...prev, monitoring_parameters: e.target.value }))}
                placeholder="e.g. Liver function tests (LFTs), renal function..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Save Master Drug Record</span>
            </button>
          </div>
        </form>
      </ModalWrapper>

      {/* ========================================================= */}
      {/* 2. EDIT EXISTING DRUG MODAL */}
      {/* ========================================================= */}
      <ModalWrapper
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        maxWidth="max-w-2xl"
        title={`Edit Drug Knowledge: ${activeDrug?.generic_name || ''}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                A. Generic Name *
              </label>
              <input
                type="text"
                required
                value={formData.generic_name}
                onChange={(e) => setFormData(prev => ({ ...prev, generic_name: e.target.value }))}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                B. Trade / Brand Names (CSV / Comma Separated)
              </label>
              <input
                type="text"
                value={formData.brand_names}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_names: e.target.value }))}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
              C & D. Primary & Additional Drug Classes
            </label>
            <input
              type="text"
              value={formData.drug_class}
              onChange={(e) => setFormData(prev => ({ ...prev, drug_class: e.target.value }))}
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                E. Established Clinical Uses
              </label>
              <textarea
                rows={3}
                value={formData.established_uses}
                onChange={(e) => setFormData(prev => ({ ...prev, established_uses: e.target.value }))}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                F. Mechanism of Action
              </label>
              <textarea
                rows={3}
                value={formData.mechanism_of_action}
                onChange={(e) => setFormData(prev => ({ ...prev, mechanism_of_action: e.target.value }))}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                G. Normal Reference Dose Range
              </label>
              <textarea
                rows={2}
                value={formData.normal_dose_range}
                onChange={(e) => setFormData(prev => ({ ...prev, normal_dose_range: e.target.value }))}
                className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                H. Contraindications
              </label>
              <textarea
                rows={2}
                value={formData.contraindications}
                onChange={(e) => setFormData(prev => ({ ...prev, contraindications: e.target.value }))}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                I. Side Effects / Adverse Effects
              </label>
              <textarea
                rows={2}
                value={formData.side_effects_adverse_effects}
                onChange={(e) => setFormData(prev => ({ ...prev, side_effects_adverse_effects: e.target.value }))}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                J. Monitoring Parameters
              </label>
              <textarea
                rows={2}
                value={formData.monitoring_parameters}
                onChange={(e) => setFormData(prev => ({ ...prev, monitoring_parameters: e.target.value }))}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
              <span>Update Master Record</span>
            </button>
          </div>
        </form>
      </ModalWrapper>

      {/* ========================================================= */}
      {/* 3. VIEW DRUG KNOWLEDGE CARD MODAL */}
      {/* ========================================================= */}
      <ModalWrapper
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        maxWidth="max-w-2xl"
        title={`Drug Knowledge Master: ${activeDrug?.generic_name || ''}`}
      >
        {activeDrug && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">1. Generic Name</span>
                <strong className="text-emerald-700 dark:text-emerald-400 text-sm font-black">{activeDrug.generic_name}</strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">2. Brand/Trade Names</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeDrug.brand_names || 'N/A'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">3 & 4. Drug Class</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{activeDrug.drug_class || 'N/A'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">5. Established Uses</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{activeDrug.established_uses || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">6. Mechanism of Action</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{activeDrug.mechanism_of_action || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">7. Normal Dose Range</span>
                <p className="text-slate-800 dark:text-slate-200 font-mono font-medium leading-relaxed">{activeDrug.normal_dose_range || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400 block mb-1">8. Contraindications</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{activeDrug.contraindications || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 block mb-1">9. Side Effects & Adverse Effects</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{activeDrug.side_effects_adverse_effects || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-extrabold uppercase text-cyan-600 dark:text-cyan-400 block mb-1">10. Monitoring Parameters</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{activeDrug.monitoring_parameters || 'N/A'}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </ModalWrapper>

      {/* BULK IMPORT MODAL */}
      <MasterBulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        masterType="drug_knowledge"
        masterTitle="Drug Knowledge Master"
        existingRecords={drugs}
        onSuccess={loadDrugs}
      />
    </div>
  );
};

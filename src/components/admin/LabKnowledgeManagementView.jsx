import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, Search, Plus, Edit, Eye, AlertTriangle, CheckCircle2, 
  Loader2, RefreshCw, FileText, Power, Filter, Layers, CheckSquare, FileSpreadsheet, Upload
} from 'lucide-react';
import { 
  fetchLabParameterKnowledgeForAdmin,
  createLabParameterKnowledgeInSupabase,
  updateLabParameterKnowledgeInSupabase
} from '../../services/supabaseService';
import { downloadMasterExcelTemplate } from '../../services/masterDataImportService';
import { ModalWrapper } from '../modals/ModalWrapper';
import { MasterBulkImportModal } from './MasterBulkImportModal';

const LAB_CATEGORIES = [
  'Haematology',
  'Renal Function',
  'Liver Function',
  'Electrolytes',
  'Lipid Profile',
  'Blood Glucose',
  'Thyroid Function',
  'Coagulation',
  'Cardiac',
  'General'
];

const EVALUATION_TYPES = [
  { value: 'numeric', label: 'Numeric (Min - Max Reference Range)' },
  { value: 'positive_negative', label: 'Qualitative (Positive / Negative)' },
  { value: 'present_absent', label: 'Qualitative (Present / Absent)' }
];

export const LabKnowledgeManagementView = () => {
  const [labParams, setLabParams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [activeParam, setActiveParam] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const initialForm = {
    parameter_name: '',
    normalized_name: '',
    category: LAB_CATEGORIES[0],
    evaluation_type: 'numeric',
    increased_significance: '',
    decreased_significance: '',
    positive_significance: '',
    negative_significance: '',
    present_significance: '',
    absent_significance: '',
    context_notes: '',
    source_reference: 'NFI / IP / Standard Lab Reference',
    is_active: true
  };

  const [formData, setFormData] = useState(initialForm);

  const loadLabKnowledge = async () => {
    setLoading(true);
    const res = await fetchLabParameterKnowledgeForAdmin();
    setLoading(false);
    if (res.success) {
      setLabParams(res.data || []);
    } else {
      setErrorMsg('Failed to load lab parameter knowledge records.');
    }
  };

  useEffect(() => {
    loadLabKnowledge();
  }, []);

  // Filter Records
  const filteredParams = labParams.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (p.parameter_name || '').toLowerCase().includes(q) ||
                      (p.normalized_name || '').toLowerCase().includes(q) ||
                      (p.category || '').toLowerCase().includes(q);
    
    const catMatch = categoryFilter === 'All' || p.category === categoryFilter;
    const statMatch = statusFilter === 'All' || (statusFilter === 'Active' ? p.is_active : !p.is_active);

    return nameMatch && catMatch && statMatch;
  });

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setErrorMsg('');
    setSuccessMsg('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (param) => {
    setActiveParam(param);
    setFormData({
      parameter_name: param.parameter_name || '',
      normalized_name: param.normalized_name || '',
      category: param.category || LAB_CATEGORIES[0],
      evaluation_type: param.evaluation_type || 'numeric',
      increased_significance: param.increased_significance || '',
      decreased_significance: param.decreased_significance || '',
      positive_significance: param.positive_significance || '',
      negative_significance: param.negative_significance || '',
      present_significance: param.present_significance || '',
      absent_significance: param.absent_significance || '',
      context_notes: param.context_notes || '',
      source_reference: param.source_reference || 'NFI / IP / Standard Lab Reference',
      is_active: param.is_active ?? true
    });
    setErrorMsg('');
    setSuccessMsg('');
    setShowEditModal(true);
  };

  const handleOpenView = (param) => {
    setActiveParam(param);
    setShowViewModal(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.parameter_name.trim()) {
      setErrorMsg('Parameter Name is required.');
      return;
    }

    setSaving(true);
    const res = await createLabParameterKnowledgeInSupabase(formData);
    setSaving(false);

    if (res.success) {
      setSuccessMsg(`✅ Laboratory parameter "${formData.parameter_name}" created successfully.`);
      setShowAddModal(false);
      loadLabKnowledge();
    } else {
      setErrorMsg(res.error || 'Failed to create laboratory parameter.');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!activeParam) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.parameter_name.trim()) {
      setErrorMsg('Parameter Name is required.');
      return;
    }

    setSaving(true);
    const res = await updateLabParameterKnowledgeInSupabase(activeParam.id, formData);
    setSaving(false);

    if (res.success) {
      setSuccessMsg(`✅ Laboratory parameter "${formData.parameter_name}" updated successfully.`);
      setShowEditModal(false);
      loadLabKnowledge();
    } else {
      setErrorMsg(res.error || 'Failed to update laboratory parameter.');
    }
  };

  const handleToggleActive = async (param) => {
    const nextStatus = !param.is_active;
    const res = await updateLabParameterKnowledgeInSupabase(param.id, { ...param, is_active: nextStatus });
    if (res.success) {
      setSuccessMsg(`Parameter "${param.parameter_name}" status set to ${nextStatus ? 'Active' : 'Inactive'}.`);
      loadLabKnowledge();
    } else {
      setErrorMsg(`Failed to change parameter status: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Lab Parameter Knowledge Master
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Centralized laboratory parameter knowledge serving Section 3 Laboratory Interpretation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-nowrap shrink-0 whitespace-nowrap overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={loadLabKnowledge}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Refresh Knowledge Master"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => downloadMasterExcelTemplate('lab_knowledge')}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Download Lab Parameter Excel Template"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Download Excel Template</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Bulk Import Lab Parameters"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>Add Lab Parameter</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CONTROLS BAR: SEARCH & FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parameter name or category..."
            className="w-full h-10 pl-10 pr-4 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
          >
            <option value="All">All Categories ({labParams.length})</option>
            {LAB_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* MASTER DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs font-bold">Loading Laboratory Knowledge Master...</p>
          </div>
        ) : filteredParams.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FlaskConical className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Laboratory Parameters Found</p>
            <p className="text-xs">Try adjusting your search query or filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Parameter Name</th>
                  <th className="py-3.5 px-4">Normalized Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Evaluation Type</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Updated At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredParams.map((param) => (
                  <tr key={param.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {param.parameter_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {param.normalized_name}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                        {param.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium capitalize">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono text-[10px]">
                        {param.evaluation_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        param.is_active
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}>
                        {param.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {param.updated_at ? new Date(param.updated_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenView(param)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Full Knowledge"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(param)}
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                          title="Edit Parameter Knowledge"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(param)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            param.is_active
                              ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                              : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                          }`}
                          title={param.is_active ? 'Deactivate Parameter' : 'Activate Parameter'}
                        >
                          <Power className="w-4 h-4" />
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

      {/* VIEW MODAL */}
      {showViewModal && activeParam && (
        <ModalWrapper
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title={`LAB KNOWLEDGE DETAILS: ${activeParam.parameter_name}`}
          subtitle={`Category: ${activeParam.category || 'General'} | Type: ${activeParam.evaluation_type}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Normalized Name</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{activeParam.normalized_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Evaluation Type</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">{activeParam.evaluation_type}</span>
              </div>
            </div>

            {activeParam.evaluation_type === 'numeric' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                  <h4 className="font-extrabold text-amber-800 dark:text-amber-300 mb-1">Increased Value Significance (High Level)</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{activeParam.increased_significance || 'Not Documented'}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
                  <h4 className="font-extrabold text-blue-800 dark:text-blue-300 mb-1">Decreased Value Significance (Low Level)</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{activeParam.decreased_significance || 'Not Documented'}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                  <h4 className="font-extrabold text-emerald-800 dark:text-emerald-300 mb-1">Positive / Present Significance</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeParam.positive_significance || activeParam.present_significance || 'Not Documented'}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 mb-1">Negative / Absent Significance</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeParam.negative_significance || activeParam.absent_significance || 'Not Documented'}
                  </p>
                </div>
              </div>
            )}

            {activeParam.context_notes && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200 mb-1">Clinical Context Notes</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{activeParam.context_notes}</p>
              </div>
            )}

            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span>Source: {activeParam.source_reference || 'NFI / IP Reference'}</span>
              <span>Updated: {new Date(activeParam.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* ADD / EDIT MODAL */}
      {(showAddModal || showEditModal) && (
        <ModalWrapper
          isOpen={showAddModal || showEditModal}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
          }}
          title={showAddModal ? 'ADD NEW LABORATORY PARAMETER' : `EDIT PARAMETER: ${activeParam?.parameter_name}`}
          subtitle="Master Database Record Management"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Parameter Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.parameter_name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      parameter_name: name,
                      normalized_name: name.toLowerCase().trim()
                    }));
                  }}
                  placeholder="e.g. Serum Creatinine"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Normalized Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.normalized_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, normalized_name: e.target.value }))}
                  placeholder="serum creatinine"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold"
                >
                  {LAB_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Evaluation Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.evaluation_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, evaluation_type: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold"
                >
                  {EVALUATION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* DYNAMIC SIGNIFICANCE FIELDS BASED ON EVALUATION TYPE */}
            {formData.evaluation_type === 'numeric' ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Increased Significance (High Value)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.increased_significance}
                    onChange={(e) => setFormData(prev => ({ ...prev, increased_significance: e.target.value }))}
                    placeholder="Clinical significance when test value is elevated..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Decreased Significance (Low Value)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.decreased_significance}
                    onChange={(e) => setFormData(prev => ({ ...prev, decreased_significance: e.target.value }))}
                    placeholder="Clinical significance when test value is low..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>
            ) : formData.evaluation_type === 'positive_negative' ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Positive Significance
                  </label>
                  <textarea
                    rows={2}
                    value={formData.positive_significance}
                    onChange={(e) => setFormData(prev => ({ ...prev, positive_significance: e.target.value }))}
                    placeholder="Clinical significance of positive result..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Negative Significance
                  </label>
                  <textarea
                    rows={2}
                    value={formData.negative_significance}
                    onChange={(e) => setFormData(prev => ({ ...prev, negative_significance: e.target.value }))}
                    placeholder="Clinical significance of negative result..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Present Significance
                  </label>
                  <textarea
                    rows={2}
                    value={formData.present_significance}
                    onChange={(e) => setFormData(prev => ({ ...prev, present_significance: e.target.value }))}
                    placeholder="Clinical significance when present..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Absent Significance
                  </label>
                  <textarea
                    rows={2}
                    value={formData.absent_significance}
                    onChange={(e) => setFormData(prev => ({ ...prev, absent_significance: e.target.value }))}
                    placeholder="Clinical significance when absent..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Context Notes</label>
                <input
                  type="text"
                  value={formData.context_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, context_notes: e.target.value }))}
                  placeholder="Optional context notes..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Source Reference</label>
                <input
                  type="text"
                  value={formData.source_reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_reference: e.target.value }))}
                  placeholder="NFI / IP / Standard Reference"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{showAddModal ? 'Create Parameter' : 'Save Changes'}</span>
                )}
              </button>
            </div>

          </form>
        </ModalWrapper>
      )}

      {/* BULK IMPORT MODAL */}
      <MasterBulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        masterType="lab_knowledge"
        masterTitle="Lab Parameter Master"
        existingRecords={labParams}
        onSuccess={loadLabKnowledge}
      />
    </div>
  );
};

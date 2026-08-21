import React, { useState, useEffect } from 'react';
import { 
  FileSearch, Search, Plus, Edit, Eye, AlertTriangle, CheckCircle2, 
  Loader2, RefreshCw, FileText, Power, Filter, Layers, FileSpreadsheet, Upload
} from 'lucide-react';
import { 
  fetchOtherInvestigationKnowledgeForAdmin,
  createOtherInvestigationKnowledgeInSupabase,
  updateOtherInvestigationKnowledgeInSupabase
} from '../../services/supabaseService';
import { downloadMasterExcelTemplate } from '../../services/masterDataImportService';
import { ModalWrapper } from '../modals/ModalWrapper';
import { MasterBulkImportModal } from './MasterBulkImportModal';

const INVESTIGATION_CATEGORIES = [
  'Radiology',
  'Cardiac',
  'Endoscopy',
  'Pathology',
  'General Diagnostic'
];

export const OtherInvestigationManagementView = () => {
  const [investigations, setInvestigations] = useState([]);
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

  const [activeInv, setActiveInv] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const initialForm = {
    investigation_name: '',
    normalized_name: '',
    category: INVESTIGATION_CATEGORIES[0],
    description: '',
    expected_findings: '',
    clinical_significance: '',
    is_active: true
  };

  const [formData, setFormData] = useState(initialForm);

  const loadInvestigations = async () => {
    setLoading(true);
    const res = await fetchOtherInvestigationKnowledgeForAdmin();
    setLoading(false);
    if (res.success) {
      setInvestigations(res.data || []);
    } else {
      setErrorMsg('Failed to load other investigation master records.');
    }
  };

  useEffect(() => {
    loadInvestigations();
  }, []);

  // Filter Records
  const filteredInvs = investigations.filter(inv => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (inv.investigation_name || '').toLowerCase().includes(q) ||
                      (inv.normalized_name || '').toLowerCase().includes(q) ||
                      (inv.category || '').toLowerCase().includes(q);
    
    const catMatch = categoryFilter === 'All' || inv.category === categoryFilter;
    const statMatch = statusFilter === 'All' || (statusFilter === 'Active' ? inv.is_active : !inv.is_active);

    return nameMatch && catMatch && statMatch;
  });

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setErrorMsg('');
    setSuccessMsg('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (inv) => {
    setActiveInv(inv);
    setFormData({
      investigation_name: inv.investigation_name || '',
      normalized_name: inv.normalized_name || '',
      category: inv.category || INVESTIGATION_CATEGORIES[0],
      description: inv.description || '',
      expected_findings: inv.expected_findings || '',
      clinical_significance: inv.clinical_significance || '',
      is_active: inv.is_active ?? true
    });
    setErrorMsg('');
    setSuccessMsg('');
    setShowEditModal(true);
  };

  const handleOpenView = (inv) => {
    setActiveInv(inv);
    setShowViewModal(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.investigation_name.trim()) {
      setErrorMsg('Investigation Name is required.');
      return;
    }

    setSaving(true);
    const res = await createOtherInvestigationKnowledgeInSupabase(formData);
    setSaving(false);

    if (res.success) {
      setSuccessMsg(`✅ Investigation "${formData.investigation_name}" created successfully.`);
      setShowAddModal(false);
      loadInvestigations();
    } else {
      setErrorMsg(res.error || 'Failed to create investigation master record.');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!activeInv) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.investigation_name.trim()) {
      setErrorMsg('Investigation Name is required.');
      return;
    }

    setSaving(true);
    const res = await updateOtherInvestigationKnowledgeInSupabase(activeInv.id, formData);
    setSaving(false);

    if (res.success) {
      setSuccessMsg(`✅ Investigation "${formData.investigation_name}" updated successfully.`);
      setShowEditModal(false);
      loadInvestigations();
    } else {
      setErrorMsg(res.error || 'Failed to update investigation master record.');
    }
  };

  const handleToggleActive = async (inv) => {
    const nextStatus = !inv.is_active;
    const res = await updateOtherInvestigationKnowledgeInSupabase(inv.id, { ...inv, is_active: nextStatus });
    if (res.success) {
      setSuccessMsg(`Investigation "${inv.investigation_name}" status set to ${nextStatus ? 'Active' : 'Inactive'}.`);
      loadInvestigations();
    } else {
      setErrorMsg(`Failed to change investigation status: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
            <FileSearch className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Other Investigation Master
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Centralized diagnostic investigation knowledge serving clinical case documentation and Section 4B
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-nowrap shrink-0 whitespace-nowrap overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={loadInvestigations}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Refresh Knowledge Master"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => downloadMasterExcelTemplate('other_inv_knowledge')}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Download Other Investigation Excel Template"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Download Excel Template</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Bulk Import Other Investigations"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all transform hover:-translate-y-0.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>Add Investigation</span>
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
            placeholder="Search investigation name or category..."
            className="w-full h-10 pl-10 pr-4 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
          >
            <option value="All">All Categories ({investigations.length})</option>
            {INVESTIGATION_CATEGORIES.map(cat => (
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
            className="w-full h-10 pl-10 pr-4 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
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
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-bold">Loading Other Investigation Master...</p>
          </div>
        ) : filteredInvs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FileSearch className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Other Investigations Found</p>
            <p className="text-xs">Try adjusting your search query or filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Investigation Name</th>
                  <th className="py-3.5 px-4">Normalized Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Updated At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredInvs.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {inv.investigation_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {inv.normalized_name}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                        {inv.category || 'General Diagnostic'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        inv.is_active
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}>
                        {inv.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {inv.updated_at ? new Date(inv.updated_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenView(inv)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Full Knowledge"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                          title="Edit Investigation Knowledge"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(inv)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            inv.is_active
                              ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                              : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                          }`}
                          title={inv.is_active ? 'Deactivate Investigation' : 'Activate Investigation'}
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
      {showViewModal && activeInv && (
        <ModalWrapper
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title={`INVESTIGATION KNOWLEDGE: ${activeInv.investigation_name}`}
          subtitle={`Category: ${activeInv.category || 'General Diagnostic'}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
              <span className="text-slate-400 block text-[10px] uppercase">Normalized Name</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{activeInv.normalized_name}</span>
            </div>

            {activeInv.description && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200 mb-1">Diagnostic Description</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{activeInv.description}</p>
              </div>
            )}

            {activeInv.expected_findings && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                <h4 className="font-extrabold text-emerald-800 dark:text-emerald-300 mb-1">Expected Normal Findings</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{activeInv.expected_findings}</p>
              </div>
            )}

            {activeInv.clinical_significance && (
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
                <h4 className="font-extrabold text-blue-800 dark:text-blue-300 mb-1">Clinical Significance</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{activeInv.clinical_significance}</p>
              </div>
            )}

            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span>Status: {activeInv.is_active ? 'Active' : 'Inactive'}</span>
              <span>Updated: {new Date(activeInv.updated_at).toLocaleString()}</span>
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
          title={showAddModal ? 'ADD NEW OTHER INVESTIGATION' : `EDIT INVESTIGATION: ${activeInv?.investigation_name}`}
          subtitle="Master Diagnostic Knowledge Record Management"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Investigation Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.investigation_name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      investigation_name: name,
                      normalized_name: name.toLowerCase().trim()
                    }));
                  }}
                  placeholder="e.g. Echocardiogram (ECHO)"
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
                  placeholder="echocardiogram (echo)"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
                  required
                />
              </div>
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
                {INVESTIGATION_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Diagnostic Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Overview of the investigation procedure..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expected Normal Findings
              </label>
              <textarea
                rows={2}
                value={formData.expected_findings}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_findings: e.target.value }))}
                placeholder="Standard expected normal findings..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Significance
              </label>
              <textarea
                rows={2}
                value={formData.clinical_significance}
                onChange={(e) => setFormData(prev => ({ ...prev, clinical_significance: e.target.value }))}
                placeholder="Clinical utility, disease indications, and diagnostic value..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
              />
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
                className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex items-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{showAddModal ? 'Create Master Record' : 'Save Changes'}</span>
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
        masterType="other_inv_knowledge"
        masterTitle="Other Investigation Master"
        existingRecords={investigations}
        onSuccess={loadInvestigations}
      />
    </div>
  );
};

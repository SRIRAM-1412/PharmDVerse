import React, { useState, useEffect, useMemo } from 'react';
import { 
  Utensils, Search, Plus, Edit2, Eye, CheckCircle, XCircle, AlertCircle, 
  RefreshCw, ShieldAlert, Sparkles, Filter, Check, X, FileSpreadsheet, Upload 
} from 'lucide-react';
import { 
  fetchDrugFoodInteractionsForAdmin, 
  createDrugFoodInteractionInSupabase, 
  updateDrugFoodInteractionInSupabase, 
  toggleDrugFoodInteractionStatusInSupabase 
} from '../../services/supabaseService';
import { downloadMasterExcelTemplate } from '../../services/masterDataImportService';
import { MasterBulkImportModal } from './MasterBulkImportModal';

export const DrugFoodInteractionManagementView = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    drug_generic: '',
    food_or_beverage: '',
    interaction_description: '',
    mechanism: '',
    clinical_significance: '',
    severity: 'Major',
    management: '',
    counselling_point: '',
    source_reference: '',
    is_active: true
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchDrugFoodInteractionsForAdmin();
    if (res.success) {
      setRecords(res.data || []);
    } else {
      setError(res.error || 'Failed to load Drug-Food interaction master records');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      drug_generic: '',
      food_or_beverage: '',
      interaction_description: '',
      mechanism: '',
      clinical_significance: '',
      severity: 'Major',
      management: '',
      counselling_point: '',
      source_reference: 'BNF, NFI, USP',
      is_active: true
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    setFormData({
      drug_generic: rec.drug_generic || '',
      food_or_beverage: rec.food_or_beverage || '',
      interaction_description: rec.interaction_description || '',
      mechanism: rec.mechanism || '',
      clinical_significance: rec.clinical_significance || '',
      severity: rec.severity || 'Major',
      management: rec.management || '',
      counselling_point: rec.counselling_point || '',
      source_reference: rec.source_reference || '',
      is_active: rec.is_active !== undefined ? rec.is_active : true
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    let res;
    if (editingRecord) {
      res = await updateDrugFoodInteractionInSupabase(editingRecord.id, formData);
    } else {
      res = await createDrugFoodInteractionInSupabase(formData);
    }

    if (res.success) {
      setSuccessMsg(editingRecord ? 'Drug-Food interaction updated successfully!' : 'New Drug-Food interaction record created successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsModalOpen(false);
      loadData();
    } else {
      setModalError(res.error || 'Failed to save record.');
    }
    setSaving(false);
  };

  const handleToggleStatus = async (rec) => {
    const nextStatus = !rec.is_active;
    const res = await toggleDrugFoodInteractionStatusInSupabase(rec.id, nextStatus);
    if (res.success) {
      setRecords(prev => prev.map(r => r.id === rec.id ? { ...r, is_active: nextStatus } : r));
      setSuccessMsg(`Status for ${rec.drug_generic} + ${rec.food_or_beverage} updated to ${nextStatus ? 'ACTIVE' : 'INACTIVE'}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setError(res.error || 'Failed to toggle status');
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        (r.drug_generic || '').toLowerCase().includes(q) ||
        (r.food_or_beverage || '').toLowerCase().includes(q) ||
        (r.interaction_description || '').toLowerCase().includes(q) ||
        (r.mechanism || '').toLowerCase().includes(q);

      const matchesSeverity = severityFilter === 'ALL' || r.severity?.toUpperCase() === severityFilter.toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && r.is_active) || 
        (statusFilter === 'INACTIVE' && !r.is_active);

      return matchesQuery && matchesSeverity && matchesStatus;
    });
  }, [records, searchQuery, severityFilter, statusFilter]);

  const getSeverityBadge = (sev) => {
    switch ((sev || '').toUpperCase()) {
      case 'CRITICAL':
      case 'SEVERE':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'MAJOR':
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'MODERATE':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <Utensils className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Section 5B Master Repository</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Drug–Food Interaction Master</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Authoritative drug-food & dietary interaction knowledge database powering Section 5B clinical counselling and risk warnings.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-nowrap shrink-0 whitespace-nowrap overflow-x-auto pb-1 md:pb-0 z-10">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => downloadMasterExcelTemplate('dfi_knowledge')}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Download Drug-Food Interaction Excel Template"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Download Excel Template</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Bulk Import Drug-Food Interactions"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3] shrink-0" />
            <span>Add Food Interaction</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-3 shadow-xs">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Drug or Food item..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Severity:</span>
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="SEVERE">Severe / Critical</option>
            <option value="MAJOR">Major</option>
            <option value="MODERATE">Moderate</option>
            <option value="MINOR">Minor</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>

      </div>

      {/* Table List */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
            <span>Loading master drug-food interaction records...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <ShieldAlert className="w-8 h-8 mx-auto text-slate-400" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No drug-food interaction records found matching your query.</p>
            <p className="text-[11px] text-slate-500">Try clearing filters or adding a new record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-extrabold border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Drug (Generic)</th>
                  <th className="py-3.5 px-4">Food / Beverage Item</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Interaction Summary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/50 transition-colors">
                    
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {rec.drug_generic}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-amber-800 dark:text-amber-300">
                      <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
                        {rec.food_or_beverage}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getSeverityBadge(rec.severity)}`}>
                        {rec.severity}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300" title={rec.interaction_description}>
                      {rec.interaction_description}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(rec)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer border transition-all ${
                          rec.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {rec.is_active ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                        <span>{rec.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setViewingRecord(rec)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="View Full Knowledge"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(rec)}
                        className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 text-amber-800 dark:text-amber-300 transition-colors cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-5 my-8">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {editingRecord ? 'Edit Drug-Food Interaction' : 'Add New Drug-Food Interaction'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Drug & Food Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Drug (Generic Name) *</label>
                  <input
                    type="text"
                    required
                    value={formData.drug_generic}
                    onChange={(e) => setFormData(prev => ({ ...prev, drug_generic: e.target.value }))}
                    placeholder="e.g. Atorvastatin"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Food / Beverage Item *</label>
                  <input
                    type="text"
                    required
                    value={formData.food_or_beverage}
                    onChange={(e) => setFormData(prev => ({ ...prev, food_or_beverage: e.target.value }))}
                    placeholder="e.g. Grapefruit Juice"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              {/* Severity & Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Severity Level *</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-medium cursor-pointer"
                  >
                    <option value="Severe / Critical">Severe / Critical</option>
                    <option value="Major">Major</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Source / Reference</label>
                  <input
                    type="text"
                    value={formData.source_reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, source_reference: e.target.value }))}
                    placeholder="e.g. BNF, NFI, USP"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              {/* Interaction Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Interaction Description *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.interaction_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, interaction_description: e.target.value }))}
                  placeholder="Summary of the interaction between the drug and food item..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Mechanism */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mechanism of Interaction</label>
                <textarea
                  rows={2}
                  value={formData.mechanism}
                  onChange={(e) => setFormData(prev => ({ ...prev, mechanism: e.target.value }))}
                  placeholder="Intestinal CYP3A4 inhibition, chelation, MAO inhibition..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Clinical Significance */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Clinical Significance</label>
                <textarea
                  rows={2}
                  value={formData.clinical_significance}
                  onChange={(e) => setFormData(prev => ({ ...prev, clinical_significance: e.target.value }))}
                  placeholder="Toxicity risk, therapeutic failure, or altered blood concentration..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Management & Counselling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Clinical Management</label>
                  <textarea
                    rows={2}
                    value={formData.management}
                    onChange={(e) => setFormData(prev => ({ ...prev, management: e.target.value }))}
                    placeholder="Timing separation (e.g. 2h before), food avoidance..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Patient Counselling Point</label>
                  <textarea
                    rows={2}
                    value={formData.counselling_point}
                    onChange={(e) => setFormData(prev => ({ ...prev, counselling_point: e.target.value }))}
                    placeholder="Clear patient instructions on dietary restriction or timing..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="dfi_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-amber-600 rounded-sm border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="dfi_is_active" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Mark record as ACTIVE for Section 5B analysis
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 pb-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{saving ? 'Saving...' : editingRecord ? 'Update Record' : 'Save Record'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4 p-6 my-8">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {viewingRecord.drug_generic} + {viewingRecord.food_or_beverage}
                </h3>
              </div>
              <button onClick={() => setViewingRecord(null)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getSeverityBadge(viewingRecord.severity)}`}>
                  {viewingRecord.severity}
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500">Source: <strong>{viewingRecord.source_reference || 'N/A'}</strong></span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-extrabold text-slate-900 dark:text-white">Interaction Description:</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{viewingRecord.interaction_description}</p>
              </div>

              {viewingRecord.mechanism && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-extrabold text-slate-900 dark:text-white">Mechanism of Interaction:</span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{viewingRecord.mechanism}</p>
                </div>
              )}

              {viewingRecord.clinical_significance && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-extrabold text-slate-900 dark:text-white">Clinical Significance:</span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{viewingRecord.clinical_significance}</p>
                </div>
              )}

              {viewingRecord.management && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 space-y-1">
                  <span className="font-extrabold text-amber-900 dark:text-amber-300">Management Strategy:</span>
                  <p className="text-amber-800 dark:text-amber-200 leading-relaxed">{viewingRecord.management}</p>
                </div>
              )}

              {viewingRecord.counselling_point && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <span className="font-extrabold text-emerald-900 dark:text-emerald-300">Patient Counselling Point:</span>
                  <p className="text-emerald-800 dark:text-emerald-200 leading-relaxed">{viewingRecord.counselling_point}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                onClick={() => setViewingRecord(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      <MasterBulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        masterType="dfi_knowledge"
        masterTitle="Drug–Food Interaction Master"
        existingRecords={records}
        onSuccess={loadData}
      />
    </div>
  );
};

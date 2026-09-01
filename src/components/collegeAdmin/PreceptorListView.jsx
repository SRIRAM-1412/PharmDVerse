import React, { useState, useEffect } from 'react';
import { User, Search, Filter, Plus, Edit3, Trash2, CheckCircle2, XCircle, Eye, Download, ChevronLeft, ChevronRight, Phone, Mail, Award, Briefcase, Building2, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { fetchPreceptorsFromSupabase, updatePreceptorInSupabase, deletePreceptorFromSupabase } from '../../services/supabaseService';
import { ModalWrapper } from '../modals/ModalWrapper';
import { SecurityManagementSection } from './SecurityManagementSection';
import { EditPreceptorModal } from './EditPreceptorModal';

export const PreceptorListView = ({ college, onAddNew }) => {
  const [preceptors, setPreceptors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Inactive'
  const [departmentFilter, setDepartmentFilter] = useState('All'); // 'All' | 'Pharmacy Practice' | 'Pharmacology'
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // View / Edit / Delete Modal State
  const [selectedPreceptor, setSelectedPreceptor] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [preceptorToDelete, setPreceptorToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadPreceptors = async () => {
    setLoading(true);
    const res = await fetchPreceptorsFromSupabase(college.id);
    if (res.success) {
      setPreceptors(res.data || []);
    } else {
      setPreceptors([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (college) loadPreceptors();
  }, [college]);

  // Filtered & Paginated Data
  const filteredPreceptors = preceptors.filter(p => {
    const matchesSearch = 
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mobile_number?.includes(searchQuery) ||
      p.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.qualification?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesDept = departmentFilter === 'All' || p.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const totalPages = Math.ceil(filteredPreceptors.length / itemsPerPage) || 1;
  const paginatedPreceptors = filteredPreceptors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleStatus = async (preceptor) => {
    const newStatus = preceptor.status === 'Active' ? 'Inactive' : 'Active';
    setActionLoading(true);
    await updatePreceptorInSupabase(preceptor.id, { ...preceptor, fullName: preceptor.full_name, mobileNumber: preceptor.mobile_number, status: newStatus });
    setActionLoading(false);
    await loadPreceptors();
  };

  const handleConfirmDelete = async () => {
    if (!preceptorToDelete) return;
    setActionLoading(true);
    await deletePreceptorFromSupabase(preceptorToDelete.id);
    setActionLoading(false);
    setPreceptorToDelete(null);
    await loadPreceptors();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Pharm.D & B.Pharm Preceptors</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registered clinical evaluators & preceptors for <strong className="text-slate-800 dark:text-slate-200">{college?.name || 'your institution'}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Exporting Preceptors list to CSV/Excel...')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Export List"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            onClick={onAddNew}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Preceptor</span>
          </button>
        </div>
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
            placeholder="Search name, department, email..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 px-2.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Departments</option>
              <option value="Pharmacy Practice">Pharmacy Practice</option>
              <option value="Pharmacology">Pharmacology</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {['All', 'Active', 'Inactive'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
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
          <p className="text-xs font-semibold text-slate-500">Loading Preceptors Directory...</p>
        </div>
      ) : paginatedPreceptors.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <User className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No preceptors found.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'All' 
              ? 'No preceptors matched your search criteria. Try adjusting your search query.'
              : 'Add your first preceptor to assign hospital evaluations.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Photo</th>
                  <th className="py-3.5 px-5">Full Name</th>
                  <th className="py-3.5 px-5">Qualification</th>
                  <th className="py-3.5 px-5">Department</th>
                  <th className="py-3.5 px-5">Mobile Number</th>
                  <th className="py-3.5 px-5">Email Address</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedPreceptors.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 px-5">
                      {p.profile_photo_url ? (
                        <img
                          src={p.profile_photo_url}
                          alt={p.full_name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                          {p.full_name ? p.full_name.substring(0, 2).toUpperCase() : 'PR'}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">
                      {p.full_name}
                      <span className="block text-[10px] text-slate-400 font-normal">{p.designation}</span>
                    </td>

                    <td className="py-3.5 px-5 font-semibold text-slate-700 dark:text-slate-300">
                      {p.qualification}
                    </td>

                    <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 font-medium">
                      {p.department}
                    </td>

                    <td className="py-3.5 px-5 font-mono text-slate-600 dark:text-slate-400">
                      {p.mobile_number}
                    </td>

                    <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400">
                      {p.email}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.status === 'Active'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Modal Trigger */}
                        <button
                          onClick={() => {
                            setSelectedPreceptor(p);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Modal Trigger */}
                        <button
                          onClick={() => {
                            setSelectedPreceptor(p);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                          title="Edit Preceptor Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            p.status === 'Active'
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={p.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {p.status === 'Active' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>

                        {/* Delete Trigger */}
                        <button
                          onClick={() => setPreceptorToDelete(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                          title="Delete Preceptor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing <strong className="text-slate-800 dark:text-slate-200">{paginatedPreceptors.length}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredPreceptors.length}</strong> preceptors
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

      {/* VIEW PROFILE MODAL */}
      {isViewModalOpen && selectedPreceptor && (
        <ModalWrapper
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Clinical Preceptor Profile"
          subtitle={`Details for ${selectedPreceptor.full_name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              {selectedPreceptor.profile_photo_url ? (
                <img
                  src={selectedPreceptor.profile_photo_url}
                  alt={selectedPreceptor.full_name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shadow-sm">
                  {selectedPreceptor.full_name ? selectedPreceptor.full_name.substring(0, 2).toUpperCase() : 'PR'}
                </div>
              )}
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedPreceptor.full_name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold">{selectedPreceptor.designation}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {selectedPreceptor.status}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Department:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPreceptor.department}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Qualification:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPreceptor.qualification}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Mobile Number:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedPreceptor.mobile_number}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Email (User ID):</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedPreceptor.email}</span>
              </div>
            </div>

            <SecurityManagementSection
              user={selectedPreceptor}
              userType="Preceptor"
              collegeAdminId={college.id}
              onUpdateUser={(updatedPreceptor) => {
                setPreceptors(prev => prev.map(p => p.id === updatedPreceptor.id ? updatedPreceptor : p));
                setSelectedPreceptor(updatedPreceptor);
              }}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* EDIT PRECEPTOR MODAL */}
      {isEditModalOpen && selectedPreceptor && (
        <EditPreceptorModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          preceptor={selectedPreceptor}
          onSuccess={(updatedPreceptor) => {
            setPreceptors(prev => prev.map(p => p.id === updatedPreceptor.id ? updatedPreceptor : p));
            if (selectedPreceptor?.id === updatedPreceptor.id) {
              setSelectedPreceptor(updatedPreceptor);
            }
          }}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {preceptorToDelete && (
        <ModalWrapper
          isOpen={Boolean(preceptorToDelete)}
          onClose={() => setPreceptorToDelete(null)}
          title="Delete Preceptor"
          subtitle={`Are you sure you want to delete ${preceptorToDelete.full_name}?`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This action will permanently remove this clinical preceptor record and login credentials from the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPreceptorToDelete(null)}
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

    </div>
  );
};

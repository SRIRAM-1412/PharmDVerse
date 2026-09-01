import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Filter, Plus, Edit3, Trash2, Eye, Download, ChevronLeft, ChevronRight, User, GraduationCap, Calendar, AlertTriangle, Loader2, Save, X } from 'lucide-react';
import { fetchPreceptorsFromSupabase, fetchAssignmentsFromSupabase, updateAssignmentInSupabase, removeAssignmentFromSupabase } from '../../services/supabaseService';
import { ModalWrapper } from '../modals/ModalWrapper';

export const AssignmentListView = ({ college, onAddNew }) => {
  const [preceptors, setPreceptors] = useState([]);
  const [selectedPreceptorId, setSelectedPreceptorId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // View / Edit / Remove Modals
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    assignmentDate: '',
    status: 'Active',
    remarks: ''
  });

  const loadPreceptors = async () => {
    if (!college) return;
    const res = await fetchPreceptorsFromSupabase(college.id);
    if (res.success && res.data) {
      setPreceptors(res.data);
      if (res.data.length > 0 && !selectedPreceptorId) {
        setSelectedPreceptorId(res.data[0].id);
      }
    }
  };

  const loadAssignments = async () => {
    if (!college) return;
    setLoading(true);
    const res = await fetchAssignmentsFromSupabase(college.id, selectedPreceptorId || null);
    if (res.success) {
      setAssignments(res.data || []);
    } else {
      setAssignments([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPreceptors();
  }, [college]);

  useEffect(() => {
    loadAssignments();
  }, [selectedPreceptorId, college]);

  const selectedPreceptor = preceptors.find(p => p.id === selectedPreceptorId);

  // Filter Assignments
  const filteredAssignments = assignments.filter(a => {
    const student = a.students;
    if (!student) return false;

    const matchesSearch = 
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.mobile_number?.includes(searchQuery);

    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage) || 1;
  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenEditModal = (assign) => {
    setSelectedAssignment(assign);
    setEditFormData({
      assignmentDate: assign.assignment_date || new Date().toISOString().split('T')[0],
      status: assign.status || 'Active',
      remarks: assign.remarks || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setActionLoading(true);
    const res = await updateAssignmentInSupabase(selectedAssignment.id, editFormData);
    setActionLoading(false);

    if (res.success) {
      setIsEditModalOpen(false);
      await loadAssignments();
    } else {
      alert(res.error || 'Failed to update assignment.');
    }
  };

  const handleConfirmRemove = async () => {
    if (!assignmentToRemove) return;
    setActionLoading(true);
    await removeAssignmentFromSupabase(assignmentToRemove.id);
    setActionLoading(false);
    setAssignmentToRemove(null);
    await loadAssignments();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Student-Preceptor Assignments</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage clinical student allocations for <strong className="text-slate-800 dark:text-slate-200">{college?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Exporting Assignment List to CSV/Excel...')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Export List"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            onClick={onAddNew}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Assign Students</span>
          </button>
        </div>
      </div>

      {/* TOP PRECEPTOR SELECTOR CARD */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Select Preceptor to View Assigned Students:
            </label>
          </div>

          <select
            value={selectedPreceptorId}
            onChange={(e) => {
              setSelectedPreceptorId(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-80 h-[44px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 font-bold"
          >
            <option value="">-- All Preceptors --</option>
            {preceptors.map(p => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.department})
              </option>
            ))}
          </select>
        </div>

        {selectedPreceptor && (
          <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-xs flex flex-wrap items-center gap-4 text-indigo-950 dark:text-indigo-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400">Selected Preceptor:</span>
              <strong className="block font-extrabold">{selectedPreceptor.full_name}</strong>
            </div>
            <span>•</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400">Department:</span>
              <span className="font-semibold">{selectedPreceptor.department}</span>
            </div>
            <span>•</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400">Assigned Count:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{filteredAssignments.length} Students</span>
            </div>
          </div>
        )}
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
            placeholder="Search student name, roll number..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status:</span>
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
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">Loading Student Assignments...</p>
        </div>
      ) : paginatedAssignments.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No assigned students found.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedPreceptor 
              ? `No active students are currently assigned to ${selectedPreceptor.full_name}.`
              : 'Select a preceptor above or assign new students.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Photo</th>
                  <th className="py-3.5 px-5">Roll Number</th>
                  <th className="py-3.5 px-5">Student Name</th>
                  <th className="py-3.5 px-5">Batch / Year</th>
                  <th className="py-3.5 px-5">Course</th>
                  <th className="py-3.5 px-5">Mobile Number</th>
                  <th className="py-3.5 px-5">Email Address</th>
                  <th className="py-3.5 px-5">Assignment Date</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedAssignments.map((a) => {
                  const s = a.students || {};
                  return (
                    <tr key={a.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-3.5 px-5">
                        {s.profile_photo_url ? (
                          <img
                            src={s.profile_photo_url}
                            alt={s.full_name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                            {s.full_name ? s.full_name.substring(0, 2).toUpperCase() : 'ST'}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-white">
                        {s.roll_number}
                      </td>

                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">
                        {s.full_name}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 block">{s.year}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-500">Batch {s.batch}</span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{s.course}</span>
                        {s.course === 'B.Pharm' && s.semester && (
                          <span className="block text-[10px] text-sky-600 dark:text-sky-400 font-bold mt-0.5">
                            {s.semester}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 font-mono text-slate-600 dark:text-slate-400">
                        {s.mobile_number || '—'}
                      </td>

                      <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400">
                        {s.email}
                      </td>

                      <td className="py-3.5 px-5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {a.assignment_date}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          a.status === 'Active'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                        }`}>
                          {a.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Modal Trigger */}
                          <button
                            onClick={() => {
                              setSelectedAssignment(a);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Assignment Trigger */}
                          <button
                            onClick={() => handleOpenEditModal(a)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                            title="Edit Assignment"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Remove Assignment Trigger */}
                          <button
                            onClick={() => setAssignmentToRemove(a)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            title="Remove Assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing <strong className="text-slate-800 dark:text-slate-200">{paginatedAssignments.length}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredAssignments.length}</strong> assigned students
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

      {/* VIEW ASSIGNMENT DETAILS MODAL */}
      {isViewModalOpen && selectedAssignment && (
        <ModalWrapper
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Student Assignment Details"
          subtitle={`Preceptor: ${selectedAssignment.preceptors?.full_name || 'N/A'}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <strong className="text-xs text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider font-extrabold">Student Details</strong>
              <div className="flex items-center gap-3">
                {selectedAssignment.students?.profile_photo_url ? (
                  <img src={selectedAssignment.students.profile_photo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center">ST</div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{selectedAssignment.students?.full_name}</h4>
                  <p className="font-mono text-slate-500 font-bold">Roll: {selectedAssignment.students?.roll_number}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Assigned Preceptor:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAssignment.preceptors?.full_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Preceptor Dept:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAssignment.preceptors?.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Assignment Date:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedAssignment.assignment_date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedAssignment.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Remarks:</span>
                <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-normal">
                  {selectedAssignment.remarks || 'No remarks added.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* EDIT ASSIGNMENT MODAL */}
      {isEditModalOpen && selectedAssignment && (
        <ModalWrapper
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Student Assignment"
          subtitle={`Student: ${selectedAssignment.students?.full_name} (${selectedAssignment.students?.roll_number})`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assignment Date *</label>
              <input
                type="date"
                required
                value={editFormData.assignmentDate}
                onChange={(e) => setEditFormData({ ...editFormData, assignmentDate: e.target.value })}
                className="w-full h-[44px] px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status *</label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full h-[44px] px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400"
              >
                <option value="Active">Active Assignment</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
              <textarea
                rows={3}
                value={editFormData.remarks}
                onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-bold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Assignment'}
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* REMOVE ASSIGNMENT CONFIRMATION MODAL */}
      {assignmentToRemove && (
        <ModalWrapper
          isOpen={Boolean(assignmentToRemove)}
          onClose={() => setAssignmentToRemove(null)}
          title="Remove Assignment"
          subtitle={`Unassign ${assignmentToRemove.students?.full_name}?`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to remove this preceptor assignment? The student will become unassigned and can be allocated to a new preceptor.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setAssignmentToRemove(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmRemove}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Confirm Remove</span>
                )}
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { GraduationCap, Search, Filter, Eye, ChevronLeft, ChevronRight, Loader2, Phone, Mail } from 'lucide-react';
import { fetchPreceptorAssignedStudentsFromSupabase } from '../../services/supabaseService';
import { ModalWrapper } from '../modals/ModalWrapper';
import { PreceptorStudentCasesView } from './PreceptorStudentCasesView';

export const PreceptorAssignedStudentsView = ({ preceptor, initialFilter = 'All' }) => {
  const [assignedRecords, setAssignedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected student for viewing cases (Screen 2)
  const [selectedStudentForCases, setSelectedStudentForCases] = useState(null);

  // View Student Modal (Quick View)
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAssignedStudents = async () => {
    if (!preceptor) return;
    setLoading(true);
    const res = await fetchPreceptorAssignedStudentsFromSupabase(preceptor.id);
    if (res.success) {
      setAssignedRecords(res.data || []);
    } else {
      setAssignedRecords([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAssignedStudents();
  }, [preceptor]);

  if (selectedStudentForCases) {
    return (
      <PreceptorStudentCasesView
        student={selectedStudentForCases}
        preceptor={preceptor}
        initialFilter={initialFilter}
        onBack={() => setSelectedStudentForCases(null)}
      />
    );
  }

  // Filtered Students
  const filteredRecords = assignedRecords.filter(r => {
    const s = r.students;
    if (!s) return false;

    const matchesSearch = 
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.mobile_number?.includes(searchQuery) ||
      s.batch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.year?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <span>My Assigned Students</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
          Pharmacy students currently allocated under your preceptorshp. Click "View" to open student clinical cases.
        </p>
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
            placeholder="Search roll number, student name..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
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
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">Loading Assigned Students...</p>
        </div>
      ) : paginatedRecords.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No assigned students found.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'All' 
              ? 'No students matched your search criteria.'
              : 'You do not have any students assigned to you yet.'}
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
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedRecords.map((r) => {
                  const s = r.students || {};
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-3.5 px-5">
                        {s.profile_photo_url ? (
                          <img
                            src={s.profile_photo_url}
                            alt={s.full_name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-700 dark:text-cyan-300 font-bold text-xs border border-cyan-200 dark:border-cyan-800">
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
                        <span className="font-semibold text-cyan-600 dark:text-cyan-400 block">{s.year}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-500">Batch {s.batch}</span>
                      </td>

                      <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 font-medium">
                        {s.course}
                      </td>

                      <td className="py-3.5 px-5 font-mono text-slate-600 dark:text-slate-400">
                        {s.mobile_number || '—'}
                      </td>

                      <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400">
                        {s.email}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          s.status === 'Active'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedStudentForCases(s)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 ml-auto shadow-xs transition-all"
                          title="Open Student Clinical Cases"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Cases</span>
                        </button>
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
              Showing <strong className="text-slate-800 dark:text-slate-200">{paginatedRecords.length}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredRecords.length}</strong> assigned students
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

      {/* VIEW STUDENT PROFILE MODAL */}
      {isModalOpen && selectedStudent && (
        <ModalWrapper
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Assigned Student Profile"
          subtitle={`Details for ${selectedStudent.full_name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              {selectedStudent.profile_photo_url ? (
                <img
                  src={selectedStudent.profile_photo_url}
                  alt={selectedStudent.full_name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-cyan-600 text-white font-extrabold text-xl flex items-center justify-center shadow-sm">
                  {selectedStudent.full_name ? selectedStudent.full_name.substring(0, 2).toUpperCase() : 'ST'}
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedStudent.full_name}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-mono font-semibold">Roll: {selectedStudent.roll_number}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                  {selectedStudent.year} • Batch {selectedStudent.batch}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Course:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudent.course}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Academic Year:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.academic_year}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Mobile Number:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedStudent.mobile_number || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Email Address:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedStudent.email}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

    </div>
  );
};

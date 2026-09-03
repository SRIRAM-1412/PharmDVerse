import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Filter, Plus, Edit3, Trash2, CheckCircle2, XCircle, Eye, Download, ChevronLeft, ChevronRight, GraduationCap, Calendar, BookOpen, AlertTriangle, Loader2, Upload } from 'lucide-react';
import { fetchStudentsFromSupabase, updateStudentInSupabase, deleteStudentFromSupabase } from '../../services/supabaseService';
import { ModalWrapper } from '../modals/ModalWrapper';
import { SecurityManagementSection } from './SecurityManagementSection';
import { EditStudentModal } from './EditStudentModal';
import { BulkStudentImportModal } from './BulkStudentImportModal';

export const StudentListView = ({ college, onAddNew }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Inactive'
  const [batchFilter, setBatchFilter] = useState('All'); // 'All' | 'Y22' | 'Y23' | 'Y24' | 'Y25' | 'Y26' | 'Y27'
  const [courseFilter, setCourseFilter] = useState('All'); // 'All' | 'Pharm.D' | 'B.Pharm'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // View / Edit / Delete / Bulk Import Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    const res = await fetchStudentsFromSupabase(college.id);
    if (res.success) {
      setStudents(res.data || []);
    } else {
      setStudents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (college) loadStudents();
  }, [college]);

  // Filtered & Paginated Data
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.batch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.year?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesBatch = batchFilter === 'All' || s.batch === batchFilter;
    const matchesCourse = courseFilter === 'All' || s.course === courseFilter;

    return matchesSearch && matchesStatus && matchesBatch && matchesCourse;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleStatus = async (student) => {
    const newStatus = student.status === 'Active' ? 'Inactive' : 'Active';
    setActionLoading(true);
    await updateStudentInSupabase(student.id, { 
      ...student, 
      rollNumber: student.roll_number, 
      fullName: student.full_name, 
      academicYear: student.academic_year, 
      status: newStatus 
    });
    setActionLoading(false);
    await loadStudents();
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setActionLoading(true);
    await deleteStudentFromSupabase(studentToDelete.id);
    setActionLoading(false);
    setStudentToDelete(null);
    await loadStudents();
  };

  const handleExportCSV = () => {
    if (!filteredStudents || filteredStudents.length === 0) {
      alert('No student records to export.');
      return;
    }
    let csv = "Roll Number,Full Name,Course,Batch,Year,Semester,Academic Year,Gender,Phone,Email,Status\n";
    filteredStudents.forEach(s => {
      csv += `"${s.roll_number || ''}","${s.full_name || ''}","${s.course || ''}","${s.batch || ''}","${s.year || ''}","${s.semester || ''}","${s.academic_year || ''}","${s.gender || ''}","${s.mobile_number || ''}","${s.email || ''}","${s.status || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Students_Directory_${college?.code || 'CLG'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Pharm.D & B.Pharm Directory</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enrolled Pharm.D & B.Pharm candidates for <strong className="text-slate-800 dark:text-slate-200">{college?.name}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export List to CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Bulk Import CSV"
          >
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={onAddNew}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search roll number, student name, email..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Course Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Course:</span>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Courses</option>
              <option value="Pharm.D">Pharm.D</option>
              <option value="B.Pharm">B.Pharm</option>
            </select>
          </div>

          {/* Batch Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Batch:</span>
            <select
              value={batchFilter}
              onChange={(e) => {
                setBatchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 px-2.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
            >
              <option value="All">All Batches</option>
              <option value="Y22">Y22</option>
              <option value="Y23">Y23</option>
              <option value="Y24">Y24</option>
              <option value="Y25">Y25</option>
              <option value="Y26">Y26</option>
              <option value="Y27">Y27</option>
            </select>
          </div>

          {/* Status Filter */}
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
          <p className="text-xs font-semibold text-slate-500">Loading Students Directory...</p>
        </div>
      ) : paginatedStudents.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No students found.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'All' || batchFilter !== 'All'
              ? 'No students matched your search filters. Try adjusting your query.'
              : 'Add your first student to enable digital logbook access.'}
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
                  <th className="py-3.5 px-5">Year / Batch</th>
                  <th className="py-3.5 px-5">Course</th>
                  <th className="py-3.5 px-5">Mobile Number</th>
                  <th className="py-3.5 px-5">Email Address</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedStudents.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 px-5">
                      {s.profile_photo_url ? (
                        <img
                          src={s.profile_photo_url}
                          alt={s.full_name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/80 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xs border border-teal-200 dark:border-teal-800">
                          {s.full_name ? s.full_name.substring(0, 2).toUpperCase() : 'ST'}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-white">
                      {s.roll_number}
                    </td>

                    <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">
                      {s.full_name}
                      <span className="block text-[10px] text-slate-400 font-normal">{s.gender}</span>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">{s.year}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">Batch {s.batch}</span>
                    </td>

                    <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 font-semibold">
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
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Trigger */}
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Trigger */}
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                          title="Edit Student Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleToggleStatus(s)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            s.status === 'Active'
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={s.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {s.status === 'Active' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>

                        {/* Delete Trigger */}
                        <button
                          onClick={() => setStudentToDelete(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                          title="Delete Student"
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
              Showing <strong className="text-slate-800 dark:text-slate-200">{paginatedStudents.length}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredStudents.length}</strong> students
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-800 dark:text-slate-200 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* VIEW STUDENT MODAL */}
      {isViewModalOpen && selectedStudent && (
        <ModalWrapper
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Pharm.D Student Profile"
          subtitle={`Details for ${selectedStudent.full_name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              {selectedStudent.profile_photo_url ? (
                <img
                  src={selectedStudent.profile_photo_url}
                  alt={selectedStudent.full_name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shadow-sm">
                  {selectedStudent.full_name ? selectedStudent.full_name.substring(0, 2).toUpperCase() : 'ST'}
                </div>
              )}
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedStudent.full_name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-mono font-semibold">Roll: {selectedStudent.roll_number}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {selectedStudent.year} • Batch {selectedStudent.batch}
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
                <span className="text-slate-400">Course:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudent.course}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Academic Year:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.academic_year}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Mobile Number:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedStudent.mobile_number || '—'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Email Address:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedStudent.email}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center sm:col-span-2">
                <span className="text-slate-400">Username (Login ID):</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedStudent.username}</span>
              </div>
            </div>

            <SecurityManagementSection
              user={selectedStudent}
              userType="Student"
              collegeAdminId={college.id}
              onUpdateUser={(updatedStudent) => {
                setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
                setSelectedStudent(updatedStudent);
              }}
            />

            <div className="flex justify-end pt-2">
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

      {/* EDIT STUDENT MODAL */}
      {isEditModalOpen && selectedStudent && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          student={selectedStudent}
          onSuccess={(updatedStudent) => {
            setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
            if (selectedStudent?.id === updatedStudent.id) {
              setSelectedStudent(updatedStudent);
            }
          }}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {studentToDelete && (
        <ModalWrapper
          isOpen={Boolean(studentToDelete)}
          onClose={() => setStudentToDelete(null)}
          title="Delete Student"
          subtitle={`Are you sure you want to delete ${studentToDelete.full_name}?`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This action will permanently remove this student record, logbook data, and login credentials from the system.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setStudentToDelete(null)}
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

      {/* BULK IMPORT MODAL */}
      <BulkStudentImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        college={college}
        onSuccess={loadStudents}
      />

    </div>
  );
};

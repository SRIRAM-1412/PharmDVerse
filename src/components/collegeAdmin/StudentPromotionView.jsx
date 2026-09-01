import React, { useState, useEffect } from 'react';
import { TrendingUp, GraduationCap, CheckSquare, Square, Search, Filter, ArrowRight, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Loader2, Sparkles, Users } from 'lucide-react';
import { fetchStudentsFromSupabase, promoteStudentsBatchInSupabase } from '../../services/supabaseService';
import { useInlineNotification } from '../../hooks/useInlineNotification';
import { InlineActionNotification } from '../common/InlineActionNotification';

const getNextPromotionPreview = (course, year, semester) => {
  if (course === 'B.Pharm') {
    const semNum = parseInt(semester?.replace('Sem ', '') || '1');
    if (semNum >= 8) return { year: 'Graduated / Alumnus', semester: null };
    
    const nextSem = semNum + 1;
    let nextYear = year;
    if (nextSem === 3) nextYear = '2nd Year';
    else if (nextSem === 5) nextYear = '3rd Year';
    else if (nextSem === 7) nextYear = '4th Year';
    
    return { year: nextYear, semester: `Sem ${nextSem}` };
  } else {
    // Pharm.D logic
    const nextYearMap = {
      '1st Year': '2nd Year',
      '2nd Year': '3rd Year',
      '3rd Year': '4th Year',
      '4th Year': '5th Year',
      '5th Year': '6th Year (Internship)',
      '6th Year (Internship)': 'Graduated / Alumnus',
      '6th Year': 'Graduated / Alumnus'
    };
    return { year: nextYearMap[year] || 'Graduated / Alumnus', semester: null };
  }
};

export const StudentPromotionView = ({ college, initialBatch = 'All' }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('Pharm.D');
  const [selectedBatch, setSelectedBatch] = useState(initialBatch || 'All');
  const [selectedCurrentYear, setSelectedCurrentYear] = useState('All');
  const [selectedCurrentSemester, setSelectedCurrentSemester] = useState('All');

  useEffect(() => {
    if (initialBatch) {
      setSelectedBatch(initialBatch);
    }
  }, [initialBatch]);
  
  // Selection state for batch promotion
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [targetYear, setTargetYear] = useState('5th Year');
  const [targetSemester, setTargetSemester] = useState('Sem 1');
  const [targetAcademicYear, setTargetAcademicYear] = useState('2026–2027');
  
  // Modal & Promotion loading
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const { notification, showNotification, clearNotification } = useInlineNotification();

  const loadStudents = async () => {
    if (!college?.id) return;
    setLoading(true);
    const res = await fetchStudentsFromSupabase(college.id);
    const studentList = res.data || res.students || [];
    setStudents(studentList);
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, [college?.id]);

  // Derived Batches from actual registered active students
  const uniqueBatches = Array.from(new Set(students.map(s => s.batch).filter(Boolean))).sort();
  const uniqueYears = Array.from(new Set(students.map(s => s.year).filter(Boolean)));

  // Filtered Students List
  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCourse = student.course === selectedCourse;
    const matchesBatch = selectedBatch === 'All' || student.batch === selectedBatch;
    const matchesYear = selectedCurrentYear === 'All' || student.year === selectedCurrentYear;
    const matchesSemester = selectedCourse !== 'B.Pharm' || selectedCurrentSemester === 'All' || student.semester === selectedCurrentSemester;

    return matchesSearch && matchesCourse && matchesBatch && matchesYear && matchesSemester;
  });

  // Automatically update target year based on selected batch / current year filter
  useEffect(() => {
    let baseYear = null;
    let baseSemester = null;

    if (selectedCurrentYear !== 'All') {
      baseYear = selectedCurrentYear;
      baseSemester = selectedCourse === 'B.Pharm' && selectedCurrentSemester !== 'All' ? selectedCurrentSemester : null;
    } else if (filteredStudents.length > 0) {
      baseYear = filteredStudents[0].year;
      baseSemester = filteredStudents[0].semester;
    }

    if (baseYear) {
      const preview = getNextPromotionPreview(selectedCourse, baseYear, baseSemester);
      setTargetYear(preview.year);
      if (preview.semester) setTargetSemester(preview.semester);
    }
  }, [selectedCurrentYear, selectedCurrentSemester, selectedCourse, selectedBatch, students.length]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const handleToggleSelectStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePromoteBatch = async () => {
    if (selectedStudentIds.length === 0) return;
    setPromoting(true);

    const semesterToPass = selectedCourse === 'B.Pharm' ? targetSemester : null;
    const res = await promoteStudentsBatchInSupabase(selectedStudentIds, targetYear, targetAcademicYear, semesterToPass);
    setPromoting(false);
    setShowConfirmModal(false);

    if (res.success) {
      showNotification({
        type: 'success',
        message: `✓ Successfully promoted ${selectedStudentIds.length} student(s) to ${targetYear} ${semesterToPass ? `(${semesterToPass})` : ''}!`
      });
      setSelectedStudentIds([]);
      await loadStudents();
    } else {
      showNotification({
        type: 'error',
        message: res.error || '✖ Failed to promote students.'
      });
    }
  };

  const isAllSelected = filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length;

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Student Academic Promotion</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Promote student batches to the next academic year (e.g. promoting Y21 batch from 4th Year to 5th Year).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStudents}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Active Students</span>
            <strong className="text-xl font-black text-slate-900 dark:text-white">{students.length}</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Batches Registered</span>
            <strong className="text-xl font-black text-slate-900 dark:text-white">{uniqueBatches.length > 0 ? uniqueBatches.join(', ') : 'None'}</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Selected for Promotion</span>
            <strong className="text-xl font-black text-emerald-600 dark:text-emerald-400">{selectedStudentIds.length} <span className="text-xs font-normal text-slate-400">/ {filteredStudents.length}</span></strong>
          </div>
        </div>
      </div>

      {/* INLINE NOTIFICATION */}
      <InlineActionNotification notification={notification} onClose={clearNotification} position="inline" />

      {/* PROMOTION ACTION & FILTER PANEL */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Search Box */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name/Roll no..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Course Filter */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Filter by Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedCurrentYear('All');
                setSelectedCurrentSemester('All');
              }}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="Pharm.D">Pharm.D</option>
              <option value="B.Pharm">B.Pharm</option>
            </select>
          </div>

          {/* Filter by Batch */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Filter by Batch
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="All">All Batches</option>
              {uniqueBatches.map(b => (
                <option key={b} value={b}>{b} Batch</option>
              ))}
            </select>
          </div>

          {/* Filter by Current Year */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Current Year
            </label>
            <select
              value={selectedCurrentYear}
              onChange={(e) => setSelectedCurrentYear(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="All">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              {selectedCourse === 'Pharm.D' && <option value="5th Year">5th Year</option>}
              {selectedCourse === 'Pharm.D' && <option value="6th Year (Internship)">6th Year (Internship)</option>}
            </select>
          </div>

          {/* Filter by Current Semester (B.Pharm Only) */}
          {selectedCourse === 'B.Pharm' && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Current Semester
              </label>
              <select
                value={selectedCurrentSemester}
                onChange={(e) => setSelectedCurrentSemester(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="All">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={`Sem ${s}`}>Sem {s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Target Year Selector */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Promote To Year
            </label>
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 text-xs font-extrabold text-emerald-700 dark:text-emerald-300"
            >
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              {selectedCourse === 'Pharm.D' && <option value="5th Year">5th Year</option>}
              {selectedCourse === 'Pharm.D' && <option value="6th Year (Internship)">6th Year (Internship)</option>}
              <option value="Graduated / Alumnus">Graduated / Alumnus</option>
            </select>
          </div>

          {/* Target Semester (B.Pharm Only) */}
          {selectedCourse === 'B.Pharm' && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Promote To Sem
              </label>
              <select
                value={targetSemester}
                onChange={(e) => setTargetSemester(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 text-xs font-extrabold text-emerald-700 dark:text-emerald-300"
              >
                {[2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={`Sem ${s}`}>Sem {s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* BATCH PROMOTION ACTION TOOLBAR */}
        <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              {isAllSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
              <span>{isAllSelected ? 'Deselect All' : `Select All (${filteredStudents.length})`}</span>
            </button>
            
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Selected: <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">{selectedStudentIds.length}</strong> student(s)
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Target Session:</span>
              <select
                value={targetAcademicYear}
                onChange={(e) => setTargetAcademicYear(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="2025–2026">2025–2026</option>
                <option value="2026–2027">2026–2027</option>
                <option value="2027–2028">2027–2028</option>
                <option value="2028–2029">2028–2029</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={selectedStudentIds.length === 0}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Promote Selected ({selectedStudentIds.length})</span>
            </button>
          </div>
        </div>

      </div>

      {/* STUDENT PROMOTION TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs font-bold">Loading student records...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <GraduationCap className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No students found</p>
            <p className="text-xs text-slate-400">Try adjusting your batch or academic year filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <button type="button" onClick={handleSelectAll}>
                      {isAllSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                    </button>
                  </th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Batch</th>
                  <th className="p-4">Current Session</th>
                  <th className="p-4">Promotion Target Preview</th>
                  <th className="p-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {filteredStudents.map(student => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  const nextPreview = getNextPromotionPreview(student.course || 'Pharm.D', student.year, student.semester);
                  const previewYear = selectedStudentIds.length > 0 ? targetYear : nextPreview.year;
                  const previewSem = selectedStudentIds.length > 0 ? targetSemester : nextPreview.semester;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <button type="button" onClick={() => handleToggleSelectStudent(student.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                          )}
                        </button>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                        {student.roll_number}
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {student.full_name}
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{student.course || 'Pharm.D'}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[11px]">
                          {student.batch || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 text-[11px] inline-block">
                          {student.year || 'Unknown Year'}
                        </div>
                        {student.course === 'B.Pharm' && student.semester && (
                          <div className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800 text-[11px] inline-block ml-1">
                            {student.semester}
                          </div>
                        )}
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 text-[11px]">
                          <ArrowRight className="w-3 h-3 text-emerald-500" />
                          <span>{previewYear}</span>
                        </div>
                        {student.course === 'B.Pharm' && previewSem && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 text-[11px] ml-1">
                            <span>{previewSem}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentIds([student.id]);
                            setShowConfirmModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors border border-emerald-300 dark:border-emerald-800"
                        >
                          Promote Student
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Confirm Student Promotion</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Promote selected candidates to the next academic year.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Students:</span>
                <strong className="text-slate-900 dark:text-white font-extrabold">{selectedStudentIds.length} Student(s)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">New Academic Year:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{targetYear}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Academic Session:</span>
                <strong className="text-slate-900 dark:text-white font-mono font-bold">{targetAcademicYear}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={promoting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePromoteBatch}
                disabled={promoting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
              >
                {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                <span>{promoting ? 'Promoting...' : 'Confirm Promotion'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

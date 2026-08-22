import React, { useState, useEffect } from 'react';
import { LayoutDashboard, User, GraduationCap, Building2, LogOut, Sun, Moon, Menu, X, ShieldCheck, UserCheck, ClipboardList, FileText, FileCheck2, TrendingUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { fetchCollegeByIdFromSupabase, fetchStudentsFromSupabase } from '../../services/supabaseService';

import { CollegeAdminDashboardView } from './CollegeAdminDashboardView';
import { AddPreceptorView } from './AddPreceptorView';
import { PreceptorListView } from './PreceptorListView';
import { AddStudentView } from './AddStudentView';
import { StudentListView } from './StudentListView';
import { StudentPromotionView } from './StudentPromotionView';
import { AssignStudentsView } from './AssignStudentsView';
import { AssignmentListView } from './AssignmentListView';
import { DocumentBrandingView } from './DocumentBrandingView';
import { CollegeAdminProfileView } from './CollegeAdminProfileView';
import { ClinicalCaseManagementView } from './ClinicalCaseManagementView';
import { LeaveWorkspaceModal } from '../modals/LeaveWorkspaceModal';
import { LogoutConfirmModal } from '../modals/LogoutConfirmModal';
import { LogoPreviewModal } from '../modals/LogoPreviewModal';
import { useWorkspaceHistory } from '../../hooks/useWorkspaceHistory';
import { usePlatform } from '../../context/PlatformContext';

export const CollegeAdminLayout = ({ college: initialCollege, onLogout }) => {
  const { isDark, toggleTheme } = useTheme();
  const { platformSettings } = usePlatform();
  const platformLogoUrl = platformSettings?.logo_url || '/pharmdverse-logo.png';
  const { activeTab, setActiveTab, pushTab, popTab, showLeaveModal, setShowLeaveModal } = useWorkspaceHistory('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collegeAdminCaseFilter, setCollegeAdminCaseFilter] = useState('All');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All');
  const [activeStudentBatches, setActiveStudentBatches] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [college, setCollege] = useState(initialCollege);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Body scroll lock effect when mobile sidebar drawer is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  const isCollapsedOnDesktop = sidebarCollapsed && !mobileSidebarOpen;

  useEffect(() => {
    setCollege(initialCollege);
  }, [initialCollege]);

  // LIVE SYNCHRONIZATION LISTENER FOR COLLEGE UPDATES
  useEffect(() => {
    const handleCollegeUpdated = (e) => {
      if (e.detail) {
        setCollege(e.detail);
      }
    };
    window.addEventListener('pharmdverse_college_updated', handleCollegeUpdated);
    return () => window.removeEventListener('pharmdverse_college_updated', handleCollegeUpdated);
  }, []);

  // FETCH FRESH COLLEGE RECORD DIRECTLY FROM SUPABASE ON MOUNT
  useEffect(() => {
    const loadFreshCollege = async () => {
      if (initialCollege?.id) {
        const res = await fetchCollegeByIdFromSupabase(initialCollege.id);
        if (res.success && res.college) {
          setCollege(res.college);
        }
      }
    };
    loadFreshCollege();
  }, [initialCollege?.id]);

  // DYNAMICALLY FETCH ACTUAL REGISTERED ACTIVE STUDENT BATCHES FOR THIS COLLEGE
  useEffect(() => {
    const loadActiveBatches = async () => {
      if (college?.id) {
        const res = await fetchStudentsFromSupabase(college.id);
        const studentList = res.data || res.students || [];
        const batches = Array.from(new Set(studentList.map(s => s.batch).filter(Boolean))).sort();
        setActiveStudentBatches(batches);
      }
    };
    loadActiveBatches();
  }, [college?.id, activeTab]);

  const handleNavigate = (tab, filter = 'All', batchFilter = 'All') => {
    setCollegeAdminCaseFilter(filter);
    setSelectedBatchFilter(batchFilter);
    pushTab(tab);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProfileUpdated = (updatedCollege) => {
    if (updatedCollege) {
      setCollege(updatedCollege);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 font-sans flex transition-colors duration-300">
      
      {/* 1. SIDEBAR (DESKTOP & MOBILE DRAWER) */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 transform lg:translate-x-0 ${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
      } ${
        mobileSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          
          {/* SIDEBAR BRANDING HEADER */}
          <div className="h-16 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {college?.college_logo_url || college?.logoUrl ? (
                <img
                  src={college.college_logo_url || college.logoUrl}
                  alt={college.college_name || college.name}
                  className="w-8 h-8 rounded-xl object-contain bg-white border border-slate-200 dark:border-slate-700 p-0.5 shadow-xs shrink-0"
                />
              ) : (
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${college?.logoBg || 'from-emerald-600 to-teal-700'} flex items-center justify-center text-white font-extrabold text-xs shadow-xs shrink-0`}>
                  {college?.initials || 'CLG'}
                </div>
              )}
              {!isCollapsedOnDesktop && (
                <div className="min-w-0">
                  <strong className="block text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[130px]">
                    {college?.college_name || college?.name || 'College Admin'}
                  </strong>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block truncate">
                    {college?.college_code || college?.code || 'ADMIN'}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (window.innerWidth <= 1024) {
                  setMobileSidebarOpen(false);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              className="p-2 ml-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition-all cursor-pointer shrink-0"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* SIDEBAR NAVIGATION ITEMS */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto text-xs font-semibold">
            
            {/* Dashboard */}
            <button
              onClick={() => handleNavigate('dashboard')}
              title="Dashboard"
              className={`w-full h-11 rounded-xl flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3.5 gap-3'} transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isCollapsedOnDesktop && <span>Dashboard</span>}
            </button>

            {/* Preceptor Management */}
            <button
              onClick={() => handleNavigate('preceptors-list')}
              title="Preceptor Management"
              className={`w-full h-11 rounded-xl flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3.5 gap-3'} transition-all ${
                activeTab === 'preceptors-list' || activeTab === 'add-preceptor'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              {!isCollapsedOnDesktop && <span>Preceptor Management</span>}
            </button>

            {/* Student Management */}
            <button
              onClick={() => handleNavigate('students-list')}
              title="Student Management"
              className={`w-full h-11 rounded-xl flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3.5 gap-3'} transition-all ${
                activeTab === 'students-list' || activeTab === 'add-student'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              {!isCollapsedOnDesktop && <span>Student Management</span>}
            </button>

            {/* Student Promotion & Registered Batches */}
            <div className="space-y-1">
              <button
                onClick={() => handleNavigate('student-promotion', 'All', 'All')}
                title="Student Promotion"
                className={`w-full h-11 rounded-xl flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3.5 justify-between'} transition-all ${
                  activeTab === 'student-promotion'
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className={`flex items-center ${isCollapsedOnDesktop ? 'justify-center' : 'gap-3'}`}>
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  {!isCollapsedOnDesktop && <span>Student Promotion</span>}
                </div>
                {!isCollapsedOnDesktop && <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
              </button>

              {/* Sub-menu Registered Active Student Batches */}
              {activeStudentBatches.length > 0 && !isCollapsedOnDesktop && (
                <div className="pl-9 pr-1 py-1 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">
                    Active Student Batches:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeStudentBatches.map(b => (
                      <button
                        key={b}
                        onClick={() => handleNavigate('student-promotion', 'All', b)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono transition-all border ${
                          selectedBatchFilter === b && activeTab === 'student-promotion'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-400 font-extrabold shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assignment Management */}
            <button
              onClick={() => handleNavigate('assignments-list')}
              title="Assignment Management"
              className={`w-full h-11 rounded-xl flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3.5 gap-3'} transition-all ${
                activeTab === 'assignments-list' || activeTab === 'assign-students'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              {!isCollapsedOnDesktop && <span>Assignment Management</span>}
            </button>

            {/* Clinical Case Management */}
            <button
              onClick={() => handleNavigate('clinical-cases')}
              title="Clinical Case Management"
              className={`w-full h-11 rounded-xl flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3.5 gap-3'} transition-all ${
                activeTab === 'clinical-cases'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCheck2 className="w-4 h-4 shrink-0" />
              {!isCollapsedOnDesktop && <span>Clinical Case Management</span>}
            </button>

            {/* PDF & PPT Format */}
            <button
              onClick={() => handleNavigate('pdf-format')}
              title="PDF & PPT Format"
              className={`w-full h-11 rounded-xl flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3.5 gap-3'} transition-all ${
                activeTab === 'pdf-format' || activeTab === 'document-branding'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              {!isCollapsedOnDesktop && <span>PDF & PPT Format</span>}
            </button>

            {/* My Profile */}
            <button
              onClick={() => handleNavigate('profile')}
              title="My Profile"
              className={`w-full h-11 rounded-xl flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3.5 gap-3'} transition-all ${
                activeTab === 'profile'
                  ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              {!isCollapsedOnDesktop && <span>My Profile</span>}
            </button>

          </nav>

          {/* SIDEBAR FOOTER (LOGOUT & LIGHT/DARK TOGGLE) */}
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className={`w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3 justify-between'} transition-colors cursor-pointer`}
            >
              <div className={`flex items-center ${isCollapsedOnDesktop ? 'justify-center' : 'gap-2'}`}>
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                {!isCollapsedOnDesktop && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
              </div>
              {!isCollapsedOnDesktop && (
                <span className="text-[10px] uppercase font-bold text-slate-400">{isDark ? 'ON' : 'OFF'}</span>
              )}
            </button>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
              className={`w-full h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center ${isCollapsedOnDesktop ? 'px-0' : 'px-3 gap-2'} transition-colors cursor-pointer`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isCollapsedOnDesktop && <span>Logout</span>}
            </button>
          </div>

        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* TOPBAR */}
        <header className="h-16 px-4 sm:px-8 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth <= 1024) {
                  setMobileSidebarOpen(true);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              {(college?.college_logo_url || college?.logoUrl) ? (
                <img
                  src={college?.college_logo_url || college?.logoUrl}
                  alt={college?.college_name || college?.name || 'College Logo'}
                  className="w-8 h-8 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-0.5 shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-xs border border-white/20">
                  {(college?.college_name || college?.name || 'CLG').substring(0, 3).toUpperCase()}
                </div>
              )}
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {college?.college_name || college?.name} <span className="text-slate-400 font-normal text-xs hidden sm:inline">| College Admin Portal</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <img
                src={platformLogoUrl}
                alt="Platform Logo"
                className="w-4 h-4 object-contain shrink-0"
                onError={(e) => { e.target.src = '/pharmdverse-logo.png'; }}
              />
              <span>Admin Workspace</span>
            </span>
          </div>
        </header>

        {/* VIEW ROUTER */}
        <main className="flex-1 p-4 sm:p-8">
          {activeTab !== 'dashboard' && (
            <div className="mb-6 mt-1">
              <button
                onClick={() => popTab ? popTab() : handleNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Back</span>
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <CollegeAdminDashboardView college={college} onNavigate={handleNavigate} />
          )}

          {activeTab === 'add-preceptor' && (
            <AddPreceptorView
              college={college}
              onCancel={() => handleNavigate('preceptors-list')}
              onSuccess={() => handleNavigate('preceptors-list')}
            />
          )}

          {activeTab === 'preceptors-list' && (
            <PreceptorListView
              college={college}
              onAddNew={() => handleNavigate('add-preceptor')}
            />
          )}

          {activeTab === 'add-student' && (
            <AddStudentView
              college={college}
              onCancel={() => handleNavigate('students-list')}
              onSuccess={() => handleNavigate('students-list')}
            />
          )}

          {activeTab === 'students-list' && (
            <StudentListView
              college={college}
              onAddNew={() => handleNavigate('add-student')}
            />
          )}

          {activeTab === 'student-promotion' && (
            <StudentPromotionView college={college} initialBatch={selectedBatchFilter} />
          )}

          {activeTab === 'assign-students' && (
            <AssignStudentsView
              college={college}
              onCancel={() => handleNavigate('assignments-list')}
              onSuccess={() => handleNavigate('assignments-list')}
            />
          )}

          {activeTab === 'assignments-list' && (
            <AssignmentListView
              college={college}
              onAddNew={() => handleNavigate('assign-students')}
            />
          )}

          {activeTab === 'clinical-cases' && (
            <ClinicalCaseManagementView college={college} initialFilter={collegeAdminCaseFilter} />
          )}

          {(activeTab === 'pdf-format' || activeTab === 'document-branding') && (
            <DocumentBrandingView college={college} />
          )}

          {activeTab === 'profile' && (
            <CollegeAdminProfileView
              college={college}
              onProfileUpdated={handleProfileUpdated}
            />
          )}
        </main>

        {/* FOOTER */}
        <footer className="py-4 px-6 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 PharmDVerse Cloud. College Admin Module for {college?.college_name || college?.name}. All rights reserved.</p>
        </footer>

      </div>

      <LeaveWorkspaceModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirmLeave={onLogout}
        leaveButtonText="Go to College Landing Page"
      />

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirmLogout={onLogout}
        userType="College Admin"
      />

      <LogoPreviewModal isOpen={showLogoModal} onClose={() => setShowLogoModal(false)} />

    </div>
  );
};

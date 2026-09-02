import React, { useState, useEffect } from 'react';
import { LayoutDashboard, User, GraduationCap, Building2, LogOut, Sun, Moon, Menu, X, ShieldCheck, UserCheck, ClipboardList, FileText, FileCheck2, TrendingUp, ChevronDown, ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { fetchCollegeByIdFromSupabase, fetchCollegeSubscriptionByIdFromSupabase, fetchStudentsFromSupabase } from '../../services/supabaseService';

import { CollegeAdminDashboardView } from './CollegeAdminDashboardView';
import { AddPreceptorView } from './AddPreceptorView';
import { PreceptorListView } from './PreceptorListView';
import { AddStudentView } from './AddStudentView';
import { StudentListView } from './StudentListView';
import { StudentPromotionView } from './StudentPromotionView';
import { AssignStudentsView } from './AssignStudentsView';
import { AssignmentListView } from './AssignmentListView';
import { DocumentBrandingView } from './DocumentBrandingView';
import { BPharmDocumentBrandingView } from './BPharmDocumentBrandingView';
import { CollegeAdminProfileView } from './CollegeAdminProfileView';
import { ClinicalCaseManagementView } from './ClinicalCaseManagementView';
import { LeaveWorkspaceModal } from '../modals/LeaveWorkspaceModal';
import { LogoutConfirmModal } from '../modals/LogoutConfirmModal';
import { LogoPreviewModal } from '../modals/LogoPreviewModal';
import { ExpiredSubscriptionBanner } from '../common/ExpiredSubscriptionBanner';
import { useWorkspaceHistory } from '../../hooks/useWorkspaceHistory';
import { usePlatform } from '../../context/PlatformContext';
import { getSubscriptionStatusDetails } from '../../utils/subscriptionUtils';

export const CollegeAdminLayout = ({ college: initialCollege, onLogout }) => {
  const { isDark, toggleTheme } = useTheme();
  const { platformSettings } = usePlatform();
  const platformLogoUrl = platformSettings?.logo_url || '/pharmdverse-logo.png';
  const platformName = platformSettings?.platform_name || 'PharmDVerse';
  const { activeTab, setActiveTab, pushTab, popTab, showLeaveModal, setShowLeaveModal } = useWorkspaceHistory('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collegeAdminCaseFilter, setCollegeAdminCaseFilter] = useState('All');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All');
  const [activeStudentBatches, setActiveStudentBatches] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [college, setCollege] = useState(initialCollege);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const rawExpiry = college?.subscription_expiry_date || college?.subscriptionExpiryDate || '2027-08-04';
  const statusMeta = getSubscriptionStatusDetails(rawExpiry, college?.status);
  const isExpired = statusMeta.status === 'Expired';
  console.log("DEBUG EXPIRATION:", { rawExpiry, dbStatus: college?.status, statusMeta, isExpired, college });

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
        const res = await fetchCollegeSubscriptionByIdFromSupabase(initialCollege.id);
        if (res.success && res.college) {
          const merged = { 
            ...res.college, 
            subscription_start_date: res.subscription?.subscription_start_date || res.college.subscription_start_date,
            subscription_expiry_date: res.subscription?.subscription_end_date || res.college.subscription_end_date || res.subscription?.subscription_expiry_date,
            status: res.subscription?.status || res.college.status
          };
          setCollege(merged);
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

  const renderSidebarContent = (isMobile = false) => {
    const collapsed = !isMobile && sidebarCollapsed;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* SIDEBAR BRANDING HEADER */}
        <div className="h-16 px-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          {collapsed ? (
            <div className="w-full flex items-center justify-center">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition-all cursor-pointer flex items-center justify-center"
                title="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
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
                <div className="min-w-0">
                  <strong className="block text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[130px]">
                    {college?.college_name || college?.name || 'College Admin'}
                  </strong>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block truncate">
                    {college?.college_code || college?.code || 'ADMIN'}
                  </span>
                </div>
              </div>

              {isMobile ? (
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 ml-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition-all cursor-pointer shrink-0"
                  title="Close sidebar"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-2 ml-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition-all cursor-pointer shrink-0"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>

        {/* SIDEBAR NAVIGATION ITEMS */}
        <div className="p-3 space-y-4 overflow-y-auto min-h-0 flex-1">
          {/* SECTION 1: COLLEGE MANAGEMENT */}
          <div>
            {!collapsed && (
              <span className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                College Management
              </span>
            )}
            <nav className="space-y-1">
              {/* Dashboard */}
              <button
                onClick={() => handleNavigate('dashboard')}
                title="Dashboard"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">Dashboard</span>}
                </div>
              </button>


              {/* Preceptor Management */}
              <button
                onClick={() => handleNavigate('preceptors-list')}
                title="Preceptor Management"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'preceptors-list' || activeTab === 'add-preceptor'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <User className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">Preceptor Management</span>}
                </div>
              </button>

              {/* Student Management */}
              <button
                onClick={() => handleNavigate('students-list')}
                title="Student Management"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'students-list' || activeTab === 'add-student'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">Student Management</span>}
                </div>
              </button>

              {/* Student Promotion & Registered Batches */}
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigate('student-promotion', 'All', 'All')}
                  title="Student Promotion"
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'student-promotion'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">Student Promotion</span>}
                  </div>
                  {!collapsed && <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />}
                </button>

                {/* Sub-menu Registered Active Student Batches */}
                {activeStudentBatches.length > 0 && !collapsed && (
                  <div className="pl-9 pr-1 py-1 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">
                      Active Student Batches:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {activeStudentBatches.map(b => (
                        <button
                          key={b}
                          onClick={() => handleNavigate('student-promotion', 'All', b)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono transition-all border cursor-pointer ${
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
            </nav>
          </div>

          {/* SECTION 2: ACADEMIC WORKFLOWS */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {!collapsed && (
              <span className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                Academic Workflows
              </span>
            )}
            <nav className="space-y-1">
              {/* Assignment Management */}
              <button
                onClick={() => handleNavigate('assignments-list')}
                title="Assignment Management"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'assignments-list' || activeTab === 'assign-students'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">Assignment Management</span>}
                </div>
              </button>

              {/* Clinical Case Management */}
              <button
                onClick={() => handleNavigate('clinical-cases')}
                title="Clinical Case Management"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'clinical-cases'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileCheck2 className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">Clinical Case Management</span>}
                </div>
              </button>

              {/* Practical Records Management */}
              <button
                onClick={() => handleNavigate('practical-records')}
                title="Practical Records Management"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'practical-records'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileCheck2 className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">Practical Records Management</span>}
                </div>
              </button>

              {/* Pharm.D PDF & PPT Branding */}
              <button
                onClick={() => handleNavigate('document-branding')}
                title="Pharm.D PDF & PPT Branding"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'document-branding' || activeTab === 'pdf-format'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Palette className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">Pharm.D PDF & PPT Branding</span>}
                </div>
              </button>

              {/* B.Pharm PDF Branding */}
              <button
                onClick={() => handleNavigate('bpharm-branding')}
                title="B.Pharm PDF Branding"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'bpharm-branding'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Palette className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">B.Pharm PDF Branding</span>}
                </div>
              </button>
            </nav>
          </div>

          {/* SECTION 3: ACCOUNT & SECURITY */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {!collapsed && (
              <span className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                Account & Security
              </span>
            )}
            <nav className="space-y-1">
              {/* My Profile */}
              <button
                onClick={() => handleNavigate('profile')}
                title="My Profile & Security"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">My Profile & Security</span>}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* SIDEBAR FOOTER (LOGOUT & LIGHT/DARK TOGGLE) */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2 shrink-0">
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={`w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center ${collapsed ? 'justify-center px-0' : 'px-3 justify-between'} transition-colors cursor-pointer`}
          >
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
            </div>
            {!collapsed && (
              <span className="text-[10px] uppercase font-bold text-slate-400">{isDark ? 'ON' : 'OFF'}</span>
            )}
          </button>

          <button
            onClick={() => {
              if (isMobile) setMobileSidebarOpen(false);
              setShowLogoutConfirm(true);
            }}
            title="Logout"
            className={`w-full h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center ${collapsed ? 'px-0' : 'px-3 gap-2'} transition-colors cursor-pointer`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <ExpiredSubscriptionBanner college={college} />
      <div className="flex-1 bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 font-sans flex transition-colors duration-300 relative">
      
      {/* 1A. DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex fixed ${isExpired ? "top-10" : "top-0"} left-0 bottom-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 flex-col justify-between ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {renderSidebarContent(false)}
      </aside>

      {/* 1B. MOBILE OFF-CANVAS SIDEBAR DRAWER */}
      <aside className={`fixed ${isExpired ? "top-10" : "top-0"} bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-transform duration-300 transform lg:hidden flex flex-col justify-between ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {renderSidebarContent(true)}
      </aside>

      {/* 1C. MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* TOPBAR */}
        <header className="h-16 px-3 sm:px-8 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
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
              <div className="flex flex-col min-w-0 leading-tight justify-center">
                <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 sm:line-clamp-1">
                  {college?.college_name || college?.name}
                </h1>
                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                  College Admin Portal
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Only: Vertical Divider + Full Super Admin Style Workspace Badge */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <img
                src={platformLogoUrl}
                alt="Platform Logo"
                className="w-4 h-4 object-contain shrink-0 bg-white rounded-xs p-0.5"
                onError={(e) => { e.target.src = '/pharmdverse-logo.png'; }}
              />
              <span>College Admin Workspace</span>
            </span>
          </div>

          {/* Mobile Only: Compact Badge without Vertical Divider */}
          <div className="sm:hidden flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <img
                src={platformLogoUrl}
                alt="Platform Logo"
                className="w-3.5 h-3.5 object-contain shrink-0"
                onError={(e) => { e.target.src = '/pharmdverse-logo.png'; }}
              />
              <span className="hidden xs:inline">Admin</span>
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
            <AddPreceptorView isExpired={isExpired} college={college}
              onCancel={() => handleNavigate('preceptors-list')}
              onSuccess={() => handleNavigate('preceptors-list')}
            />
          )}

          {activeTab === 'preceptors-list' && (
            <PreceptorListView isExpired={isExpired} college={college}
              onAddNew={() => handleNavigate('add-preceptor')}
            />
          )}

          {activeTab === 'add-student' && (
            <AddStudentView isExpired={isExpired} college={college}
              onCancel={() => handleNavigate('students-list')}
              onSuccess={() => handleNavigate('students-list')}
            />
          )}

          {activeTab === 'students-list' && (
            <StudentListView isExpired={isExpired} college={college}
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
            <DocumentBrandingView isExpired={isExpired} college={college} />
          )}

          {activeTab === 'bpharm-branding' && (
            <BPharmDocumentBrandingView isExpired={isExpired} college={college} />
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
          <p>© {new Date().getFullYear()} {platformName} Cloud. College Admin Module for {college?.college_name || college?.name}. All rights reserved.</p>
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
    </div>
  );
};

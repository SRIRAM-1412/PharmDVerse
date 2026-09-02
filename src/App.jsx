import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { GlobalToastRenderer } from './components/common/GlobalToastRenderer';
import { SplashScreen } from './components/common/SplashScreen';
import { CollegeProvider } from './context/CollegeContext';
import { PlatformProvider } from './context/PlatformContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { StudentValueSection } from './components/landing/StudentValueSection';
import { PlatformWorkflowSection } from './components/landing/PlatformWorkflowSection';
import { Footer } from './components/Footer';
import { supabase } from './lib/supabaseClient';
import { AlertTriangle } from 'lucide-react';

// Config & Hooks
import { APP_CONFIG } from './config/appConfig';
import { useDeveloperShortcut } from './hooks/useDeveloperShortcut';
import { getActiveAdminSession, saveActiveSession, getActiveSession, clearActiveSession, logoutSuperAdmin } from './services/authService';
import { verifyActiveSessionTokenInSupabase, invalidateActiveSessionByTokenInSupabase } from './services/supabaseService';

// Full Page Components
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { CollegePortalView } from './components/portal/CollegePortalView';
import { CollegeAdminLayout } from './components/collegeAdmin/CollegeAdminLayout';
import { PharmPracticePreceptorLayout } from './components/preceptor/PharmPracticePreceptorLayout';
import { PharmacologyPreceptorLayout } from './components/preceptor/PharmacologyPreceptorLayout';
import { PharmDStudentLayout } from './components/student/PharmDStudentLayout';
import { BPharmStudentLayout } from './components/student/BPharmStudentLayout';

// Modals
import { PricingModal } from './components/modals/PricingModal';
import { ContactModal } from './components/modals/ContactModal';
import { RegisterModal } from './components/modals/RegisterModal';
import { AllCollegesModal } from './components/modals/AllCollegesModal';
import { DeveloperAccessModal } from './components/modals/DeveloperAccessModal';
import { SuperAdminModal } from './components/modals/SuperAdminModal';
import { CollegeAdminLoginModal } from './components/modals/CollegeAdminLoginModal';
import { PreceptorLoginModal } from './components/modals/PreceptorLoginModal';
import { StudentLoginModal } from './components/modals/StudentLoginModal';
import { InfoModal } from './components/modals/InfoModal';

export default function App() {
  const [showSplash, setShowSplash] = useState(false);
  const [viewMode, setViewMode] = useState('landing'); // 'landing' | 'admin' | 'college_portal' | 'college_admin' | 'preceptor_portal' | 'student_portal'
  
  const [pricingOpen, setPricingOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [allCollegesOpen, setAllCollegesOpen] = useState(false);
  const [devAccessOpen, setDevAccessOpen] = useState(false);
  
  const [superAdminLoginOpen, setSuperAdminLoginOpen] = useState(false);
  const [collegeAdminLoginOpen, setCollegeAdminLoginOpen] = useState(false);
  const [preceptorLoginOpen, setPreceptorLoginOpen] = useState(false);
  const [studentLoginOpen, setStudentLoginOpen] = useState(false);
  const [infoContentType, setInfoContentType] = useState(null);
  
  const [activePortalCollege, setActivePortalCollege] = useState(null);
  const [loggedCollegeAdmin, setLoggedCollegeAdmin] = useState(null);
  const [loggedPreceptor, setLoggedPreceptor] = useState(null);
  const [loggedStudent, setLoggedStudent] = useState(null);

  // Helper to safely set/delete custom headers on supabase.rest
  const setSupabaseCustomHeader = (key, val) => {
    try {
      if (supabase?.rest?.headers) {
        if (typeof supabase.rest.headers.set === 'function') {
          if (val) supabase.rest.headers.set(key, val);
          else if (typeof supabase.rest.headers.delete === 'function') supabase.rest.headers.delete(key);
        } else if (typeof supabase.rest.headers === 'object') {
          if (val) supabase.rest.headers[key] = val;
          else delete supabase.rest.headers[key];
        }
      }
    } catch (e) {
      console.warn(`[Supabase Header Warning] Could not update header ${key}:`, e);
    }
  };

  // Set custom RLS headers on supabase client based on logged-in user & active college
  useEffect(() => {
    setSupabaseCustomHeader('x-student-id', loggedStudent?.id);
  }, [loggedStudent]);

  useEffect(() => {
    setSupabaseCustomHeader('x-preceptor-id', loggedPreceptor?.id);
  }, [loggedPreceptor]);

  useEffect(() => {
    const activeCollegeId = loggedStudent?.college_id || loggedPreceptor?.college_id || loggedCollegeAdmin?.id || activePortalCollege?.id;
    setSupabaseCustomHeader('x-college-id', activeCollegeId);
  }, [loggedStudent, loggedPreceptor, loggedCollegeAdmin, activePortalCollege]);

  // Helper to normalize college object fields (handling both snake_case from DB and camelCase from frontend)
  const normalizeCollege = (raw) => {
    if (!raw) return null;
    return {
      ...raw,
      id: raw.id,
      name: raw.name || raw.college_name || 'Pharmacy College',
      code: raw.code || raw.college_code || 'CLG',
      description: raw.description || raw.college_description || '',
      logoUrl: raw.logoUrl || raw.college_logo_url || '',
      logoBg: raw.logoBg || 'from-emerald-500 to-teal-600',
      initials: raw.initials || (raw.name || raw.college_name || 'CLG').substring(0, 3).toUpperCase(),
      city: raw.city || '',
      state: raw.state || '',
      district: raw.district || '',
      websiteUrl: raw.websiteUrl || raw.website_url || `https://${(raw.code || raw.college_code || 'clg').toLowerCase()}.pharmdverse.com`,
      pciApprovalNo: raw.pciApprovalNo || raw.pci_approval_no || 'Verified',
      status: raw.status || 'Active'
    };
  };

  const [sessionEndedMessage, setSessionEndedMessage] = useState('');

  // Helper to handle forced logout when session token is invalidated by another device
  const handleSessionInvalidatedByOtherDevice = () => {
    setLoggedStudent(null);
    setLoggedPreceptor(null);
    setLoggedCollegeAdmin(null);
    clearActiveSession();
    setViewMode('landing');
    setSessionEndedMessage('Your session has ended because your account was logged in on another device.');
    setTimeout(() => {
      setSessionEndedMessage('');
    }, 6000);
  };

  // RESTORE ACTIVE SESSION ON BROWSER REFRESH (F5 / RELOAD) & DYNAMIC URL RESOLUTION
  useEffect(() => {
    const restoreSession = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const targetParam = urlParams.get('college') || urlParams.get('college_id') || urlParams.get('collegeCode');

      const session = getActiveSession();
      if (session) {
        // Verify session_token in public.active_sessions if available
        if (session.sessionToken) {
          const isValid = await verifyActiveSessionTokenInSupabase(session.sessionToken);
          if (!isValid) {
            handleSessionInvalidatedByOtherDevice();
            return;
          }
        }

        if (session.viewMode === 'admin') {
          const adminSession = getActiveAdminSession();
          if (adminSession && session.sessionToken) {
            const isStillActive = await verifyActiveSessionTokenInSupabase(session.sessionToken);
            if (isStillActive) {
              setViewMode('admin');
            } else {
              logoutSuperAdmin(session.sessionToken);
              setSessionEndedBanner(true);
            }
          } else if (adminSession) {
            setViewMode('admin');
          } else {
            clearActiveSession();
          }
        } else if (session.viewMode === 'college_admin' && (session.user || session.college)) {
          const collegeObj = normalizeCollege(session.college || session.user);
          if (collegeObj && session.user && (session.user.id === collegeObj.id || session.user.college_id === collegeObj.id)) {
            setLoggedCollegeAdmin(session.user || session.college);
            setActivePortalCollege(collegeObj);
            setViewMode('college_admin');
          } else {
            clearActiveSession();
          }
        } else if (session.viewMode === 'preceptor_portal' && session.user) {
          const collegeObj = normalizeCollege(session.user.colleges || session.college);
          if (collegeObj && session.user.college_id === collegeObj.id) {
            setLoggedPreceptor(session.user);
            setActivePortalCollege(collegeObj);
            setViewMode('preceptor_portal');
          } else {
            clearActiveSession();
          }
        } else if (session.viewMode === 'student_portal' && session.user) {
          const collegeObj = normalizeCollege(session.user.colleges || session.college);
          if (collegeObj && session.user.college_id === collegeObj.id) {
            setLoggedStudent(session.user);
            setActivePortalCollege(collegeObj);
            setViewMode('student_portal');
          } else {
            clearActiveSession();
          }
        } else if (session.viewMode === 'college_portal' && session.college) {
          const collegeObj = normalizeCollege(session.college);
          setActivePortalCollege(collegeObj);
          setViewMode('college_portal');
        }
      }
    };

    restoreSession();
  }, []);

  // PERIODIC ACTIVE SESSION VALIDATION (EVERY 10 SECONDS FOR ACTIVE USERS)
  useEffect(() => {
    if (!loggedStudent && !loggedPreceptor && !loggedCollegeAdmin) return;

    const interval = setInterval(async () => {
      const session = getActiveSession();
      if (session && session.sessionToken) {
        const isValid = await verifyActiveSessionTokenInSupabase(session.sessionToken);
        if (!isValid) {
          handleSessionInvalidatedByOtherDevice();
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [loggedStudent, loggedPreceptor, loggedCollegeAdmin]);

  // Hidden Developer Mode Keyboard Shortcut (Ctrl + Alt + D)
  useDeveloperShortcut({
    enabled: APP_CONFIG.DEVELOPER_MODE,
    onTrigger: () => {
      setDevAccessOpen(true);
    },
    isModalOpen: devAccessOpen || superAdminLoginOpen || viewMode === 'admin'
  });

  // Open Full-Page College Portal Landing Page
  const handleOpenPortal = (college) => {
    const normalized = normalizeCollege(college);
    setActivePortalCollege(normalized);
    setViewMode('college_portal');
    setAllCollegesOpen(false);
    saveActiveSession({ viewMode: 'college_portal', college: normalized });
  };

  // Back to Main Public PharmDVerse Website
  const handleBackToLanding = () => {
    const session = getActiveSession();
    if (session?.sessionToken) {
      invalidateActiveSessionByTokenInSupabase(session.sessionToken);
    }
    setViewMode('landing');
    setActivePortalCollege(null);
    setLoggedCollegeAdmin(null);
    setLoggedPreceptor(null);
    setLoggedStudent(null);
    logoutSuperAdmin();
    clearActiveSession();
    window.history.replaceState(null, '', window.location.pathname);
  };

  // Student Logout -> Redirect to Student's College Landing Page
  const handleStudentLogout = () => {
    const session = getActiveSession();
    if (session?.sessionToken) {
      invalidateActiveSessionByTokenInSupabase(session.sessionToken);
    }
    const collegeObj = normalizeCollege(loggedStudent?.colleges || activePortalCollege);
    setLoggedStudent(null);
    clearActiveSession();
    window.history.replaceState(null, '', window.location.pathname);
    if (collegeObj) {
      setActivePortalCollege(collegeObj);
      setViewMode('college_portal');
      saveActiveSession({ viewMode: 'college_portal', college: collegeObj });
    } else {
      handleBackToLanding();
    }
  };

  // Preceptor Logout -> Redirect to Preceptor's College Landing Page
  const handlePreceptorLogout = () => {
    const session = getActiveSession();
    if (session?.sessionToken) {
      invalidateActiveSessionByTokenInSupabase(session.sessionToken);
    }
    const collegeObj = normalizeCollege(loggedPreceptor?.colleges || activePortalCollege);
    setLoggedPreceptor(null);
    clearActiveSession();
    window.history.replaceState(null, '', window.location.pathname);
    if (collegeObj) {
      setActivePortalCollege(collegeObj);
      setViewMode('college_portal');
      saveActiveSession({ viewMode: 'college_portal', college: collegeObj });
    } else {
      handleBackToLanding();
    }
  };

  // College Admin Logout -> Redirect to College Landing Page
  const handleCollegeAdminLogout = () => {
    const session = getActiveSession();
    if (session?.sessionToken) {
      invalidateActiveSessionByTokenInSupabase(session.sessionToken);
    }
    const collegeObj = normalizeCollege(loggedCollegeAdmin || activePortalCollege);
    setLoggedCollegeAdmin(null);
    clearActiveSession();
    window.history.replaceState(null, '', window.location.pathname);
    if (collegeObj) {
      setActivePortalCollege(collegeObj);
      setViewMode('college_portal');
      saveActiveSession({ viewMode: 'college_portal', college: collegeObj });
    } else {
      handleBackToLanding();
    }
  };

  // Super Admin Logout -> Redirect to Main PharmDVerse Website
  const handleSuperAdminLogout = () => {
    logoutSuperAdmin();
    clearActiveSession();
    window.history.replaceState(null, '', window.location.pathname);
    handleBackToLanding();
  };

  const handleCollegeAdminLoginSuccess = (college, sessionToken) => {
    const normalized = normalizeCollege(college);
    setLoggedCollegeAdmin(college);
    setActivePortalCollege(normalized);
    setViewMode('college_admin');
    setCollegeAdminLoginOpen(false);
    saveActiveSession({ viewMode: 'college_admin', college: normalized, user: college, sessionToken });
  };

  const handlePreceptorLoginSuccess = (preceptor, sessionToken) => {
    const collegeObj = normalizeCollege(preceptor.colleges || activePortalCollege);
    setLoggedPreceptor(preceptor);
    if (collegeObj) setActivePortalCollege(collegeObj);
    setViewMode('preceptor_portal');
    setPreceptorLoginOpen(false);
    saveActiveSession({ viewMode: 'preceptor_portal', college: collegeObj, user: preceptor, sessionToken });
  };

  const handleStudentLoginSuccess = (student, sessionToken) => {
    const collegeObj = normalizeCollege(student.colleges || activePortalCollege);
    setLoggedStudent(student);
    if (collegeObj) setActivePortalCollege(collegeObj);
    setViewMode('student_portal');
    setStudentLoginOpen(false);
    saveActiveSession({ viewMode: 'student_portal', college: collegeObj, user: student, sessionToken });
  };

  return (
    <ThemeProvider>
      <GlobalToastRenderer />
      <PlatformProvider>
          {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

        <CollegeProvider>
        
        {/* 1. FULL PAGE SUPER ADMIN DASHBOARD VIEW */}
        {viewMode === 'admin' ? (
          <SuperAdminDashboard
            onExitToLanding={handleSuperAdminLogout}
          />
        ) : viewMode === 'college_admin' && loggedCollegeAdmin ? (
          
          /* 2. FULL PAGE COLLEGE ADMIN MODULE VIEW */
          <CollegeAdminLayout
            college={loggedCollegeAdmin}
            onLogout={handleCollegeAdminLogout}
          />

        ) : viewMode === 'preceptor_portal' && loggedPreceptor ? (
          
          /* 3. FULL PAGE PRECEPTOR PORTAL VIEW (FORKED BY DEPARTMENT) */
          (loggedPreceptor.department === 'Pharmacology' ? (
            <PharmacologyPreceptorLayout
              preceptor={loggedPreceptor}
              onLogout={handlePreceptorLogout}
            />
          ) : (
            <PharmPracticePreceptorLayout
              preceptor={loggedPreceptor}
              onLogout={handlePreceptorLogout}
            />
          ))

        ) : viewMode === 'student_portal' && loggedStudent ? (
          
          /* 4. FULL PAGE STUDENT PORTAL VIEW (FORKED BY COURSE) */
          (loggedStudent.course === 'B.Pharm' ? (
            <BPharmStudentLayout
              student={loggedStudent}
              onLogout={handleStudentLogout}
            />
          ) : (
            <PharmDStudentLayout
              student={loggedStudent}
              onLogout={handleStudentLogout}
            />
          ))

        ) : viewMode === 'college_portal' && activePortalCollege ? (
          
          /* 5. FULL PAGE DEDICATED COLLEGE PORTAL LANDING PAGE */
          <CollegePortalView
            college={activePortalCollege}
            onBackToLanding={handleBackToLanding}
            onOpenAdminLogin={(col) => {
              setActivePortalCollege(col);
              setCollegeAdminLoginOpen(true);
            }}
            onOpenPreceptorLogin={(col) => {
              setActivePortalCollege(col);
              setPreceptorLoginOpen(true);
            }}
            onOpenStudentLogin={(col) => {
              setActivePortalCollege(col);
              setStudentLoginOpen(true);
            }}
          />

        ) : (
          /* 6. PUBLIC SAAS LANDING PAGE VIEW */
          <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300 flex flex-col justify-between">
            
            {/* Sticky Glass Header */}
            <Header
              onOpenPricing={() => setPricingOpen(true)}
              onOpenContact={() => setContactOpen(true)}
            />

            {/* Main Landing Page Content */}
            <main className="flex-grow">
              
              {/* Hero Section */}
              <Hero
                onOpenPortal={handleOpenPortal}
                onOpenAllColleges={() => setAllCollegesOpen(true)}
                onOpenRegisterModal={() => setRegisterOpen(true)}
              />

              {/* Student Value Section: From Case Learning to Clinical Confidence */}
              <StudentValueSection />

              {/* Complete Platform Workflow Section */}
              <PlatformWorkflowSection />

            </main>

            {/* Clean Public Footer */}
            <Footer
              onOpenInfoModal={(type) => setInfoContentType(type)}
              onOpenSuperAdmin={() => setSuperAdminLoginOpen(true)}
            />

            {/* --- MODAL DIALOGS --- */}
            
            {/* Pricing Popup Modal */}
            <PricingModal
              isOpen={pricingOpen}
              onClose={() => setPricingOpen(false)}
              onSelectPlanToRegister={() => {
                setPricingOpen(false);
                setRegisterOpen(true);
              }}
            />

            {/* Contact Popup Modal */}
            <ContactModal
              isOpen={contactOpen}
              onClose={() => setContactOpen(false)}
            />

            {/* College Registration Modal */}
            <RegisterModal
              isOpen={registerOpen}
              onClose={() => setRegisterOpen(false)}
            />

            {/* All Subscribed Colleges Modal */}
            <AllCollegesModal
              isOpen={allCollegesOpen}
              onClose={() => setAllCollegesOpen(false)}
              onOpenPortal={handleOpenPortal}
            />

            {/* Developer Access Code Modal (Triggered via Ctrl + Alt + D) */}
            <DeveloperAccessModal
              isOpen={devAccessOpen}
              onClose={() => setDevAccessOpen(false)}
              onSuccess={() => setSuperAdminLoginOpen(true)}
            />

            {/* Super Admin Login Modal */}
            <SuperAdminModal
              isOpen={superAdminLoginOpen}
              onClose={() => setSuperAdminLoginOpen(false)}
              onLoginSuccess={(token) => {
                setViewMode('admin');
                setSuperAdminLoginOpen(false);
                saveActiveSession({ viewMode: 'admin', userRole: 'super_admin', sessionToken: token });
              }}
            />

            {/* Informational Modals */}
            <InfoModal
              isOpen={Boolean(infoContentType)}
              onClose={() => setInfoContentType(null)}
              contentType={infoContentType}
            />

          </div>
        )}

        {/* Global Portal Login Modals when on College Portal page */}
        {viewMode === 'college_portal' && (
          <>
            <CollegeAdminLoginModal
              isOpen={collegeAdminLoginOpen}
              onClose={() => setCollegeAdminLoginOpen(false)}
              initialCollege={activePortalCollege}
              onLoginSuccess={handleCollegeAdminLoginSuccess}
            />

            <PreceptorLoginModal
              isOpen={preceptorLoginOpen}
              onClose={() => setPreceptorLoginOpen(false)}
              initialCollege={activePortalCollege}
              onLoginSuccess={handlePreceptorLoginSuccess}
            />

            <StudentLoginModal
              isOpen={studentLoginOpen}
              onClose={() => setStudentLoginOpen(false)}
              initialCollege={activePortalCollege}
              onLoginSuccess={handleStudentLoginSuccess}
            />
          </>
        )}

        {/* Session Invalidation Toast Banner */}
        {sessionEndedMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
            <div className="p-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shadow-2xl border border-amber-500/50 flex items-center gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold leading-relaxed text-slate-100">
                {sessionEndedMessage}
              </p>
            </div>
          </div>
        )}

        </CollegeProvider>
      </PlatformProvider>
    </ThemeProvider>
  );
}

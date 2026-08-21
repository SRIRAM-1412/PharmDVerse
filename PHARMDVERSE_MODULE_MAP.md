# PHARMDVERSE ERP — MODULE MAP REFERENCE DOCUMENT

> **ROLE → MODULE → PAGE / COMPONENT → DATABASE TABLE → SERVICE → DEPENDENCIES**

---

## 1. PUBLIC VISITOR JOURNEY

```text
VISITOR
  │
  ├─► MAIN LANDING PAGE
  │     ├── Page: App.jsx (viewMode === 'landing')
  │     ├── Components: Header.jsx, Hero.jsx, ActiveColleges.jsx, CallToAction.jsx, Footer.jsx
  │     ├── Database Table: public.colleges, public.subscriptions
  │     └── Services: supabaseService.js (fetchAllCollegesFromSupabase)
  │
  ├─► OPEN COLLEGE PORTAL
  │     ├── Page: App.jsx (viewMode === 'college_portal')
  │     ├── Component: CollegePortalView.jsx
  │     ├── Database Table: public.colleges, public.college_branding
  │     └── Services: authService.js (saveActiveSession)
  │
  └─► REGISTER YOUR COLLEGE
        ├── Modal: RegisterModal.jsx
        ├── Database Table: public.registration_requests
        └── Services: supabaseService.js (saveCollegeRegistrationRequest)
```

---

## 2. SUPER ADMIN GOVERNANCE ROLE

```text
SUPER ADMIN
  │
  ├─► GOVERNANCE DASHBOARD
  │     ├── Component: SuperAdminDashboard.jsx
  │     ├── Database Table: public.super_admin, public.colleges, public.subscriptions
  │     └── Services: authService.js (logoutSuperAdmin)
  │
  ├─► COLLEGE REGISTRATION APPLICATIONS
  │     ├── View: SuperAdminDashboard.jsx (activeTab === 'requests')
  │     ├── Database Table: public.registration_requests, public.colleges, public.college_admins, public.subscriptions
  │     └── Services: supabaseService.js (approveRegistrationRequest, rejectRegistrationRequest)
  │
  └─► DRUG KNOWLEDGE MASTER MANAGEMENT
        ├── Component: DrugKnowledgeManagementView.jsx
        ├── Database Table: public.drug_knowledge (SINGLE SOURCE OF TRUTH)
        └── Services: supabaseService.js (fetchAllDrugKnowledgeFromSupabase, addDrugKnowledgeToSupabase, updateDrugKnowledgeInSupabase, checkGenericDrugExistsInSupabase)
```

---

## 3. COLLEGE ADMIN ROLE

```text
COLLEGE ADMIN
  │
  ├─► COLLEGE ADMIN DASHBOARD
  │     ├── Layout: CollegeAdminLayout.jsx
  │     ├── View: CollegeAdminDashboardView.jsx
  │     ├── Database Table: public.college_admins, public.colleges
  │     └── Services: supabaseService.js (fetchCollegeAdminStats)
  │
  ├─► PRECEPTOR / FACULTY MANAGEMENT
  │     ├── Views: PreceptorListView.jsx, AddPreceptorView.jsx, EditPreceptorModal.jsx
  │     ├── Database Table: public.preceptors
  │     └── Services: supabaseService.js (fetchPreceptorsFromSupabase, createPreceptorInSupabase, updatePreceptorInSupabase)
  │
  ├─► STUDENT ENROLLMENT & PROMOTION
  │     ├── Views: StudentListView.jsx, AddStudentView.jsx, EditStudentModal.jsx, StudentPromotionView.jsx
  │     ├── Database Table: public.students
  │     └── Services: supabaseService.js (fetchStudentsFromSupabase, createStudentInSupabase, updateStudentInSupabase)
  │
  ├─► STUDENT-PRECEPTOR ASSIGNMENTS
  │     ├── Views: AssignStudentsView.jsx, AssignmentListView.jsx
  │     ├── Database Table: public.student_preceptor_assignments
  │     └── Services: supabaseService.js (fetchStudentPreceptorAssignmentsFromSupabase, assignStudentToPreceptorInSupabase)
  │
  └─► DOCUMENT BRANDING & SETTINGS
        ├── View: DocumentBrandingView.jsx
        ├── Database Table: public.college_branding
        └── Services: supabaseService.js (fetchCollegeBrandingFromSupabase, saveCollegeBrandingInSupabase)
```

---

## 4. PRECEPTOR ROLE

```text
PRECEPTOR
  │
  ├─► PRECEPTOR WORKSPACE & DASHBOARD
  │     ├── Layout: PreceptorLayout.jsx
  │     ├── View: PreceptorDashboardView.jsx
  │     ├── Database Table: public.preceptors, public.student_preceptor_assignments
  │     └── Services: supabaseService.js (fetchPreceptorAssignedStudents)
  │
  ├─► CLINICAL CASE REVIEW QUEUE
  │     ├── View: PreceptorCaseReviewView.jsx
  │     ├── Database Table: public.clinical_cases, public.clinical_case_review_history
  │     └── Services: supabaseService.js (fetchClinicalCasesForPreceptor, updateClinicalCaseReviewStatus)
  │
  ├─► 4-STEP CASE EVALUATION & ANNOTATIONS
  │     ├── View: PreceptorCaseReviewView.jsx (Detailed Review Mode)
  │     ├── Database Table: public.patient_profiles, public.patient_lab_investigations, public.patient_prescribed_drugs, public.clinical_case_review_history
  │     └── Services: diffEngine.js, supabaseService.js (saveCaseReviewFeedback)
  │
  └─► SPECIALIZED MODULE REVIEWS
        ├── ADR Review: PreceptorCaseReviewView.jsx (ADR Tab) -> public.adr_reports
        ├── Counselling Review: PreceptorCaseReviewView.jsx (Counselling Tab) -> public.patient_counselling
        └── Intervention Review: PreceptorCaseReviewView.jsx (Intervention Tab) -> public.pharmacist_interventions
```

---

## 5. STUDENT CLINICAL ERP ROLE

```text
STUDENT
  │
  ├─► STUDENT DASHBOARD
  │     ├── Layout: StudentLayout.jsx
  │     ├── View: StudentDashboardView.jsx
  │     ├── Database Table: public.students, public.clinical_cases
  │     └── Services: supabaseService.js (fetchStudentCasesFromSupabase)
  │
  ├─► PATIENT PROFILE & CASE ENTRY (STEPS 1–6)
  │     ├── View: PatientProfileFormView.jsx
  │     ├── Database Table: public.patient_profiles, public.patient_lab_investigations, public.patient_prescribed_drugs, public.clinical_cases
  │     └── Services: supabaseService.js (saveStudentFormSectionInSupabase, saveLabInvestigationsInSupabase, savePrescribedDrugsInSupabase), labMasterData.js
  │
  ├─► SECTION 3: LABORATORY INTERPRETATION ENGINE
  │     ├── View: StudentAiAnalysisView.jsx (Section 3)
  │     ├── Database Table: public.lab_parameter_knowledge, public.patient_lab_investigations
  │     └── Services: supabaseService.js (fetchLabParameterKnowledgeFromSupabase)
  │
  ├─► SECTION 4A: DRUG KNOWLEDGE RETRIEVAL & DISPLAY
  │     ├── View: StudentAiAnalysisView.jsx (Section 4A)
  │     ├── Database Table: public.drug_knowledge (SINGLE SOURCE OF TRUTH)
  │     └── Services: prescriptionParserService.js (resolveTradeNameToGeneric), supabaseService.js (fetchMultipleDrugKnowledgeFromSupabase)
  │
  ├─► SECTION 4B: AI CLINICAL MEDICATION INTERPRETATION
  │     ├── View: StudentAiAnalysisView.jsx (Section 4B)
  │     ├── Service: aiAnalysisService.js (synthesizeSection4DrugAiInterpretation)
  │     └── Dependencies: Patient Vitals, Section 3 Lab Findings, Section 4A Drug Knowledge
  │
  ├─► ADVERSE DRUG REACTION (ADR) REPORTING
  │     ├── Views: ADRDocumentationFormView.jsx, ADRReportPreviewModal.jsx
  │     ├── Database Table: public.adr_reports
  │     └── Services: supabaseService.js (saveADRReportInSupabase)
  │
  ├─► PATIENT COUNSELLING DOCUMENTATION
  │     ├── Views: PatientCounsellingFormView.jsx, PatientCounsellingPDFPreviewModal.jsx
  │     ├── Database Table: public.patient_counselling
  │     └── Services: supabaseService.js (savePatientCounsellingInSupabase)
  │
  ├─► PHARMACIST INTERVENTIONS
  │     ├── View: PharmacistInterventionsFormView.jsx
  │     ├── Database Table: public.pharmacist_interventions
  │     └── Services: supabaseService.js (savePharmacistInterventionInSupabase)
  │
  └─► BRANDED DOCUMENT EXPORT & PDF PRINTING
        ├── Components: ClinicalCaseDocumentRenderer.jsx, PharmDVerseBrandedDocumentContainer.jsx
        ├── Database Table: public.college_branding
        └── Libraries: html2canvas, jsPDF
```

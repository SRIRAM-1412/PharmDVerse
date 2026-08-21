# PHARMDVERSE ERP — DATABASE MAP REFERENCE DOCUMENT

> **PUBLIC SCHEMA ARCHITECTURE: 22 TABLES**
> **Database Engine**: PostgreSQL (Supabase Managed Service)
> **Row-Level Security (RLS)**: Enabled across all 22 tables

---

## 1. PUBLIC TABLE SCHEMAS & RELATIONSHIPS

### 1. `public.active_sessions`
- **Purpose**: Tracks active single user logins across devices. Enforces 1 active session per `user_role + user_id`.
- **Primary Key**: `id` (uuid)
- **Columns**: `id`, `user_id` (uuid), `user_role` (text), `session_token` (text, UNIQUE), `is_active` (boolean, DEFAULT true), `login_at` (timestamptz)
- **Constraints**: Partial Unique Index `idx_single_active_session ON active_sessions (user_role, user_id) WHERE (is_active = true)`.
- **Used By Role**: All Roles (Student, Preceptor, College Admin, Super Admin).
- **Used By Module**: `App.jsx`, `authService.js`, `supabaseService.js`.

---

### 2. `public.adr_reports`
- **Purpose**: Adverse Drug Reaction (ADR) reporting and Naranjo Causality Assessment documentation.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `clinical_case_id` $\rightarrow$ `clinical_cases(id)`, `student_id` $\rightarrow$ `students(id)`, `college_id` $\rightarrow$ `colleges(id)`
- **Columns**: `id`, `clinical_case_id`, `student_id`, `college_id`, `patient_name`, `age`, `sex`, `suspect_drug`, `reaction_description`, `naranjo_score`, `naranjo_causality`, `who_causality`, `severity`, `outcome`, `status`, `review_status`, `preceptor_comments`, `created_at`, `updated_at`.
- **Used By Role**: Student (Author), Preceptor (Reviewer).
- **Used By Module**: `ADRDocumentationFormView.jsx`, `ADRReportPreviewModal.jsx`.

---

### 3. `public.clinical_case_review_history`
- **Purpose**: Immutable audit log recording preceptor feedback, line annotations, returned change requests, and final approvals.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `clinical_case_id` $\rightarrow$ `clinical_cases(id)`, `preceptor_id` $\rightarrow$ `preceptors(id)`
- **Columns**: `id`, `clinical_case_id`, `preceptor_id`, `review_status`, `general_comments`, `field_annotations` (jsonb), `action_taken`, `reviewed_at`.
- **Used By Role**: Preceptor (Reviewer), Student (Author), College Admin (Auditor).
- **Used By Module**: `PreceptorCaseReviewView.jsx`, `StudentDocReviewView.jsx`.

---

### 4. `public.clinical_cases`
- **Purpose**: Master clinical case tracking record for each patient case assigned to a student.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `student_id` $\rightarrow$ `students(id)`, `college_id` $\rightarrow$ `colleges(id)`
- **Columns**: `id`, `student_id`, `college_id`, `case_title`, `patient_initials`, `age`, `gender`, `ip_no`, `department`, `ward`, `overall_case_status` (`Draft`, `Submitted`, `Returned`, `Approved`), `profile_completed` (boolean), `counselling_completed` (boolean), `created_at`, `updated_at`.
- **Used By Role**: Student, Preceptor, College Admin.
- **Used By Module**: `StudentDashboardView.jsx`, `PreceptorLayout.jsx`, `ClinicalCaseManagementView.jsx`.

---

### 5. `public.college_admins`
- **Purpose**: College Admin user credentials and profile information.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `college_id` $\rightarrow$ `colleges(id)`
- **Columns**: `id`, `college_id`, `name`, `email`, `mobile_number`, `password_hash`, `role`, `status`, `created_at`, `updated_at`.
- **Used By Role**: College Admin, Super Admin.
- **Used By Module**: `CollegeAdminLoginModal.jsx`, `CollegeAdminProfileView.jsx`.

---

### 6. `public.college_branding`
- **Purpose**: Institutional document branding settings (letterhead, logos, PCI approval number, watermark configuration).
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `college_id` $\rightarrow$ `colleges(id)`
- **Columns**: `id`, `college_id`, `header_title`, `sub_header`, `logo_url`, `pci_approval_number`, `watermark_text`, `created_at`, `updated_at`.
- **Used By Role**: College Admin, All Roles (PDF Document Renderer).
- **Used By Module**: `DocumentBrandingView.jsx`, `PharmDVerseBrandedDocumentContainer.jsx`.

---

### 7. `public.colleges`
- **Purpose**: Master directory of onboarded pharmacy colleges.
- **Primary Key**: `id` (uuid)
- **Columns**: `id`, `college_name`, `college_code`, `city`, `state`, `pci_approval_no`, `status`, `created_at`, `updated_at`.
- **Used By Role**: All Roles (Public Landing Page, Super Admin, College Portals).
- **Used By Module**: `ActiveColleges.jsx`, `AllCollegesModal.jsx`, `SuperAdminDashboard.jsx`.

---

### 8. `public.drug_knowledge` (SINGLE SOURCE OF TRUTH)
- **Purpose**: Centralized generic drug database serving Section 4A & 4B clinical modules (683 active generic records).
- **Primary Key**: `id` (uuid)
- **Columns**:
  - `id` (uuid)
  - `generic_name` (text, NOT NULL)
  - `brand_names` (text)
  - `drug_class` (text)
  - `established_uses` (text)
  - `mechanism_of_action` (text)
  - `normal_dose_range` (text)
  - `contraindications` (text)
  - `side_effects_adverse_effects` (text)
  - `monitoring_parameters` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **Used By Role**: Super Admin (Master Management), Student & Preceptor (Read).
- **Used By Module**: `DrugKnowledgeManagementView.jsx`, `StudentAiAnalysisView.jsx` (Section 4A & 4B), `aiAnalysisService.js`.

---

### 9. `public.lab_parameter_knowledge`
- **Purpose**: Centralized laboratory parameter master knowledge database (62 active records covering all form categories).
- **Primary Key**: `id` (uuid)
- **Columns**: `id`, `parameter_name`, `normalized_name`, `category`, `evaluation_type` (`numeric`, `positive_negative`, `present_absent`), `increased_significance`, `decreased_significance`, `positive_significance`, `negative_significance`, `present_significance`, `absent_significance`, `context_notes`, `source_reference`, `is_active`, `created_at`, `updated_at`.
- **Used By Role**: Super Admin, Student & Preceptor (Section 3 Lab Evaluation).
- **Used By Module**: `StudentAiAnalysisView.jsx` (Section 3), `labMasterData.js`.

---

### 10. `public.patient_counselling`
- **Purpose**: Patient counselling & education documentation.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `clinical_case_id` $\rightarrow$ `clinical_cases(id)`, `student_id` $\rightarrow$ `students(id)`, `college_id` $\rightarrow$ `colleges(id)`
- **Columns**: `id`, `clinical_case_id`, `student_id`, `college_id`, `patient_name`, `disease_explained`, `medication_instructions`, `lifestyle_modifications`, `adherence_barriers`, `review_status`, `preceptor_comments`, `created_at`, `updated_at`.
- **Used By Role**: Student (Author), Preceptor (Reviewer).
- **Used By Module**: `PatientCounsellingFormView.jsx`, `PatientCounsellingPDFPreviewModal.jsx`.

---

### 11. `public.patient_lab_investigations`
- **Purpose**: Individual patient laboratory test results (numeric numbers & qualitative text strings).
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `patient_profile_id` $\rightarrow$ `patient_profiles(id)`
- **Columns**: `id`, `patient_profile_id`, `category`, `parameter_name`, `test_value` (varchar), `unit`, `reference_range`, `test_date`, `created_at`.
- **Used By Role**: Student (Author), Preceptor (Reviewer).
- **Used By Module**: `PatientProfileFormView.jsx`, `StudentAiAnalysisView.jsx` (Section 3).

---

### 12. `public.patient_prescribed_drugs`
- **Purpose**: Prescribed drugs and dosage regimens recorded for a patient.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `patient_profile_id` $\rightarrow$ `patient_profiles(id)`
- **Columns**: `id`, `patient_profile_id`, `s_no`, `trade_name`, `generic_name`, `route_of_admin`, `dose`, `frequency`, `start_date`, `stop_date`, `created_at`.
- **Used By Role**: Student (Author), Preceptor (Reviewer).
- **Used By Module**: `PatientProfileFormView.jsx`, `StudentAiAnalysisView.jsx` (Section 4A & 4B).

---

### 13. `public.patient_profiles`
- **Purpose**: Comprehensive patient profile (demographics, vital signs log, medical histories, provisional & final diagnosis).
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `clinical_case_id` $\rightarrow$ `clinical_cases(id)`, `student_id` $\rightarrow$ `students(id)`, `college_id` $\rightarrow$ `colleges(id)`
- **Columns**: `id`, `clinical_case_id`, `student_id`, `college_id`, `patient_name`, `age`, `gender`, `ip_no`, `height`, `weight`, `bmi`, `ward`, `department`, `doa`, `doc`, `dod`, `physician`, `chief_complaints`, `past_medical_history`, `past_medication_history`, `family_history`, `smoker_pack_day`, `smoker_duration`, `alcoholic_amount_day`, `alcoholic_duration`, `allergy_food`, `allergy_drugs`, `vital_signs` (jsonb), `other_investigations`, `final_diagnosis`, `discharge_summary`, `status`, `created_at`, `updated_at`.
- **Used By Role**: Student (Author), Preceptor (Reviewer).
- **Used By Module**: `PatientProfileFormView.jsx`, `StudentAiAnalysisView.jsx`.

---

### 14. `public.pharmacist_interventions`
- **Purpose**: Pharmacist clinical intervention documentation & recommendations.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `clinical_case_id` $\rightarrow$ `clinical_cases(id)`, `student_id` $\rightarrow$ `students(id)`, `college_id` $\rightarrow$ `colleges(id)`
- **Columns**: `id`, `clinical_case_id`, `student_id`, `college_id`, `patient_name`, `date_of_intervention`, `description_of_problem`, `action_taken`, `recommendations`, `discussed_with_physician`, `accepted`, `outcome`, `status`, `review_status`, `preceptor_comments`, `created_at`, `updated_at`.
- **Used By Role**: Student (Author), Preceptor (Reviewer).
- **Used By Module**: `PharmacistInterventionsFormView.jsx`.

---

### 15. `public.preceptors`
- **Purpose**: Preceptor / clinical faculty user accounts.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `college_id` $\rightarrow$ `colleges(id)`
- **Columns**: `id`, `college_id`, `full_name`, `gender`, `mobile_number`, `email`, `qualification`, `designation`, `department`, `username`, `password_hash`, `status`, `created_at`, `updated_at`.
- **Used By Role**: Preceptor, College Admin, Super Admin.
- **Used By Module**: `PreceptorLoginModal.jsx`, `PreceptorListView.jsx`, `PreceptorLayout.jsx`.

---

### 16. `public.registration_requests`
- **Purpose**: Pharmacy college onboarding registration applications.
- **Primary Key**: `id` (uuid)
- **Columns**: `id`, `college_name`, `city`, `state`, `contact_person`, `mobile_number`, `email`, `status` (`Pending`, `Approved`, `Rejected`), `remarks`, `submitted_at`, `created_at`.
- **Used By Role**: Super Admin, Public Visitor.
- **Used By Module**: `RegisterModal.jsx`, `SuperAdminDashboard.jsx`.

---

### 17. `public.student_preceptor_assignments`
- **Purpose**: Links connecting Pharm.D students to their assigned clinical preceptor.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `student_id` $\rightarrow$ `students(id)`, `preceptor_id` $\rightarrow$ `preceptors(id)`, `college_id` $\rightarrow$ `colleges(id)`
- **Columns**: `id`, `college_id`, `student_id`, `preceptor_id`, `assignment_date`, `remarks`, `status`, `created_at`.
- **Used By Role**: College Admin, Preceptor, Student.
- **Used By Module**: `AssignStudentsView.jsx`, `AssignmentListView.jsx`, `PreceptorDashboardView.jsx`.

---

### 18. `public.students`
- **Purpose**: Pharm.D student user accounts & academic progression tracking.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `college_id` $\rightarrow$ `colleges(id)`
- **Columns**: `id`, `college_id`, `roll_number`, `full_name`, `gender`, `email`, `mobile_number`, `batch`, `academic_year`, `year`, `username`, `password_hash`, `status`, `created_at`, `updated_at`.
- **Used By Role**: Student, College Admin, Super Admin.
- **Used By Module**: `StudentLoginModal.jsx`, `StudentListView.jsx`, `StudentLayout.jsx`.

---

### 19. `public.subscriptions`
- **Purpose**: College subscription plans, expiry dates, and maximum student limits.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `college_id` $\rightarrow$ `colleges(id)`
- **Columns**: `id`, `college_id`, `plan_name`, `subscription_start_date`, `subscription_expiry_date`, `maximum_students`, `status`, `created_at`.
- **Used By Role**: Super Admin, College Admin.
- **Used By Module**: `SuperAdminDashboard.jsx`, `CollegeAdminDashboardView.jsx`.

---

### 20. `public.super_admin`
- **Purpose**: Global Super Admin credentials.
- **Primary Key**: `id` (uuid)
- **Columns**: `id`, `name`, `email`, `password_hash`, `role`, `is_active`, `created_at`.
- **Used By Role**: Super Admin.
- **Used By Module**: `SuperAdminModal.jsx`, `SuperAdminDashboard.jsx`.

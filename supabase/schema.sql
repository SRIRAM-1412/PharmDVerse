-- ====================================================================
-- PharmDVerse Complete Database Schema for Supabase (PostgreSQL)
-- ====================================================================

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update the updated_at timestamp column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TABLE 1: registration_requests
CREATE TABLE IF NOT EXISTS public.registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    contact_person VARCHAR(150) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    approved_at TIMESTAMP WITH TIME ZONE NULL,
    rejected_at TIMESTAMP WITH TIME ZONE NULL,
    remarks TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLE 2: colleges
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_request_id UUID NULL REFERENCES public.registration_requests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    college_code VARCHAR(50) NOT NULL UNIQUE,
    college_name VARCHAR(255) NOT NULL,
    college_logo TEXT NULL,
    college_logo_url TEXT NULL,
    college_description TEXT NULL,
    college_admin_username TEXT NULL UNIQUE,
    college_admin_password_hash TEXT NULL,
    address TEXT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NULL,
    university_affiliation TEXT NULL,
    pci_approval_number VARCHAR(100) NULL,
    principal_name VARCHAR(150) NULL,
    principal_mobile VARCHAR(20) NULL,
    principal_email VARCHAR(255) NULL,
    is_autonomous BOOLEAN DEFAULT false,
    hospital_name VARCHAR(255) NULL,
    hospital_logo_url TEXT NULL,
    subscription_id UUID NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLE 3: subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    plan_name VARCHAR(50) NOT NULL DEFAULT 'Professional' CHECK (plan_name IN ('Basic', 'Professional', 'Enterprise')),
    subscription_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subscription_expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    maximum_students INTEGER NOT NULL DEFAULT 600,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLE 4: preceptors
CREATE TABLE IF NOT EXISTS public.preceptors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    qualification VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    profile_photo_url TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLE 5: students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    roll_number VARCHAR(100) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    mobile_number VARCHAR(20) NULL,
    email VARCHAR(255) NOT NULL,
    batch VARCHAR(50) NOT NULL,
    course VARCHAR(50) NOT NULL DEFAULT 'Pharm.D',
    academic_year VARCHAR(50) NOT NULL DEFAULT '2026–2027',
    year VARCHAR(50) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    profile_photo_url TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLE 6: student_preceptor_assignments
CREATE TABLE IF NOT EXISTS public.student_preceptor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    preceptor_id UUID NOT NULL REFERENCES public.preceptors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    remarks TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLE 7: clinical_cases
CREATE TABLE IF NOT EXISTS public.clinical_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id VARCHAR(100) NOT NULL UNIQUE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    preceptor_id UUID NULL REFERENCES public.preceptors(id) ON DELETE SET NULL ON UPDATE CASCADE,
    hospital_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    ward_unit VARCHAR(100) NOT NULL,
    ip_op_type VARCHAR(10) NOT NULL CHECK (ip_op_type IN ('IP', 'OP')),
    date_of_admission DATE NOT NULL,
    date_of_collection DATE NOT NULL,
    academic_year VARCHAR(50) NOT NULL DEFAULT '2026–2027',
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Reviewed', 'Approved')),
    profile_completed BOOLEAN NOT NULL DEFAULT false,
    counselling_completed BOOLEAN NOT NULL DEFAULT false,
    case_number INTEGER NULL,
    roll_number TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_student_case_number UNIQUE (student_id, case_number)
);

-- TABLE 8: patient_profiles
CREATE TABLE IF NOT EXISTS public.patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinical_case_id UUID NOT NULL UNIQUE REFERENCES public.clinical_cases(id) ON DELETE CASCADE ON UPDATE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    age VARCHAR(20) NULL,
    gender VARCHAR(20) NULL,
    ip_no VARCHAR(50) NULL,
    height VARCHAR(20) NULL,
    weight VARCHAR(20) NULL,
    bmi VARCHAR(20) NULL,
    ward VARCHAR(100) NULL,
    department VARCHAR(100) NULL,
    doa DATE NULL,
    doc DATE NULL,
    dod DATE NULL,
    physician VARCHAR(150) NULL,
    chief_complaints TEXT NULL,
    past_medical_history TEXT NULL,
    past_medication_history TEXT NULL,
    family_history TEXT NULL,
    smoker_pack_day VARCHAR(50) NULL,
    smoker_duration VARCHAR(50) NULL,
    alcoholic_amount_day VARCHAR(50) NULL,
    alcoholic_duration VARCHAR(50) NULL,
    allergy_food TEXT NULL,
    allergy_drugs TEXT NULL,
    marital_status VARCHAR(50) NULL,
    cyanosis VARCHAR(100) NULL,
    icterus VARCHAR(100) NULL,
    pallor VARCHAR(100) NULL,
    cvs TEXT NULL,
    gi TEXT NULL,
    rs TEXT NULL,
    cns TEXT NULL,
    provisional_diagnosis TEXT NULL,
    final_diagnosis TEXT NULL,
    vital_signs JSONB DEFAULT '[]'::jsonb,
    other_investigations TEXT NULL,
    discharge_summary TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Reviewed', 'Approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLE 9: patient_counselling
CREATE TABLE IF NOT EXISTS public.patient_counselling (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinical_case_id UUID NOT NULL UNIQUE REFERENCES public.clinical_cases(id) ON DELETE CASCADE ON UPDATE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    counselling_date DATE NOT NULL DEFAULT CURRENT_DATE,
    counselling_time VARCHAR(20) NULL,
    patient_type VARCHAR(20) NOT NULL DEFAULT 'In patient',
    ip_op_number VARCHAR(50) NULL,
    unit_ward VARCHAR(100) NULL,
    age VARCHAR(20) NULL,
    sex VARCHAR(20) NULL,
    allergies TEXT NULL,
    specific_background_collected BOOLEAN NOT NULL DEFAULT false,
    disease_counselled TEXT NULL,
    medications_counselled TEXT NULL,
    points_covered JSONB DEFAULT '[]'::jsonb,
    major_barriers_involved BOOLEAN NOT NULL DEFAULT false,
    barrier_details TEXT NULL,
    barrier_overcome BOOLEAN NOT NULL DEFAULT false,
    time_taken VARCHAR(50) NULL,
    counselling_provided_to VARCHAR(50) NOT NULL DEFAULT 'Patient',
    representative_reasons JSONB DEFAULT '[]'::jsonb,
    representative_other_reason TEXT NULL,
    counselling_aids_used TEXT NULL,
    counselling_material_provided TEXT NULL,
    understanding_ascertained BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Reviewed', 'Approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLE 10: pharmacist_interventions
CREATE TABLE IF NOT EXISTS public.pharmacist_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinical_case_id UUID NOT NULL UNIQUE REFERENCES public.clinical_cases(id) ON DELETE CASCADE ON UPDATE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    age VARCHAR(20) NULL,
    sex VARCHAR(20) NULL,
    date_of_intervention DATE NOT NULL DEFAULT CURRENT_DATE,
    ip_op_no VARCHAR(50) NULL,
    ward VARCHAR(100) NULL,
    present_diagnosis TEXT NULL,
    prescription_details JSONB DEFAULT '[]'::jsonb,
    prescription_problems JSONB DEFAULT '[]'::jsonb,
    prescription_problem_other TEXT NULL,
    description_of_problem TEXT NULL,
    action_taken JSONB DEFAULT '[]'::jsonb,
    action_taken_other TEXT NULL,
    recommendations JSONB DEFAULT '[]'::jsonb,
    recommendation_other TEXT NULL,
    background_info_collected BOOLEAN NOT NULL DEFAULT true,
    discussed_with_physician BOOLEAN NOT NULL DEFAULT true,
    suggestions_appropriate_time BOOLEAN NOT NULL DEFAULT true,
    accepted BOOLEAN NOT NULL DEFAULT true,
    changed BOOLEAN NOT NULL DEFAULT true,
    reasons_if_no TEXT NULL,
    significance_of_intervention VARCHAR(50) NOT NULL DEFAULT 'Moderate',
    outcome VARCHAR(50) NOT NULL DEFAULT 'Positive',
    references_text TEXT NULL,
    follow_up TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Reviewed', 'Approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLE 11: drug_information_requests
CREATE TABLE IF NOT EXISTS public.drug_information_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinical_case_id UUID NOT NULL UNIQUE REFERENCES public.clinical_cases(id) ON DELETE CASCADE ON UPDATE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_time VARCHAR(20) NULL,
    enquirer_name VARCHAR(150) NOT NULL,
    designation VARCHAR(100) NULL,
    phone_no VARCHAR(30) NULL,
    unit_ward VARCHAR(100) NULL,
    professional_status VARCHAR(50) NULL,
    professional_status_other TEXT NULL,
    mode_of_request VARCHAR(50) NOT NULL DEFAULT 'Direct',
    answer_needed VARCHAR(50) NOT NULL DEFAULT 'Immediately',
    details_of_enquiry TEXT NOT NULL,
    question_category VARCHAR(100) NULL,
    purpose_of_enquiry VARCHAR(100) NOT NULL DEFAULT 'Better patient care',
    purpose_other TEXT NULL,
    age VARCHAR(20) NULL,
    sex VARCHAR(20) NULL,
    weight_kg VARCHAR(20) NULL,
    allergies TEXT NULL,
    current_medical_problem TEXT NULL,
    is_pregnant_lactating BOOLEAN NOT NULL DEFAULT false,
    pregnancy_lactation_details TEXT NULL,
    other_investigations TEXT NULL,
    drug_therapy TEXT NULL,
    answer_given_timeframe VARCHAR(50) NULL,
    reason_for_delay TEXT NULL,
    mode_of_reply VARCHAR(50) NOT NULL DEFAULT 'Written',
    information_provided TEXT NULL,
    ref_textbooks TEXT NULL,
    ref_journals TEXT NULL,
    ref_micromedex TEXT NULL,
    ref_clinirex TEXT NULL,
    ref_idis TEXT NULL,
    ref_website TEXT NULL,
    ref_others TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Reviewed', 'Approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLE 12: adr_reports
CREATE TABLE IF NOT EXISTS public.adr_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinical_case_id UUID NOT NULL UNIQUE REFERENCES public.clinical_cases(id) ON DELETE CASCADE ON UPDATE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    adr_number VARCHAR(100) NOT NULL UNIQUE,
    reporting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reported_by_student_name VARCHAR(150) NULL,
    assigned_preceptor_name VARCHAR(150) NULL,
    patient_initials VARCHAR(50) NULL,
    hospital_reg_number VARCHAR(50) NULL,
    age VARCHAR(20) NULL,
    gender VARCHAR(20) NULL,
    weight VARCHAR(20) NULL,
    department VARCHAR(100) NULL,
    ward VARCHAR(100) NULL,
    primary_diagnosis TEXT NULL,
    reaction_title VARCHAR(255) NULL,
    reaction_category VARCHAR(100) NULL,
    reaction_description TEXT NULL,
    reaction_started_at TIMESTAMP WITH TIME ZONE NULL,
    reaction_ended_at TIMESTAMP WITH TIME ZONE NULL,
    reaction_duration VARCHAR(100) NULL,
    clinical_management_provided TEXT NULL,
    current_patient_condition VARCHAR(100) NULL,
    suspected_medications JSONB DEFAULT '[]'::jsonb,
    concomitant_medications JSONB DEFAULT '[]'::jsonb,
    drug_allergy_history TEXT NULL,
    previous_adr_history TEXT NULL,
    relevant_medical_conditions TEXT NULL,
    pregnancy_lactation_status VARCHAR(100) NULL,
    renal_status VARCHAR(100) NULL,
    hepatic_status VARCHAR(100) NULL,
    lifestyle_factors TEXT NULL,
    additional_clinical_notes TEXT NULL,
    reaction_severity VARCHAR(50) NULL,
    reaction_seriousness VARCHAR(100) NULL,
    patient_outcome VARCHAR(100) NULL,
    action_taken_on_suspected_drug VARCHAR(100) NULL,
    rechallenge_information TEXT NULL,
    dechallenge_information TEXT NULL,
    initial_causality_opinion VARCHAR(100) NULL,
    clinical_remarks TEXT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    student_remarks TEXT NULL,
    preceptor_review TEXT NULL,
    faculty_comments TEXT NULL,
    approval_status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (approval_status IN ('Draft', 'Submitted', 'Returned', 'Approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLE 13: document_branding_settings
CREATE TABLE IF NOT EXISTS public.document_branding_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL UNIQUE REFERENCES public.colleges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    show_college_logo BOOLEAN NOT NULL DEFAULT true,
    show_college_name BOOLEAN NOT NULL DEFAULT true,
    show_autonomous BOOLEAN NOT NULL DEFAULT true,
    show_hospital_logo BOOLEAN NOT NULL DEFAULT true,
    show_hospital_name BOOLEAN NOT NULL DEFAULT true,
    watermark_enabled BOOLEAN NOT NULL DEFAULT true,
    watermark_text_line1 VARCHAR(150) NOT NULL DEFAULT 'PHARMDVERSE',
    watermark_text_line2 VARCHAR(150) NOT NULL DEFAULT 'Clinical Documentation System',
    watermark_opacity INTEGER NOT NULL DEFAULT 10,
    watermark_position VARCHAR(50) NOT NULL DEFAULT 'Center',
    footer_left_text VARCHAR(150) NOT NULL DEFAULT 'PharmDVerse',
    footer_center_text VARCHAR(255) NOT NULL DEFAULT 'Confidential Clinical Documentation',
    show_page_number BOOLEAN NOT NULL DEFAULT true,
    show_generated_datetime BOOLEAN NOT NULL DEFAULT true,
    paper_size VARCHAR(20) NOT NULL DEFAULT 'A4',
    orientation VARCHAR(20) NOT NULL DEFAULT 'Portrait',
    margin_top VARCHAR(20) NOT NULL DEFAULT '15mm',
    margin_bottom VARCHAR(20) NOT NULL DEFAULT '15mm',
    margin_left VARCHAR(20) NOT NULL DEFAULT '15mm',
    margin_right VARCHAR(20) NOT NULL DEFAULT '15mm',
    font_family VARCHAR(100) NOT NULL DEFAULT 'Times New Roman',
    title_font_size VARCHAR(20) NOT NULL DEFAULT '18pt',
    heading_font_size VARCHAR(20) NOT NULL DEFAULT '14pt',
    body_font_size VARCHAR(20) NOT NULL DEFAULT '12pt',
    primary_color VARCHAR(30) NOT NULL DEFAULT '#0f172a',
    secondary_color VARCHAR(30) NOT NULL DEFAULT '#0284c7',
    table_header_color VARCHAR(30) NOT NULL DEFAULT '#f1f5f9',
    border_color VARCHAR(30) NOT NULL DEFAULT '#0f172a',
    text_color VARCHAR(30) NOT NULL DEFAULT '#0f172a',
    zebra_striping BOOLEAN NOT NULL DEFAULT false,
    repeat_table_header BOOLEAN NOT NULL DEFAULT true,
    show_student_signature BOOLEAN NOT NULL DEFAULT true,
    show_preceptor_signature BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS POLICIES FOR SUPABASE
ALTER TABLE public.adr_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All ADR Reports" ON public.adr_reports;
CREATE POLICY "Allow All ADR Reports" ON public.adr_reports FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.document_branding_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Document Branding" ON public.document_branding_settings;
CREATE POLICY "Allow All Document Branding" ON public.document_branding_settings FOR ALL USING (true) WITH CHECK (true);

-- RPC FUNCTION: create_clinical_case
-- Safe sequential case_id generation and insertion for concurrent requests
CREATE OR REPLACE FUNCTION public.create_clinical_case(
    p_student_id UUID,
    p_college_id UUID,
    p_preceptor_id UUID,
    p_hospital_name TEXT,
    p_department TEXT,
    p_ward_unit TEXT,
    p_ip_op_type TEXT,
    p_date_of_admission DATE,
    p_academic_year TEXT,
    p_status TEXT
) RETURNS JSONB AS $$
DECLARE
    v_roll_number TEXT;
    v_college_code TEXT;
    v_year TEXT;
    v_case_number INT;
    v_case_id TEXT;
    v_new_id UUID;
    v_retries INT := 0;
    v_inserted BOOLEAN := FALSE;
BEGIN
    -- Get student roll number
    SELECT roll_number INTO v_roll_number FROM public.students WHERE id = p_student_id;
    -- Get college code
    SELECT college_code INTO v_college_code FROM public.colleges WHERE id = p_college_id;
    
    IF v_college_code IS NULL OR v_college_code = '' THEN
        v_college_code := 'AMRMCP';
    END IF;
    
    -- Current Year
    v_year := to_char(CURRENT_DATE, 'YYYY');

    -- Get next running case number for this student using max of case_number or count
    SELECT COALESCE(
        GREATEST(
            MAX(case_number),
            COUNT(*)
        ), 0) + 1 INTO v_case_number 
    FROM public.clinical_cases 
    WHERE student_id = p_student_id;

    -- Concurrency handling loop (max 15 retries)
    WHILE NOT v_inserted AND v_retries < 15 LOOP
        BEGIN
            -- Format Case ID: e.g. AMRMCP-2026-Y22PHD0314-0001
            v_case_id := v_college_code || '-' || v_year || '-' || COALESCE(v_roll_number, 'UNKNOWN') || '-' || lpad(v_case_number::text, 4, '0');

            -- Insert directly
            INSERT INTO public.clinical_cases (
                college_id,
                student_id,
                preceptor_id,
                hospital_name,
                department,
                ward_unit,
                ip_op_type,
                date_of_admission,
                date_of_collection,
                academic_year,
                status,
                case_number,
                roll_number,
                case_id
            ) VALUES (
                p_college_id,
                p_student_id,
                p_preceptor_id,
                p_hospital_name,
                p_department,
                p_ward_unit,
                p_ip_op_type,
                p_date_of_admission,
                p_date_of_admission,
                p_academic_year,
                p_status,
                v_case_number,
                v_roll_number,
                v_case_id
            ) RETURNING id, case_id INTO v_new_id, v_case_id;

            v_inserted := TRUE;
        EXCEPTION WHEN unique_violation THEN
            v_case_number := v_case_number + 1;
            v_retries := v_retries + 1;
        END;
    END LOOP;

    IF v_inserted THEN
        RETURN jsonb_build_object(
            'success', true,
            'id', v_new_id,
            'case_id', v_case_id
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Failed to generate unique Case ID due to concurrent inserts. Please try again.'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- SECTION 3 KNOWLEDGE TABLE: lab_parameter_knowledge
-- Standard Clinical Knowledge for Laboratory Parameters
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.lab_parameter_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parameter_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL UNIQUE,
    category TEXT NULL,
    evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('numeric', 'positive_negative', 'present_absent')),
    increased_significance TEXT NULL,
    decreased_significance TEXT NULL,
    positive_significance TEXT NULL,
    negative_significance TEXT NULL,
    present_significance TEXT NULL,
    absent_significance TEXT NULL,
    context_notes TEXT NULL,
    source_reference TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lab_param_knowledge_norm_name ON public.lab_parameter_knowledge(normalized_name);

ALTER TABLE public.lab_parameter_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Read Access for All Users" ON public.lab_parameter_knowledge;
CREATE POLICY "Allow Read Access for All Users" ON public.lab_parameter_knowledge
    FOR SELECT USING (true);

-- ====================================================================
-- SECTION 4 KNOWLEDGE TABLE: drug_knowledge
-- Standard Clinical Knowledge for Prescribed Medications
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.drug_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generic_name TEXT NOT NULL,
    brand_names TEXT NULL,
    drug_class TEXT NULL,
    established_uses TEXT NULL,
    mechanism_of_action TEXT NULL,
    normal_dose_range TEXT NULL,
    contraindications TEXT NULL,
    side_effects_adverse_effects TEXT NULL,
    monitoring_parameters TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_drug_knowledge_generic_name_unique 
    ON public.drug_knowledge (LOWER(TRIM(generic_name)));

ALTER TABLE public.drug_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users for drug_knowledge" ON public.drug_knowledge;
CREATE POLICY "Allow read access to all users for drug_knowledge" 
    ON public.drug_knowledge FOR SELECT USING (true);



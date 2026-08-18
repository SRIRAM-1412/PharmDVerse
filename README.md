# PharmDVerse — Clinical Case Management Platform for Pharmacy Colleges

PharmDVerse is a cloud-based ERP platform built exclusively for Pharm.D / Pharmacy colleges to streamline clinical case documentation, academic management, preceptor collaboration, and institutional workflows.

## Technology Stack

- **Frontend Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4
- **Database & Backend**: Supabase PostgreSQL (Auth, Row Level Security, RPC Functions)
- **Document Generation**: High-Precision PDF (`jspdf`) & PPT Presentation (`pptxgenjs`)
- **ORMs & Utilities**: Prisma ORM Schema (`prisma/`)

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Local Development Server
```bash
npm run dev
```

### 4. Build Production Bundle
```bash
npm run build
```

## Vercel Deployment
This repository is configured to deploy directly on Vercel as a Vite Single Page Application (SPA).
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

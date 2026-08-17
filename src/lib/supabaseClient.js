import { createClient } from '@supabase/supabase-js';

// Read Supabase environment variables from Vite .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ngfgwgwofnuwqrbmvtuo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZmd3Z3dvZm51d3FyYm12dHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5Njc5NjEsImV4cCI6MjEwMjU0Mzk2MX0.UjWJhQh0T0DRpcYKNunAEr6jOdMIc7pl2uDBxtGc8d4';

console.log('🔗 [PharmDVerse Supabase Client] Initialized with URL:', supabaseUrl);

// Create and export Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

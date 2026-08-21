import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ngfgwgwofnuwqrbmvtuo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZmd3Z3dvZm51d3FyYm12dHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5Njc5NjEsImV4cCI6MjEwMjU0Mzk2MX0.UjWJhQh0T0DRpcYKNunAEr6jOdMIc7pl2uDBxtGc8d4';

async function debugInsert() {
  const clientStudA = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { 'x-student-id': '276e6b14-accf-4a97-97b3-e6f57db0d00f', 'x-college-id': '74a8d70b-a41d-4075-9dc2-63240a5f7069' } }
  });

  // Insert without .select()
  const res = await clientStudA.from('notifications').insert([{
    recipient_user_id: '8a5b0e3a-c259-4b0e-97d0-7d419091a9a8',
    recipient_role: 'Preceptor',
    sender_user_id: '276e6b14-accf-4a97-97b3-e6f57db0d00f',
    sender_role: 'Student',
    clinical_case_id: 'dabdcfca-2581-43e3-b9c3-04a8271c6433',
    notification_type: 'Case Submitted Test',
    title: 'Automated Security Test Notification',
    message: 'Test message for RLS compliance check',
    college_id: '74a8d70b-a41d-4075-9dc2-63240a5f7069'
  }]);

  console.log('Insert without .select() error:', res.error);
  console.log('Insert status:', res.status, res.statusText);
}

debugInsert();

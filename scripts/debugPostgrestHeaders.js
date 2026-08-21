import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const supabaseUrl = 'https://ngfgwgwofnuwqrbmvtuo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZmd3Z3dvZm51d3FyYm12dHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NTcxODAsImV4cCI6MjA2MjQzMzE4MH0.6l2d3Z4e8s8Q_M0-J0Xp0-w8o2s-N9z9Z-X9y9Z-W9w';

async function debugHeaders() {
  const studentA_ID = '276e6b14-accf-4a97-97b3-e6f57db0d00f'; // DANAY SRI recipient
  const preceptorA_ID = '8a5b0e3a-c259-4b0e-97d0-7d419091a9a8'; // Preceptor recipient

  const clientPrec = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-preceptor-id': preceptorA_ID,
        'x-college-id': '74a8d70b-a41d-4075-9dc2-63240a5f7069'
      }
    }
  });

  const res = await clientPrec.from('notifications').select('*');
  console.log('Preceptor query status:', res.status, res.statusText);
  console.log('Preceptor query error:', res.error);
  console.log('Preceptor query data length:', res.data?.length);
  if (res.data && res.data.length > 0) {
    console.log('Sample row:', res.data[0]);
  }
}

debugHeaders();

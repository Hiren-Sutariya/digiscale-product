import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cqgkbapowszjhfeqalnv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZ2tiYXBvd3N6amhmZXFhbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDU1ODEsImV4cCI6MjEwMDIyMTU4MX0.0LncIzBgCsVcj853imV_vUE3a1A1W2i_I-QpX_vCg08';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


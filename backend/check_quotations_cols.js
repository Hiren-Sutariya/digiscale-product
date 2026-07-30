const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cqgkbapowszjhfeqalnv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZ2tiYXBvd3N6amhmZXFhbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDU1ODEsImV4cCI6MjEwMDIyMTU4MX0.0LncIzBgCsVcj853imV_vUE3a1A1W2i_I-QpX_vCg08');

async function check() {
  const { data, error } = await supabase.from('quotations').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else if (data && data.length > 0) {
    console.log("Cols:", Object.keys(data[0]).join(', '));
  }
}
check();

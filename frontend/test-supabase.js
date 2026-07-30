const { createClient } = require('@supabase/supabase-js');
const url = 'https://cqgkbapowszjhfeqalnv.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZ2tiYXBvd3N6amhmZXFhbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDU1ODEsImV4cCI6MjEwMDIyMTU4MX0.0LncIzBgCsVcj853imV_vUE3a1A1W2i_I-QpX_vCg08';
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('products').select('*').eq('name', 'PJD-77-01-YG-12');
  console.log('Error:', error);
  if (data && data.length > 0) {
    console.log('Keys:', Object.keys(data[0]));
    console.log('PhotoUrl starts with:', data[0].photoUrl ? data[0].photoUrl.substring(0, 30) : data[0].photoUrl);
  }
}
check();

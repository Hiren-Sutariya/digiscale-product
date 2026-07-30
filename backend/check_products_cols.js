const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cqgkbapowszjhfeqalnv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZ2tiYXBvd3N6amhmZXFhbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDU5MDMsImV4cCI6MjA1ODgyMTkwM30.b3B6n25oQ_C25l9q6Qy_F7nO993K6Z5Y29E9b51k95U');
async function check() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) console.error(error);
  else console.log(Object.keys(data[0] || {}));
}
check();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../frontend/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: rows, error: err1 } = await supabase.from('warehouse_rows').select('*').limit(1);
  console.log("rows:", err1 || rows);
}
run();

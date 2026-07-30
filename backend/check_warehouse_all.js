const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../frontend/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const [r1, r2, r3] = await Promise.all([
    supabase.from('warehouse_rows').select('*').limit(1),
    supabase.from('warehouse_slots').select('*').limit(1),
    supabase.from('warehouse_assignments').select('*').limit(1)
  ]);
  console.log("rows err:", r1.error);
  console.log("slots err:", r2.error);
  console.log("assigns err:", r3.error);
}
run();

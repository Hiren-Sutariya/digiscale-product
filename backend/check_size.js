const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../frontend/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('products').select('id, name, collection_id, created_at, stock, cartonQty, rate, length, color, description, unit_type');
  console.log("error:", error);
  const size = JSON.stringify(data).length;
  console.log("Size in bytes:", size);
}
run();

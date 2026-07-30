const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../frontend/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('quotations').select('id');
  if (error) {
    console.error("Error fetching quotations length:", error);
  } else {
    console.log(`Found ${data.length} quotations.`);
  }

  // Try to fetch all with select('*')
  const start = Date.now();
  const res = await supabase.from('quotations').select('*');
  const elapsed = Date.now() - start;
  if (res.error) {
    console.error("Error fetching all quotations:", res.error);
  } else {
    console.log(`Successfully fetched all quotations in ${elapsed}ms`);
    console.log(`Data size: ${(JSON.stringify(res.data).length / 1024 / 1024).toFixed(2)} MB`);
  }
}
check();

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching quotations...');
  const { data: quotations, error: qError } = await supabase.from('quotations').select('user_id, client_name, client_company, client_address');
  
  if (qError) {
    console.error('Error fetching quotations:', qError);
    return;
  }
  
  const uniqueClients = {};
  
  for (const q of quotations) {
    if (!q.client_name) continue;
    const name = q.client_name.trim();
    const key = `${q.user_id}_${name.toLowerCase()}`;
    
    if (!uniqueClients[key]) {
      uniqueClients[key] = {
        user_id: q.user_id,
        name: name,
        company: q.client_company ? q.client_company.trim() : null,
        address: q.client_address ? q.client_address.trim() : null
      };
    } else {
      if (!uniqueClients[key].company && q.client_company) uniqueClients[key].company = q.client_company.trim();
      if (!uniqueClients[key].address && q.client_address) uniqueClients[key].address = q.client_address.trim();
    }
  }
  
  console.log(`Found ${Object.keys(uniqueClients).length} unique clients from past quotations.`);
  
  const { data: existingClients, error: eError } = await supabase.from('clients').select('user_id, name');
  if (eError) {
    console.error('Error fetching clients:', eError);
    return;
  }
  
  const existingSet = new Set(existingClients.map(c => `${c.user_id}_${c.name.trim().toLowerCase()}`));
  
  let added = 0;
  for (const key of Object.keys(uniqueClients)) {
    if (!existingSet.has(key)) {
      const c = uniqueClients[key];
      const { error: iError } = await supabase.from('clients').insert([c]);
      if (iError) {
        console.error('Error inserting client:', c.name, iError);
      } else {
        added++;
      }
    }
  }
  
  console.log(`Successfully migrated ${added} clients.`);
}

run();

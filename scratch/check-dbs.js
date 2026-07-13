import { createClient } from '@supabase/supabase-js';

// The LIVE database connected to the app (fpnuckewxvxfftbeutsr)
const LIVE_URL = 'https://fpnuckewxvxfftbeutsr.supabase.co';
// We need service role key for fpnuckewxvxfftbeutsr - but we only have the anon key
// The "new" service role key we have is for cnxrrucvapuuirphwxuu
// We'll use the live anon key and run the migrations via the REST API
const LIVE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbnVja2V3eHZ4ZmZ0YmV1dHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MTQ2NjAsImV4cCI6MjA5OTI5MDY2MH0.dAL5SWRddmmJZVKXnSCtdKF36KHAKipsHmz9ipphBk4';

// The new database (cnxrrucvapuuirphwxuu) - we have service role
const NEW_URL = 'https://cnxrrucvapuuirphwxuu.supabase.co';
const NEW_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueHJydWN2YXB1dWlycGh3eHV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc2Nzg4NSwiZXhwIjoyMDk5MzQzODg1fQ.ufj5P4t_wU-mhL_6NciEL_LNOtlgF6NZ3iIxCZEtKfg';

const liveClient = createClient(LIVE_URL, LIVE_ANON_KEY);
const newClient = createClient(NEW_URL, NEW_SERVICE_KEY);

async function run() {
  // Test 1: Can we call place_order_guest on the NEW DB?
  console.log("\n=== Testing NEW DB (cnxrrucvapuuirphwxuu) ===");
  const { data: rests } = await newClient.from('restaurants').select('id').limit(1);
  if (!rests || rests.length === 0) {
    console.log("No restaurants on new DB");
  } else {
    console.log("Restaurant found on new DB:", rests[0].id);
    const { data: meals } = await newClient.from('meals').select('id').limit(1);
    const { data, error } = await newClient.rpc('place_order_guest', {
      _restaurant_id: rests[0].id,
      _delivery_address: 'Test Address, Osogbo',
      _delivery_phone: '08141894696',
      _customer_name: 'Test Guest',
      _notes: null,
      _subtotal_naira: 2500,
      _delivery_fee_naira: 700,
      _total_naira: 3200,
      _items: [{ meal_id: meals?.[0]?.id ?? null, name_snapshot: 'Test Meal', price_snapshot: 2500, quantity: 1 }]
    });
    if (error) console.error("place_order_guest on NEW DB error:", error.message);
    else console.log("place_order_guest on NEW DB SUCCESS:", data);
  }

  // Test 2: Check what's on the LIVE DB
  console.log("\n=== Checking LIVE DB (fpnuckewxvxfftbeutsr) ===");
  const { data: liveRests, error: liveErr } = await liveClient.from('restaurants').select('id, name').limit(3);
  if (liveErr) console.error("Could not read live DB:", liveErr.message);
  else console.log("Restaurants on live DB:", liveRests?.map(r => r.name));
}

run();

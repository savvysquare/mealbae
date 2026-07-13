import { createClient } from '@supabase/supabase-js';

const newUrl = 'https://cnxrrucvapuuirphwxuu.supabase.co';
const newServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueHJydWN2YXB1dWlycGh3eHV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc2Nzg4NSwiZXhwIjoyMDk5MzQzODg1fQ.ufj5P4t_wU-mhL_6NciEL_LNOtlgF6NZ3iIxCZEtKfg';

const supabase = createClient(newUrl, newServiceKey);

async function run() {
  console.log("Testing place_order_guest call on the NEW database...");
  const { data, error } = await supabase.rpc('place_order_guest', {
    _restaurant_id: 'e2908fde-dc99-4c57-a36c-94116d41a7e2', // dummy uuid
    _delivery_address: 'Test Address',
    _delivery_phone: '08141894696',
    _customer_name: 'Test Customer',
    _notes: 'Test Notes',
    _subtotal_naira: 1000,
    _delivery_fee_naira: 500,
    _total_naira: 1500,
    _items: [
      {
        meal_id: 'e2908fde-dc99-4c57-a36c-94116d41a7e2',
        name_snapshot: 'Test Meal',
        price_snapshot: 1000,
        quantity: 1
      }
    ]
  });

  if (error) {
    console.error("RPC Error on new DB:", error);
  } else {
    console.log("RPC Success on new DB! Data:", data);
  }
}

run();

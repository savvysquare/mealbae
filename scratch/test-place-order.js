import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve('.env');
const envConfig = fs.readFileSync(envPath, 'utf-8');
const env = {};
envConfig.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabase = createClient(
  env["VITE_SUPABASE_URL"] || '',
  env["VITE_SUPABASE_PUBLISHABLE_KEY"] || ''
);

async function run() {
  console.log("Testing place_order_guest call via anon SDK...");
  const { data, error } = await supabase.rpc('place_order_guest', {
    _restaurant_id: 'e2908fde-dc99-4c57-a36c-94116d41a7e2', // dummy or existing uuid
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
    console.error("RPC Error:", error);
  } else {
    console.log("RPC Success! Data:", data);
  }
}

run();

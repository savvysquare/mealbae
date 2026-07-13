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
  console.log("Testing direct client-side insert on active DB...");
  const orderData = {
    restaurant_id: 'e2908fde-dc99-4c57-a36c-94116d41a7e2', // need a valid restaurant UUID to test foreign key
    delivery_address: 'Test Direct Address',
    delivery_phone: '08141894696',
    customer_name: 'Test Direct Guest',
    notes: 'Test Direct Notes',
    subtotal_naira: 1000,
    delivery_fee_naira: 500,
    total_naira: 1500,
    status: 'pending_payment'
  };

  // Let's find a valid restaurant ID first
  const { data: restaurants } = await supabase.from('restaurants').select('id').limit(1);
  if (!restaurants || restaurants.length === 0) {
    console.error("No restaurants found in database!");
    return;
  }
  const restaurantId = restaurants[0].id;
  orderData.restaurant_id = restaurantId;

  console.log("Using restaurant ID:", restaurantId);

  const { data: newOrder, error: orderErr } = await supabase
    .from('orders')
    .insert([orderData])
    .select('id, short_code')
    .single();

  if (orderErr) {
    console.error("Error inserting order:", orderErr);
    return;
  }

  console.log("Order insert success! Order details:", newOrder);

  const itemData = {
    order_id: newOrder.id,
    meal_id: null, // nullable or need valid meal ID
    name_snapshot: 'Test Direct Item',
    price_snapshot: 1000,
    quantity: 1
  };

  const { data: newItem, error: itemErr } = await supabase
    .from('order_items')
    .insert([itemData])
    .select('*');

  if (itemErr) {
    console.error("Error inserting order item:", itemErr);
  } else {
    console.log("Order item insert success! Details:", newItem);
  }
}

run();

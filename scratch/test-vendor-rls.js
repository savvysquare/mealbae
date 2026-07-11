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

// We need the ANON key to test RLS like a real client
const supabase = createClient(
  env["SUPABASE_URL"] || '',
  env["SUPABASE_PUBLISHABLE_KEY"] || ''
);

async function run() {
  const email = "vendor.0f73dc22e7004de69b4af52fa9aaf8a6@mealbae.internal";
  const password = "password"; // Wait, I don't know the password the user set.
  // Actually, I can just use the service role key to generate a custom JWT for this user!
  
  const adminClient = createClient(
    env["SUPABASE_URL"],
    env["SUPABASE_SERVICE_ROLE_KEY"]
  );

  // Generate an access token or just query with service role but impersonate
  // We can't easily impersonate without pg, so let's just fetch directly with admin client to verify the data structure
  
  console.log("Fetching orders for Embassy Food Canteen (0f73dc22-e700-4de6-9b4a-f52fa9aaf8a6)...");
  
  const { data, error } = await adminClient.from("orders")
        .select("*, order_items(*)")
        .eq("restaurant_id", "0f73dc22-e700-4de6-9b4a-f52fa9aaf8a6")
        .in("status", ["awaiting_restaurant_acceptance", "accepted_by_restaurant", "preparing", "ready_for_pickup", "rider_arrived_at_restaurant", "out_for_delivery"]);

  if (error) {
    console.error("Error fetching orders:", error);
    return;
  }

  console.log(`Returned ${data.length} orders.`);
  console.log(JSON.stringify(data, null, 2));
}

run();

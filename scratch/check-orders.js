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
  env["SUPABASE_URL"] || '',
  env["SUPABASE_SERVICE_ROLE_KEY"] || ''
);

async function run() {
  console.log("Checking orders in database...");
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, restaurants(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return;
  }

  console.log(`Found ${orders.length} orders total.`);
  for (const o of orders) {
    console.log(`ID: ${o.id}, Code: #${o.short_code}, Status: ${o.status}, Restaurant: ${o.restaurants?.name}, Total: ${o.total_naira}, Created: ${o.created_at}`);
  }
}

run();

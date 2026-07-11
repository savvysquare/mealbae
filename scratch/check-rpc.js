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
  const { data, error } = await supabase.rpc('track_orders_by_phone', { _phone: '1234567890' });
  if (error) {
    console.error("Function track_orders_by_phone check failed:", error);
  } else {
    console.log("Function track_orders_by_phone exists and runs successfully!");
  }
}

run();

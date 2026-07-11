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
  env["SUPABASE_PUBLISHABLE_KEY"] || ''
);

console.log("Type of supabase.auth.getClaims:", typeof supabase.auth.getClaims);
if (supabase.auth.getClaims) {
  console.log("getClaims exists!");
} else {
  console.log("getClaims DOES NOT EXIST!");
}

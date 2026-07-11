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
  const userId = 'fb71ab79-302d-4ccd-8551-2aab80f663c5';
  console.log("Deleting old admin role...");
  await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
  
  console.log("Inserting new admin role...");
  const { data, error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
  if (error) {
    console.error("Failed to insert admin role:", error);
  } else {
    console.log("Admin role inserted successfully!");
  }
}

run();

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
    // Remove quotes
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
  console.log("Checking profiles, auth users, and user roles...");
  
  const { data: users, error: err1 } = await supabase.auth.admin.listUsers();
  if (err1) {
    console.error("Error listing users:", err1);
    return;
  }
  
  console.log("\n--- AUTH USERS ---");
  for (const u of users.users) {
    console.log(`ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`);
  }

  const { data: roles, error: err2 } = await supabase.from('user_roles').select('*');
  if (err2) {
    console.error("Error listing roles:", err2);
    return;
  }

  console.log("\n--- USER ROLES ---");
  console.log(roles);
}

run();

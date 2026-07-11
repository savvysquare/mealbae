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
  console.log("Checking restaurants...");
  const { data: restaurants } = await supabase.from("restaurants").select("id, name");
  console.log("Restaurants list:");
  console.log(restaurants);

  console.log("\nChecking auth users...");
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  for (const u of authUsers.users) {
    console.log(`ID: ${u.id}, Email: ${u.email}`);
  }

  console.log("\nChecking user roles...");
  const { data: userRoles } = await supabase.from("user_roles").select("*");
  console.log(userRoles);
}

run();

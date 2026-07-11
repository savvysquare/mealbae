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

const serviceRoleClient = createClient(
  env["SUPABASE_URL"] || '',
  env["SUPABASE_SERVICE_ROLE_KEY"] || ''
);

async function run() {
  console.log("Signing in as admin@mealbae.internal...");
  const password = env["ADMIN_PASSWORD"] || "MealBAE$$$123";
  const { data: sessionData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'admin@mealbae.internal',
    password: password
  });

  if (loginErr) {
    console.error("Login failed:", loginErr);
    return;
  }

  const userId = sessionData.user.id;
  console.log(`Logged in successfully! User ID: ${userId}`);

  // Test has_role RPC
  console.log("Checking has_role RPC...");
  const { data: isAdmin, error: rpcErr } = await serviceRoleClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin"
  });

  if (rpcErr) {
    console.error("has_role RPC error:", rpcErr);
    return;
  }
  console.log(`has_role RPC result: ${isAdmin}`);

  // Test listing restaurants and users
  console.log("Listing restaurants...");
  const { data: restaurants, error: restErr } = await serviceRoleClient.from("restaurants").select("id,name").order("name");
  if (restErr) {
    console.error("Restaurants select error:", restErr);
    return;
  }
  console.log(`Found ${restaurants.length} restaurants.`);

  console.log("Listing auth users...");
  const { data: usersList, error: listErr } = await serviceRoleClient.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) {
    console.error("Auth listUsers error:", listErr);
    return;
  }
  console.log(`Found ${usersList.users.length} auth users.`);
}

run();

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "admin@mealbae.internal";
export const vendorEmailFor = (restaurantId: string) => `vendor.${restaurantId.replace(/-/g, "")}@mealbae.internal`;

async function loadAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function findUserByEmail(email: string): Promise<{ id: string } | null> {
  const admin = await loadAdmin();
  // paginate first page (100 users) should be enough for this app
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(error.message);
  const u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
  return u ? { id: u.id } : null;
}

/** Verify the shared admin password and provision the admin auth user idempotently. */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD || "MealBAE$$$123";
    if (data.password !== expected) return { ok: false as const };

    const admin = await loadAdmin();
    let user = await findUserByEmail(ADMIN_EMAIL);
    if (!user) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: expected,
        email_confirm: true,
      });
      if (error || !created.user) throw new Error(error?.message ?? "create admin failed");
      user = { id: created.user.id };
    } else {
      // Ensure password matches (in case env was rotated)
      await admin.auth.admin.updateUserById(user.id, { password: expected });
    }
    // Ensure admin role
    await admin.from("user_roles").delete().eq("user_id", user.id).eq("role", "admin");
    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: user.id, role: "admin" });
    if (roleErr) throw new Error(roleErr.message);
    return { ok: true as const, email: ADMIN_EMAIL };
  });

/** Admin-only: list restaurants with whether they have a vendor login. */
export const listVendorAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (!isAdmin) throw new Error("Forbidden");
      const admin = await loadAdmin();
      const [{ data: restaurants }, { data: usersList }] = await Promise.all([
        admin.from("restaurants").select("id,name").order("name"),
        admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      ]);
      const emails = new Set((usersList?.users ?? []).map((u) => u.email?.toLowerCase()));
      return (restaurants ?? []).map((r) => ({
        restaurantId: r.id as string,
        name: r.name as string,
        email: vendorEmailFor(r.id as string),
        hasAccount: emails.has(vendorEmailFor(r.id as string).toLowerCase()),
      }));
    } catch (e) {
      console.error("Error in listVendorAccounts server function:", e);
      throw e;
    }
  });

/** Admin-only: create-or-update a vendor account (auth user + restaurant_staff role) with a password. */
export const setVendorPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { restaurantId: string; password: string }) => {
    if (!data.restaurantId) throw new Error("restaurantId required");
    if (!data.password || data.password.length < 6) throw new Error("Password must be at least 6 characters");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const admin = await loadAdmin();
    const email = vendorEmailFor(data.restaurantId);
    let user = await findUserByEmail(email);
    if (!user) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
      });
      if (error || !created.user) throw new Error(error?.message ?? "create vendor failed");
      user = { id: created.user.id };
    } else {
      const { error } = await admin.auth.admin.updateUserById(user.id, { password: data.password });
      if (error) throw new Error(error.message);
    }
    // Ensure role + restaurant link. Delete any stale staff row for this user first, then insert.
    await admin.from("user_roles").delete().eq("user_id", user.id).eq("role", "restaurant_staff");
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: user.id, role: "restaurant_staff", restaurant_id: data.restaurantId });
    if (roleErr) throw new Error(roleErr.message);
    return { ok: true as const, email };
  });

/** Public: get the login email for a given restaurant (so vendors don't type an email). */
export const getVendorLoginEmail = createServerFn({ method: "GET" })
  .inputValidator((data: { restaurantId: string }) => data)
  .handler(async ({ data }) => ({ email: vendorEmailFor(data.restaurantId) }));

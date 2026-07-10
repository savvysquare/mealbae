import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user ?? null); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { user, loading };
}

export type AppRole = "customer" | "restaurant_staff" | "admin";
export interface UserRoleRow { role: AppRole; restaurant_id: string | null }

export function useRoles(userId: string | undefined) {
  return useQuery({
    queryKey: ["user_roles", userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserRoleRow[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.from("user_roles").select("role,restaurant_id").eq("user_id", userId);
      if (error) throw error;
      return (data ?? []) as UserRoleRow[];
    },
  });
}

export function primaryRole(roles: UserRoleRow[] | undefined): AppRole {
  if (!roles || roles.length === 0) return "customer";
  if (roles.some((r) => r.role === "admin")) return "admin";
  if (roles.some((r) => r.role === "restaurant_staff")) return "restaurant_staff";
  return "customer";
}

export function staffRestaurantId(roles: UserRoleRow[] | undefined): string | null {
  return roles?.find((r) => r.role === "restaurant_staff")?.restaurant_id ?? null;
}

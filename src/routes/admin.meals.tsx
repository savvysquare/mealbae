import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatNaira } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/PanelShells";

export const Route = createFileRoute("/admin/meals")({ component: AdminMeals });

function AdminMeals() {
  const qc = useQueryClient();
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [form, setForm] = useState({ name: "", price: "", description: "", category_id: "" });

  const { data: restaurants } = useQuery({
    queryKey: ["all-restaurants"],
    queryFn: async () => (await supabase.from("restaurants").select("id,name").order("name")).data ?? [],
  });
  const { data: cats } = useQuery({
    queryKey: ["cats", restaurantId], enabled: !!restaurantId,
    queryFn: async () => (await supabase.from("menu_categories").select("*").eq("restaurant_id", restaurantId).order("sort_order")).data ?? [],
  });
  const { data: meals } = useQuery({
    queryKey: ["all-meals", restaurantId], enabled: !!restaurantId,
    queryFn: async () => (await supabase.from("meals").select("*").eq("restaurant_id", restaurantId).order("name")).data ?? [],
  });

  async function addMeal() {
    if (!restaurantId || !form.name || !form.price) { toast.error("Restaurant, name and price required"); return; }
    const { error } = await supabase.from("meals").insert({
      restaurant_id: restaurantId, name: form.name, price_naira: parseInt(form.price),
      category_id: form.category_id || null, description: form.description || null, is_available: true,
    });
    if (error) toast.error(error.message);
    else { setForm({ name: "", price: "", description: "", category_id: "" }); qc.invalidateQueries({ queryKey: ["all-meals", restaurantId] }); toast.success("Added"); }
  }
  async function del(id: string) {
    if (!confirm("Delete meal?")) return;
    await supabase.from("meals").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["all-meals", restaurantId] });
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl space-y-4">
        <select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm">
          <option value="">— Pick restaurant —</option>
          {restaurants?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        {restaurantId && (
          <>
            <section className="card-soft p-5">
              <h2 className="font-display text-xl font-bold">Add meal</h2>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="rounded-xl border border-input bg-surface px-3 py-2 text-sm md:col-span-2" />
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" placeholder="Price ₦" className="rounded-xl border border-input bg-surface px-3 py-2 text-sm" />
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="rounded-xl border border-input bg-surface px-3 py-2 text-sm">
                  <option value="">— Category —</option>
                  {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-xl border border-input bg-surface px-3 py-2 text-sm md:col-span-3" />
                <button onClick={addMeal} className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" /> Add</button>
              </div>
            </section>

            <section className="card-soft p-5">
              <h2 className="font-display text-xl font-bold">Meals</h2>
              <div className="mt-3 divide-y divide-border">
                {meals?.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{formatNaira(m.price_naira)} · {m.is_available ? "Available" : "Unavailable"}</div>
                    </div>
                    <button onClick={() => del(m.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AdminShell>
  );
}

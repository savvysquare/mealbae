import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { VendorShell } from "@/components/PanelShells";

export const Route = createFileRoute("/vendor/menu")({ component: MenuAdmin });

function MenuAdmin() {
  const { restaurantId } = Route.useRouteContext() as { restaurantId: string };
  const qc = useQueryClient();

  const { data: cats } = useQuery({
    queryKey: ["r-cats", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_categories").select("*").eq("restaurant_id", restaurantId).order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const { data: meals } = useQuery({
    queryKey: ["r-meals", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("meals").select("*").eq("restaurant_id", restaurantId).order("name");
      if (error) throw error;
      return data;
    },
  });

  const [newCat, setNewCat] = useState("");
  const [form, setForm] = useState({ name: "", price: "", category_id: "", description: "" });

  async function addCat() {
    if (!newCat.trim()) return;
    const { error } = await supabase.from("menu_categories").insert({ restaurant_id: restaurantId, name: newCat, sort_order: (cats?.length ?? 0) + 1 });
    if (error) toast.error(error.message); else { setNewCat(""); qc.invalidateQueries({ queryKey: ["r-cats", restaurantId] }); }
  }
  async function addMeal() {
    if (!form.name || !form.price) { toast.error("Name and price required"); return; }
    const { error } = await supabase.from("meals").insert({
      restaurant_id: restaurantId, name: form.name, price_naira: parseInt(form.price),
      category_id: form.category_id || null, description: form.description || null, is_available: true,
    });
    if (error) toast.error(error.message);
    else { setForm({ name: "", price: "", category_id: "", description: "" }); qc.invalidateQueries({ queryKey: ["r-meals", restaurantId] }); }
  }
  async function toggle(id: string, v: boolean) {
    const { error } = await supabase.from("meals").update({ is_available: v }).eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["r-meals", restaurantId] });
  }
  async function del(id: string) {
    if (!confirm("Delete this meal?")) return;
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["r-meals", restaurantId] });
  }

  return (
    <VendorShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="card-soft p-5">
          <h2 className="font-display text-xl font-bold">Categories</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {cats?.map((c) => <span key={c.id} className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">{c.name}</span>)}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" className="flex-1 rounded-xl border border-input bg-surface px-3 py-2 text-sm" />
            <button onClick={addCat} className="rounded-xl bg-primary px-4 text-sm text-primary-foreground">Add</button>
          </div>
        </section>

        <section className="card-soft p-5">
          <h2 className="font-display text-xl font-bold">Add a meal</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="rounded-xl border border-input bg-surface px-3 py-2 text-sm md:col-span-2" />
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price (₦)" type="number" className="rounded-xl border border-input bg-surface px-3 py-2 text-sm" />
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="rounded-xl border border-input bg-surface px-3 py-2 text-sm">
              <option value="">— Category —</option>
              {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-xl border border-input bg-surface px-3 py-2 text-sm md:col-span-3" />
            <button onClick={addMeal} className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" /> Add meal</button>
          </div>
        </section>

        <section className="card-soft p-5">
          <h2 className="font-display text-xl font-bold">Meals</h2>
          <div className="mt-3 divide-y divide-border">
            {meals?.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{formatNaira(m.price_naira)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input type="checkbox" checked={m.is_available} onChange={(e) => toggle(m.id, e.target.checked)} className="h-4 w-4 accent-primary" />
                    Available
                  </label>
                  <button onClick={() => del(m.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </VendorShell>
  );
}

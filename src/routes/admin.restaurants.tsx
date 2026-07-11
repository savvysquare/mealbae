import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AdminShell } from "@/components/PanelShells";

export const Route = createFileRoute("/admin/restaurants")({ component: AdminRestaurants });

function AdminRestaurants() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", address: "", phone: "", opens_at: "08:00", closes_at: "22:00", delivery_fee_naira: 700, image_url: "" });

  const { data } = useQuery({
    queryKey: ["all-restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  async function add() {
    if (!form.name || !form.address) { toast.error("Name and address required"); return; }
    const { error } = await supabase.from("restaurants").insert(form);
    if (error) toast.error(error.message);
    else { toast.success("Restaurant added"); setForm({ name: "", address: "", phone: "", opens_at: "08:00", closes_at: "22:00", delivery_fee_naira: 700, image_url: "" }); qc.invalidateQueries({ queryKey: ["all-restaurants"] }); }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="card-soft p-5">
          <h2 className="font-display text-xl font-bold">Add restaurant</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-input bg-surface px-3 py-2 text-sm md:col-span-2" />
            <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-xl border border-input bg-surface px-3 py-2 text-sm md:col-span-2" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border border-input bg-surface px-3 py-2 text-sm" />
            <input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="rounded-xl border border-input bg-surface px-3 py-2 text-sm" />
            <label className="text-xs">Opens<input type="time" value={form.opens_at} onChange={(e) => setForm({ ...form, opens_at: e.target.value })} className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2 text-sm" /></label>
            <label className="text-xs">Closes<input type="time" value={form.closes_at} onChange={(e) => setForm({ ...form, closes_at: e.target.value })} className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2 text-sm" /></label>
            <label className="text-xs md:col-span-2">Delivery fee (₦)<input type="number" value={form.delivery_fee_naira} onChange={(e) => setForm({ ...form, delivery_fee_naira: parseInt(e.target.value || "0") })} className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2 text-sm" /></label>
            <button onClick={add} className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground md:col-span-2"><Plus className="h-4 w-4" /> Add restaurant</button>
          </div>
        </section>

        <section className="card-soft p-5">
          <h2 className="font-display text-xl font-bold">All restaurants</h2>
          <div className="mt-3 divide-y divide-border">
            {data?.map((r) => (
              <div key={r.id} className="py-3">
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.address} · {r.opens_at.slice(0,5)}–{r.closes_at.slice(0,5)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

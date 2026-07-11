import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminShell } from "@/components/PanelShells";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, User, Phone, Bike } from "lucide-react";

export const Route = createFileRoute("/admin/riders")({ component: AdminRiders });

interface Rider {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

function AdminRiders() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Rider | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", is_active: true });

  const { data: riders, isLoading } = useQuery({
    queryKey: ["admin-riders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("riders")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Rider[];
    },
    refetchInterval: 15000,
  });

  // Fetch active deliveries to show rider busy status
  const { data: busyPhones } = useQuery({
    queryKey: ["active-rider-phones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("rider_phone")
        .in("status", ["preparing", "ready_for_pickup", "rider_arrived_at_restaurant", "out_for_delivery", "rider_arrived_at_delivery"])
        .not("rider_phone", "is", null);
      if (error) throw error;
      return new Set((data ?? []).map((o: any) => o.rider_phone));
    },
    refetchInterval: 15000,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: { name: string; phone: string; is_active: boolean }) => {
      if (editing) {
        const { error } = await supabase.from("riders").update(values).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("riders").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Rider updated" : "Rider added");
      qc.invalidateQueries({ queryKey: ["admin-riders"] });
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("riders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rider removed");
      qc.invalidateQueries({ queryKey: ["admin-riders"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ name: "", phone: "", is_active: true });
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(rider: Rider) {
    setEditing(rider);
    setForm({ name: rider.name, phone: rider.phone, is_active: rider.is_active });
    setShowForm(true);
  }

  async function toggleActive(rider: Rider) {
    const { error } = await supabase.from("riders").update({ is_active: !rider.is_active }).eq("id", rider.id);
    if (error) toast.error(error.message);
    else toast.success(rider.is_active ? "Rider deactivated" : "Rider activated");
    qc.invalidateQueries({ queryKey: ["admin-riders"] });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    saveMutation.mutate(form);
  };

  const activeRiders = (riders ?? []).filter((r) => r.is_active);
  const inactiveRiders = (riders ?? []).filter((r) => !r.is_active);

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-6 px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Dispatch Riders</h1>
            <p className="text-sm text-muted-foreground">
              {activeRiders.length} active · {(riders ?? []).filter((r) => busyPhones?.has(r.phone)).length} currently on assignment
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Add Rider
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="card-soft p-5 border-l-4 border-primary">
            <h2 className="font-semibold text-base mb-4">{editing ? "Edit Rider" : "Add New Rider"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Taiwo Adeleke"
                    className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. 08012345678"
                    className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm font-medium">Active (can receive dispatch assignments)</span>
              </label>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition whitespace-nowrap disabled:opacity-60"
                >
                  {saveMutation.isPending ? "Saving…" : editing ? "Save Changes" : "Add Rider"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-border px-5 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary transition whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Active Riders */}
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading riders…</div>
        ) : (
          <>
            <section>
              <h2 className="mb-3 font-semibold text-lg">Active Riders <span className="text-sm font-normal text-muted-foreground">({activeRiders.length})</span></h2>
              {activeRiders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No active riders. Add one above.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {activeRiders.map((rider) => {
                    const isBusy = busyPhones?.has(rider.phone);
                    return (
                      <div key={rider.id} className={`card-soft p-4 flex items-start gap-3 ${isBusy ? "border-l-4 border-warning" : "border-l-4 border-success"}`}>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isBusy ? "bg-warning/10" : "bg-success/10"}`}>
                          <Bike className={`h-5 w-5 ${isBusy ? "text-warning" : "text-success"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold truncate">{rider.name}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isBusy ? "bg-warning/10 text-warning-foreground" : "bg-success/10 text-success"}`}>
                              {isBusy ? "On assignment" : "Available"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {rider.phone}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(rider)}
                            className="p-1.5 rounded-lg hover:bg-secondary transition text-muted-foreground hover:text-foreground"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => toggleActive(rider)}
                            className="p-1.5 rounded-lg hover:bg-secondary transition text-muted-foreground hover:text-foreground"
                            title="Deactivate"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Remove ${rider.name}?`)) deleteMutation.mutate(rider.id); }}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition text-muted-foreground hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Inactive Riders */}
            {inactiveRiders.length > 0 && (
              <section>
                <h2 className="mb-3 font-semibold text-base text-muted-foreground">Inactive Riders <span className="text-sm font-normal">({inactiveRiders.length})</span></h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {inactiveRiders.map((rider) => (
                    <div key={rider.id} className="card-soft p-4 flex items-start gap-3 opacity-60">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{rider.name}</div>
                        <div className="text-xs text-muted-foreground">{rider.phone}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleActive(rider)}
                          className="p-1.5 rounded-lg hover:bg-secondary transition text-muted-foreground hover:text-success"
                          title="Activate"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Remove ${rider.name}?`)) deleteMutation.mutate(rider.id); }}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}

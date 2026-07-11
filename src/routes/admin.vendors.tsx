import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { AdminShell } from "@/components/PanelShells";
import { listVendorAccounts, setVendorPassword } from "@/lib/vendor-admin.functions";

export const Route = createFileRoute("/admin/vendors")({ component: AdminVendors });

function AdminVendors() {
  const qc = useQueryClient();
  const listFn = useServerFn(listVendorAccounts);
  const setFn = useServerFn(setVendorPassword);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-accounts"],
    queryFn: () => listFn(),
  });

  async function save(restaurantId: string) {
    const password = drafts[restaurantId]?.trim() ?? "";
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setBusy(restaurantId);
    try {
      await setFn({ data: { restaurantId, password } });
      toast.success("Vendor password set");
      setDrafts((d) => ({ ...d, [restaurantId]: "" }));
      qc.invalidateQueries({ queryKey: ["vendor-accounts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-2xl font-bold">Vendor passwords</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the password each restaurant uses to sign in at <span className="font-semibold">/vendor</span>. Vendors pick their restaurant from a dropdown and enter this password.
        </p>

        <div className="card-soft mt-6 divide-y divide-border">
          {isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
          {(data ?? []).map((r) => (
            <div key={r.restaurantId} className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex-1 min-w-[180px]">
                <div className="font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                  {r.hasAccount ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Vendor account exists</>
                  ) : (
                    <>No vendor account yet</>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={drafts[r.restaurantId] ?? ""}
                onChange={(e) => setDrafts({ ...drafts, [r.restaurantId]: e.target.value })}
                placeholder={r.hasAccount ? "New password" : "Set password"}
                className="min-w-[180px] flex-1 rounded-xl border border-input bg-surface px-3 py-2 text-sm"
              />
              <button
                onClick={() => save(r.restaurantId)}
                disabled={busy === r.restaurantId}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
              >
                <KeyRound className="h-3.5 w-3.5" />
                {busy === r.restaurantId ? "Saving…" : r.hasAccount ? "Update" : "Create"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

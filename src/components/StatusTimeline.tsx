import { Check, Circle } from "lucide-react";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/format";

export function StatusTimeline({ current, events }: {
  current: string;
  events?: { status: string; created_at: string }[];
}) {
  const idx = STATUS_ORDER.indexOf(current as (typeof STATUS_ORDER)[number]);
  const isTerminalBad = current === "rejected" || current === "cancelled";

  if (isTerminalBad) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        <div className="font-semibold flex items-center gap-2">
          <span>❌</span>
          Order {current === "rejected" ? "rejected by restaurant" : "cancelled"}
        </div>
      </div>
    );
  }

  return (
    <ol className="relative space-y-4">
      {STATUS_ORDER.map((s, i) => {
        const done = i <= idx;
        const active = i === idx;
        const event = events?.find((e) => e.status === s);
        return (
          <li key={s} className="flex gap-3">
            <div className="relative flex flex-col items-center">
              <span className={`z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 ${done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>
                {done ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
              </span>
              {i < STATUS_ORDER.length - 1 && (
                <span className={`h-full w-px flex-1 ${i < idx ? "bg-primary" : "bg-border"}`} style={{ minHeight: 20 }} />
              )}
            </div>
            <div className="pb-4">
              <div className={`text-sm ${active ? "font-semibold text-foreground" : done ? "text-foreground" : "text-muted-foreground"}`}>
                {STATUS_LABELS[s]}
              </div>
              {event && (
                <div className="text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleString("en-NG", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

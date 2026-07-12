import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HeaderActions } from "@/components/HeaderActions";
import { Phone, MessageCircle, Mail, Clock } from "lucide-react";

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Support — MealBae" },
      { name: "description", content: "Reach the MealBae team any time — call, WhatsApp, or email us." },
      { property: "og:title", content: "Support — MealBae" },
      { property: "og:description", content: "Reach the MealBae team any time — call, WhatsApp, or email us." },
    ],
  }),
});

const SUPPORT_PHONE = "08141894696";
const SUPPORT_WA = "2348141894696";
const SUPPORT_EMAIL = "hello@mealbae.com";

function SupportPage() {
  return (
    <AppShell title="Support" right={<HeaderActions />}>
      <div className="mx-auto max-w-xl pb-24">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">How can we help?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We reply within minutes during working hours.
          </p>
        </div>

        <div className="space-y-3">
          <a
            href={`https://wa.me/${SUPPORT_WA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 hover:border-primary hover:bg-secondary/40 transition"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-success/10 text-success">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-foreground">Chat on WhatsApp</div>
              <div className="text-xs text-muted-foreground truncate">Fastest way to reach us</div>
            </div>
            <span className="text-xs font-bold text-primary">Open</span>
          </a>

          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 hover:border-primary hover:bg-secondary/40 transition"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
              <Phone className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-foreground">Call us</div>
              <div className="text-xs text-muted-foreground truncate">{SUPPORT_PHONE}</div>
            </div>
            <span className="text-xs font-bold text-primary">Dial</span>
          </a>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 hover:border-primary hover:bg-secondary/40 transition"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-foreground">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-foreground">Email</div>
              <div className="text-xs text-muted-foreground truncate">{SUPPORT_EMAIL}</div>
            </div>
            <span className="text-xs font-bold text-primary">Send</span>
          </a>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-secondary/50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Working hours
          </div>
          <div className="mt-2 text-sm text-foreground">Every day · 8:00 AM – 10:00 PM</div>
        </div>
      </div>
    </AppShell>
  );
}

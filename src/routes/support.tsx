import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageCircle, Phone, HelpCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/support")({ component: SupportPage });

const FAQS = [
  {
    q: "Where is my order and how do I track it?",
    a: "You can track your order live from the 'Orders' tab in the bottom bar, or by clicking the 'Track Status' button in your order history. Once a rider is assigned, their details and phone number will be displayed on the tracking screen.",
  },
  {
    q: "How do I make payment for my order?",
    a: "Currently, MealBae supports payment via bank transfer. After selecting your meals, you will be shown the OPay account details to transfer to. Once you have transferred the exact amount on your banking app, tap 'I have paid' to verify your payment and start preparation.",
  },
  {
    q: "Can I edit or cancel my order?",
    a: "Orders can only be cancelled while they are in the 'Pending Payment' or 'Payment Confirmed' states. Once the restaurant accepts the order and begins preparation, cancellation is no longer possible. To make changes, please contact support immediately.",
  },
  {
    q: "How long does delivery take?",
    a: "Delivery time depends on preparation time and the distance from the restaurant. Typically, orders in Osogbo are delivered within 25–45 minutes. You can check the average preparation and delivery time on the restaurant page.",
  },
  {
    q: "My transfer was debited but the order is still pending. What do I do?",
    a: "Occasionally, bank network delays can affect transfer confirmations. If your order hasn't advanced within 5 minutes of making payment, please tap the 'Trouble? Call' button or contact us on WhatsApp with a screenshot of your payment receipt.",
  },
];

function SupportPage() {
  return (
    <AppShell title="Support">
      <div className="mx-auto max-w-xl pb-24">
        {/* Support Options Header */}
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="font-display text-2xl font-extrabold text-foreground flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" /> Support Center
          </h1>
          <p className="text-sm text-muted-foreground">
            We are here to help you. Reach out to our support agents or read the FAQs below.
          </p>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
          <a
            href="https://wa.me/2348141894696"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col justify-between p-5 rounded-2xl bg-emerald-50 border border-emerald-100 hover:scale-[1.01] transition-transform duration-300 text-left"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-extrabold text-emerald-950 mt-4">
                Chat on WhatsApp
              </h3>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Connect with our customer care agents instantly for quick resolutions.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-6">
              Start chat <ArrowRight className="h-3 w-3" />
            </div>
          </a>

          <a
            href="tel:+2348141894696"
            className="flex flex-col justify-between p-5 rounded-2xl bg-amber-50 border border-amber-100 hover:scale-[1.01] transition-transform duration-300 text-left"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-extrabold text-amber-950 mt-4">
                Call Support
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Call our direct phone line for urgent orders or issues.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 mt-6">
              08141894696 <ArrowRight className="h-3 w-3" />
            </div>
          </a>
        </div>

        {/* FAQs Accordion */}
        <div className="bg-white border border-border/80 rounded-2xl p-5 shadow-xs">
          <h2 className="font-display text-lg font-extrabold text-foreground mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" /> Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/50 py-1">
                <AccordionTrigger className="text-left font-bold text-sm text-foreground hover:no-underline py-3">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1 pb-3">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </AppShell>
  );
}

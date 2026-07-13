import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/vendor/")({
  ssr: false,
  beforeLoad: ({ context }: { context: Record<string, unknown> }) => {
    if ((context as { isVendor?: boolean }).isVendor) {
      throw redirect({ to: "/vendor/orders" });
    }
  },
  component: () => null,
});

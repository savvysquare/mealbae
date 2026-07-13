import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  beforeLoad: ({ context }: { context: Record<string, unknown> }) => {
    if ((context as { isAdmin?: boolean }).isAdmin) {
      throw redirect({ to: "/admin/overview" });
    }
  },
  component: () => null,
});

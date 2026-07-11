import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  beforeLoad: ({ context }) => {
    if ((context as { isAdmin?: boolean }).isAdmin) {
      throw redirect({ to: "/admin/overview" });
    }
  },
  component: () => null,
});

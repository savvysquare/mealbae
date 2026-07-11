import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/track")({ component: () => <Outlet /> });

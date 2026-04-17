import type { ProtectedRoute, PublicRoute } from "@/types/navigation";

export const DEFAULT_AUTHENTICATED_ROUTE: ProtectedRoute = "/home";
export const DEFAULT_PUBLIC_ROUTE: PublicRoute = "/auth";

export const PUBLIC_ROUTES: PublicRoute[] = [
  "/",
  "/intro",
  "/auth",
  "/choose-profile",
];

export const PROTECTED_ROUTES: ProtectedRoute[] = [
  "/home",
  "/settings",
  "/memories",
  "/us",
  "/constellation",
  "/secret-mode",
];

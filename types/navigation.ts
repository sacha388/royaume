export type PublicRoute = "/" | "/intro" | "/auth" | "/choose-profile";

export type ProtectedRoute =
  | "/home"
  | "/settings"
  | "/memories"
  | "/us"
  | "/constellation"
  | "/secret-mode";

export type AppRoute = PublicRoute | ProtectedRoute;

import { RequireProfile } from "@/components/auth/require-profile";
import { ProtectedRoutePrefetcher } from "@/components/navigation/protected-route-prefetcher";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <RequireProfile>
      <ProtectedRoutePrefetcher />
      {children}
    </RequireProfile>
  );
}

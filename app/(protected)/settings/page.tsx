import Link from "next/link";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ScreenHeader } from "@/components/layout/screen-header";
import { ProfileSessionCard } from "@/components/settings/profile-session-card";
import { RestartFlowButton } from "@/components/settings/restart-flow-button";
import { SyncStatusCard } from "@/components/settings/sync-status-card";
import { WebPushSettingsCard } from "@/components/settings/web-push-settings-card";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <MobileShell className="gap-6">
      <ScreenHeader backHref="/home" title="Réglages" />

      <ProfileSessionCard />

      <WebPushSettingsCard />

      <SyncStatusCard />

      <Card className="rounded-[18px]">
        <div className="grid gap-3">
          {[
            { href: "/constellation", label: "Constellation" },
            { href: "/us", label: "Nous" },
            { href: "/memories", label: "Souvenirs" },
          ].map((item) => (
            <Link
              key={item.href}
              className={cn(
                "inline-flex min-h-12 w-full items-center justify-center rounded-[16px] bg-white px-5",
                "text-[16px] font-semibold text-zinc-900 transition-colors active:bg-zinc-100",
              )}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </Card>

      <RestartFlowButton />
    </MobileShell>
  );
}

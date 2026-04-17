import { MobileShell } from "@/components/layout/mobile-shell";
import { ScreenHeader } from "@/components/layout/screen-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PlaceholderScreenProps = {
  caption: string;
  description: string;
  title: string;
};

export function PlaceholderScreen({
  caption,
  description,
  title,
}: PlaceholderScreenProps) {
  return (
    <MobileShell className="gap-6">
      <ScreenHeader
        action={
          <ButtonLink href="/settings" fullWidth={false} variant="ghost">
            Réglages
          </ButtonLink>
        }
        caption={caption}
        title={title}
      />

      <Card className="flex flex-1 flex-col justify-between rounded-[28px]">
        <div>
          <p className="mb-4 text-sm font-medium text-[#c44f5d]">Placeholder</p>
          <p className="text-lg leading-7 text-zinc-700">{description}</p>
        </div>

        <ButtonLink href="/home" variant="secondary">
          Revenir à l’accueil
        </ButtonLink>
      </Card>
    </MobileShell>
  );
}

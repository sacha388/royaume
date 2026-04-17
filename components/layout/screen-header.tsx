import type { ReactNode } from "react";
import { BackLink } from "@/components/ui/back-link";

type ScreenHeaderProps = {
  action?: ReactNode;
  backHref?: string;
  caption?: string;
  title: string;
};

export function ScreenHeader({
  action,
  backHref,
  caption,
  title,
}: ScreenHeaderProps) {
  return (
    <header className="flex min-h-12 items-start justify-between gap-4">
      <div className="min-w-0">
        {backHref ? (
          <BackLink className="mb-3" href={backHref} />
        ) : null}
        {caption ? (
          <p className="mb-1 text-sm font-medium text-zinc-500">{caption}</p>
        ) : null}
        <h1 className="text-3xl font-semibold leading-tight tracking-normal text-zinc-950">
          {title}
        </h1>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

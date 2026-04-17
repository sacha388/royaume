import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type MobileShellProps = PropsWithChildren<{
  className?: string;
  /** Hauteur = fenêtre (dvh), pas de dépassement : pour écrans plein type onboarding. */
  fixedViewport?: boolean;
}>;

export function MobileShell({
  children,
  className,
  fixedViewport,
}: MobileShellProps) {
  return (
    <main
      className={cn(
        "safe-shell mx-auto flex w-full max-w-[430px] flex-col bg-background px-5 text-foreground",
        fixedViewport
          ? "h-dvh max-h-dvh min-h-0 overflow-hidden"
          : "min-h-svh",
        className,
      )}
    >
      {children}
    </main>
  );
}

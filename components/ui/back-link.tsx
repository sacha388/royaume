import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type BackLinkProps = ComponentPropsWithoutRef<typeof Link>;

function BackArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 18 9 12l6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function BackLink({ className, children = "Retour", ...props }: BackLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-200 px-4",
        "bg-white/70 text-sm font-medium text-zinc-700 transition-colors active:bg-zinc-100",
        className,
      )}
      {...props}
    >
      <BackArrowIcon className="h-4 w-4" />
      {children}
    </Link>
  );
}

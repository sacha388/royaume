import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type CardProps = ComponentPropsWithoutRef<"section">;

export function Card({ className, ...props }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-[24px] border-none bg-white p-5 shadow-[0_10px_36px_rgba(48,32,28,0.08)] ring-0 outline-none",
        className,
      )}
      {...props}
    />
  );
}

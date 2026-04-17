import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

const baseStyles =
  "relative inline-flex min-h-16 touch-manipulation select-none items-center justify-center rounded-full border-0 px-7 text-[17px] font-bold tracking-normal text-[#FFFDF9] shadow-none transition-[background-color,opacity] active:opacity-95 disabled:pointer-events-none disabled:opacity-45";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[#c44f5d] active:bg-[#b94753]",
  secondary: "bg-[#d96f7a] active:bg-[#cc636f]",
  ghost: "bg-[#c44f5d] active:bg-[#b94753]",
};

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  fullWidth?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  className,
  fullWidth = true,
  style,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        baseStyles,
        fullWidth ? "w-full" : "w-auto",
        variantStyles[variant],
        className,
      )}
      style={{ color: "#FFFDF9", ...style }}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  fullWidth?: boolean;
  variant?: ButtonVariant;
};

export function ButtonLink({
  className,
  fullWidth = true,
  style,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        baseStyles,
        fullWidth ? "w-full" : "w-auto",
        variantStyles[variant],
        className,
      )}
      style={{ color: "#FFFDF9", ...style }}
      {...props}
    />
  );
}

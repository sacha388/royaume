import localFont from "next/font/local";

export const lemonCake = localFont({
  src: "../public/font/lemon-cake.otf",
  display: "swap",
});

/** Serif système : aucun fetch externe au build, donc plus rapide et robuste. */
export const lora = {
  className: "font-serif",
} as const;

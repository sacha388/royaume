import { redirect } from "next/navigation";

/** Ancienne route : le flux est sur `/` avec `?s=` pour les étapes. */
export default function IntroRedirectPage() {
  redirect("/?s=1");
}

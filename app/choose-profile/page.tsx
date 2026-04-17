import { redirect } from "next/navigation";

/** Alias vers l’écran de choix de profil. */
export default function ChooseProfileRedirectPage() {
  redirect("/auth");
}

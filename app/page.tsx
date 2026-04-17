import { ProfileLandingRedirect } from "@/components/landing/profile-landing-redirect";
import { EntryFlow } from "@/components/onboarding/entry-flow";
import { parseEntryStep } from "@/lib/entry-step";

type LandingPageProps = {
  searchParams: Promise<{ s?: string | string[] }>;
};

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const params = await searchParams;
  const initialStep = parseEntryStep(params.s);

  return (
    <ProfileLandingRedirect>
      <EntryFlow initialStep={initialStep} />
    </ProfileLandingRedirect>
  );
}

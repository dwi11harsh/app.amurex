"use client";

import { OnboardingFlow } from "@repo/ui/components";
import { useShowOnboarding } from "@repo/ui/store";

// TODO: there is no setShowOnboarding call to set this

export const ShowOnboardingFlow = () => {
  const showOnboarding = useShowOnboarding((state) => state.showOnboarding);
  return <>{showOnboarding && <OnboardingFlow />}</>;
};

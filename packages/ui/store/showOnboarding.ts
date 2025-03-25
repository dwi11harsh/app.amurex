import { create } from "zustand";

interface ShowOnboardingState {
  showOnboarding: boolean;
  setShowOnboarding: (showOnboarding: boolean) => void;
}

export const useShowOnboarding = create<ShowOnboardingState>()((set) => ({
  showOnboarding: false,
  setShowOnboarding: (showOnboarding: boolean) => set({ showOnboarding }),
}));

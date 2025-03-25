"use client";

import { Navbar, ShowOnboardingFlow, StarButton } from "@repo/ui/components";
import { CheckSearchInitiated } from "@repo/web/components/CheckSearchInitiated";
import { useState } from "react";

const AISearch = (): JSX.Element => {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [hasGoogleDocs, setHasGoogleDocs] = useState<boolean>(false);
  const [hasNotion, setHasNotion] = useState<boolean>(false);

  return (
    <>
      <Navbar />
      <CheckSearchInitiated>
        <div className="fixed top-4 right-4 z-50">
          <StarButton />
        </div>

        <ShowOnboardingFlow />

        <div className="p-3 md:p-6 max-w-7xl mx-auto w-full">
          {!showOnboarding && !hasGoogleDocs && !hasNotion && (
            <div className="bg-[#1E1E24] rounded-lg border border-zinc-800 p-4 mb-4 flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <div className="bg-[#9334E9] rounded-full p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <p className="text-zinc-300">
                  Connect your Google Docs or Notion to get the most out of
                  Amurex
                </p>
              </div>
              <a
                href="/settings?tab=personalization"
                className="inline-flex items-center justify-center px-4 py-2 bg-[#9334E9] text-white rounded-lg hover:bg-[#7928CA] transition-colors"
              >
                Connect Accounts
              </a>
            </div>
          )}
        </div>
      </CheckSearchInitiated>
    </>
  );
};

export default AISearch;

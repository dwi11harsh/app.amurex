import {
  ConnectDocsOrNotionPopup,
  Navbar,
  ShowOnboardingFlow,
  StarButton,
} from "@repo/ui/components";

import { CheckSearchInitiated } from "@repo/web/components";

const AISearch = (): JSX.Element => {
  return (
    <>
      <Navbar />
      <CheckSearchInitiated>
        <div className="fixed top-4 right-4 z-50">
          <StarButton />
        </div>
        <ShowOnboardingFlow />
        <div className="p-3 md:p-6 max-w-7xl mx-auto w-full">
          <ConnectDocsOrNotionPopup />
        </div>
      </CheckSearchInitiated>
    </>
  );
};

export default AISearch;

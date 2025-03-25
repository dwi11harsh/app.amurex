"use client";

import { useState } from "react";

export const CheckSearchInitiated = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isSearchInitiated, setIsSearchInitiated] = useState<boolean>(false);

  return (
    <div
      className={`min-h-screen bg-black lg:ml-[4rem] ${
        isSearchInitiated ? "pt-6" : "flex items-center justify-center"
      }`}
    >
      {children}
    </div>
  );
};

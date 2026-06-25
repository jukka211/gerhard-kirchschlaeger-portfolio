"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type SiteMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SiteMenuContext = createContext<SiteMenuContextValue | null>(null);

export function SiteMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <SiteMenuContext.Provider value={{ open, setOpen }}>
      {children}
    </SiteMenuContext.Provider>
  );
}

export function useSiteMenu() {
  const context = useContext(SiteMenuContext);
  if (!context) {
    throw new Error("useSiteMenu must be used within a SiteMenuProvider");
  }
  return context;
}

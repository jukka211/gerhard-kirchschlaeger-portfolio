"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type SiteMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  pageAction: (() => void) | null;
  setPageAction: (action: (() => void) | null) => void;
};

const SiteMenuContext = createContext<SiteMenuContextValue | null>(null);

export function SiteMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pageAction, setPageActionState] = useState<(() => void) | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const setPageAction = useCallback((action: (() => void) | null) => {
    setPageActionState(() => action);
  }, []);

  return (
    <SiteMenuContext.Provider value={{ open, setOpen, pageAction, setPageAction }}>
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

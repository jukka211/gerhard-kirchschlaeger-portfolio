"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// A page's row modes, so the type tester can list them and pick one.
export type PageModes = {
  modes: readonly string[];
  mode: string;
  setMode: (mode: string) => void;
};

type PageModesContextValue = {
  pageModes: PageModes | null;
  setPageModes: (modes: PageModes | null) => void;
};

const PageModesContext = createContext<PageModesContextValue | null>(null);

export function PageModesProvider({ children }: { children: ReactNode }) {
  const [pageModes, setPageModes] = useState<PageModes | null>(null);

  return (
    <PageModesContext.Provider value={{ pageModes, setPageModes }}>
      {children}
    </PageModesContext.Provider>
  );
}

export function usePageModes() {
  const context = useContext(PageModesContext);
  if (!context) {
    throw new Error("usePageModes must be used within a PageModesProvider");
  }
  return context;
}

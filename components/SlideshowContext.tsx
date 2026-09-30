"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

// Columns and rows the grid can have: size × size cells, one image per cell.
export const GRID_SIZES = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28] as const;

export const DEFAULT_GRID_SIZE = 4;

type SlideshowContextValue = {
  gridSize: number;
  setGridSize: (size: number) => void;
  // Whether a slideshow is on the page, so the type tester knows to offer its controls.
  active: boolean;
  register: () => () => void;
};

const SlideshowContext = createContext<SlideshowContextValue | null>(null);

export function SlideshowProvider({ children }: { children: ReactNode }) {
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  // A count rather than a flag, so one slideshow unmounting can't hide the
  // controls of another that's already mounted.
  const [mounted, setMounted] = useState(0);

  const register = useCallback(() => {
    setMounted((count) => count + 1);
    return () => setMounted((count) => count - 1);
  }, []);

  return (
    <SlideshowContext.Provider value={{ gridSize, setGridSize, active: mounted > 0, register }}>
      {children}
    </SlideshowContext.Provider>
  );
}

export function useSlideshow() {
  const context = useContext(SlideshowContext);
  if (!context) {
    throw new Error("useSlideshow must be used within a SlideshowProvider");
  }
  return context;
}

// For the slideshow itself: its grid size, with the slideshow announced to
// the type tester for as long as it's mounted.
export function useSlideshowSettings() {
  const { gridSize, setGridSize, register } = useSlideshow();
  useEffect(register, [register]);
  return { gridSize, setGridSize };
}

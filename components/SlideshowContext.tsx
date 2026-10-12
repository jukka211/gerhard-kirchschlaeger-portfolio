"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

// Columns and rows the grid can have: size × size cells, one image per cell.
export const GRID_SIZES = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28] as const;

export const DEFAULT_GRID_SIZE = 8;

// The room around each image, as a share of its cell: 0 fills the cell,
// 0.5 leaves the image half the cell's width and height.
export const MAX_GRID_SPACING = 0.9;

export const DEFAULT_GRID_SPACING = 0.5;

// What each cell shows: its image, or the work's title instead.
export const GRID_VIEWS = ["image", "title"] as const;

export type GridView = (typeof GRID_VIEWS)[number];

type SlideshowContextValue = {
  gridSize: number;
  setGridSize: (size: number) => void;
  spacing: number;
  setSpacing: (spacing: number) => void;
  view: GridView;
  setView: (view: GridView) => void;
  // Back to the defaults above.
  reset: () => void;
  // Whether a slideshow is on the page, so the type tester knows to offer its controls.
  active: boolean;
  register: () => () => void;
};

const SlideshowContext = createContext<SlideshowContextValue | null>(null);

export function SlideshowProvider({ children }: { children: ReactNode }) {
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [spacing, setSpacing] = useState(DEFAULT_GRID_SPACING);
  const [view, setView] = useState<GridView>("image");
  // A count rather than a flag: the home page mounts a desktop and a mobile slideshow.
  const [mounted, setMounted] = useState(0);

  const reset = useCallback(() => {
    setGridSize(DEFAULT_GRID_SIZE);
    setSpacing(DEFAULT_GRID_SPACING);
    setView("image");
  }, []);

  const register = useCallback(() => {
    setMounted((count) => count + 1);
    return () => setMounted((count) => count - 1);
  }, []);

  return (
    <SlideshowContext.Provider
      value={{
        gridSize,
        setGridSize,
        spacing,
        setSpacing,
        view,
        setView,
        reset,
        active: mounted > 0,
        register,
      }}
    >
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

// For the slideshow itself: its settings, with the slideshow announced to
// the type tester for as long as it's mounted.
export function useSlideshowSettings() {
  const { gridSize, setGridSize, spacing, view, register } = useSlideshow();
  useEffect(register, [register]);
  return { gridSize, setGridSize, spacing, view };
}
